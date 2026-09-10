# FastBroadbands Google Ads Bot

A rule-based bot that manages Google Ads campaigns via the official
Google Ads API: it pulls performance data, proposes budget and keyword
changes against thresholds you set, and writes a full report every run.

## What it does

- **Reads** campaign performance (spend, conversions, CPA, ROAS) and
  keyword performance (clicks, conversions, Quality Score) for a
  rolling lookback window.
- **Proposes** budget increases/decreases and keyword pauses based on
  the rules in `bot_config.yaml` — nothing is ever silently invented,
  every action is one of a small fixed set with a clear "reason".
- **Flags** any ad with a policy issue (disapproved / under review) so
  you see it immediately instead of losing traffic quietly.
- **Reports**: writes a `.txt` summary and a `.csv` action log to
  `reports/` on every run.

## Why it defaults to dry-run

This account has previously had a Google Ads suspension for
"Unacceptable Business Practices." To avoid ever making that kind of
problem worse automatically, the bot:

- Defaults to `dry_run: true` — it will log every proposed change but
  write nothing to the account.
- Requires **both** `dry_run: false` in `bot_config.yaml` **and**
  `--live` on the command line before anything is actually applied.
- Never pauses or resumes a whole campaign, and never touches ad copy
  or targeting — only budgets (within a ceiling you set) and
  individual keyword pauses.
- Caps the number of live changes per run (`max_changes_per_run`) as a
  circuit breaker.
- Always writes a full audit trail, whether dry-run or live.

This is a starting point, not a substitute for reading Google's ads
policies for your account type — worth revisiting after the prior
suspension, since ISP/telecom lead-gen sits in a category Google
scrutinizes closely.

## Setup

1. Get Google Ads API access: apply for/confirm your **developer
   token**, and create OAuth2 credentials (client ID/secret) with a
   **refresh token** for the account. Google's guide:
   https://developers.google.com/google-ads/api/docs/first-call/overview

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy and fill in the two config files:
   ```bash
   cp google-ads.yaml.example google-ads.yaml
   cp bot_config.yaml.example bot_config.yaml
   ```
   Edit `google-ads.yaml` with your developer token, client ID/secret,
   and refresh token. Edit `bot_config.yaml` with your customer ID
   (no dashes) and your target CPA/ROAS/budget ceiling.

4. Note the API version pinned in `bot/client.py`
   (`version="v18"`) — check
   https://developers.google.com/google-ads/api/docs/release-notes
   for the current supported version before your first run, since
   Google deprecates old versions on a fixed schedule.

## Running it

```bash
# Dry run (default) — see what it WOULD do, writes nothing
python main.py

# Just pull metrics and the policy-issue report, skip the rule engine
python main.py --report-only

# Actually apply changes (also requires dry_run: false in bot_config.yaml)
python main.py --live
```

Reports land in `reports/run_<timestamp>.txt` and
`reports/actions_<timestamp>.csv`.

## Deployment

See [DEPLOY.md](DEPLOY.md) for running this on a schedule via GitHub
Actions, with credentials in GitHub Secrets.

## Suggested next steps

- Point `--live` at a cron job (e.g. daily) once you've watched a
  week of dry-run reports and trust the thresholds.
- Add email/Slack delivery of the report instead of just writing files
  (the `reporting.py` module is the place to hook that in).
- If you want ad copy generation or A/B testing added later, that's a
  separate module — this bot intentionally never touches ad text so
  it can't introduce a new policy violation on its own.
