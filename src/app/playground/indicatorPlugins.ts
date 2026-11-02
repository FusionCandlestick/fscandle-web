import type { IndicatorTemplate } from 'fscandle';

export interface IndicatorPlugin {
  name: string;
  version: string;
  install: (context: { registerTemplate: (template: IndicatorTemplate) => void }) => void;
}

/** Compiled templates only: no evaluation of user-entered formula strings. */
export const pluginTemplates: IndicatorTemplate[] = [
  {
    name: 'Close position in range', shortName: 'RANGE_POSITION', calcParams: [],
    figures: [{ key: 'value', title: 'Position', type: 'line' }],
    calc: data => data.map(bar => ({ value: bar.high === bar.low ? 50 : 100 * (bar.close - bar.low) / (bar.high - bar.low) })),
  },
  {
    name: 'Candle range', shortName: 'CANDLE_RANGE', calcParams: [],
    figures: [{ key: 'value', title: 'Range', type: 'line' }],
    calc: data => data.map(bar => ({ value: bar.high - bar.low })),
  },
];

export const formulaIndicatorPlugin: IndicatorPlugin = {
  name: 'fscandle-price-measures', version: '1.0.0',
  install: context => pluginTemplates.forEach(template => context.registerTemplate(template)),
};
