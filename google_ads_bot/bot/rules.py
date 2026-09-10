"""Rule engine: turns performance data into a list of proposed actions.

Every function here only *proposes* actions (plain dicts). Nothing is
written to the account until executor.py applies them, and only if
dry_run is False. Keeping proposal and execution separate makes every
run auditable and easy to review before anything goes live.
"""
from typing import List, Dict
from .metrics import CampaignStats, KeywordStats


def propose_budget_actions(campaigns: List[CampaignStats], cfg: dict) -> List[Dict]:
    actions = []
    for c in campaigns:
        if c.status != "ENABLED":
            continue
        if c.conversions < cfg["min_conversions_for_decision"]:
            continue  # sample too small to act on

        cpa = c.cpa
        roas = c.roas
        target_cpa = cfg["target_cpa"]
        target_roas = cfg.get("target_roas")

        performing_well = cpa is not None and cpa <= target_cpa
        if target_roas and roas is not None:
            performing_well = performing_well or roas >= target_roas

        underperforming = cpa is not None and cpa > target_cpa * 1.25

        if performing_well and c.budget < cfg["max_daily_budget"]:
            new_budget = min(
                c.budget * (1 + cfg["budget_increase_step_pct"] / 100),
                cfg["max_daily_budget"],
            )
            actions.append({
                "type": "budget_change",
                "campaign_id": c.campaign_id,
                "campaign_name": c.campaign_name,
                "budget_resource_name": c.budget_resource_name,
                "old_budget": round(c.budget, 2),
                "new_budget": round(new_budget, 2),
                "reason": f"CPA ${cpa:.2f} <= target ${target_cpa:.2f}" if cpa else f"ROAS {roas:.2f} >= target {target_roas}",
            })
        elif underperforming:
            new_budget = max(
                c.budget * (1 - cfg["budget_decrease_step_pct"] / 100),
                cfg["max_daily_budget"] * 0.1,
            )
            actions.append({
                "type": "budget_change",
                "campaign_id": c.campaign_id,
                "campaign_name": c.campaign_name,
                "budget_resource_name": c.budget_resource_name,
                "old_budget": round(c.budget, 2),
                "new_budget": round(new_budget, 2),
                "reason": f"CPA ${cpa:.2f} > 1.25x target ${target_cpa:.2f}",
            })
    return actions


def propose_keyword_actions(keywords: List[KeywordStats], cfg: dict) -> List[Dict]:
    actions = []
    click_limit = cfg["pause_keyword_after_clicks_no_conversion"]
    qs_floor = cfg["low_quality_score_threshold"]

    for k in keywords:
        if k.clicks >= click_limit and k.conversions == 0:
            actions.append({
                "type": "pause_keyword",
                "ad_group_id": k.ad_group_id,
                "criterion_id": k.criterion_id,
                "keyword_text": k.keyword_text,
                "match_type": k.match_type,
                "reason": f"{k.clicks} clicks, 0 conversions (limit {click_limit})",
            })
        elif k.quality_score is not None and k.quality_score <= qs_floor:
            actions.append({
                "type": "flag_low_quality_score",
                "ad_group_id": k.ad_group_id,
                "criterion_id": k.criterion_id,
                "keyword_text": k.keyword_text,
                "quality_score": k.quality_score,
                "reason": f"Quality Score {k.quality_score} <= floor {qs_floor}",
            })
    return actions


def cap_actions(actions: List[Dict], max_changes: int) -> List[Dict]:
    """Circuit breaker: never let one run make more than N live changes.
    Flags (which don't touch the account) don't count against the cap.
    """
    live = [a for a in actions if a["type"] in ("budget_change", "pause_keyword")]
    flags = [a for a in actions if a["type"] not in ("budget_change", "pause_keyword")]
    return live[:max_changes] + flags
