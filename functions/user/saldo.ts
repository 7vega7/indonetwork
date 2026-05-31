// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const sb = getSupabase(env);
  const { data: user } = await sb
    .from('users')
    .select('username, balance')
    .eq('id', auth.sub)
    .single();

  // Ambil saldo dari NexusGGR
  try {
    const nexusRes = await nexus(env, {
      method: 'money_info',
      user_code: user.username,
    });

    if (nexusRes?.status === 1 && nexusRes?.user) {
      const nexusSaldo = nexusRes.user.balance;
      // Sync saldo Supabase dengan NexusGGR
      if (nexusSaldo !== user.balance) {
        await sb.from('users').update({ balance: nexusSaldo }).eq('id', auth.sub);
      }
      return ok({ saldo: nexusSaldo });
    }
  } catch(e) {}

  // Fallback ke saldo Supabase
  return ok({ saldo: user?.balance ?? 0 });
}
