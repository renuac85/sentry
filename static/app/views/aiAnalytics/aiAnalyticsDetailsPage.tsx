import styled from '@emotion/styled';

import Feature from 'sentry/components/acl/feature';
import {Alert} from 'sentry/components/alert';
import * as Layout from 'sentry/components/layouts/thirds';
import NoProjectMessage from 'sentry/components/noProjectMessage';
import {DatePageFilter} from 'sentry/components/organizations/datePageFilter';
import {EnvironmentPageFilter} from 'sentry/components/organizations/environmentPageFilter';
import PageFilterBar from 'sentry/components/organizations/pageFilterBar';
import PageFiltersContainer from 'sentry/components/organizations/pageFilters/container';
import {ProjectPageFilter} from 'sentry/components/organizations/projectPageFilter';
import {PageHeadingQuestionTooltip} from 'sentry/components/pageHeadingQuestionTooltip';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {DurationUnit, RateUnit} from 'sentry/utils/discover/fields';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import useOrganization from 'sentry/utils/useOrganization';
import {
  NumberOfPipelinesChart,
  PipelineDurationChart,
} from 'sentry/views/aiAnalytics/aiAnalyticsCharts';
import {PipelineSpansTable} from 'sentry/views/aiAnalytics/pipelineSpansTable';
import {MetricReadout} from 'sentry/views/performance/metricReadout';
import * as ModuleLayout from 'sentry/views/performance/moduleLayout';
import {useSpanMetrics} from 'sentry/views/starfish/queries/useSpanMetrics';
import {
  SpanFunction,
  SpanMetricsField,
  type SpanMetricsQueryFilters,
} from 'sentry/views/starfish/types';
import {DataTitles} from 'sentry/views/starfish/views/spans/types';

function NoAccessComponent() {
  return (
    <Layout.Page withPadding>
      <Alert type="warning">{t("You don't have access to this feature")}</Alert>
    </Layout.Page>
  );
}
interface Props {
  params: {
    groupId: string;
  };
}

export default function AiAnalyticsPage({params}: Props) {
  const organization = useOrganization();
  const {groupId} = params;

  const filters: SpanMetricsQueryFilters = {
    'span.group': groupId,
    'span.category': 'ai.pipeline',
  };

  const {data, isLoading: areSpanMetricsLoading} = useSpanMetrics({
    search: MutableSearch.fromQueryObject(filters),
    fields: [
      SpanMetricsField.SPAN_OP,
      SpanMetricsField.SPAN_DESCRIPTION,
      'count()',
      `${SpanFunction.SPM}()`,
      `avg(${SpanMetricsField.SPAN_DURATION})`,
    ],
    enabled: Boolean(groupId),
    referrer: 'api.ai-pipelines.view',
  });
  const spanMetrics = data[0] ?? {};

  return (
    <PageFiltersContainer>
      <SentryDocumentTitle
        title={`AI Analytics — ${spanMetrics['span.description'] ?? t('(no name)')}`}
      >
        <Layout.Page>
          <Feature
            features="ai-analytics"
            organization={organization}
            renderDisabled={NoAccessComponent}
          >
            <NoProjectMessage organization={organization}>
              <Layout.Header>
                <Layout.HeaderContent>
                  <Layout.Title>
                    {`${t('AI Analytics')} - ${spanMetrics['span.description'] ?? t('(no name)')}`}
                    <PageHeadingQuestionTooltip
                      title={t(
                        'If this name is too generic, read the docs to learn how to change it.'
                      )}
                      docsUrl="https://docs.sentry.io/product/ai-analytics/"
                    />
                  </Layout.Title>
                </Layout.HeaderContent>
              </Layout.Header>
              <Layout.Body>
                <Layout.Main fullWidth>
                  <ModuleLayout.Layout>
                    <ModuleLayout.Full>
                      <SpaceBetweenWrap>
                        <PageFilterBar condensed>
                          <ProjectPageFilter />
                          <EnvironmentPageFilter />
                          <DatePageFilter />
                        </PageFilterBar>
                        <MetricsRibbon>
                          <MetricReadout
                            title={t('Total Runs')}
                            value={spanMetrics['count()']}
                            unit={'count'}
                            isLoading={areSpanMetricsLoading}
                          />

                          <MetricReadout
                            title={t('Runs Per Minute')}
                            value={spanMetrics?.[`${SpanFunction.SPM}()`]}
                            unit={RateUnit.PER_MINUTE}
                            isLoading={areSpanMetricsLoading}
                          />

                          <MetricReadout
                            title={DataTitles.avg}
                            value={
                              spanMetrics?.[`avg(${SpanMetricsField.SPAN_DURATION})`]
                            }
                            unit={DurationUnit.MILLISECOND}
                            isLoading={areSpanMetricsLoading}
                          />
                        </MetricsRibbon>
                      </SpaceBetweenWrap>
                    </ModuleLayout.Full>
                    <ModuleLayout.Half>
                      <NumberOfPipelinesChart groupId={groupId} />
                    </ModuleLayout.Half>
                    <ModuleLayout.Half>
                      <PipelineDurationChart groupId={groupId} />
                    </ModuleLayout.Half>
                    <ModuleLayout.Full>
                      <PipelineSpansTable groupId={groupId} />
                    </ModuleLayout.Full>
                  </ModuleLayout.Layout>
                </Layout.Main>
              </Layout.Body>
            </NoProjectMessage>
          </Feature>
        </Layout.Page>
      </SentryDocumentTitle>
    </PageFiltersContainer>
  );
}

const SpaceBetweenWrap = styled('div')`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const MetricsRibbon = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${space(4)};
`;
