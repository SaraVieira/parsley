import type { Snippet } from './types';

export const COMMON_SNIPPETS: Array<Snippet> = [
  {
    label: 'return filter',
    detail: 'Return filtered data',
    insertText: 'return _.filter(data${1:.items}, item => ${2:item.active})',
    kind: 'Snippet',
  },
  {
    label: 'return map',
    detail: 'Return mapped data',
    insertText: 'return _.map(data${1:.items}, item => ({\n  ${2:...item}\n}))',
    kind: 'Snippet',
  },
  {
    label: 'return groupBy',
    detail: 'Return grouped data',
    insertText: "return _.groupBy(data${1:.items}, '${2:category}')",
    kind: 'Snippet',
  },
  {
    label: 'return sorted',
    detail: 'Return sorted data',
    insertText: "return _.sortBy(data${1:.items}, '${2:name}')",
    kind: 'Snippet',
  },
  {
    label: 'return keys',
    detail: 'Return object keys',
    insertText: 'return Object.keys(data)',
    kind: 'Snippet',
  },
  {
    label: 'return values',
    detail: 'Return object values',
    insertText: 'return Object.values(data)',
    kind: 'Snippet',
  },
  {
    label: 'return entries',
    detail: 'Return object entries',
    insertText:
      'return Object.entries(data).map(([k, v]) => ({ key: k, value: v }))',
    kind: 'Snippet',
  },
  {
    label: 'return pluck',
    detail: 'Extract single field from array',
    insertText: "return _.map(data${1:.items}, '${2:name}')",
    kind: 'Snippet',
  },
  {
    label: 'return stats',
    detail: 'Return aggregate stats',
    insertText:
      "return {\n  count: data${1:.items}.length,\n  sum: _.sumBy(data${1:.items}, '${2:value}'),\n  avg: _.meanBy(data${1:.items}, '${2:value}'),\n  min: _.minBy(data${1:.items}, '${2:value}')?.${2:value},\n  max: _.maxBy(data${1:.items}, '${2:value}')?.${2:value},\n}",
    kind: 'Snippet',
  },
  {
    label: 'chain',
    detail: 'Lodash chain pattern',
    insertText:
      "return _.chain(data${1:.items})\n  .filter(item => ${2:true})\n  .sortBy('${3:name}')\n  .value()",
    kind: 'Snippet',
  },
];
