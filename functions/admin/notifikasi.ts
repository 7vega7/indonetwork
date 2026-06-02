// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner','cs'].includes(auth.role)) return err('Akses diperlukan', 403);

  const sb = getSupabase(env);
  const { data, count } = await sb.from('notifikasi')
    .select('*', { count: 'exact' })
    .eq('dibaca', false)
    .order('created_at', { ascending: false })
    .limit(20);

  return ok({ notifikasi: data || [], total: count || 0 });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses diperlukan', 403);

  const sb = getSupabase(env);
  await sb.from('notifikasi').update({ dibaca: true }).eq('dibaca', false);
  return ok({ pesan: 'Semua notifikasi ditandai dibaca' });
}
