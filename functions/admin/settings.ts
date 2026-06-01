// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const sb = getSupabase(env);
  const { data } = await sb.from('settings').select('*').order('kunci');
  
  // Sensor private key
  const settings = (data || []).map(s => ({
    ...s,
    nilai: s.kunci.includes('private_key') && s.nilai
      ? s.nilai.substring(0, 20) + '...[tersembunyi]'
      : s.nilai
  }))

  return ok({ settings });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { settings } = body;
  if (!settings || !Array.isArray(settings)) return err('settings harus array');

  const sb = getSupabase(env);

  for (const s of settings) {
    if (!s.kunci) continue
    // Jangan update private key jika masih tersembunyi
    if (s.nilai?.includes('[tersembunyi]')) continue
    await sb.from('settings').update({
      nilai: s.nilai,
      updated_at: new Date().toISOString(),
    }).eq('kunci', s.kunci)
  }

  return ok({ pesan: 'Settings berhasil disimpan' });
}
