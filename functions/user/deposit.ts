// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const id = url.searchParams.get('id');

  const sb = getSupabase(env);
  let query = sb
    .from('deposits')
    .select('*')
    .eq('user_id', auth.sub)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (id) query = query.eq('id', id)

  const { data } = await query.limit(20)
  return ok({ deposits: data || [] })
}
