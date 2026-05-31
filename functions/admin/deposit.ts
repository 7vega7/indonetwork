// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';

  const sb = getSupabase(env);
  const { data } = await sb
    .from('deposits')
    .select('*, users(username, email)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  return ok({ deposits: data || [] });
}
