// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const url = new URL(request.url);
  const halaman = parseInt(url.searchParams.get('halaman') || '0');
  const perPage = 20;

  const sb = getSupabase(env);
  const { data, count } = await sb.from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.sub)
    .order('created_at', { ascending: false })
    .range(halaman * perPage, (halaman + 1) * perPage - 1);

  return ok({
    transaksi: (data || []).map(t => ({
      id: t.id,
      jenis: t.type,
      jumlah: t.amount,
      saldo_awal: t.balance_before,
      saldo_akhir: t.balance_after,
      keterangan: t.description,
      status: t.status,
      dibuat: t.created_at,
    })),
    total: count || 0,
    halaman,
  });
}
