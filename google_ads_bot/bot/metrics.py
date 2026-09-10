"""Fetch performance data from the Google Ads API via GAQL."""
from dataclasses import dataclass, field
from typing import List


@dataclass
class CampaignStats:
    campaign_id: str
    campaign_name: str
    status: str
    budget_resource_name: str
    budget_micros: int
    clicks: int = 0
    cost_micros: int = 0
    conversions: float = 0.0
    conversions_value: float = 0.0

    @property
    def cost(self) -> float:
        return self.cost_micros / 1_000_000

    @property
    def budget(self) -> float:
        return self.budget_micros / 1_000_000

    @property
    def cpa(self):
        return self.cost / self.conversions if self.conversions > 0 else None

    @property
    def roas(self):
        return self.conversions_value / self.cost if self.cost > 0 else None


@dataclass
class KeywordStats:
    ad_group_id: str
    criterion_id: str
    keyword_text: str
    match_type: str
    clicks: int = 0
    conversions: float = 0.0
    quality_score: int = None


def fetch_campaign_stats(client, customer_id: str, lookback_days: int) -> List[CampaignStats]:
    ga_service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign_budget.resource_name,
          campaign_budget.amount_micros,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date DURING LAST_{lookback_days}_DAYS
          AND campaign.status != 'REMOVED'
    """
    stats = {}
    response = ga_service.search_stream(customer_id=customer_id, query=query)
    for batch in response:
        for row in batch.results:
            cid = str(row.campaign.id)
            if cid not in stats:
                stats[cid] = CampaignStats(
                    campaign_id=cid,
                    campaign_name=row.campaign.name,
                    status=row.campaign.status.name,
                    budget_resource_name=row.campaign_budget.resource_name,
                    budget_micros=row.campaign_budget.amount_micros,
                )
            s = stats[cid]
            s.clicks += row.metrics.clicks
            s.cost_micros += row.metrics.cost_micros
            s.conversions += row.metrics.conversions
            s.conversions_value += row.metrics.conversions_value
    return list(stats.values())


def fetch_keyword_stats(client, customer_id: str, lookback_days: int) -> List[KeywordStats]:
    ga_service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
          ad_group.id,
          ad_group_criterion.criterion_id,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.quality_info.quality_score,
          metrics.clicks,
          metrics.conversions
        FROM keyword_view
        WHERE segments.date DURING LAST_{lookback_days}_DAYS
          AND ad_group_criterion.status = 'ENABLED'
    """
    out = []
    response = ga_service.search_stream(customer_id=customer_id, query=query)
    for batch in response:
        for row in batch.results:
            out.append(KeywordStats(
                ad_group_id=str(row.ad_group.id),
                criterion_id=str(row.ad_group_criterion.criterion_id),
                keyword_text=row.ad_group_criterion.keyword.text,
                match_type=row.ad_group_criterion.keyword.match_type.name,
                clicks=row.metrics.clicks,
                conversions=row.metrics.conversions,
                quality_score=row.ad_group_criterion.quality_info.quality_score or None,
            ))
    return out


def fetch_ad_policy_issues(client, customer_id: str):
    """Return ads with policy topics (disapproved or under review) so the
    bot can alert a human rather than silently losing traffic — relevant
    given this account's prior 'Unacceptable Business Practices' suspension.
    """
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.status,
          ad_group_ad.policy_summary.approval_status,
          ad_group_ad.policy_summary.review_status,
          campaign.name,
          ad_group.name
        FROM ad_group_ad
        WHERE ad_group_ad.policy_summary.approval_status != 'APPROVED'
          AND ad_group_ad.status != 'REMOVED'
    """
    issues = []
    response = ga_service.search_stream(customer_id=customer_id, query=query)
    for batch in response:
        for row in batch.results:
            issues.append({
                "ad_id": row.ad_group_ad.ad.id,
                "campaign": row.campaign.name,
                "ad_group": row.ad_group.name,
                "status": row.ad_group_ad.status.name,
                "approval_status": row.ad_group_ad.policy_summary.approval_status.name,
                "review_status": row.ad_group_ad.policy_summary.review_status.name,
            })
    return issues
