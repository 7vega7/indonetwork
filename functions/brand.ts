// @ts-nocheck
import { ok, getSupabase } from './_utils';

export async function onRequestGet({ request, env }) {
  const sb = getSupabase(env);
  const { data } = await sb.from('settings').select('kunci, nilai')
    .in('kunci', [
      'brand_nama', 'brand_tagline', 'brand_logo_url', 'brand_favicon_url',
      'brand_warna_utama', 'brand_warna_aksen', 'brand_warna_ketiga',
      'maintenance_aktif', 'maintenance_pesan',
      'whatsapp_url', 'telegram_url', 'livechat_url',
      'footer_teks', 'marquee_teks',
      'min_deposit', 'min_withdraw', 'max_withdraw',
    ])

  const brand: Record<string, any> = {}
  for (const s of data || []) {
    const key = s.kunci.replace('brand_', '')
    brand[key] = s.nilai || ''
  }

  // Konversi tipe
  brand.maintenance_aktif = brand.maintenance_aktif === 'true'
  brand.min_deposit = parseInt(brand.min_deposit || '10000')
  brand.min_withdraw = parseInt(brand.min_withdraw || '50000')
  brand.max_withdraw = parseInt(brand.max_withdraw || '50000000')

  return ok({ brand })
}
