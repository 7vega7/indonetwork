// @ts-nocheck
import { json, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const sb = getSupabase(env);
  const { data } = await sb
    .from('transactions')
    .select('type, amount, users(username)')
    .in('type', ['deposit', 'withdraw'])
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(30);

  const aktivitas = (data || []).map((t: any) => ({
    nama: sensorNama(t.users?.username || ''),
    jumlah: t.amount,
    type: t.type,
  }));

  return json({ status: 1, aktivitas });
}

function sensorNama(nama: string): string {
  if (!nama || nama.length === 0) return 'a***a'
  if (nama.length === 1) return nama[0] + '***' + randomChar()
  const depan = nama[0]
  const belakang = nama[nama.length - 1]
  const bintang = '*'.repeat(Math.min(Math.max(nama.length - 2, 2), 5))
  return `${depan}${bintang}${belakang}`
}

function randomChar() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return chars[Math.floor(Math.random() * chars.length)]
}
