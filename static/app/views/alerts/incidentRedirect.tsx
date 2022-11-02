import {useCallback, useEffect, useState} from 'react';
import {browserHistory, RouteComponentProps} from 'react-router';

import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {Organization} from 'sentry/types';
import trackAdvancedAnalyticsEvent from 'sentry/utils/analytics/trackAdvancedAnalyticsEvent';
import useRouteAnalyticsEventNames from 'sentry/utils/routeAnalytics/useRouteAnalyticsEventNames';
import useRouteAnalyticsParams from 'sentry/utils/routeAnalytics/useRouteAnalyticsParams';
import useApi from 'sentry/utils/useApi';

import {fetchIncident} from './utils/apiCalls';
import {alertDetailsLink} from './utils';

type Props = {
  organization: Organization;
} & RouteComponentProps<{alertId: string; orgId: string}, {}>;

/**
 * Reirects from an incident to the incident's metric alert details page
 */
function IncidentRedirect({organization, params}: Props) {
  const api = useApi();
  const [hasError, setHasError] = useState(false);
  useRouteAnalyticsEventNames('alert_details.viewed', 'Alert Details: Viewed');
  useRouteAnalyticsParams({alert_id: parseInt(params.alertId, 10)});

  const track = useCallback(() => {
    // TODO: remove once we set this flag to true for everyone
    if (!organization.features.includes('auto-capture-page-load-analytics')) {
      trackAdvancedAnalyticsEvent('alert_details.viewed', {
        organization,
        alert_id: parseInt(params.alertId, 10),
      });
    }
  }, [organization, params.alertId]);

  const fetchData = useCallback(async () => {
    setHasError(false);

    try {
      const incident = await fetchIncident(api, params.orgId, params.alertId);
      browserHistory.replace({
        pathname: alertDetailsLink(organization, incident),
        query: {alert: incident.identifier},
      });
    } catch (err) {
      setHasError(true);
    }
  }, [setHasError, api, params.orgId, params.alertId, organization]);

  useEffect(() => {
    fetchData();
    track();
  }, [fetchData, track]);

  if (hasError) {
    return <LoadingError onRetry={fetchData} />;
  }

  return <LoadingIndicator />;
}

export default IncidentRedirect;
