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
  } catch(e) {
    return new Response('SUCCESS', { status: 200 })
  }

  // Debug - simpan ke callback_logs
  const sb = getSupabase(env)
  await sb.from('callback_logs').insert({
    method: body.status || 'unknown',
    payload: JSON.stringify(body),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
  }).catch(() => {})

  const settings = await getSettings(env)
  const publicKey = settings['jayapay_public_key'] || ''

  const valid = await verifyCallback(body, publicKey)
  if (!valid) {
    await sb.from('callback_logs').insert({ method: 'INVALID_SIGN', payload: 'publicKey length: ' + publicKey.length, ip: 'system' }).catch(() => {})
    return new Response('SUCCESS', { status: 200 })
  }

  const status = parseCallbackStatus(body)
  if (status !== 'paid') {
    return new Response('SUCCESS', { status: 200 })
  }

  const { orderNum, platOrderNum } = body

  // Cari deposit
  const { data: deposit, error: depError } = await sb
    .from('deposits')
    .select('*, users(username, balance)')
    .eq('reference', orderNum)
    .maybeSingle()

  await sb.from('callback_logs').insert({
    method: 'DEPOSIT_SEARCH',
    payload: JSON.stringify({ orderNum, found: !!deposit, error: depError?.message }),
    ip: 'system',
  }).catch(() => {})

  if (!deposit) return new Response('SUCCESS', { status: 200 })
  if (deposit.status === 'success') return new Response('SUCCESS', { status: 200 })

  // Kirim ke NexusGGR
  const agentSign = deposit.id.replace(/-/g, '_')
  const nexusRes = await nexus(env, {
    method: 'user_deposit',
    user_code: deposit.users.username,
    amount: deposit.amount,
    agent_sign: agentSign,
  })

  await sb.from('callback_logs').insert({
    method: 'NEXUS_RESULT',
    payload: JSON.stringify(nexusRes),
    ip: 'system',
  }).catch(() => {})

  if (!nexusRes || nexusRes.status !== 1) {
    return new Response('SUCCESS', { status: 200 })
  }

  const saldoBaru = nexusRes.user_balance

  await Promise.all([
    sb.from('users').update({ balance: saldoBaru }).eq('id', deposit.user_id),
    sb.from('deposits').update({
      status: 'success',
      plat_order_num: platOrderNum || null,
      updated_at: new Date().toISOString(),
    }).eq('id', deposit.id),
    sb.from('transactions').insert({
      user_id: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      balance_before: deposit.users.balance,
      balance_after: saldoBaru,
      description: `Deposit via ${deposit.method} - Auto JayaPay`,
      reference: orderNum,
      status: 'success',
    }),
  ])

  return new Response('SUCCESS', { status: 200 })
}

export async function onRequestGet() {
  return new Response('JayaPay callback aktif', { status: 200 })
}
