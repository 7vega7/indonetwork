// @ts-nocheck
import { ok, err, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  // Bisa dipanggil via cron atau manual
  const sb = getSupabase(env);

  const { data: expired } = await sb
    .from('deposits')
    .select('id')
    .eq('status', 'pending')
    .lt('expired_at', new Date().toISOString())

  if (!expired?.length) return ok({ pesan: 'Tidak ada deposit yang expired', jumlah: 0 })

  const ids = expired.map((d: any) => d.id)
  await sb.from('deposits').update({
    status: 'failed',
    auto_expired: true,
    updated_at: new Date().toISOString(),
  }).in('id', ids)

  return ok({ pesan: `${ids.length} deposit berhasil di-expire`, jumlah: ids.length })
}
