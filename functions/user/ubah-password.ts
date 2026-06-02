// @ts-nocheck
import { ok, err, getAuth, getSupabase, hashPassword, verifyPassword } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { password_lama, password_baru } = body;
  if (!password_lama || !password_baru) return err('Semua field wajib diisi');
  if (password_baru.length < 6) return err('Password baru minimal 6 karakter');

  const sb = getSupabase(env);
  const { data: user } = await sb.from('users').select('password_hash').eq('id', auth.sub).single();
  if (!user) return err('User tidak ditemukan');

  const valid = await verifyPassword(password_lama, user.password_hash);
  if (!valid) return err('Password lama tidak sesuai');

  const hash = await hashPassword(password_baru);
  await sb.from('users').update({ password_hash: hash }).eq('id', auth.sub);

  return ok({ pesan: 'Password berhasil diubah' });
}
