// @ts-nocheck
import { json, getSupabase } from './_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  
  // Simpan log ke Supabase
  try {
    const sb = getSupabase(env);
    await sb.from('callback_logs').insert({
      method: body.method || 'unknown',
      payload: JSON.stringify(body),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      created_at: new Date().toISOString(),
    });
  } catch(e) {}

  console.log('CALLBACK RECEIVED:', JSON.stringify(body));
  return json({ status: 1, user_balance: 99999 });
}

export async function onRequestGet({ request }) {
  return json({ status: 1, msg: 'active' });
}
