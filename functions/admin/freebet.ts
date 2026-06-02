// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses diperlukan', 403);

  const sb = getSupabase(env);

  // Ambil semua user yang dapat freebet
  const { data: users } = await sb
    .from('users')
    .select('id, username, email, balance, created_at, no_whatsapp, bank, no_rekening')
    .eq('via_freebet', true)
    .order('created_at', { ascending: false });

  // Ambil transaksi freebet
  const { data: transaksi } = await sb
    .from('transactions')
    .select('*, users(username)')
    .ilike('description', '%freebet%')
    .order('created_at', { ascending: false })
    .limit(100);

  const totalFreebet = transaksi?.reduce((s, t) => s + (t.amount || 0), 0) || 0;

  return ok({
    users: users || [],
    transaksi: transaksi || [],
    total_user: users?.length || 0,
    total_nominal: totalFreebet,
  });
}
