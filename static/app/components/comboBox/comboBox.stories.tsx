import {Fragment, useState} from 'react';

import type {ComboBoxOptionOrSection} from 'sentry/components/comboBox/types';
import Matrix from 'sentry/components/stories/matrix';
import SizingWindow from 'sentry/components/stories/sizingWindow';
import storyBook from 'sentry/stories/storyBook';

import {ComboBox} from './';

const options: ComboBoxOptionOrSection<string>[] = [
  {label: 'Option One', value: 'opt_one'},
  {label: 'Option Two', value: 'opt_two'},
  {label: 'Option Three', value: 'opt_three'},
  {label: 'Disabled', value: 'opt_dis', disabled: true},
  {label: 'Option Four', textValue: 'included in search', value: 'opt_four'},
  {
    label: 'Section',
    options: [
      {label: 'Other Option One', value: 'oth_opt_one'},
      {label: 'Other Option Two', value: 'oth_opt_two'},
      {label: 'Other Option Three', value: 'oth_opt_three'},
      {label: 'Other Disabled', value: 'oth_opt_dis', disabled: true},
      {
        label: 'Other Option Four',
        textValue: 'included in search',
        value: 'oth_opt_four',
      },
    ],
  },
];

export default storyBook('ComboBox', story => {
  story('Default', () => {
    const [value, setValue] = useState('opt_one');
    return (
      <SizingWindow display="block" style={{overflow: 'visible'}}>
        <ComboBox
          value={value}
          onChange={({value: newValue}) => setValue(newValue)}
          aria-label="ComboBox"
          menuTrigger="focus"
          placeholder="Select an Option"
          options={options}
        />
      </SizingWindow>
    );
  });

  story('With list size limit', () => {
    const [value, setValue] = useState('opt_one');
    return (
      <Fragment>
        <SizingWindow display="block" style={{overflow: 'visible'}}>
          <ComboBox
            value={value}
            onChange={({value: newValue}) => setValue(newValue)}
            aria-label="ComboBox"
            menuTrigger="focus"
            placeholder="Select an Option"
            sizeLimit={5}
            options={options}
          />
        </SizingWindow>
      </Fragment>
    );
  });

  story('Loading indicator', () => {
    const [value, setValue] = useState('opt_one');
    return (
      <SizingWindow display="block" style={{overflow: 'visible'}}>
        <ComboBox
          value={value}
          onChange={({value: newValue}) => setValue(newValue)}
          aria-label="ComboBox"
          menuTrigger="focus"
          placeholder="Select an Option"
          isLoading
          options={options}
        />
      </SizingWindow>
    );
  });

  story('Size vs diabled', () => {
    return (
      <Matrix
        render={props => {
          const [value, setValue] = useState('opt_one');
          return (
            <ComboBox
              value={value}
              onChange={({value: newValue}) => setValue(newValue)}
              aria-label="ComboBox"
              menuTrigger="focus"
              placeholder="Select an Option"
              options={options}
              {...props}
            />
          );
        }}
        selectedProps={['size', 'disabled']}
        propMatrix={{
          size: ['md', 'sm', 'xs'] as const,
          disabled: [false, true],
        }}
        sizingWindowProps={{style: {overflow: 'visible'}}}
      />
    );
  });
});
