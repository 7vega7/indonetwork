// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';
import { getSettings } from '../_settings';
import { createOrder } from '../_jayapay';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { jumlah, metode, nama, email, telepon } = body;
  if (!jumlah || jumlah < 10000) return err('Minimal deposit Rp 10.000');
  if (!metode) return err('Metode pembayaran diperlukan');

  const sb = getSupabase(env);

  // Cek apakah ada deposit pending
  const { data: pending } = await sb
    .from('deposits')
    .select('id, created_at, expired_at')
    .eq('user_id', auth.sub)
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    // Cek apakah sudah expired
    const expiredAt = pending.expired_at ? new Date(pending.expired_at) : new Date(new Date(pending.created_at).getTime() + 60 * 60 * 1000)
    if (new Date() < expiredAt) {
      const sisaMenit = Math.ceil((expiredAt.getTime() - Date.now()) / 60000)
      return err(`Kamu masih memiliki deposit pending. Selesaikan atau tunggu ${sisaMenit} menit hingga expired.`)
    }
    // Auto expire deposit lama
    await sb.from('deposits').update({
      status: 'failed',
      auto_expired: true,
      updated_at: new Date().toISOString(),
    }).eq('id', pending.id)
  }

  const settings = await getSettings(env)
  const jayapayAktif = settings['jayapay_aktif'] === 'true'
  const orderNum = `DEP-${auth.username.toUpperCase()}-${Date.now()}`
  const expiredAt = new Date(Date.now() + parseInt(settings['deposit_timeout_menit'] || '60') * 60 * 1000)

  if (jayapayAktif && settings['jayapay_merchant_code'] && settings['jayapay_private_key']) {
    // Mode otomatis - pakai JayaPay
    try {
      const result = await createOrder({
        merchantCode: settings['jayapay_merchant_code'],
        privateKey: settings['jayapay_private_key'],
        mode: settings['jayapay_mode'] || 'test',
        orderNum,
        amount: jumlah,
        method: metode,
        name: nama || auth.username,
        email: email || `${auth.username}@indonetwork.com`,
        phone: telepon || '081234567890',
        notifyUrl: settings['jayapay_notify_url'] || `${new URL(request.url).origin}/deposit/callback`,
      })

      if (result.platRespCode !== 'SUCCESS') {
        return err(`Gagal membuat order: ${result.platRespMessage || 'Unknown error'}`)
      }

      const { data: deposit } = await sb.from('deposits').insert({
        user_id: auth.sub,
        amount: jumlah,
        method: metode,
        reference: orderNum,
        status: 'pending',
        payment_url: result.url || null,
        plat_order_num: result.platOrderNum,
        pay_data: result.payData || null,
        expired_at: expiredAt.toISOString(),
      }).select().single()

      return ok({
        pesan: 'Order deposit berhasil dibuat',
        deposit_id: deposit.id,
        payment_url: result.url || null,
        pay_data: result.payData ? JSON.parse(result.payData) : null,
        plat_order_num: result.platOrderNum,
        expired_at: expiredAt.toISOString(),
        mode: 'auto',
      })
    } catch(e) {
      return err('Gagal membuat order JayaPay: ' + e.message)
    }
  }

  // Mode manual - tanpa JayaPay
  const { data: deposit } = await sb.from('deposits').insert({
    user_id: auth.sub,
    amount: jumlah,
    method: metode,
    reference: orderNum,
    status: 'pending',
    expired_at: expiredAt.toISOString(),
  }).select().single()

  return ok({
    pesan: 'Permintaan deposit berhasil dibuat. Menunggu konfirmasi admin.',
    deposit_id: deposit.id,
    reference: orderNum,
    expired_at: expiredAt.toISOString(),
    mode: 'manual',
  })
}
