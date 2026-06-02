// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';

  const sb = getSupabase(env);
  const { data } = await sb
    .from('withdrawals')
    .select('*, users(username, email, balance)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  return ok({ withdrawals: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { withdrawal_id, aksi, catatan_admin } = body;
  if (!withdrawal_id || !aksi) return err('withdrawal_id dan aksi diperlukan');
  if (!['sukses', 'ditolak'].includes(aksi)) return err('Aksi tidak valid');

  const sb = getSupabase(env);
  const { data: wd } = await sb
    .from('withdrawals')
    .select('*, users(balance, username)')
    .eq('id', withdrawal_id)
    .single();

  if (!wd) return err('Withdrawal tidak ditemukan');
  if (wd.status !== 'pending') return err('Withdrawal sudah diproses');

  if (aksi === 'sukses') {
    // Saldo sudah ditarik dari NexusGGR saat user request
    // Admin hanya update status jadi sukses
    await sb.from('withdrawals').update({
      status: 'sukses',
      catatan_admin: catatan_admin || null,
      updated_at: new Date().toISOString(),
    }).eq('id', withdrawal_id);

    await sb.from('transactions')
      .update({ status: 'success' })
      .eq('user_id', wd.user_id)
      .eq('type', 'withdraw')
      .eq('status', 'pending');

    return ok({ pesan: 'Withdraw berhasil dikonfirmasi' });

  } else {
    // Tolak - kembalikan saldo ke user di NexusGGR
    const refundSign = `refund_${withdrawal_id.replace(/-/g, '_')}`;
    const nexusRes = await nexus(env, {
      method: 'user_deposit',
      user_code: wd.users.username,
      amount: wd.amount,
      agent_sign: refundSign,
    });

    if (!nexusRes || nexusRes.status !== 1) {
      return err(`Gagal kembalikan saldo: ${nexusRes?.msg || 'Unknown error'}`);
    }

    const saldoBaru = nexusRes.user_balance;

    // Update saldo Supabase
    await sb.from('users').update({ balance: saldoBaru }).eq('id', wd.user_id);

    // Catat transaksi pengembalian
    await sb.from('transactions').insert({
      user_id: wd.user_id,
      type: 'deposit',
      amount: wd.amount,
      balance_before: wd.users.balance,
      balance_after: saldoBaru,
      description: `Withdraw ditolak - saldo dikembalikan${catatan_admin ? ': ' + catatan_admin : ''}`,
      status: 'success',
    });

    await sb.from('transactions')
      .update({ status: 'failed' })
      .eq('user_id', wd.user_id)
      .eq('type', 'withdraw')
      .eq('status', 'pending');

    await sb.from('withdrawals').update({
      status: 'ditolak',
      catatan_admin: catatan_admin || null,
      updated_at: new Date().toISOString(),
    }).eq('id', withdrawal_id);

    return ok({ pesan: 'Withdraw ditolak, saldo dikembalikan', saldo_baru: saldoBaru });
  }
}
