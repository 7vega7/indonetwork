// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

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
    .select('*, users(balance, username)')
    .eq('id', deposit_id)
    .single();

  if (!deposit) return err('Deposit tidak ditemukan', 404);
  if (deposit.status !== 'pending') return err('Deposit sudah diproses');

  // Kirim saldo ke NexusGGR
  const nexusRes = await nexus(env, {
    method: 'user_deposit',
    user_code: deposit.users.username,
    amount: deposit.amount,
    agent_sign: deposit_id,
  });

  if (!nexusRes || nexusRes.status !== 1) {
    return err(`Gagal deposit ke NexusGGR: ${nexusRes?.msg || 'Unknown error'}`);
  }

  // Update status deposit
  await sb.from('deposits').update({
    status: 'success',
    updated_at: new Date().toISOString(),
  }).eq('id', deposit_id);

  // Catat transaksi di Supabase
  await sb.from('transactions').insert({
    user_id: deposit.user_id,
    type: 'deposit',
    amount: deposit.amount,
    balance_before: deposit.users.balance,
    balance_after: deposit.users.balance + deposit.amount,
    description: `Deposit via ${deposit.method} dikonfirmasi`,
    reference: deposit.reference,
    status: 'success',
  });

  // Update saldo di Supabase juga (untuk tampilan)
  await sb.from('users').update({
    balance: deposit.users.balance + deposit.amount,
  }).eq('id', deposit.user_id);

  return ok({
    pesan: 'Deposit berhasil dikonfirmasi',
    nexus_agent_balance: nexusRes.agent_balance,
    nexus_user_balance: nexusRes.user_balance,
  });
}
