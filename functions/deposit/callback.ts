// @ts-nocheck
import { getSupabase, nexus, notifAdmin } from '../_utils';
import { sendTelegram } from '../_telegram';

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch(e) {
    return new Response('SUCCESS', { status: 200 })
  }

  const status = String(body.status || '')
  const code = String(body.code || '')
  const isPaid = status === 'SUCCESS' || code === '00'

  if (!isPaid) return new Response('SUCCESS', { status: 200 })

  const orderNum = body.orderNum
  if (!orderNum) return new Response('SUCCESS', { status: 200 })

  const sb = getSupabase(env)

  const { data: deposit } = await sb
    .from('deposits')
    .select('id, user_id, amount, method, status, users(username, balance)')
    .eq('reference', orderNum)
    .maybeSingle()

  if (!deposit || deposit.status === 'success') {
    return new Response('SUCCESS', { status: 200 })
  }

  const nexusRes = await nexus(env, {
    method: 'user_deposit',
    user_code: deposit.users.username,
    amount: deposit.amount,
    agent_sign: deposit.id.replace(/-/g, '_'),
  })

  if (!nexusRes || nexusRes.status !== 1) {
    return new Response('SUCCESS', { status: 200 })
  }

  const saldoBaru = nexusRes.user_balance

  await sb.from('users').update({ balance: saldoBaru }).eq('id', deposit.user_id)
  await sb.from('deposits').update({
    status: 'success',
    plat_order_num: body.platOrderNum || null,
    updated_at: new Date().toISOString(),
  }).eq('id', deposit.id)
  await sb.from('transactions').insert({
    user_id: deposit.user_id,
    type: 'deposit',
    amount: deposit.amount,
    balance_before: deposit.users.balance,
    balance_after: saldoBaru,
    description: 'Deposit via ' + deposit.method + ' - Auto JayaPay',
    reference: orderNum,
    status: 'success',
  })

  // Notif telegram sukses
  const nama = deposit.users.username
  const jumlah = deposit.amount.toLocaleString('id-ID')
  const metode = deposit.method
  await sendTelegram(env,
    '💰 <b>DEPOSIT SUKSES</b>\n\n' +
    '👤 User: <b>' + nama + '</b>\n' +
    '💵 Jumlah: <b>Rp ' + jumlah + '</b>\n' +
    '💳 Metode: ' + metode + '\n' +
    '✅ Status: Dikonfirmasi Otomatis\n' +
    '🕐 ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
  )

  return new Response('SUCCESS', { status: 200 })
}

export async function onRequestGet() {
  return new Response('callback aktif', { status: 200 })
}
