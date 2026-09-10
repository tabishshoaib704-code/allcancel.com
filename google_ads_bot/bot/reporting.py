"""Writes a human-readable + CSV report for each bot run."""
import csv
import os
from datetime import datetime
from typing import List, Dict


def write_report(campaigns, action_results: List[Dict], policy_issues: List[Dict], output_dir: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    txt_path = os.path.join(output_dir, f"run_{timestamp}.txt")
    csv_path = os.path.join(output_dir, f"actions_{timestamp}.csv")

    with open(txt_path, "w") as f:
        f.write(f"Google Ads Bot Report — {timestamp}\n")
        f.write("=" * 50 + "\n\n")

        f.write("CAMPAIGN PERFORMANCE\n")
        for c in campaigns:
            cpa = f"${c.cpa:.2f}" if c.cpa else "n/a"
            roas = f"{c.roas:.2f}" if c.roas else "n/a"
            f.write(
                f"  {c.campaign_name} [{c.status}] — spend ${c.cost:.2f}, "
                f"budget ${c.budget:.2f}, conversions {c.conversions:.1f}, "
                f"CPA {cpa}, ROAS {roas}\n"
            )

        f.write(f"\nACTIONS ({len(action_results)})\n")
        if not action_results:
            f.write("  No actions triggered this run.\n")
        for a in action_results:
            status = "DRY RUN" if a.get("dry_run") else ("OK" if a.get("executed") else "FAILED")
            f.write(f"  [{status}] {a['type']} — {a.get('reason', '')}\n")
            if a.get("error"):
                f.write(f"      error: {a['error']}\n")

        f.write(f"\nPOLICY / DISAPPROVAL ALERTS ({len(policy_issues)})\n")
        if not policy_issues:
            f.write("  None found — no ads currently disapproved or under review issue.\n")
        for p in policy_issues:
            f.write(
                f"  Ad {p['ad_id']} in {p['campaign']} / {p['ad_group']}: "
                f"{p['approval_status']} ({p['review_status']})\n"
            )

    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["type", "campaign_or_keyword", "reason", "status", "error"])
        for a in action_results:
            status = "dry_run" if a.get("dry_run") else ("executed" if a.get("executed") else "failed")
            label = a.get("campaign_name") or a.get("keyword_text", "")
            writer.writerow([a["type"], label, a.get("reason", ""), status, a.get("error") or ""])

    return txt_path
