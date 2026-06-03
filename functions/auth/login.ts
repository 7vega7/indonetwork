// @ts-nocheck
import { ok, err, getSupabase, signJWT, verifyPassword, verifyTurnstile } from '../_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { username, password, turnstile_token } = body;
  if (!username || !password || !turnstile_token) return err('Semua kolom wajib diisi');

  const ip = request.headers.get('CF-Connecting-IP');
  const valid = await verifyTurnstile(turnstile_token, env.TURNSTILE_SECRET_KEY, ip);
  if (!valid) return err('Verifikasi keamanan gagal');

  const sb = getSupabase(env);
  const { data: user } = await sb.from('users')
    .select('id, username, email, password_hash, balance, role, is_active')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (!user) return err('Username atau password salah');
  if (!user.is_active) return err('Akun dinonaktifkan, hubungi CS');

  const valid2 = await verifyPassword(password, user.password_hash);
  if (!valid2) return err('Username atau password salah');

  await sb.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  await sb.from('users').update({
    last_login: new Date().toISOString(),
    login_count: (user.login_count || 0) + 1,
  }).eq('id', user.id)

  const token = await signJWT({ sub: user.id, username: user.username, role: user.role }, env.JWT_SECRET);

  return ok({
    pesan: 'Login berhasil',
    token,
    user: { id: user.id, username: user.username, email: user.email, saldo: user.balance, role: user.role },
  });
}
