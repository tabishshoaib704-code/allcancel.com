#!/usr/bin/env python3
"""Google Ads campaign management bot for FastBroadbands.us.

Usage:
    python main.py --config bot_config.yaml                 # dry run (default)
    python main.py --config bot_config.yaml --live          # actually apply changes
    python main.py --config bot_config.yaml --report-only   # just pull metrics, no rules

By default this NEVER writes to your account — dry_run in bot_config.yaml
must be explicitly set to false, AND --live must be passed, before any
budget or keyword change is applied. This double gate is intentional: this
account has previously had a Google Ads suspension for "Unacceptable
Business Practices", so automated changes are opt-in and fully logged.
"""
import argparse
import logging
import os
import sys
import yaml

from bot.client import load_client
from bot.metrics import fetch_campaign_stats, fetch_keyword_stats, fetch_ad_policy_issues
from bot.rules import propose_budget_actions, propose_keyword_actions, cap_actions
from bot.executor import execute_actions
from bot.reporting import write_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("google_ads_bot")


def parse_args():
    p = argparse.ArgumentParser(description="Google Ads management bot")
    p.add_argument("--config", default="bot_config.yaml", help="Path to bot_config.yaml")
    p.add_argument("--creds", default="google-ads.yaml", help="Path to google-ads.yaml")
    p.add_argument("--live", action="store_true", help="Actually apply changes (overrides dry_run=false requirement check)")
    p.add_argument("--report-only", action="store_true", help="Only pull and report metrics, skip the rule engine entirely")
    return p.parse_args()


def main():
    args = parse_args()

    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    client = load_client(args.creds)

    # GOOGLE_ADS_CUSTOMER_ID env var wins over the config file. This lets CI
    # keep the account ID in a secret instead of committing it to the repo.
    customer_id = os.environ.get("GOOGLE_ADS_CUSTOMER_ID") or cfg["customer_id"]
    customer_id = str(customer_id).replace("-", "")

    logger.info("Fetching campaign stats for customer %s (last %s days)...",
                customer_id, cfg["lookback_days"])
    campaigns = fetch_campaign_stats(client, customer_id, cfg["lookback_days"])

    policy_issues = []
    if cfg.get("alert_on_disapproved_ads", True):
        policy_issues = fetch_ad_policy_issues(client, customer_id)
        if policy_issues:
            logger.warning("%d ad(s) with policy issues found — see report.", len(policy_issues))

    action_results = []
    if not args.report_only:
        keywords = fetch_keyword_stats(client, customer_id, cfg["lookback_days"])
        actions = propose_budget_actions(campaigns, cfg) + propose_keyword_actions(keywords, cfg)
        actions = cap_actions(actions, cfg["max_changes_per_run"])

        # Effective dry_run is true unless BOTH the config says false AND --live was passed.
        effective_dry_run = not (args.live and not cfg.get("dry_run", True))
        if effective_dry_run:
            logger.info("Running in DRY RUN mode — no changes will be written.")
        else:
            logger.warning("LIVE MODE — changes will be written to the account.")

        action_results = execute_actions(client, customer_id, actions, effective_dry_run)

    report_path = write_report(campaigns, action_results, policy_issues, cfg["report_output_dir"])
    logger.info("Report written to %s", report_path)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error("Bot run failed: %s", e)
        sys.exit(1)
