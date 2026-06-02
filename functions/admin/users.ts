// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus, hashPassword, logAdmin, notifAdmin } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const cari = url.searchParams.get('cari') || '';
  const halaman = parseInt(url.searchParams.get('halaman') || '0');
  const perPage = 20;

  const sb = getSupabase(env);
  let query = sb
    .from('users')
    .select('id, username, email, balance, role, is_active, created_at, last_login, login_count, ban_reason, nama_lengkap, no_telepon, no_whatsapp, bank, no_rekening, atas_nama, via_freebet, profil_lengkap', { count: 'exact' })
    .not('role', 'in', '("owner")')
    .order('created_at', { ascending: false })
    .range(halaman * perPage, (halaman + 1) * perPage - 1);

  if (cari) query = query.ilike('username', `%${cari}%`);

  const { data, count } = await query;
  return ok({ users: data || [], total: count || 0 });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, user_id, jumlah, keterangan, password_baru, role_baru, ban_reason, limit_harian } = body;
  if (!aksi || !user_id) return err('aksi dan user_id diperlukan');

  const sb = getSupabase(env);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  const { data: user } = await sb.from('users').select('username, balance, role').eq('id', user_id).single();
  if (!user) return err('User tidak ditemukan');

  // Owner only actions
  if (['set_role', 'buat_admin', 'buat_cs'].includes(aksi) && auth.role !== 'owner') {
    return err('Hanya owner yang bisa mengubah role');
  }

  if (aksi === 'nonaktifkan') {
    await sb.from('users').update({ is_active: false }).eq('id', user_id);
    await logAdmin(env, auth, 'nonaktifkan_user', user_id, 'user', { username: user.username }, ip);
    return ok({ pesan: 'User dinonaktifkan' });
  }

  if (aksi === 'aktifkan') {
    await sb.from('users').update({ is_active: true, ban_reason: null, banned_at: null }).eq('id', user_id);
    await logAdmin(env, auth, 'aktifkan_user', user_id, 'user', { username: user.username }, ip);
    return ok({ pesan: 'User diaktifkan' });
  }

  if (aksi === 'ban') {
    await sb.from('users').update({
      is_active: false,
      ban_reason: ban_reason || 'Melanggar ketentuan',
      banned_at: new Date().toISOString(),
    }).eq('id', user_id);
    await logAdmin(env, auth, 'ban_user', user_id, 'user', { username: user.username, alasan: ban_reason }, ip);
    return ok({ pesan: 'User diban' });
  }

  if (aksi === 'reset_password') {
    if (!password_baru || password_baru.length < 6) return err('Password minimal 6 karakter');
    const hash = await hashPassword(password_baru);
    await sb.from('users').update({ password_hash: hash }).eq('id', user_id);
    await logAdmin(env, auth, 'reset_password', user_id, 'user', { username: user.username }, ip);
    return ok({ pesan: 'Password berhasil direset' });
  }

  if (aksi === 'set_role') {
    const validRoles = ['user', 'cs', 'admin'];
    if (!validRoles.includes(role_baru)) return err('Role tidak valid');
    await sb.from('users').update({ role: role_baru }).eq('id', user_id);
    await logAdmin(env, auth, 'set_role', user_id, 'user', { username: user.username, role_lama: user.role, role_baru }, ip);
    return ok({ pesan: `Role diubah ke ${role_baru}` });
  }

  if (aksi === 'edit_profil') {
    await sb.from('users').update({
      nama_lengkap: body.nama_lengkap || null,
      no_telepon: body.no_whatsapp || body.no_telepon || null,
      no_whatsapp: body.no_whatsapp || null,
      bank: body.bank || null,
      no_rekening: body.no_rekening || null,
      atas_nama: body.atas_nama || null,
      profil_lengkap: !!(body.nama_lengkap && body.bank && body.no_rekening && body.atas_nama),
    }).eq('id', user_id);
    await logAdmin(env, auth, 'edit_profil_user', user_id, 'user', { username: user.username }, ip);
    return ok({ pesan: 'Data user diupdate' });
  }

  if (aksi === 'set_limit_withdraw') {
    await sb.from('users').update({ daily_withdraw_limit: limit_harian || 0 }).eq('id', user_id);
    return ok({ pesan: 'Limit withdraw harian diset' });
  }

  if (aksi === 'tambah_saldo') {
    if (!jumlah || jumlah <= 0) return err('Jumlah tidak valid');
    const agentSign = `admin_add_${user_id.replace(/-/g, '_')}_${Date.now()}`
    const nexusRes = await nexus(env, { method: 'user_deposit', user_code: user.username, amount: jumlah, agent_sign: agentSign });
    if (!nexusRes || nexusRes.status !== 1) return err(`Gagal tambah saldo: ${nexusRes?.msg}`);
    const saldoBaru = nexusRes.user_balance;
    await sb.from('users').update({ balance: saldoBaru }).eq('id', user_id);
    await sb.from('transactions').insert({ user_id, type: 'bonus', amount: jumlah, balance_before: user.balance, balance_after: saldoBaru, description: keterangan || 'Penambahan saldo oleh admin', status: 'success' });
    await logAdmin(env, auth, 'tambah_saldo', user_id, 'user', { username: user.username, jumlah, keterangan }, ip);
    await notifAdmin(env, 'saldo', `Saldo +${jumlah} untuk ${user.username}`, keterangan);
    return ok({ pesan: 'Saldo berhasil ditambahkan', saldo_baru: saldoBaru });
  }

  if (aksi === 'kurang_saldo') {
    if (!jumlah || jumlah <= 0) return err('Jumlah tidak valid');
    const agentSign = `admin_sub_${user_id.replace(/-/g, '_')}_${Date.now()}`
    const nexusRes = await nexus(env, { method: 'user_withdraw', user_code: user.username, amount: jumlah, agent_sign: agentSign });
    if (!nexusRes || nexusRes.status !== 1) return err(`Gagal kurang saldo: ${nexusRes?.msg}`);
    const saldoBaru = nexusRes.user_balance;
    await sb.from('users').update({ balance: saldoBaru }).eq('id', user_id);
    await sb.from('transactions').insert({ user_id, type: 'withdraw', amount: jumlah, balance_before: user.balance, balance_after: saldoBaru, description: keterangan || 'Pengurangan saldo oleh admin', status: 'success' });
    await logAdmin(env, auth, 'kurang_saldo', user_id, 'user', { username: user.username, jumlah }, ip);
    return ok({ pesan: 'Saldo berhasil dikurangi', saldo_baru: saldoBaru });
  }

  return err('Aksi tidak valid');
}
