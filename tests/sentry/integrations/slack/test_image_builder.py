from datetime import timedelta
import uuid

from django.utils import timezone

from sentry.integrations.slack.message_builder.image_block_builder import ImageBlockBuilder
from sentry.issues.grouptype import PerformanceP95EndpointRegressionGroupType
from sentry.models.group import Group
from sentry.testutils.cases import MetricsEnhancedPerformanceTestCase, PerformanceIssueTestCase, TestCase
from sentry.testutils.helpers.datetime import before_now
from sentry.testutils.helpers.features import with_feature
from sentry.utils.samples import load_data
from tests.sentry.issues.test_utils import OccurrenceTestMixin


class TestSlackImageBlockBuilder(MetricsEnhancedPerformanceTestCase, OccurrenceTestMixin):
    def setUp(self):
        super().setUp()
        self.features = {
            "organizations:performance-use-metrics": True,
            "organizations:slack-endpoint-regression-image": True,
        }

    @with_feature("organizations:slack-endpoint-regression-image")
    def test_image_block(self):
        event_id = uuid.uuid4().hex
        _ = self.process_occurrence(
            project_id=self.project.id,
            event_id=event_id,
            type=PerformanceP95EndpointRegressionGroupType.type_id,
            event_data={
                "fingerprint": ["group-1"],
                "timestamp": before_now(minutes=1).isoformat(),
                "transaction": "/books/",
            },
            evidence_data={
                "breakpoint": before_now(minutes=1).timestamp(),
            }
        )
        group = Group.objects.first()
        group.update(type=PerformanceP95EndpointRegressionGroupType.type_id)

        with self.feature(self.features):
            ImageBlockBuilder(group=group).build()
        assert False
