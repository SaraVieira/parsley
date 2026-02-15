import type { Monaco } from '@monaco-editor/react';

type Snippet = {
  label: string;
  detail: string;
  insertText: string;
  kind: 'Snippet' | 'Function';
};

const LODASH_SNIPPETS: Snippet[] = [
  {
    label: '_.filter',
    detail: 'Filter items by condition',
    insertText: '_.filter(data, item => ${1:item.id > 0})',
    kind: 'Function',
  },
  {
    label: '_.map',
    detail: 'Transform each item',
    insertText:
      '_.map(data, item => ({\n  ...item,\n  ${1:key}: ${2:value}\n}))',
    kind: 'Function',
  },
  {
    label: '_.find',
    detail: 'Find first matching item',
    insertText: '_.find(data, item => ${1:item.id === 1})',
    kind: 'Function',
  },
  {
    label: '_.groupBy',
    detail: 'Group items by key',
    insertText: "_.groupBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.sortBy',
    detail: 'Sort items by key',
    insertText: "_.sortBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.uniqBy',
    detail: 'Unique items by key',
    insertText: "_.uniqBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.keyBy',
    detail: 'Index items by key',
    insertText: "_.keyBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.pick',
    detail: 'Pick specific keys from object',
    insertText: "_.pick(data, [${1:'key1', 'key2'}])",
    kind: 'Function',
  },
  {
    label: '_.omit',
    detail: 'Omit specific keys from object',
    insertText: "_.omit(data, [${1:'key1', 'key2'}])",
    kind: 'Function',
  },
  {
    label: '_.flatMap',
    detail: 'Map and flatten results',
    insertText: '_.flatMap(data, item => ${1:item.tags})',
    kind: 'Function',
  },
  {
    label: '_.countBy',
    detail: 'Count occurrences by key',
    insertText: "_.countBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.chunk',
    detail: 'Split array into chunks',
    insertText: '_.chunk(data, ${1:3})',
    kind: 'Function',
  },
  {
    label: '_.take',
    detail: 'Take first N items',
    insertText: '_.take(data, ${1:5})',
    kind: 'Function',
  },
  {
    label: '_.drop',
    detail: 'Skip first N items',
    insertText: '_.drop(data, ${1:5})',
    kind: 'Function',
  },
  {
    label: '_.orderBy',
    detail: 'Sort by multiple keys with order',
    insertText: "_.orderBy(data, ['${1:key}'], ['${2:asc}'])",
    kind: 'Function',
  },
  {
    label: '_.sumBy',
    detail: 'Sum values by key',
    insertText: "_.sumBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.meanBy',
    detail: 'Average values by key',
    insertText: "_.meanBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.minBy',
    detail: 'Find min by key',
    insertText: "_.minBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.maxBy',
    detail: 'Find max by key',
    insertText: "_.maxBy(data, '${1:key}')",
    kind: 'Function',
  },
  {
    label: '_.get',
    detail: 'Get nested value by path',
    insertText: "_.get(data, '${1:path.to.value}')",
    kind: 'Function',
  },
  {
    label: '_.set',
    detail: 'Set nested value by path',
    insertText: "_.set(_.cloneDeep(data), '${1:path}', ${2:value})",
    kind: 'Function',
  },
  {
    label: '_.merge',
    detail: 'Deep merge objects',
    insertText: '_.merge({}, data, { ${1:key}: ${2:value} })',
    kind: 'Function',
  },
  {
    label: '_.flatten',
    detail: 'Flatten nested arrays',
    insertText: '_.flatten(data)',
    kind: 'Function',
  },
  {
    label: '_.compact',
    detail: 'Remove falsy values',
    insertText: '_.compact(data)',
    kind: 'Function',
  },
  {
    label: '_.partition',
    detail: 'Split into two groups',
    insertText: '_.partition(data, item => ${1:item.active})',
    kind: 'Function',
  },
  {
    label: '_.intersection',
    detail: 'Items present in all arrays',
    insertText: '_.intersection(data${1:, otherArray})',
    kind: 'Function',
  },
  {
    label: '_.difference',
    detail: 'Items not in other arrays',
    insertText: '_.difference(data${1:, otherArray})',
    kind: 'Function',
  },
  {
    label: '_.zip',
    detail: 'Zip arrays together',
    insertText: '_.zip(${1:data.keys}, ${2:data.values})',
    kind: 'Function',
  },
  {
    label: '_.fromPairs',
    detail: 'Convert [key,value] pairs to object',
    insertText: '_.fromPairs(data)',
    kind: 'Function',
  },
  {
    label: '_.toPairs',
    detail: 'Convert object to [key,value] pairs',
    insertText: '_.toPairs(data)',
    kind: 'Function',
  },
];

const COMMON_SNIPPETS: Snippet[] = [
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

export function registerTransformCompletions(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', '_'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const allSnippets = [...LODASH_SNIPPETS, ...COMMON_SNIPPETS];

      const suggestions = allSnippets.map((snippet) => ({
        label: snippet.label,
        kind:
          snippet.kind === 'Function'
            ? monaco.languages.CompletionItemKind.Function
            : monaco.languages.CompletionItemKind.Snippet,
        detail: snippet.detail,
        insertText: snippet.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      }));

      return { suggestions };
    },
  });
}
