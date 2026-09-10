#!/usr/bin/env python3
"""Builds google-ads.yaml from environment variables.

Used in CI so credentials live in GitHub Secrets instead of the repo.
Run locally too if you'd rather keep creds in your shell environment.

Required env vars:
    GOOGLE_ADS_DEVELOPER_TOKEN
    GOOGLE_ADS_CLIENT_ID
    GOOGLE_ADS_CLIENT_SECRET
    GOOGLE_ADS_REFRESH_TOKEN
Optional:
    GOOGLE_ADS_LOGIN_CUSTOMER_ID   (only if using a manager/MCC account)
"""
import os
import stat
import sys

REQUIRED = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
]

OUT_PATH = "google-ads.yaml"


def main():
    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        print(
            "Missing required environment variable(s): " + ", ".join(missing),
            file=sys.stderr,
        )
        print(
            "In GitHub, add these under Settings > Secrets and variables > Actions.",
            file=sys.stderr,
        )
        sys.exit(1)

    lines = [
        f'developer_token: "{os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"]}"',
        f'client_id: "{os.environ["GOOGLE_ADS_CLIENT_ID"]}"',
        f'client_secret: "{os.environ["GOOGLE_ADS_CLIENT_SECRET"]}"',
        f'refresh_token: "{os.environ["GOOGLE_ADS_REFRESH_TOKEN"]}"',
        "use_proto_plus: true",
    ]

    login_cid = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
    if login_cid:
        lines.insert(4, f'login_customer_id: "{login_cid.replace("-", "")}"')

    with open(OUT_PATH, "w") as f:
        f.write("\n".join(lines) + "\n")

    # Owner read/write only — matters less in an ephemeral runner, but this
    # script is meant to be safe to run on a real server too.
    os.chmod(OUT_PATH, stat.S_IRUSR | stat.S_IWUSR)

    print(f"Wrote {OUT_PATH} (credentials not echoed).")


if __name__ == "__main__":
    main()
