// @ts-nocheck
import { ok, err, getAuth, getSupabase, hashPassword, logAdmin } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'owner') return err('Hanya owner yang bisa akses', 403);

  const sb = getSupabase(env);
  const { data } = await sb
    .from('users')
    .select('id, username, email, role, is_active, created_at, last_login')
    .in('role', ['admin', 'cs', 'owner'])
    .order('created_at', { ascending: false });

  return ok({ staff: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'owner') return err('Hanya owner yang bisa akses', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, user_id, role_baru, password_baru, username, email, password } = body;
  const sb = getSupabase(env);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (aksi === 'tambah_staff') {
    // Buat akun staff baru
    if (!username || !password || !role_baru) return err('Username, password, dan role diperlukan');
    if (!['admin','cs'].includes(role_baru)) return err('Role tidak valid');

    const { data: exist } = await sb.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
    if (exist) return err('Username sudah digunakan');

    const hash = await hashPassword(password);
    const { data: user, error } = await sb.from('users').insert({
      username: username.toLowerCase(),
      email: email || `${username}@staff.internal`,
      password_hash: hash,
      balance: 0,
      role: role_baru,
      is_active: true,
    }).select('id, username, role').single();

    if (error) return err('Gagal buat akun staff');

    // Daftarkan ke NexusGGR
    try {
      const { nexus } = await import('../_utils');
      await nexus(env, { method: 'user_create', user_code: user.username });
    } catch {}

    await logAdmin(env, auth, 'tambah_staff', user.id, 'staff', { username: user.username, role: role_baru }, ip);
    return ok({ pesan: `Staff ${role_baru} berhasil ditambahkan`, user });
  }

  if (aksi === 'set_role') {
    if (!user_id || !role_baru) return err('user_id dan role_baru diperlukan');
    if (!['admin','cs'].includes(role_baru)) return err('Role tidak valid - hanya admin atau cs');

    const { data: user } = await sb.from('users').select('username, role').eq('id', user_id).single();
    if (!user) return err('User tidak ditemukan');
    if (user.role === 'owner') return err('Tidak bisa mengubah role owner');

    await sb.from('users').update({ role: role_baru }).eq('id', user_id);
    await logAdmin(env, auth, 'set_role_staff', user_id, 'staff', { username: user.username, role_lama: user.role, role_baru }, ip);
    return ok({ pesan: `Role diubah ke ${role_baru}` });
  }

  if (aksi === 'reset_password') {
    if (!user_id || !password_baru) return err('user_id dan password_baru diperlukan');
    if (password_baru.length < 6) return err('Password minimal 6 karakter');

    const { data: user } = await sb.from('users').select('username, role').eq('id', user_id).single();
    if (!user) return err('User tidak ditemukan');
    if (user.role === 'owner') return err('Tidak bisa reset password owner');

    const hash = await hashPassword(password_baru);
    await sb.from('users').update({ password_hash: hash }).eq('id', user_id);
    await logAdmin(env, auth, 'reset_password_staff', user_id, 'staff', { username: user.username }, ip);
    return ok({ pesan: 'Password staff direset' });
  }

  if (aksi === 'nonaktifkan') {
    const { data: user } = await sb.from('users').select('username, role').eq('id', user_id).single();
    if (!user) return err('User tidak ditemukan');
    if (user.role === 'owner') return err('Tidak bisa nonaktifkan owner');

    await sb.from('users').update({ is_active: false }).eq('id', user_id);
    await logAdmin(env, auth, 'nonaktifkan_staff', user_id, 'staff', { username: user.username }, ip);
    return ok({ pesan: 'Staff dinonaktifkan' });
  }

  if (aksi === 'aktifkan') {
    await sb.from('users').update({ is_active: true }).eq('id', user_id);
    return ok({ pesan: 'Staff diaktifkan' });
  }

  if (aksi === 'hapus') {
    const { data: user } = await sb.from('users').select('username, role').eq('id', user_id).single();
    if (!user) return err('User tidak ditemukan');
    if (user.role === 'owner') return err('Tidak bisa hapus owner');

    await sb.from('users').update({ role: 'user' }).eq('id', user_id);
    await logAdmin(env, auth, 'hapus_staff', user_id, 'staff', { username: user.username }, ip);
    return ok({ pesan: 'Staff dihapus (diubah ke user biasa)' });
  }

  return err('Aksi tidak valid');
}
