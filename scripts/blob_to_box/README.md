# Blob to Box transfer

GitHub Actions runs `transfer.py` at 12:00 AM and 12:00 PM Central time. Each run:

1. Lists every file in Vercel Blob.
2. Downloads each file and computes its SHA-1 hash.
3. Uploads the file to Box, mirroring the Blob folder path.
4. Deletes the Blob original only after Box reports the same SHA-1.

A failed file stays in Blob and gets retried on the next run. A run with any failure ends red, and GitHub emails you.

## Files

| Path | Purpose |
| --- | --- |
| `.github/workflows/blob-to-box.yml` | Schedule and job definition |
| `scripts/blob_to_box/transfer.py` | The transfer |
| `scripts/blob_to_box/box_authorize.py` | One-time Box login (OAuth mode only) |
| `scripts/blob_to_box/requirements.txt` | Python packages |

Add `.box_refresh_token` to `.gitignore`.

## Box auth: pick one mode

**Mode A: OAuth 2.0 (works today, no IT ticket).** The app acts as your Illinois Box account. Box gives a refresh token valid 60 days and replaces it on every use. The workflow writes each new token back into the repo secret, so twice-daily runs keep it alive indefinitely.

**Mode B: Client Credentials Grant (sturdier, needs IT approval).** No rotating tokens. A U of I Box admin must authorize the app first. Request through the Technology Services Help Desk (consult@illinois.edu).

Start with Mode A. Switch to Mode B later by setting one variable.

## Setup

### 1. Create the Box app
1. Open the Box Developer Console from your Illinois Box account and create a Platform App (Custom App).
2. Mode A: choose **User Authentication (OAuth 2.0)**. Mode B: choose **Server Authentication (Client Credentials Grant)**.
3. Under Application Scopes, enable **Read and write all files and folders stored in Box**.
4. Mode A only: under Redirect URIs, add `http://localhost:8765/callback`.
5. Save. Copy the Client ID and Client Secret.

Mode B extra steps: submit the app for authorization from the Authorization tab, wait for approval, then invite the app's service account email to your destination folder as an Editor.

### 2. Get the first refresh token (Mode A)
```bash
pip install requests
python scripts/blob_to_box/box_authorize.py
```
Log in with your Illinois account. Copy the printed token.

### 3. Find the Box folder ID
Open the destination folder in Box. The number at the end of the URL (`.../folder/123456789`) is the ID.

### 4. Create a GitHub token (Mode A)
GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Repository access: this repo only. Permission: **Secrets → Read and write**. Note the expiry date and renew before then.

### 5. Add repo secrets and variables
Repo → Settings → Secrets and variables → Actions.

| Name | Type | Value |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Secret | From Vercel → Storage → your Blob store |
| `BOX_CLIENT_ID` | Secret | From step 1 |
| `BOX_CLIENT_SECRET` | Secret | From step 1 |
| `BOX_REFRESH_TOKEN` | Secret | From step 2 (Mode A) |
| `GH_SECRETS_PAT` | Secret | From step 4 (Mode A) |
| `BOX_FOLDER_ID` | Variable | From step 3 |
| `BOX_ENTERPRISE_ID` | Variable | Mode B only. Setting this switches to Mode B |
| `BLOB_PREFIX` | Variable | Optional. Move only paths starting with this, for example `uploads/` |

### 6. Test
1. Actions tab → **Move media from Vercel Blob to Box** → Run workflow, with "dry run" checked. The log shows the Box folder name and the file list. Nothing moves.
2. Run again with "dry run" unchecked. Check Box, then check Vercel → Storage → Browse.

## Operating notes

- GitHub may start a scheduled run several minutes late during busy periods.
- In a public repo, GitHub pauses scheduled workflows after 60 days with no repo activity and emails you first. Re-enable from the Actions tab.
- Mode A recovery: if a run fails with "Box token refresh failed", run `box_authorize.py` again and replace `BOX_REFRESH_TOKEN`.
- A name clash with different content in Box uploads the new file as `name_<8-char hash>.ext`. Nothing gets overwritten.
- In Mode A the access token lasts about 60 minutes. A backlog bigger than one run handles stays in Blob for the next run.
