// @ts-nocheck
import { json, getSupabase } from './_utils';

export async function onRequestGet({ request, env }) {
  const sb = getSupabase(env);
  
  // Ambil 20 transaksi terbaru (deposit + withdraw) dari semua user
  const { data } = await sb
    .from('transactions')
    .select('type, amount, users(username)')
    .in('type', ['deposit', 'withdraw', 'win'])
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(20);

  const aktivitas = (data || []).map((t: any) => ({
    nama: sensorNama(t.users?.username || '???'),
    jumlah: t.amount,
    type: t.type,
  }));

  return json({ status: 1, aktivitas });
}

function sensorNama(nama: string): string {
  if (nama.length <= 2) return nama[0] + '***';
  const hurufDepan = nama[0];
  const hurufBelakang = nama[nama.length - 1];
  const bintang = '*'.repeat(Math.min(nama.length - 2, 5));
  return `${hurufDepan}${bintang}${hurufBelakang}`;
}
