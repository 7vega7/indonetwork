// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { deposit_id } = body;
  if (!deposit_id) return err('deposit_id diperlukan');

  const sb = getSupabase(env);
  const { data: deposit } = await sb
    .from('deposits')
    .select('*')
    .eq('id', deposit_id)
    .single();

  if (!deposit) return err('Deposit tidak ditemukan');
  if (deposit.status !== 'pending') return err('Deposit sudah diproses');

  await sb.from('deposits').update({
    status: 'failed',
    updated_at: new Date().toISOString(),
  }).eq('id', deposit_id);

  return ok({ pesan: 'Deposit berhasil ditolak' });
}
