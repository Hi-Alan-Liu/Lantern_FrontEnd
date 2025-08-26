const API_BASE = 'https://lantern-api.zeabur.app';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  const uid = localStorage.getItem('X-User-Id');
  if (uid) headers.set('X-User-Id', uid);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  const newUid = res.headers.get('X-User-Id');
  if (newUid) localStorage.setItem('X-User-Id', newUid);

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = json?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json;
}
