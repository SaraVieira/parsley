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
import { DEFAULT_MONACO_THEME } from '@/lib/utils/monaco-themes';
import { hydrateFromShareUrl } from '@/lib/utils/share-url';

const SAMPLE_JSON = JSON.stringify(
  {
    name: 'Smith Family Cookbook',
    version: 2,
    lastUpdated: '2026-02-17T10:00:00Z',
    categories: [
      'stan-approved',
      'rogers-personas',
      'francine-specials',
      'klaus-cuisine',
    ],
    recipes: [
      {
        id: 1,
        title: "Francine's Forgot-The-Kids Casserole",
        category: 'francine-specials',
        chef: 'Francine Smith',
        difficulty: 'easy',
        prepTimeMinutes: 15,
        ingredients: [
          { name: 'tater tots', amount: 2, unit: 'bags', fresh: false },
          { name: 'canned cheese', amount: 1, unit: 'cans', fresh: false },
          { name: 'mystery meat', amount: 1.5, unit: 'lbs', fresh: false },
          {
            name: "wine (cook's treat)",
            amount: 3,
            unit: 'glasses',
            fresh: true,
          },
        ],
        rating: 3.2,
        tags: ['comfort-food', 'questionable', 'family-dinner'],
        stanApproved: true,
      },
      {
        id: 2,
        title: "Roger's Ricky Spanish Paella",
        category: 'rogers-personas',
        chef: 'Ricky Spanish',
        difficulty: 'hard',
        prepTimeMinutes: 90,
        ingredients: [
          { name: 'saffron', amount: 1, unit: 'pinch', fresh: true },
          { name: 'stolen shrimp', amount: 1, unit: 'lbs', fresh: false },
          { name: 'arborio rice', amount: 2, unit: 'cups', fresh: false },
          { name: 'revenge', amount: 1, unit: 'dash', fresh: true },
        ],
        rating: 4.9,
        tags: ['spanish', 'dramatic', 'persona-cooking'],
        stanApproved: false,
      },
      {
        id: 3,
        title: "Stan's Freedom Meatloaf",
        category: 'stan-approved',
        chef: 'Stan Smith',
        difficulty: 'medium',
        prepTimeMinutes: 60,
        ingredients: [
          { name: 'ground beef', amount: 2, unit: 'lbs', fresh: true },
          {
            name: 'bald eagle seasoning',
            amount: 3,
            unit: 'tbsp',
            fresh: false,
          },
          {
            name: 'ketchup (american-made)',
            amount: 0.5,
            unit: 'cups',
            fresh: false,
          },
          { name: 'patriotism', amount: 1776, unit: 'units', fresh: true },
        ],
        rating: 4.1,
        tags: ['american', 'manly', 'cia-approved'],
        stanApproved: true,
      },
      {
        id: 4,
        title: "Klaus's Sad Bowl of Bratwurst",
        category: 'klaus-cuisine',
        chef: 'Klaus Heissler',
        difficulty: 'medium',
        prepTimeMinutes: 40,
        ingredients: [
          { name: 'bratwurst', amount: 4, unit: 'links', fresh: true },
          { name: 'sauerkraut', amount: 1, unit: 'cups', fresh: true },
          { name: 'german mustard', amount: 3, unit: 'tbsp', fresh: false },
          {
            name: 'tears of a former olympian',
            amount: 2,
            unit: 'drops',
            fresh: true,
          },
        ],
        rating: 3.8,
        tags: ['german', 'nostalgic', 'fish-made'],
        stanApproved: false,
      },
      {
        id: 5,
        title: "Jeff's Totally Chill Nachos",
        category: 'francine-specials',
        chef: 'Jeff Fischer',
        difficulty: 'easy',
        prepTimeMinutes: 10,
        ingredients: [
          { name: 'tortilla chips', amount: 1, unit: 'bags', fresh: false },
          { name: 'shredded cheese', amount: 2, unit: 'cups', fresh: false },
          { name: 'jalapeños', amount: 5, unit: 'whole', fresh: true },
          { name: 'good vibes', amount: 100, unit: 'percent', fresh: true },
        ],
        rating: 4.4,
        tags: ['snack', 'chill', 'hayley-tolerates-it'],
        stanApproved: false,
      },
      {
        id: 6,
        title: "Steve's Dungeon Master Dip",
        category: 'stan-approved',
        chef: 'Steve Smith',
        difficulty: 'easy',
        prepTimeMinutes: 15,
        ingredients: [
          { name: 'cream cheese', amount: 8, unit: 'oz', fresh: false },
          { name: 'spinach', amount: 1, unit: 'cups', fresh: true },
          { name: 'artichoke hearts', amount: 1, unit: 'cans', fresh: false },
          {
            name: "snot's secret ingredient",
            amount: 1,
            unit: 'tsp',
            fresh: false,
          },
        ],
        rating: 3.5,
        tags: ['nerdy', 'party-dip', 'basement-approved'],
        stanApproved: true,
      },
    ],
    metadata: {
      totalRecipes: 6,
      averageRating: null,
      featured: true,
      warning: 'Roger may have poisoned one of these',
      ciaClassified: false,
    },
  },
  null,
  2,
);

const SAMPLE_TRANSFORM = `// 'data' is your parsed JSON, '_' is lodash
// Return the transformed result

return _.filter(data.recipes, r => r.stanApproved)`;

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
  monacoTheme: string;
};

type ParsleyActions = {
  setJsonInput: (input: string) => void;
  setTransformCode: (code: string) => void;
  executeTransform: () => Promise<void>;
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
  setMonacoTheme: (theme: string) => void;
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
        monacoTheme: DEFAULT_MONACO_THEME,

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

        executeTransform: async () => {
          const { parsedJson, transformCode, transformedJson, jsonError } =
            get();
          if (jsonError) {
            return;
          }

          const { result, error, logs } = await executeTransformCode(
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
            monacoTheme: DEFAULT_MONACO_THEME,
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

        setMonacoTheme: (theme: string) => {
          set({ monacoTheme: theme });
        },
      };
    },
    {
      name: 'parsley-store',
      partialize: (state) => ({
        jsonInput: state.jsonInput,
        transformCode: state.transformCode,
        rootName: state.rootName,
        monacoTheme: state.monacoTheme,
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
