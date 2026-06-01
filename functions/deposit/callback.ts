// @ts-nocheck
import { json, getSupabase, nexus } from '../_utils';
import { getSettings } from '../_settings';
import { verifySign } from '../_jayapay';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return new Response('FAIL', { status: 400 }) }

  console.log('JayaPay callback:', JSON.stringify(body))

  const settings = await getSettings(env)

  // Verifikasi signature dari JayaPay
  if (settings['jayapay_public_key']) {
    const valid = await verifySign(body, settings['jayapay_public_key'])
    if (!valid) {
      console.log('Invalid signature dari JayaPay')
      return new Response('FAIL', { status: 400 })
    }
  }

  // Hanya proses jika status SUCCESS
  if (body.status !== 'SUCCESS') {
    console.log('Status bukan SUCCESS:', body.status)
    return new Response('SUCCESS') // Tetap return SUCCESS agar tidak retry
  }

  const { orderNum, payMoney, platOrderNum } = body
  const sb = getSupabase(env)

  // Cari deposit berdasarkan reference
  const { data: deposit } = await sb
    .from('deposits')
    .select('*, users(username, balance)')
    .eq('reference', orderNum)
    .eq('status', 'pending')
    .maybeSingle()

  if (!deposit) {
    console.log('Deposit tidak ditemukan atau sudah diproses:', orderNum)
    return new Response('SUCCESS')
  }

  // Kirim saldo ke NexusGGR
  try {
    const nexusRes = await nexus(env, {
      method: 'user_deposit',
      user_code: deposit.users.username,
      amount: deposit.amount,
      agent_sign: deposit.id.replace(/-/g, '_'),
    })

    if (!nexusRes || nexusRes.status !== 1) {
      console.log('Gagal deposit NexusGGR:', nexusRes?.msg)
      return new Response('SUCCESS')
    }

    const saldoBaru = nexusRes.user_balance

    // Update Supabase
    await sb.from('users').update({ balance: saldoBaru }).eq('id', deposit.user_id)
    await sb.from('deposits').update({
      status: 'success',
      plat_order_num: platOrderNum,
      updated_at: new Date().toISOString(),
    }).eq('id', deposit.id)

    await sb.from('transactions').insert({
      user_id: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      balance_before: deposit.users.balance,
      balance_after: saldoBaru,
      description: `Deposit via ${deposit.method} - Auto konfirmasi JayaPay`,
      reference: orderNum,
      status: 'success',
    })

    console.log('Deposit berhasil dikonfirmasi otomatis:', orderNum, 'saldo baru:', saldoBaru)
  } catch(e) {
    console.log('Error konfirmasi deposit:', e.message)
  }

  // Wajib return string SUCCESS
  return new Response('SUCCESS')
}

export async function onRequestGet({ request }) {
  return new Response('JayaPay callback endpoint aktif', { status: 200 })
}
