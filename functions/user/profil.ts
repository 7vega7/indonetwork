// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const sb = getSupabase(env);
  const { data: user } = await sb.from('users')
    .select('id, username, email, balance, role, referral_code, created_at, last_login')
    .eq('id', auth.sub)
    .single();

  if (!user) return err('Pengguna tidak ditemukan', 404);

  return ok({
    pengguna: {
      id: user.id,
      username: user.username,
      email: user.email,
      saldo: user.balance,
      role: user.role,
      kode_referral: user.referral_code,
      bergabung: user.created_at,
      login_terakhir: user.last_login,
    }
  });
}
