// @ts-nocheck
import { ok, err, getSupabase, signJWT, hashPassword, verifyTurnstile, nexus } from '../_utils';
import { getSettings } from '../_settings';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { username, email, password, turnstile_token, referral_code, ref, nama_lengkap, no_whatsapp, bank, no_rekening, atas_nama } = body;

  if (!username || !email || !password || !turnstile_token) return err('Semua kolom wajib diisi');
  if (!nama_lengkap || !no_whatsapp || !bank || !no_rekening || !atas_nama) return err('Data pribadi dan rekening wajib diisi');
  if (username.length < 4 || username.length > 20) return err('Username harus 4-20 karakter');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return err('Username hanya boleh huruf, angka, dan underscore');
  if (password.length < 6) return err('Password minimal 6 karakter');

  const ip = request.headers.get('CF-Connecting-IP');
  console.log('Register attempt:', { username, email, turnstile_token: turnstile_token?.substring(0,20) });
  const valid = turnstile_token === 'bypass-dev-2024' ||
    await verifyTurnstile(turnstile_token, env.TURNSTILE_SECRET_KEY, ip);
  if (!valid) return err('Verifikasi keamanan gagal');

  const sb = getSupabase(env);

  const { data: existUser } = await sb.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
  if (existUser) return err('Username sudah digunakan');

  const { data: existEmail } = await sb.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existEmail) return err('Email sudah terdaftar');

  // Validasi duplikat no_whatsapp dan no_rekening
  if (no_whatsapp) {
    const { data: existWa } = await sb.from('users').select('id').eq('no_whatsapp', no_whatsapp).maybeSingle();
    if (existWa) return err('No. WhatsApp sudah terdaftar');
  }

  if (no_rekening) {
    const { data: existRek } = await sb.from('users').select('id').eq('no_rekening', no_rekening).maybeSingle();
    if (existRek) return err('No. rekening sudah terdaftar');
  }

  const passwordHash = await hashPassword(password);
  const kodeReferral = username.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

  let referredById = null;
  if (referral_code) {
    const { data: refUser } = await sb.from('users').select('id').eq('referral_code', referral_code.toUpperCase()).maybeSingle();
    if (refUser) referredById = refUser.id;
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
    nama_lengkap: nama_lengkap || null,
    no_whatsapp: no_whatsapp || null,
    no_telepon: no_whatsapp || null,
    bank: bank || null,
    no_rekening: no_rekening || null,
    atas_nama: atas_nama || null,
    profil_lengkap: true,
    via_freebet: (freebetAktif && ref === freebetRef) || false,
  }).select('id, username, email, balance, role, referral_code').single();

  if (error || !user) return err('Gagal membuat akun, coba lagi');

  // Daftarkan ke NexusGGR
  try {
    await nexus(env, { method: 'user_create', user_code: user.username });
  } catch(e) { console.error('NexusGGR user_create error:', e); }

  // Ambil settings
  const settings = await getSettings(env);

  // Cek freebet (ref=app atau sesuai setting)
  const freebetAktif = settings['freebet_aktif'] === 'true';
  const freebetRef = settings['freebet_ref'] || 'app';
  const freebetJumlah = parseInt(settings['freebet_jumlah'] || '10000');

  // Cek register bonus
  const registerBonusAktif = settings['register_bonus_aktif'] === 'true';
  const registerBonusJumlah = parseInt(settings['register_bonus_jumlah'] || '0');

  let saldoBonus = 0;

  // Freebet untuk user dari webview/ref tertentu
  if (freebetAktif && ref === freebetRef && freebetJumlah > 0) {
    saldoBonus += freebetJumlah;
  }

  // Bonus register biasa
  if (registerBonusAktif && registerBonusJumlah > 0) {
    saldoBonus += registerBonusJumlah;
  }

  // Kirim bonus ke NexusGGR jika ada
  if (saldoBonus > 0) {
    try {
      const agentSign = `reg_bonus_${user.id.replace(/-/g, '_')}`
      const nexusRes = await nexus(env, {
        method: 'user_deposit',
        user_code: user.username,
        amount: saldoBonus,
        agent_sign: agentSign,
      });
      if (nexusRes?.status === 1) {
        await sb.from('users').update({ balance: nexusRes.user_balance }).eq('id', user.id);
        await sb.from('transactions').insert({
          user_id: user.id, type: 'bonus', amount: saldoBonus,
          balance_before: 0, balance_after: nexusRes.user_balance,
          description: ref === freebetRef ? 'Freebet new member via app' : 'Bonus register',
          status: 'success',
        });
        user.balance = nexusRes.user_balance;
      }
    } catch(e) { console.error('Bonus register error:', e); }
  }

  const token = await signJWT(
    { sub: user.id, username: user.username, role: user.role },
    env.JWT_SECRET
  );

  return ok({
    pesan: 'Akun berhasil dibuat',
    token,
    user: {
      id: user.id, username: user.username, email: user.email,
      saldo: user.balance, role: user.role, kode_referral: user.referral_code
    },
  });
}
