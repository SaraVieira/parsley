import type { Monaco } from '@monaco-editor/react';

import { COMMON_SNIPPETS } from './common-snippets';
import { LODASH_SNIPPETS } from './lodash-snippets';

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
