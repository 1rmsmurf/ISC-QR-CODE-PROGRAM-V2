"""
One-time Box login for OAuth 2.0 mode. Run on your own laptop.

1. In the Box Developer Console, add this redirect URI to your app:
       http://localhost:8765/callback
2. Run:  python box_authorize.py
3. Log in with your Illinois account in the browser window.
4. Copy the printed refresh token into the BOX_REFRESH_TOKEN repo secret.

Box authorization codes expire after 30 seconds, so this script catches the
redirect and trades the code for tokens right away.
"""

import getpass
import os
import secrets
import sys
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

PORT = 8765
REDIRECT_URI = f"http://localhost:{PORT}/callback"


def main():
    client_id = os.getenv("BOX_CLIENT_ID") or input("Box client ID: ").strip()
    client_secret = os.getenv("BOX_CLIENT_SECRET") or getpass.getpass("Box client secret: ").strip()
    state = secrets.token_urlsafe(16)

    auth_url = "https://account.box.com/api/oauth2/authorize?" + urllib.parse.urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "state": state,
    })

    result = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/callback":
                query = urllib.parse.parse_qs(parsed.query)
                result.update({k: v[0] for k, v in query.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Box login received. Go back to the terminal.")

        def log_message(self, *args):
            pass

    server = HTTPServer(("localhost", PORT), Handler)
    print("Opening Box login. If no browser opens, visit:\n" + auth_url)
    webbrowser.open(auth_url)
    while "code" not in result and "error" not in result:
        server.handle_request()
    server.server_close()

    if "error" in result:
        sys.exit(f"Box returned an error: {result.get('error')} {result.get('error_description', '')}")
    if result.get("state") != state:
        sys.exit("State mismatch. Start over.")

    resp = requests.post(
        "https://api.box.com/oauth2/token",
        data={
            "grant_type": "authorization_code",
            "code": result["code"],
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": REDIRECT_URI,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        sys.exit(f"Token exchange failed (HTTP {resp.status_code}): {resp.text}")

    print("\nRefresh token (valid 60 days, single use, the workflow rotates it):\n")
    print(resp.json()["refresh_token"])
    print("\nSave this as the BOX_REFRESH_TOKEN secret in your GitHub repo.")


if __name__ == "__main__":
    main()
