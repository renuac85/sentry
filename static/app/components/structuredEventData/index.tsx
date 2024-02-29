import {Fragment, isValidElement} from 'react';
import styled from '@emotion/styled';
import isNumber from 'lodash/isNumber';

import {AnnotatedText} from 'sentry/components/events/meta/annotatedText';
import ExternalLink from 'sentry/components/links/externalLink';
import {IconOpen} from 'sentry/icons';
import {t} from 'sentry/locale';
import {isUrl} from 'sentry/utils';

import Toggle from './toggle';
import {analyzeStringForRepr, naturalCaseInsensitiveSort} from './utils';

export type StructedEventDataConfig = {
  isBoolean?: (value: unknown) => boolean;
  isNull?: (value: unknown) => boolean;
  renderBoolean?: (value: unknown) => React.ReactNode;
  renderNull?: (value: unknown) => React.ReactNode;
};

type StructedEventDataProps = {
  children?: React.ReactNode;
  className?: string;
  /**
   * Allows customization of how values are rendered
   */
  config?: StructedEventDataConfig;
  data?: React.ReactNode;
  'data-test-id'?: string;
  maxDefaultDepth?: number;
  meta?: Record<any, any>;
  preserveQuotes?: boolean;
  withAnnotatedText?: boolean;
};

function AnnotatedValue({
  value,
  withAnnotatedText,
  meta,
}: {
  meta: Record<any, any> | undefined;
  withAnnotatedText: boolean;
  value?: React.ReactNode;
}) {
  if (!withAnnotatedText || !meta) {
    return <Fragment>{value}</Fragment>;
  }

  return <AnnotatedText value={value} meta={meta?.[''] ?? meta} />;
}

function LinkHint({value}: {value: string}) {
  if (!isUrl(value)) {
    return null;
  }

  return (
    <ExternalLink href={value} className="external-icon">
      <StyledIconOpen size="xs" aria-label={t('Open link')} />
    </ExternalLink>
  );
}

function StructedData({
  config,
  depth,
  value = null,
  maxDefaultDepth,
  preserveQuotes,
  withAnnotatedText,
  meta,
}: {
  config: StructedEventDataConfig | undefined;
  depth: number;
  maxDefaultDepth: number;
  meta: Record<any, any> | undefined;
  preserveQuotes: boolean;
  withAnnotatedText: boolean;
  value?: React.ReactNode;
}) {
  let i = 0;

  const children: React.ReactNode[] = [];

  if (config?.isNull?.(value) || value === null) {
    const nullValue = config?.renderNull?.(value) ?? String(value);

    return (
      <ValueNull data-test-id="value-null">
        <AnnotatedValue
          value={nullValue}
          meta={meta}
          withAnnotatedText={withAnnotatedText}
        />
      </ValueNull>
    );
  }

  if (config?.isBoolean?.(value) || value === true || value === false) {
    const booleanValue = config?.renderBoolean?.(value) ?? String(value);

    return (
      <ValueBoolean data-test-id="value-boolean">
        <AnnotatedValue
          value={booleanValue}
          meta={meta}
          withAnnotatedText={withAnnotatedText}
        />
      </ValueBoolean>
    );
  }

  if (typeof value === 'string') {
    const valueInfo = analyzeStringForRepr(value);

    const annotatedValue = withAnnotatedText ? (
      <AnnotatedValue
        value={valueInfo.repr}
        meta={meta}
        withAnnotatedText={withAnnotatedText}
      />
    ) : (
      valueInfo.repr
    );

    const printedValue = preserveQuotes ? `"${annotatedValue}"` : annotatedValue;

    if (valueInfo.isStripped) {
      return <ValueStrippedString>{printedValue}</ValueStrippedString>;
    }

    if (valueInfo.isMultiLine) {
      return (
        <ValueMultiLineString>
          {printedValue}
          <LinkHint value={value} />
        </ValueMultiLineString>
      );
    }

    return (
      <span>
        {printedValue}
        <LinkHint value={value} />
      </span>
    );
  }

  if (isNumber(value)) {
    const valueToBeReturned =
      withAnnotatedText && meta ? (
        <AnnotatedValue value={value} meta={meta} withAnnotatedText={withAnnotatedText} />
      ) : (
        value
      );
    return <span>{valueToBeReturned}</span>;
  }
  if (Array.isArray(value)) {
    for (i = 0; i < value.length; i++) {
      children.push(
        <div key={i}>
          <StructedData
            config={config}
            value={value[i]}
            depth={depth + 1}
            preserveQuotes={preserveQuotes}
            withAnnotatedText={withAnnotatedText}
            meta={meta?.[i]}
            maxDefaultDepth={maxDefaultDepth}
          />
          {i < value.length - 1 ? <span>{', '}</span> : null}
        </div>
      );
    }
    return (
      <span>
        <span>{'['}</span>
        <Toggle highUp={depth <= maxDefaultDepth}>{children}</Toggle>
        <span>{']'}</span>
      </span>
    );
  }
  if (isValidElement(value)) {
    return value;
  }
  const keys = Object.keys(value);
  keys.sort(naturalCaseInsensitiveSort);
  for (i = 0; i < keys.length; i++) {
    const key = keys[i];

    children.push(
      <div key={key}>
        <ValueObjectKey>{preserveQuotes ? `"${key}"` : key}</ValueObjectKey>
        <span>{': '}</span>
        <span>
          <StructedData
            config={config}
            value={value[key]}
            depth={depth + 1}
            preserveQuotes={preserveQuotes}
            withAnnotatedText={withAnnotatedText}
            meta={meta?.[key]}
            maxDefaultDepth={maxDefaultDepth}
          />
          {i < keys.length - 1 ? <span>{', '}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <span>
      <span>{'{'}</span>
      <Toggle highUp={depth <= maxDefaultDepth - 1}>{children}</Toggle>
      <span>{'}'}</span>
    </span>
  );
}

function StructuredEventData({
  config,
  children,
  meta,
  maxDefaultDepth = 2,
  data = null,
  preserveQuotes = false,
  withAnnotatedText = false,
  ...props
}: StructedEventDataProps) {
  return (
    <pre {...props}>
      <StructedData
        config={config}
        value={data}
        depth={0}
        maxDefaultDepth={maxDefaultDepth}
        meta={meta}
        withAnnotatedText={withAnnotatedText}
        preserveQuotes={preserveQuotes}
      />
      {children}
    </pre>
  );
}

export default StructuredEventData;

const StyledIconOpen = styled(IconOpen)`
  position: relative;
  top: 1px;
`;

const ValueNull = styled('span')`
  font-weight: bold;
  color: var(--prism-property);
`;

const ValueBoolean = styled('span')`
  font-weight: bold;
  color: var(--prism-property);
`;

const ValueMultiLineString = styled('span')`
  display: block;
  overflow: auto;
  border-radius: 4px;
  padding: 2px 4px;
`;

const ValueStrippedString = styled('span')`
  font-weight: bold;
  color: var(--prism-keyword);
`;

const ValueObjectKey = styled('span')`
  color: var(--prism-keyword);
`;