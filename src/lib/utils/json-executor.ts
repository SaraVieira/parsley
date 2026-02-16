import _ from 'lodash';

export type ConsoleEntry = {
  level: 'log' | 'warn' | 'error' | 'info';
  args: Array<unknown>;
  timestamp: number;
};

type ExecuteResult = {
  result: unknown;
  error: string | null;
  logs: Array<ConsoleEntry>;
};

export function executeTransformCode(
  code: string,
  jsonData: unknown,
): ExecuteResult {
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
    return { result, error: null, logs };
  } catch (e) {
    return {
      result: null,
      error: e instanceof Error ? e.message : 'Transform execution failed',
      logs,
    };
  }
}
