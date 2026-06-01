// @ts-nocheck
import { getSupabase } from './_utils';

// Dipanggil via GET /cron untuk expire deposit
export async function onRequestGet({ request, env }) {
  const sb = getSupabase(env);

  // Auto expire deposit pending yang sudah melewati batas waktu
  const { data: expired } = await sb
    .from('deposits')
    .select('id, user_id, amount, reference')
    .eq('status', 'pending')
    .lt('expired_at', new Date().toISOString())

  if (!expired?.length) {
    return new Response(JSON.stringify({ status: 1, pesan: 'Tidak ada deposit expired', jumlah: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const ids = expired.map((d) => d.id)
  await sb.from('deposits').update({
    status: 'failed',
    auto_expired: true,
    updated_at: new Date().toISOString(),
  }).in('id', ids)

  return new Response(JSON.stringify({ status: 1, pesan: `${ids.length} deposit di-expire`, jumlah: ids.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
