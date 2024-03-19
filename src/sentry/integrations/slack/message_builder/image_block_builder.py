import datetime
import logging

from sentry import charts, features
from sentry.api import client
from sentry.charts.types import ChartType
from sentry.integrations.slack.message_builder import SlackBlock
from sentry.integrations.slack.message_builder.base.block import BlockSlackMessageBuilder
from sentry.integrations.slack.message_builder.time_utils import get_approx_start_time
from sentry.issues.grouptype import PerformanceP95EndpointRegressionGroupType
from sentry.models.apikey import ApiKey
from sentry.models.group import Group
from sentry.snuba.referrer import Referrer

logger = logging.getLogger("sentry.integrations.slack")


class ImageBlockBuilder(BlockSlackMessageBuilder):
    def __init__(self, group: Group) -> None:
        super().__init__()
        self.group = group
        self.event = group.get_recommended_event_for_environments()

    def build(self) -> SlackBlock | None:
        if (
            features.has("organizations:slack-endpoint-regression-image", self.group.organization)
            and self.group.issue_type == PerformanceP95EndpointRegressionGroupType
        ):
            return self._build_endpoint_regression_image_block()

        # TODO: Add support for other issue alerts
        logger.warning("build_issue_alert_image.not_supported")
        return None

    def _build_endpoint_regression_image_block(self) -> SlackBlock | None:
        logger.info(
            "build_endpoint_regression_image.attempt",
            extra={
                "group_id": self.group.id,
            },
        )
        endpoint = "events-stats/"
        organization = self.group.organization
        try:
            resp = client.get(
                auth=ApiKey(organization_id=organization.id, scope_list=["org:read"]),
                user=None,
                path=f"/organizations/{organization.slug}/{endpoint}",
                params={
                    "yAxis[]": ["p95(transaction.duration)", "count()"],
                    "referrer": Referrer.API_ALERTS_CHARTCUTERIE,
                    "query": f"event.type:transaction transaction:{self.event.transaction}",
                    "project": self.group.project.id,
                    "start": get_approx_start_time(self.group),
                    "end": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "dataset": "metrics",
                },
            )
            print("response", resp.data)

            url = charts.generate_chart(
                ChartType.SLACK_PERFORMANCE_ENDPOINT_REGRESSION,
                data={
                    "evidenceData": self.event.occurrence.evidence_data,
                    "percentileData": resp.data["p95(transaction.duration)"],
                },
            )

            return self.get_image_block(
                url=url,
                title=self.group.title,
                alt="P95(transaction.duration)",
            )

        except Exception as e:
            logger.exception(
                "build_endpoint_regression_image.failed",
                extra={
                    "exception": e,
                },
            )
            return None
