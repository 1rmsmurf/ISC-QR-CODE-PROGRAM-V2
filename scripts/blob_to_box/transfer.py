"""
Move media from Vercel Blob to Box, then delete each Blob original.

A Blob file gets deleted only after Box confirms a copy with the same SHA-1
hash. Any failure leaves the original in Blob for the next run. Reruns are
safe: a file already in Box with a matching hash counts as transferred.

Environment variables
  BLOB_READ_WRITE_TOKEN   Vercel Blob read-write token (required)
  BOX_CLIENT_ID           Box app client ID (required)
  BOX_CLIENT_SECRET       Box app client secret (required)
  BOX_FOLDER_ID           Box folder ID to receive the files (required)

  Box auth, pick one:
  BOX_REFRESH_TOKEN       OAuth 2.0 mode. Box rotates this token on every run.
                          The new token goes to REFRESH_TOKEN_OUT.
  BOX_ENTERPRISE_ID       Client Credentials Grant mode, as the app service account
  BOX_USER_ID             Client Credentials Grant mode, as a specific user

  Optional:
  BLOB_PREFIX             Move only blobs whose pathname starts with this prefix
  DRY_RUN                 "true" lists files and checks Box access, moves nothing
  REFRESH_TOKEN_OUT       Where to write the rotated refresh token
                          (default: .box_refresh_token)
"""

import hashlib
import logging
import os
import sys
import tempfile
from pathlib import PurePosixPath

import requests
from box_sdk_gen import (
    BoxAPIError,
    BoxCCGAuth,
    BoxClient,
    BoxDeveloperTokenAuth,
    CCGConfig,
    CreateFolderParent,
    PreflightFileUploadCheckParent,
    UploadFileAttributes,
    UploadFileAttributesParentField,
)
from vercel.blob import sync as blob

# Box direct upload tops out at 50 MB. Chunked upload needs 20 MB or more.
CHUNKED_THRESHOLD = 40 * 1024 * 1024
BOX_TOKEN_URL = "https://api.box.com/oauth2/token"

log = logging.getLogger("blob_to_box")


class TransferError(Exception):
    pass


def require_env(name):
    value = os.getenv(name, "").strip()
    if not value:
        sys.exit(f"Missing required environment variable: {name}")
    return value


def mask_in_github_logs(secret):
    if os.getenv("GITHUB_ACTIONS") == "true":
        print(f"::add-mask::{secret}", flush=True)


def human_size(num_bytes):
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024 or unit == "GB":
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024


# ---------------------------------------------------------------- Box auth

