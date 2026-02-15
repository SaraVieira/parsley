import _ from 'lodash';

export type ConsoleEntry = {
  level: 'log' | 'warn' | 'error' | 'info';
  args: unknown[];
  timestamp: number;
};

type ExecuteResult = {
  result: unknown;
  error: string | null;
  logs: ConsoleEntry[];
};

export function executeTransformCode(
  code: string,
  jsonData: unknown,
): ExecuteResult {
  const logs: ConsoleEntry[] = [];

  const mockConsole = {
    log: (...args: unknown[]) =>
      logs.push({ level: 'log', args, timestamp: Date.now() }),
    warn: (...args: unknown[]) =>
      logs.push({ level: 'warn', args, timestamp: Date.now() }),
    error: (...args: unknown[]) =>
      logs.push({ level: 'error', args, timestamp: Date.now() }),
    info: (...args: unknown[]) =>
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
