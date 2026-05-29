// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const sb = getSupabase(env);
  const { data: user } = await sb.from('users').select('balance').eq('id', auth.sub).single();
  return ok({ saldo: user?.balance ?? 0 });
}
