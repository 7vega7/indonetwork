// @ts-nocheck
import { ok, err, getSupabase, signJWT, hashPassword, verifyTurnstile } from '../_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { username, email, password, turnstile_token, referral_code } = body;

  if (!username || !email || !password || !turnstile_token) return err('Semua kolom wajib diisi');
  if (username.length < 4 || username.length > 20) return err('Username harus 4-20 karakter');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return err('Username hanya boleh huruf, angka, dan underscore');
  if (password.length < 6) return err('Password minimal 6 karakter');

  const ip = request.headers.get('CF-Connecting-IP');
  const valid = await verifyTurnstile(turnstile_token, env.TURNSTILE_SECRET_KEY, ip);
  if (!valid) return err('Verifikasi keamanan gagal');

  const sb = getSupabase(env);

  const { data: existUser } = await sb.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
  if (existUser) return err('Username sudah digunakan');

  const { data: existEmail } = await sb.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existEmail) return err('Email sudah terdaftar');

  const passwordHash = await hashPassword(password);
  const kodeReferral = username.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

  let referredById = null;
  if (referral_code) {
    const { data: ref } = await sb.from('users').select('id').eq('referral_code', referral_code.toUpperCase()).maybeSingle();
    if (ref) referredById = ref.id;
  }

  const { data: user, error } = await sb.from('users').insert({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password_hash: passwordHash,
    balance: 0,
    role: 'user',
    is_active: true,
    referral_code: kodeReferral,
    referred_by: referredById,
  }).select('id, username, email, balance, role, referral_code').single();

  if (error || !user) return err('Gagal membuat akun, coba lagi');

  // Daftarkan user ke NexusGGR
  try {
    await fetch('https://api.nexusggr.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'user_create',
        agent_code: env.NEXUS_AGENT_CODE,
        agent_token: env.NEXUS_AGENT_TOKEN,
        user_code: user.username,
      }),
    });
  } catch (e) {
    console.error('NexusGGR user_create error:', e);
  }

  const token = await signJWT({ sub: user.id, username: user.username, role: user.role }, env.JWT_SECRET);

  return ok({
    pesan: 'Akun berhasil dibuat',
    token,
    user: { id: user.id, username: user.username, email: user.email, saldo: user.balance, role: user.role, kode_referral: user.referral_code },
  });
}
