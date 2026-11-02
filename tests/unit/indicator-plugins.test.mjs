import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formulaIndicatorPlugin, pluginTemplates } from '../../src/app/playground/indicatorPlugins.ts';

const bars = [
  { timestamp: 1, open: 10, high: 14, low: 10, close: 11, volume: 1 },
  { timestamp: 2, open: 7, high: 7, low: 7, close: 7, volume: 1 },
];
test('price-measure plugins produce finite, causal values including flat candles', () => {
  assert.deepEqual(pluginTemplates[0].calc(bars, []), [{ value: 25 }, { value: 50 }]);
  assert.deepEqual(pluginTemplates[1].calc(bars, []), [{ value: 4 }, { value: 0 }]);
  for (const template of pluginTemplates) {
    assert.deepEqual(template.calc([], []), []);
    assert.deepEqual(template.calc(bars.slice(0, 1), []), template.calc(bars, []).slice(0, 1));
  }
});
test('plugin installation registers both compiled templates', () => {
  const registered = [];
  formulaIndicatorPlugin.install({ registerTemplate: template => registered.push(template) });
  assert.deepEqual(registered, pluginTemplates);
});
