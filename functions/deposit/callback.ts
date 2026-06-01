// @ts-nocheck
import { getSupabase, nexus } from '../_utils';
import { getSettings } from '../_settings';
import { verifyCallback, parseCallbackStatus } from '../_jayapay';

export async function onRequestPost({ request, env }) {
  let body
  try {
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      body = await request.json()
    } else {
      const text = await request.text()
      try { body = JSON.parse(text) }
      catch {
        const params = new URLSearchParams(text)
        body = {}
        for (const [k, v] of params.entries()) body[k] = v
      }
    }
    console.log('JayaPay callback:', JSON.stringify(body))
  } catch(e) {
    return new Response('SUCCESS', { status: 200 })
  }

  const settings = await getSettings(env)

  // Verifikasi signature
  const valid = await verifyCallback(body, settings['jayapay_public_key'])
  if (!valid) {
    console.log('Invalid signature')
    return new Response('SUCCESS', { status: 200 }) // tetap SUCCESS agar tidak retry
  }

  const status = parseCallbackStatus(body)
  console.log('Status:', status)

  if (status !== 'paid') {
    return new Response('SUCCESS', { status: 200 })
  }

  const { orderNum, platOrderNum } = body
  const sb = getSupabase(env)

  // Cari deposit
  const { data: deposit } = await sb
    .from('deposits')
    .select('*, users(username, balance)')
    .eq('reference', orderNum)
    .eq('status', 'pending')
    .maybeSingle()

  if (!deposit) {
    console.log('Deposit tidak ditemukan:', orderNum)
    return new Response('SUCCESS', { status: 200 })
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
      return new Response('SUCCESS', { status: 200 })
    }

    const saldoBaru = nexusRes.user_balance

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
      description: `Deposit via ${deposit.method} - Auto JayaPay`,
      reference: orderNum,
      status: 'success',
    })

    console.log('Deposit sukses:', orderNum, 'saldo:', saldoBaru)
  } catch(e) {
    console.log('Error:', e.message)
  }

  return new Response('SUCCESS', { status: 200 })
}

export async function onRequestGet() {
  return new Response('JayaPay callback aktif', { status: 200 })
}