def refresh_oauth_token(client_id, client_secret, refresh_token, out_path):
    """Trade the refresh token for an access token and save the new refresh token.

    Box invalidates the old refresh token the moment this call succeeds, so
    the new one gets written to disk before anything else happens.
    """
    resp = requests.post(
        BOX_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        sys.exit(
            f"Box token refresh failed (HTTP {resp.status_code}): {resp.text}\n"
            "Run box_authorize.py again and update the BOX_REFRESH_TOKEN secret."
        )
    tokens = resp.json()
    mask_in_github_logs(tokens["access_token"])
    mask_in_github_logs(tokens["refresh_token"])

    fd = os.open(out_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(tokens["refresh_token"])
    log.info("Box refresh token rotated and saved to %s", out_path)
    return tokens["access_token"]


def make_box_client():
    client_id = require_env("BOX_CLIENT_ID")
    client_secret = require_env("BOX_CLIENT_SECRET")
    user_id = os.getenv("BOX_USER_ID", "").strip()
    enterprise_id = os.getenv("BOX_ENTERPRISE_ID", "").strip()

    if user_id or enterprise_id:
        log.info("Box auth: Client Credentials Grant")
        if user_id:
            config = CCGConfig(client_id=client_id, client_secret=client_secret, user_id=user_id)
        else:
            config = CCGConfig(client_id=client_id, client_secret=client_secret, enterprise_id=enterprise_id)
        return BoxClient(auth=BoxCCGAuth(config=config))

    log.info("Box auth: OAuth 2.0 refresh token")
    access_token = refresh_oauth_token(
        client_id,
        client_secret,
        require_env("BOX_REFRESH_TOKEN"),
        os.getenv("REFRESH_TOKEN_OUT", ".box_refresh_token"),
    )
    return BoxClient(auth=BoxDeveloperTokenAuth(token=access_token))


# ---------------------------------------------------------------- Box helpers

def conflict_id(err):
    """Pull the ID of the existing item out of an item_name_in_use error."""
    conflicts = (err.response_info.context_info or {}).get("conflicts")
    if isinstance(conflicts, list):
        conflicts = conflicts[0]
    return conflicts["id"]


class BoxFolders:
    """Mirror Blob folder paths inside the Box root folder, with a cache."""

    def __init__(self, box, root_id):
        self.box = box
        self.cache = {"": root_id}

    def ensure(self, folder_path):
        if folder_path in self.cache:
            return self.cache[folder_path]
        parent = PurePosixPath(folder_path).parent
        parent_id = self.ensure("" if str(parent) == "." else str(parent))
        name = PurePosixPath(folder_path).name
        try:
            folder_id = self.box.folders.create_folder(name, CreateFolderParent(id=parent_id)).id
            log.info("Created Box folder %s", folder_path)
        except BoxAPIError as err:
            if err.response_info.code != "item_name_in_use":
                raise
            folder_id = conflict_id(err)
        self.cache[folder_path] = folder_id
        return folder_id


def upload_to_box(box, local_path, name, size, folder_id, sha1_hex):
    """Upload one file. Returns the Box file plus a flag for 'already in Box'.

    Name taken by identical content: treat as done (an earlier run uploaded it
    but crashed before the Blob delete). Name taken by different content:
    upload under a name with a short hash tag so nothing gets overwritten.
    """
    stem, suffix = os.path.splitext(name)
    for candidate in (name, f"{stem}_{sha1_hex[:8]}{suffix}"):
        try:
            box.uploads.preflight_file_upload_check(
                name=candidate,
                size=size,
                parent=PreflightFileUploadCheckParent(id=folder_id),
            )
        except BoxAPIError as err:
            if err.response_info.code != "item_name_in_use":
                raise
            existing = box.files.get_file_by_id(conflict_id(err), fields=["sha1", "name"])
            if existing.sha_1 == sha1_hex:
                return existing, True
            continue

        with open(local_path, "rb") as f:
            if size < CHUNKED_THRESHOLD:
                files = box.uploads.upload_file(
                    UploadFileAttributes(
                        name=candidate,
                        parent=UploadFileAttributesParentField(id=folder_id),
                    ),
                    f,
                    content_md_5=sha1_hex,  # Box expects SHA-1 here despite the name
                )
                return files.entries[0], False
            return box.chunked_uploads.upload_big_file(f, candidate, size, folder_id), False

    raise TransferError(f"Both '{name}' and its hash-tagged name hold different content in Box")


# ---------------------------------------------------------------- Blob helpers

def blob_access(url):
    # Delivery URLs look like https://<store-id>.<access>.blob.vercel-storage.com/...
    return "private" if ".private.blob." in url else "public"


def download_blob(item, dest):
    sha1 = hashlib.sha1()
    received = 0
    with blob.stream_blob(item.url, access=blob_access(item.url)) as download:
        for chunk in download:
            dest.write(chunk)
            sha1.update(chunk)
            received += len(chunk)
    dest.flush()
    if received != item.size:
        raise TransferError(f"Downloaded {received} bytes, Blob lists {item.size}")
    return sha1.hexdigest()


# ---------------------------------------------------------------- main loop

def transfer_one(item, box, folders):
    path = PurePosixPath(item.pathname)
    folder_path = "" if str(path.parent) == "." else str(path.parent)

    fd, tmp_path = tempfile.mkstemp(prefix="blob_")
    try:
        with os.fdopen(fd, "wb") as tmp:
            sha1_hex = download_blob(item, tmp)

        folder_id = folders.ensure(folder_path)
        box_file, already_there = upload_to_box(box, tmp_path, path.name, item.size, folder_id, sha1_hex)

        if box_file.sha_1 != sha1_hex:
            raise TransferError(f"SHA-1 mismatch: Blob {sha1_hex}, Box {box_file.sha_1}")

        try:
            blob.delete_blob(item.url, if_match=item.etag)
        except blob.BlobPreconditionFailedError:
            raise TransferError("Blob changed after listing, kept for the next run")

        note = " (already in Box)" if already_there else ""
        log.info("Moved %s -> Box file %s%s", item.pathname, box_file.id, note)
    finally:
        os.remove(tmp_path)


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    require_env("BLOB_READ_WRITE_TOKEN")
    root_folder_id = require_env("BOX_FOLDER_ID")
    dry_run = os.getenv("DRY_RUN", "false").strip().lower() == "true"
    prefix = os.getenv("BLOB_PREFIX", "").strip() or None

    # Connect to Box on every run, even with nothing to move. In OAuth mode
    # this keeps the refresh token alive through quiet weeks.
    box = make_box_client()
    root = box.folders.get_folder_by_id(root_folder_id, fields=["name"])
    log.info("Box destination: '%s' (ID %s)", root.name, root_folder_id)

    # List everything first. Deleting during a paginated listing can skip items.
    items = list(blob.query_blobs(prefix=prefix))
    total = sum(i.size for i in items)
    log.info("Found %d blob(s), %s total%s", len(items), human_size(total),
             f" under '{prefix}'" if prefix else "")

    if dry_run:
        for item in items:
            log.info("[dry run] would move %s (%s)", item.pathname, human_size(item.size))
        return 0

    folders = BoxFolders(box, root_folder_id)
    moved, failed = 0, []
    for item in items:
        try:
            transfer_one(item, box, folders)
            moved += 1
        except Exception as exc:  # keep going, report at the end
            log.error("FAILED %s: %s", item.pathname, exc)
            failed.append(item.pathname)

    log.info("Done. Moved %d, failed %d.", moved, len(failed))
    if failed:
        log.error("Files kept in Blob: %s", ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
