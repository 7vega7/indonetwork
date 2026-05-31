// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { deposit_id } = body;
  if (!deposit_id) return err('deposit_id diperlukan');

  const sb = getSupabase(env);
  const { data: deposit } = await sb
    .from('deposits')
    .select('*, users(balance)')
    .eq('id', deposit_id)
    .single();

  if (!deposit) return err('Deposit tidak ditemukan', 404);
  if (deposit.status !== 'pending') return err('Deposit sudah diproses');

  const saldoBaru = deposit.users.balance + deposit.amount;

  await sb.from('users').update({ balance: saldoBaru }).eq('id', deposit.user_id);
  await sb.from('deposits').update({ status: 'success', updated_at: new Date().toISOString() }).eq('id', deposit_id);
  await sb.from('transactions').insert({
    user_id: deposit.user_id,
    type: 'deposit',
    amount: deposit.amount,
    balance_before: deposit.users.balance,
    balance_after: saldoBaru,
    description: `Deposit via ${deposit.method} dikonfirmasi`,
    reference: deposit.reference,
    status: 'success',
  });

  return ok({ pesan: 'Deposit berhasil dikonfirmasi', saldo_baru: saldoBaru });
}
