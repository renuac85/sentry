from datetime import datetime, timedelta
from django.utils import timezone
from django.utils.timesince import timesince
from sentry.models.group import Group
from django.utils.translation import gettext as _


def get_approx_start_time(group: Group):
    event = group.get_recommended_event_for_environments()

    if event is None:
        return None

    occurrence = event.occurrence

    if occurrence is None:
        return None

    regression_time = occurrence.evidence_data.get("breakpoint", None)

    if regression_time is None:
        return None

    # format moment into YYYY-mm-dd h:m:s
    time = datetime.fromtimestamp(regression_time)
    return time.strftime("%Y-%m-%d %H:%M:%S")


def time_since(value: datetime):
    """
    Display the relative time
    """
    now = timezone.now()
    if value < (now - timedelta(days=5)):
        return value.date()
    diff = timesince(value, now)
    if diff == timesince(now, now):
        return "Just now"
    if diff == "1 day":
        return _("Yesterday")
    return f"{diff} ago"
