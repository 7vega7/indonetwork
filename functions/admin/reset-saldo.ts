// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { user_code, all_users } = body;

  const sb = getSupabase(env);

  if (all_users) {
    // Reset semua user
    const nexusRes = await nexus(env, {
      method: 'user_withdraw_reset',
      all_users: true,
    });

    if (!nexusRes || nexusRes.status !== 1) {
      return err(`Gagal reset: ${nexusRes?.msg || 'Unknown error'}`);
    }

    // Update semua saldo di Supabase jadi 0
    const userList = nexusRes.user_list || [];
    for (const u of userList) {
      await sb.from('users').update({ balance: 0 }).eq('username', u.user_code);
    }

    return ok({ pesan: 'Semua saldo berhasil direset', data: nexusRes });

  } else {
    // Reset saldo 1 user
    if (!user_code) return err('user_code diperlukan');

    const nexusRes = await nexus(env, {
      method: 'user_withdraw_reset',
      user_code,
    });

    if (!nexusRes || nexusRes.status !== 1) {
      return err(`Gagal reset: ${nexusRes?.msg || 'Unknown error'}`);
    }

    await sb.from('users').update({ balance: 0 }).eq('username', user_code);

    return ok({ pesan: `Saldo ${user_code} berhasil direset`, data: nexusRes });
  }
}
