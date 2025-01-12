import {browserHistory} from 'react-router';
import type {Location} from 'history';

import type {GridColumnHeader} from 'sentry/components/gridEditable';
import GridEditable, {COL_WIDTH_UNDEFINED} from 'sentry/components/gridEditable';
import Link from 'sentry/components/links/link';
import type {CursorHandler} from 'sentry/components/pagination';
import Pagination from 'sentry/components/pagination';
import {t} from 'sentry/locale';
import type {Organization} from 'sentry/types/organization';
import type {EventsMetaType} from 'sentry/utils/discover/eventView';
import {getFieldRenderer} from 'sentry/utils/discover/fieldRenderers';
import type {Sort} from 'sentry/utils/discover/fields';
import {RATE_UNIT_TITLE, RateUnit} from 'sentry/utils/discover/fields';
import {VisuallyCompleteWithData} from 'sentry/utils/performanceForSentry';
import {decodeScalar, decodeSorts} from 'sentry/utils/queryString';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {normalizeUrl} from 'sentry/utils/withDomainRequired';
import {renderHeadCell} from 'sentry/views/starfish/components/tableCells/renderHeadCell';
import {useSpanMetrics} from 'sentry/views/starfish/queries/useSpanMetrics';
import type {MetricsResponse} from 'sentry/views/starfish/types';
import {QueryParameterNames} from 'sentry/views/starfish/views/queryParameters';
import {DataTitles} from 'sentry/views/starfish/views/spans/types';

type Row = Pick<
  MetricsResponse,
  | 'project.id'
  | 'span.description'
  | 'span.group'
  | 'spm()'
  | 'avg(span.duration)'
  | 'sum(span.duration)'
  | 'time_spent_percentage()'
>;

type Column = GridColumnHeader<
  'span.description' | 'spm()' | 'avg(span.duration)' | 'time_spent_percentage()'
>;

const COLUMN_ORDER: Column[] = [
  {
    key: 'span.description',
    name: t('AI Pipeline name'),
    width: COL_WIDTH_UNDEFINED,
  },
  {
    key: 'spm()',
    name: `${t('Times')} ${RATE_UNIT_TITLE[RateUnit.PER_MINUTE]}`,
    width: COL_WIDTH_UNDEFINED,
  },
  {
    key: `avg(span.duration)`,
    name: DataTitles.avg,
    width: COL_WIDTH_UNDEFINED,
  },
  {
    key: 'time_spent_percentage()',
    name: DataTitles.timeSpent,
    width: COL_WIDTH_UNDEFINED,
  },
];

const SORTABLE_FIELDS = ['avg(span.duration)', 'spm()', 'time_spent_percentage()'];

type ValidSort = Sort & {
  field: 'spm()' | 'avg(span.duration)' | 'time_spent_percentage()';
};

export function isAValidSort(sort: Sort): sort is ValidSort {
  return (SORTABLE_FIELDS as unknown as string[]).includes(sort.field);
}

export function PipelinesTable() {
  const location = useLocation();
  const organization = useOrganization();
  const cursor = decodeScalar(location.query?.[QueryParameterNames.SPANS_CURSOR]);
  const sortField = decodeScalar(location.query?.[QueryParameterNames.SPANS_SORT]);

  let sort = decodeSorts(sortField).filter(isAValidSort)[0];
  if (!sort) {
    sort = {field: 'time_spent_percentage()', kind: 'desc'};
  }
  const {data, isLoading, meta, pageLinks, error} = useSpanMetrics({
    search: new MutableSearch('span.category:ai.pipeline'),
    fields: [
      'project.id',
      'span.group',
      'span.description',
      'spm()',
      'avg(span.duration)',
      'sum(span.duration)',
      'time_spent_percentage()',
    ],
    sorts: [sort],
    limit: 25,
    cursor,
    referrer: 'api.ai-pipelines.view',
  });

  const handleCursor: CursorHandler = (newCursor, pathname, query) => {
    browserHistory.push({
      pathname,
      query: {...query, [QueryParameterNames.SPANS_CURSOR]: newCursor},
    });
  };

  return (
    <VisuallyCompleteWithData
      id="PipelinesTable"
      hasData={data.length > 0}
      isLoading={isLoading}
    >
      <GridEditable
        isLoading={isLoading}
        error={error}
        data={data}
        columnOrder={COLUMN_ORDER}
        columnSortBy={[
          {
            key: sort.field,
            order: sort.kind,
          },
        ]}
        grid={{
          renderHeadCell: column =>
            renderHeadCell({
              column,
              sort,
              location,
              sortParameterName: QueryParameterNames.SPANS_SORT,
            }),
          renderBodyCell: (column, row) =>
            renderBodyCell(column, row, meta, location, organization),
        }}
        location={location}
      />
      <Pagination pageLinks={pageLinks} onCursor={handleCursor} />
    </VisuallyCompleteWithData>
  );
}

function renderBodyCell(
  column: Column,
  row: Row,
  meta: EventsMetaType | undefined,
  location: Location,
  organization: Organization
) {
  if (column.key === 'span.description') {
    if (!row['span.description']) {
      return <span>(unknown)</span>;
    }
    if (!row['span.group']) {
      return <span>{row['span.description']}</span>;
    }
    return (
      <Link
        to={normalizeUrl(
          `/organizations/${organization.slug}/ai-analytics/pipeline-type/${row['span.group']}`
        )}
      >
        {row['span.description']}
      </Link>
    );
  }

  if (!meta || !meta?.fields) {
    return row[column.key];
  }

  const renderer = getFieldRenderer(column.key, meta.fields, false);

  const rendered = renderer(row, {
    location,
    organization,
    unit: meta.units?.[column.key],
  });

  return rendered;
}
