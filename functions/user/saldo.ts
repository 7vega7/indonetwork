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

  if (!user) return err('User tidak ditemukan', 404);

  // Ambil saldo real dari NexusGGR
  try {
    const nexusRes = await nexus(env, {
      method: 'money_info',
      user_code: user.username,
    });

    if (nexusRes?.status === 1 && nexusRes?.user) {
      const saldoNexus = nexusRes.user.balance;
      // Sync ke Supabase
      if (saldoNexus !== user.balance) {
        await sb.from('users').update({ balance: saldoNexus }).eq('id', auth.sub);
      }
      return ok({ saldo: saldoNexus });
    }
  } catch(e) {
    console.error('money_info error:', e);
  }

  return ok({ saldo: user.balance });
}
