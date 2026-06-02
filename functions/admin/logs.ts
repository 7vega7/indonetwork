// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const sb = getSupabase(env);

  const { data } = await sb.from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return ok({ logs: data || [] });
}
