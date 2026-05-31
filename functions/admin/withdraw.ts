// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

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
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { withdrawal_id, aksi, catatan_admin } = body;
  if (!withdrawal_id || !aksi) return err('withdrawal_id dan aksi diperlukan');
  if (!['sukses', 'ditolak'].includes(aksi)) return err('Aksi tidak valid');

  const sb = getSupabase(env);
  const { data: wd } = await sb
    .from('withdrawals')
    .select('*, users(balance)')
    .eq('id', withdrawal_id)
    .single();

  if (!wd) return err('Withdrawal tidak ditemukan');
  if (wd.status !== 'pending') return err('Withdrawal sudah diproses');

  if (aksi === 'ditolak') {
    // Kembalikan saldo
    const saldoBaru = wd.users.balance + wd.amount;
    await sb.from('users').update({ balance: saldoBaru }).eq('id', wd.user_id);
    await sb.from('transactions').insert({
      user_id: wd.user_id, type: 'deposit', amount: wd.amount,
      balance_before: wd.users.balance, balance_after: saldoBaru,
      description: `Withdraw ditolak - saldo dikembalikan${catatan_admin ? ': ' + catatan_admin : ''}`,
      status: 'success',
    });
  } else {
    // Update transaksi withdraw jadi success
    await sb.from('transactions')
      .update({ status: 'success' })
      .eq('user_id', wd.user_id)
      .eq('type', 'withdraw')
      .eq('status', 'pending');
  }

  await sb.from('withdrawals').update({
    status: aksi,
    catatan_admin: catatan_admin || null,
    updated_at: new Date().toISOString(),
  }).eq('id', withdrawal_id);

  return ok({ pesan: `Withdraw berhasil ${aksi}` });
}
