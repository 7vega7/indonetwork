// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const cari = url.searchParams.get('cari') || '';
  const halaman = parseInt(url.searchParams.get('halaman') || '0');
  const perPage = 20;

  const sb = getSupabase(env);
  let query = sb
    .from('users')
    .select('id, username, email, balance, role, is_active, created_at, last_login', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(halaman * perPage, (halaman + 1) * perPage - 1);

  if (cari) query = query.ilike('username', `%${cari}%`);

  const { data, count } = await query;
  return ok({ users: data || [], total: count || 0 });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, user_id, jumlah, keterangan } = body;
  if (!aksi || !user_id) return err('aksi dan user_id diperlukan');

  const sb = getSupabase(env);
  const { data: user } = await sb
    .from('users')
    .select('username, balance')
    .eq('id', user_id)
    .single();
  if (!user) return err('User tidak ditemukan');

  if (aksi === 'nonaktifkan') {
    await sb.from('users').update({ is_active: false }).eq('id', user_id);
    return ok({ pesan: 'User dinonaktifkan' });
  }

  if (aksi === 'aktifkan') {
    await sb.from('users').update({ is_active: true }).eq('id', user_id);
    return ok({ pesan: 'User diaktifkan' });
  }

  if (aksi === 'tambah_saldo') {
    if (!jumlah || jumlah <= 0) return err('Jumlah tidak valid');

    // Kirim ke NexusGGR
    const agentSign = `admin_add_${user_id.replace(/-/g, '_')}_${Date.now()}`
    const nexusRes = await nexus(env, {
      method: 'user_deposit',
      user_code: user.username,
      amount: jumlah,
      agent_sign: agentSign,
    })

    if (!nexusRes || nexusRes.status !== 1) {
      return err(`Gagal tambah saldo NexusGGR: ${nexusRes?.msg || 'Unknown error'}`)
    }

    const saldoBaru = nexusRes.user_balance

    await sb.from('users').update({ balance: saldoBaru }).eq('id', user_id);
    await sb.from('transactions').insert({
      user_id, type: 'bonus', amount: jumlah,
      balance_before: user.balance, balance_after: saldoBaru,
      description: keterangan || 'Penambahan saldo oleh admin',
      status: 'success',
    });

    return ok({ pesan: 'Saldo berhasil ditambahkan via NexusGGR', saldo_baru: saldoBaru });
  }

  if (aksi === 'kurang_saldo') {
    if (!jumlah || jumlah <= 0) return err('Jumlah tidak valid');

    // Tarik dari NexusGGR
    const agentSign = `admin_sub_${user_id.replace(/-/g, '_')}_${Date.now()}`
    const nexusRes = await nexus(env, {
      method: 'user_withdraw',
      user_code: user.username,
      amount: jumlah,
      agent_sign: agentSign,
    })

    if (!nexusRes || nexusRes.status !== 1) {
      return err(`Gagal kurang saldo NexusGGR: ${nexusRes?.msg || 'Unknown error'}`)
    }

    const saldoBaru = nexusRes.user_balance

    await sb.from('users').update({ balance: saldoBaru }).eq('id', user_id);
    await sb.from('transactions').insert({
      user_id, type: 'withdraw', amount: jumlah,
      balance_before: user.balance, balance_after: saldoBaru,
      description: keterangan || 'Pengurangan saldo oleh admin',
      status: 'success',
    });

    return ok({ pesan: 'Saldo berhasil dikurangi via NexusGGR', saldo_baru: saldoBaru });
  }

  return err('Aksi tidak valid');
}
