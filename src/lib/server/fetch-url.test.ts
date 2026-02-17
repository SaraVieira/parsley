import { describe, expect, it } from 'vitest';

import { parseCurlCommand } from '@/lib/server/fetch-url';

describe('parseCurlCommand', () => {
  it('parses a simple GET curl', () => {
    const result = parseCurlCommand('curl https://api.example.com/users');
    expect(result).toEqual({
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: [],
      body: '',
    });
  });

  it('parses a POST curl with headers and body', () => {
    const result = parseCurlCommand(
      `curl -X POST https://api.example.com/data -H "Content-Type: application/json" -H "Authorization: Bearer token123" -d '{"key":"value"}'`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ],
      body: '{"key":"value"}',
    });
  });

  it('parses --data flag as body', () => {
    const result = parseCurlCommand(
      `curl --data '{"a":1}' https://api.example.com/data`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: [],
      body: '{"a":1}',
    });
  });

  it('parses -X PUT method', () => {
    const result = parseCurlCommand(
      `curl -X PUT https://api.example.com/data/1 -d '{"updated":true}'`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data/1',
      method: 'PUT',
      headers: [],
      body: '{"updated":true}',
    });
  });

  it('handles --header long form', () => {
    const result = parseCurlCommand(
      `curl --header "Accept: application/json" https://api.example.com/data`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: [{ key: 'Accept', value: 'application/json' }],
      body: '',
    });
  });

  it('handles --request long form for method', () => {
    const result = parseCurlCommand(
      `curl --request DELETE https://api.example.com/data/1`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data/1',
      method: 'DELETE',
      headers: [],
      body: '',
    });
  });

  it('returns null for non-curl input', () => {
    expect(parseCurlCommand('not a curl command')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseCurlCommand('')).toBeNull();
  });

  it('handles single-quoted and double-quoted URLs', () => {
    const result = parseCurlCommand(`curl "https://api.example.com/users"`);
    expect(result).toEqual({
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: [],
      body: '',
    });
  });

  it('strips backslash line continuations', () => {
    const result = parseCurlCommand(
      `curl \\\n  -X POST \\\n  https://api.example.com/data \\\n  -H "Content-Type: application/json"`,
    );
    expect(result).toEqual({
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '',
    });
  });

  it('defaults to POST when body is present but no method specified', () => {
    const result = parseCurlCommand(
      `curl https://api.example.com/data -d '{"a":1}'`,
    );
    expect(result?.method).toBe('POST');
  });

  it('handles Chrome DevTools curl with --compressed flag', () => {
    const result = parseCurlCommand(
      `curl 'https://api.example.com/data' --compressed -H 'Accept: application/json'`,
    );
    expect(result?.url).toBe('https://api.example.com/data');
    expect(result?.headers).toEqual([
      { key: 'Accept', value: 'application/json' },
    ]);
  });

  it('returns null for curl without a valid URL', () => {
    expect(parseCurlCommand("curl -H 'Accept: json'")).toBeNull();
  });
});
