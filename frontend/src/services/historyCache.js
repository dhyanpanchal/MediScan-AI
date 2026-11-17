export function getHistoryCacheKey() {
  try {
    const token = localStorage.getItem('mediscan_token');
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    // This identifies a local cache only; server authorization still verifies JWTs.
    if (typeof payload.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(payload.id)) return `mediscan_text_searches:${payload.id}`;
  } catch { /* No authenticated local cache. */ }
  return 'mediscan_text_searches:signed-out';
}

export function clearHistoryCache() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key === 'mediscan_text_searches' || key?.startsWith('mediscan_text_searches:')) localStorage.removeItem(key);
  }
}
