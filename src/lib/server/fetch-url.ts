import { createServerFn } from '@tanstack/react-start';

export type HeaderEntry = {
  key: string;
  value: string;
};

export type FetchRequestParams = {
  url: string;
  method: string;
  headers: Array<HeaderEntry>;
  body: string;
};

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB
const DIGITS_ONLY = /^\d+$/;

/**
 * Validate that a URL is a public HTTP(S) URL.
 * Blocks private/internal addresses to prevent SSRF.
 */
function validateUrl(urlString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    throw new Error('Requests to localhost are not allowed.');
  }

  // Block private IP ranges
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => DIGITS_ONLY.test(p))) {
    const first = Number.parseInt(parts[0], 10);
    const second = Number.parseInt(parts[1], 10);
    if (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first === 169 // link-local (169.254.x.x AWS metadata)
    ) {
      throw new Error(
        'Requests to private/internal addresses are not allowed.',
      );
    }
  }
}

function buildHeaders(entries: Array<HeaderEntry>): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of entries) {
    const key = h.key.trim();
    if (key) {
      headers[key] = h.value;
    }
  }
  if (!(headers.Accept || headers.accept)) {
    headers.Accept = 'application/json';
  }
  return headers;
}

async function parseResponse(response: Response) {
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new Error(
      `Response too large (${Math.round(Number.parseInt(contentLength, 10) / 1024 / 1024)}MB). Max is 10MB.`,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (text.length > MAX_RESPONSE_SIZE) {
    throw new Error('Response too large. Max is 10MB.');
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Response is not valid JSON (Content-Type: ${contentType}). Only JSON responses are supported.`,
    );
  }

  return {
    data: json,
    status: response.status,
    statusText: response.statusText,
    contentType,
  };
}

export const fetchFromUrl = createServerFn({ method: 'POST' })
  .inputValidator((d: FetchRequestParams) => d)
  .handler(async ({ data }) => {
    validateUrl(data.url);

    const headers = buildHeaders(data.headers);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(data.url, {
        method: data.method || 'GET',
        headers,
        body: data.body && data.method !== 'GET' ? data.body : undefined,
        signal: controller.signal,
      });

      return await parseResponse(response);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(
          `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  });

/**
 * Parse a cURL command string into fetch parameters.
 * Returns null if the string doesn't look like a curl command.
 */
type CurlState = {
  url: string;
  method: string;
  headers: Array<HeaderEntry>;
  body: string;
};

function parseHeader(headerStr: string): HeaderEntry | null {
  const colonIdx = headerStr.indexOf(':');
  if (colonIdx <= 0) {
    return null;
  }
  return {
    key: headerStr.slice(0, colonIdx).trim(),
    value: headerStr.slice(colonIdx + 1).trim(),
  };
}

const METHOD_FLAGS = new Set(['-X', '--request']);
const HEADER_FLAGS = new Set(['-H', '--header']);
const BODY_FLAGS = new Set(['-d', '--data', '--data-raw']);

function isUrl(token: string): boolean {
  return token.startsWith('http://') || token.startsWith('https://');
}

function isFlag(token: string): boolean {
  return token.startsWith('-') && !isUrl(token);
}

function processToken(
  tokens: Array<string>,
  i: number,
  state: CurlState,
): number {
  const token = tokens[i];
  const nextToken = tokens[i + 1] || '';

  if (METHOD_FLAGS.has(token)) {
    state.method = nextToken.toUpperCase() || 'GET';
    return i + 2;
  }

  if (HEADER_FLAGS.has(token)) {
    const entry = parseHeader(nextToken);
    if (entry) {
      state.headers.push(entry);
    }
    return i + 2;
  }

  if (BODY_FLAGS.has(token)) {
    state.body = nextToken;
    return i + 2;
  }

  if (isFlag(token)) {
    // Skip unknown flags; if the next token isn't a flag, assume it's a value
    const hasValue = i + 1 < tokens.length && !isFlag(tokens[i + 1]);
    return hasValue ? i + 2 : i + 1;
  }

  if (!state.url && isUrl(token)) {
    state.url = token;
  }

  return i + 1;
}

export function parseCurlCommand(input: string): FetchRequestParams | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('curl')) {
    return null;
  }

  const normalized = trimmed.replace(/\\\s*\n\s*/g, ' ');
  const tokens = tokenize(normalized);

  if (tokens.length < 2) {
    return null;
  }

  const state: CurlState = { url: '', method: '', headers: [], body: '' };

  let i = 1; // skip "curl"
  while (i < tokens.length) {
    i = processToken(tokens, i, state);
  }

  if (!state.url) {
    return null;
  }

  if (!state.method) {
    state.method = state.body ? 'POST' : 'GET';
  }

  return state;
}

/**
 * Tokenize a shell-like command string, respecting single and double quotes.
 */
function tokenize(input: string): Array<string> {
  const tokens: Array<string> = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === ' ' && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}
