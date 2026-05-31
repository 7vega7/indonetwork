// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const PROXY_URL = 'https://indonetwork.onrender.com/nexus';

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
export const ok = (data) => json({ status: 1, ...data });
export const err = (message, status = 400) => json({ status: 0, error: message }, status);
export const getSupabase = (env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// NexusGGR via Render proxy
export async function nexus(env, body) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_code: env.NEXUS_AGENT_CODE,
      agent_token: env.NEXUS_AGENT_TOKEN,
      ...body,
    }),
  });
  return res.json();
}

// JWT
const b64url = (data) => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
const b64decode = (str) => {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array([...atob(b64)].map(c => c.charCodeAt(0)));
};
const getKey = (secret) =>
  crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function signJWT(payload, secret, exp = 86400) {
  const now = Math.floor(Date.now() / 1000);
  const p = { ...payload, iat: now, exp: now + exp };
  const enc = new TextEncoder();
  const h = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const b = b64url(enc.encode(JSON.stringify(p)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${h}.${b}`));
  return `${h}.${b}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyJWT(token, secret) {
  try {
    const [h, b, sig] = token.split('.');
    if (!h || !b || !sig) return null;
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, b64decode(sig), new TextEncoder().encode(`${h}.${b}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64decode(b)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export async function getAuth(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyJWT(auth.slice(7), env.JWT_SECRET);
}

export async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = stored.split(':');
  if (algo !== 'pbkdf2') return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  const hash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === hashHex;
}

export async function verifyTurnstile(token, secretKey, ip) {
  const form = new FormData();
  form.append('secret', secretKey);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const data = await res.json();
  return data.success === true;
}
