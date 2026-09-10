"""Applies proposed actions to the account, or just logs them in dry_run mode."""
import logging
from typing import List, Dict
from google.ads.googleads.errors import GoogleAdsException
from .client import handle_googleads_exception

logger = logging.getLogger("google_ads_bot")


def execute_actions(client, customer_id: str, actions: List[Dict], dry_run: bool) -> List[Dict]:
    """Runs each action, returns the actions annotated with an 'executed'
    and 'error' field so the caller can build a full report either way.
    """
    results = []
    for action in actions:
        record = dict(action)
        record["dry_run"] = dry_run
        record["executed"] = False
        record["error"] = None

        if dry_run:
            logger.info("[DRY RUN] Would apply: %s", action)
            results.append(record)
            continue

        try:
            if action["type"] == "budget_change":
                _apply_budget_change(client, customer_id, action)
            elif action["type"] == "pause_keyword":
                _apply_pause_keyword(client, customer_id, action)
            # flag_low_quality_score is informational only — no API call
            record["executed"] = True
            logger.info("Applied: %s", action)
        except GoogleAdsException as ex:
            record["error"] = handle_googleads_exception(ex)
            logger.error("Failed to apply %s: %s", action, record["error"])
        results.append(record)
    return results


def _apply_budget_change(client, customer_id, action):
    campaign_budget_service = client.get_service("CampaignBudgetService")
    operation = client.get_type("CampaignBudgetOperation")
    budget = operation.update
    budget.resource_name = action["budget_resource_name"]
    budget.amount_micros = int(action["new_budget"] * 1_000_000)
    from google.protobuf import field_mask_pb2
    operation.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["amount_micros"]))
    campaign_budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[operation]
    )


def _apply_pause_keyword(client, customer_id, action):
    ad_group_criterion_service = client.get_service("AdGroupCriterionService")
    operation = client.get_type("AdGroupCriterionOperation")
    criterion = operation.update
    criterion.resource_name = (
        f"customers/{customer_id}/adGroupCriteria/"
        f"{action['ad_group_id']}~{action['criterion_id']}"
    )
    criterion.status = client.enums.AdGroupCriterionStatusEnum.PAUSED
    from google.protobuf import field_mask_pb2
    operation.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["status"]))
    ad_group_criterion_service.mutate_ad_group_criteria(
        customer_id=customer_id, operations=[operation]
    )
