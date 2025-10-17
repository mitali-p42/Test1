const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function extractMessage(data: any, fallback = 'Request failed') {
  if (!data) return fallback;
  if (Array.isArray(data.message)) return data.message[0] || fallback;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  let data: any = null;
  try { data = await res.clone().json(); } catch {}

  if (!res.ok) {
    const msg = extractMessage(data, `${res.status} ${res.statusText}`);
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;              // <── now your catch(err) in Login.tsx gets msg
  }

  return (data ?? (await res.json())) as T;
}
