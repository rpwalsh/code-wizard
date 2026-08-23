// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { TemperaturePair, convert, toCelsius, toFahrenheit } from '../main.js';

const empty = { celsius: '', fahrenheit: '' };

test(
  'the conversions convert',
  () => {
    expectEqual(toFahrenheit(100), 212);
    expectEqual(toFahrenheit(0), 32);
    expectEqual(toCelsius(212), 100);
    expectEqual(toCelsius(50), 10);
  },
  { concept: 'react.state.lifting' },
);

test(
  'editing celsius fills fahrenheit',
  () => {
    expectEqual(convert(empty, 'celsius', '25'), { celsius: '25', fahrenheit: '77' });
  },
  { concept: 'react.state.lifting' },
);

test(
  'editing fahrenheit fills celsius',
  () => {
    expectEqual(convert(empty, 'fahrenheit', '32'), { celsius: '0', fahrenheit: '32' });
  },
  { concept: 'react.state.lifting' },
);

test(
  'rounding stops at one decimal place',
  () => {
    expectEqual(convert(empty, 'fahrenheit', '100'), { celsius: '37.8', fahrenheit: '100' });
  },
  { concept: 'react.state.lifting' },
);

test(
  'the pair renders both values from the one state',
  () => {
    const markup = renderToStaticMarkup(
      <TemperaturePair state={{ celsius: '25', fahrenheit: '77' }} onEdit={() => undefined} />,
    );
    expectTrue(markup.includes('Celsius'));
    expectTrue(markup.includes('Fahrenheit'));
    expectTrue(markup.includes('value="25"'));
    expectTrue(markup.includes('value="77"'));
  },
  { concept: 'react.render.jsx' },
);
