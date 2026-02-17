import TransformWorker from '@/lib/utils/transform-worker?worker';

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

const TRANSFORM_TIMEOUT = 5000;

export function executeTransformCode(
  code: string,
  jsonData: unknown,
): Promise<ExecuteResult> {
  return new Promise((resolve) => {
    const worker = new TransformWorker();

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve({
        result: null,
        error: `Transform timed out after ${TRANSFORM_TIMEOUT / 1000}s`,
        logs: [],
      });
    }, TRANSFORM_TIMEOUT);

    worker.onmessage = (e: MessageEvent<ExecuteResult>) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve({
        result: null,
        error: e.message || 'Transform execution failed',
        logs: [],
      });
    };

    worker.postMessage({ code, jsonData });
  });
}
