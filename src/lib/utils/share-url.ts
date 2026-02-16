/**
 * Hydrate localStorage from a share URL hash before store initialization.
 * Call this once at app startup.
 */
export function hydrateFromShareUrl(): void {
  if (typeof window === 'undefined') return;

  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return;

  try {
    const encoded = hash.slice(7);
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (payload.j || payload.t) {
      const state: Record<string, string> = {};
      if (payload.j) {
        // Validate JSON before storing
        JSON.parse(payload.j);
        state.jsonInput = payload.j;
      }
      if (payload.t) {
        state.transformCode = payload.t;
      }
      localStorage.setItem(
        'parsley-store',
        JSON.stringify({ state, version: 0 }),
      );
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch {
    // Invalid share link, ignore
  }
}

/**
 * Encode the current JSON input and transform code into a shareable URL.
 */
export function createShareUrl(
  jsonInput: string,
  transformCode: string,
): string {
  const payload = JSON.stringify({ j: jsonInput, t: transformCode });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}
