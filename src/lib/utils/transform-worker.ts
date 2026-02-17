import _ from 'lodash';

import type { ConsoleEntry } from '@/lib/utils/json-executor';

type WorkerMessage = {
  code: string;
  jsonData: unknown;
};

type WorkerResult = {
  result: unknown;
  error: string | null;
  logs: Array<ConsoleEntry>;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { code, jsonData } = e.data;
  const logs: Array<ConsoleEntry> = [];

  const mockConsole = {
    log: (...args: Array<unknown>) =>
      logs.push({ level: 'log', args, timestamp: Date.now() }),
    warn: (...args: Array<unknown>) =>
      logs.push({ level: 'warn', args, timestamp: Date.now() }),
    error: (...args: Array<unknown>) =>
      logs.push({ level: 'error', args, timestamp: Date.now() }),
    info: (...args: Array<unknown>) =>
      logs.push({ level: 'info', args, timestamp: Date.now() }),
  };

  try {
    const fn = new Function('_', 'data', 'console', `'use strict';\n${code}`);
    const result = fn(_, jsonData, mockConsole);
    const response: WorkerResult = { result, error: null, logs };
    self.postMessage(response);
  } catch (e) {
    const response: WorkerResult = {
      result: null,
      error: e instanceof Error ? e.message : 'Transform execution failed',
      logs,
    };
    self.postMessage(response);
  }
};
