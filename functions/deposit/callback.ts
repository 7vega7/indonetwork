// @ts-nocheck
import { getSupabase, nexus } from '../_utils';

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

  // Log ke DB
  const sb = getSupabase(env)
  await sb.from('callback_logs').insert({
    method: body.status || 'unknown',
    payload: JSON.stringify(body),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
  }).catch(() => {})

  // Cek status - hanya proses jika SUCCESS
  const status = String(body.status || '')
  const code = String(body.code || '')
  if (status !== 'SUCCESS' && code !== '00') {
    return new Response('SUCCESS', { status: 200 })
  }

  const orderNum = body.orderNum
  if (!orderNum) return new Response('SUCCESS', { status: 200 })

  // Cari deposit
  const { data: deposit } = await sb
    .from('deposits')
    .select('*, users(username, balance)')
    .eq('reference', orderNum)
    .maybeSingle()

  if (!deposit || deposit.status === 'success') {
    return new Response('SUCCESS', { status: 200 })
  }

  // Kirim ke NexusGGR
  const agentSign = deposit.id.replace(/-/g, '_')
  const nexusRes = await nexus(env, {
    method: 'user_deposit',
    user_code: deposit.users.username,
    amount: deposit.amount,
    agent_sign: agentSign,
  })

  if (!nexusRes || nexusRes.status !== 1) {
    return new Response('SUCCESS', { status: 200 })
  }

  const saldoBaru = nexusRes.user_balance

  // Update semua
  await Promise.all([
    sb.from('users').update({ balance: saldoBaru }).eq('id', deposit.user_id),
    sb.from('deposits').update({
      status: 'success',
      plat_order_num: body.platOrderNum || null,
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
  return new Response('callback aktif', { status: 200 })
}
