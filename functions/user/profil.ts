// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);
  const sb = getSupabase(env);
  const { data: user } = await sb.from('users')
    .select('id, username, email, balance, role, referral_code, created_at, last_login, nama_lengkap, no_telepon, bank, no_rekening, atas_nama, profil_lengkap')
    .eq('id', auth.sub).single();
  if (!user) return err('Pengguna tidak ditemukan', 404);
  return ok({ pengguna: { ...user, saldo: user.balance } });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { nama_lengkap, no_telepon, bank, no_rekening, atas_nama } = body;
  if (!nama_lengkap || !no_telepon || !bank || !no_rekening || !atas_nama) return err('Semua kolom wajib diisi');

  const profil_lengkap = !!(nama_lengkap && no_telepon && bank && no_rekening && atas_nama);

  const sb = getSupabase(env);
  await sb.from('users').update({ nama_lengkap, no_telepon, bank, no_rekening, atas_nama, profil_lengkap }).eq('id', auth.sub);

  return ok({ pesan: 'Profil berhasil diperbarui' });
}
