import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  type ConsoleEntry,
  executeTransformCode,
} from '@/lib/utils/json-executor';
import {
  addAtPath,
  bulkDeleteKey,
  bulkRenameKey,
  deleteAtPath,
  renameKeyAtPath,
  setValueAtPath,
} from '@/lib/utils/json-path';
import { hydrateFromShareUrl } from '@/lib/utils/share-url';

const SAMPLE_JSON = JSON.stringify(
  {
    users: [
      { id: 1, name: 'Alice', age: 30, role: 'admin' },
      { id: 2, name: 'Bob', age: 25, role: 'user' },
      { id: 3, name: 'Charlie', age: 35, role: 'user' },
      { id: 4, name: 'Diana', age: 28, role: 'admin' },
    ],
    metadata: {
      total: 4,
      page: 1,
      perPage: 10,
    },
  },
  null,
  2,
);

const SAMPLE_TRANSFORM = `// 'data' is your parsed JSON, '_' is lodash
// Return the transformed result

return _.filter(data.users, u => u.role === "admin")`;

type ViewMode = 'graph' | 'tree' | 'types' | 'diff' | 'table';

type HistoryEntry = {
  transformedJson: unknown;
  transformCode: string;
};

type EditorTab = 'json' | 'transform';

type ParsleyState = {
  jsonInput: string;
  parsedJson: unknown;
  jsonError: string | null;
  transformCode: string;
  transformError: string | null;
  transformedJson: unknown;
  viewMode: ViewMode;
  editorTab: EditorTab;
  history: Array<HistoryEntry>;
  rootName: string;
  consoleLogs: Array<ConsoleEntry>;
  autoRun: boolean;
};

type ParsleyActions = {
  setJsonInput: (input: string) => void;
  setTransformCode: (code: string) => void;
  executeTransform: () => void;
  setViewMode: (mode: ViewMode) => void;
  revert: () => void;
  reset: () => void;
  updateValueAtPath: (path: string, value: unknown) => void;
  deleteAtPath: (path: string) => void;
  renameKeyAtPath: (path: string, newKey: string) => void;
  addAtPath: (path: string, key: string, value: unknown) => void;
  bulkRenameKey: (oldKey: string, newKey: string) => void;
  bulkDeleteKey: (key: string) => void;
  setEditorTab: (tab: EditorTab) => void;
  setRootName: (name: string) => void;
  clearConsoleLogs: () => void;
  setAutoRun: (autoRun: boolean) => void;
};

export type ParsleyStore = ParsleyState & ParsleyActions;

const MAX_HISTORY = 50;
const initialParsedJson = JSON.parse(SAMPLE_JSON);

// Pre-seed localStorage from share URL before store initialization
hydrateFromShareUrl();

export const useParsleyStore = create<ParsleyStore>()(
  persist(
    (set, get) => {
      const applyMutation = (mutate: (json: unknown) => unknown) => {
        const { parsedJson } = get();
        const updated = mutate(parsedJson);
        const newInput = JSON.stringify(updated, null, 2);
        set({
          jsonInput: newInput,
          parsedJson: updated,
          jsonError: null,
          transformedJson: updated,
          transformError: null,
        });
      };

      return {
        jsonInput: SAMPLE_JSON,
        parsedJson: initialParsedJson,
        jsonError: null,
        transformCode: SAMPLE_TRANSFORM,
        transformError: null,
        transformedJson: initialParsedJson,
        viewMode: 'graph',
        editorTab: 'json',
        history: [],
        rootName: 'Root',
        consoleLogs: [],
        autoRun: false,

        setJsonInput: (input: string) => {
          try {
            const parsed = JSON.parse(input);
            set({
              jsonInput: input,
              parsedJson: parsed,
              jsonError: null,
              transformedJson: parsed,
              transformError: null,
            });
          } catch (e) {
            set({
              jsonInput: input,
              jsonError: e instanceof Error ? e.message : 'Invalid JSON',
            });
          }
        },

        setTransformCode: (code: string) => {
          set({ transformCode: code });
        },

        executeTransform: () => {
          const { parsedJson, transformCode, transformedJson, jsonError } =
            get();
          if (jsonError) {
            return;
          }

          const { result, error, logs } = executeTransformCode(
            transformCode,
            parsedJson,
          );

          if (error) {
            set({ transformError: error, consoleLogs: logs });
          } else {
            set((state) => ({
              transformedJson: result,
              transformError: null,
              consoleLogs: logs,
              history: [
                ...state.history,
                {
                  transformedJson: transformedJson,
                  transformCode: state.transformCode,
                },
              ].slice(-MAX_HISTORY),
            }));
          }
        },

        setViewMode: (mode: ViewMode) => {
          set({ viewMode: mode });
        },

        setEditorTab: (tab: EditorTab) => {
          set({ editorTab: tab });
        },

        revert: () => {
          const { history } = get();
          if (history.length === 0) {
            return;
          }

          const previous = history[history.length - 1];
          set({
            transformedJson: previous.transformedJson,
            transformCode: previous.transformCode,
            transformError: null,
            history: history.slice(0, -1),
          });
        },

        reset: () => {
          set({
            jsonInput: SAMPLE_JSON,
            parsedJson: initialParsedJson,
            jsonError: null,
            transformCode: SAMPLE_TRANSFORM,
            transformError: null,
            transformedJson: initialParsedJson,
            viewMode: 'graph',
            history: [],
            rootName: 'Root',
            consoleLogs: [],
            autoRun: false,
          });
        },

        updateValueAtPath: (path, value) =>
          applyMutation((json) => setValueAtPath(json, path, value)),

        deleteAtPath: (path) =>
          applyMutation((json) => deleteAtPath(json, path)),

        renameKeyAtPath: (path, newKey) =>
          applyMutation((json) => renameKeyAtPath(json, path, newKey)),

        addAtPath: (path, key, value) =>
          applyMutation((json) => addAtPath(json, path, key, value)),

        bulkRenameKey: (oldKey, newKey) =>
          applyMutation((json) => bulkRenameKey(json, oldKey, newKey)),

        bulkDeleteKey: (key) =>
          applyMutation((json) => bulkDeleteKey(json, key)),

        setRootName: (name: string) => {
          set({ rootName: name });
        },

        clearConsoleLogs: () => {
          set({ consoleLogs: [] });
        },

        setAutoRun: (autoRun: boolean) => {
          set({ autoRun });
        },
      };
    },
    {
      name: 'parsley-store',
      partialize: (state) => ({
        jsonInput: state.jsonInput,
        transformCode: state.transformCode,
        rootName: state.rootName,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        try {
          const parsed = JSON.parse(state.jsonInput);
          state.parsedJson = parsed;
          state.transformedJson = parsed;
          state.jsonError = null;
        } catch (e) {
          state.jsonError = e instanceof Error ? e.message : 'Invalid JSON';
        }
      },
    },
  ),
);
