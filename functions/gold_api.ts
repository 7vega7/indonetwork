// @ts-nocheck
import { json, getSupabase } from './_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ status: 0, msg: 'INVALID_JSON' }, 400); }

  if (body.agent_code !== env.NEXUS_AGENT_CODE) {
    return json({ status: 0, msg: 'INVALID_AGENT' }, 401);
  }

  const { method, user_code } = body;
  const sb = getSupabase(env);

  const { data: user } = await sb
    .from('users')
    .select('id, username, balance, is_active')
    .eq('username', user_code.toLowerCase())
    .maybeSingle();

  // Selalu return status 1 meski user tidak ditemukan atau saldo 0
  if (!user) return json({ status: 1, user_balance: 0 });
  if (!user.is_active) return json({ status: 1, user_balance: 0 });

  if (method === 'user_balance') {
    return json({ status: 1, user_balance: user.balance });
  }

  if (method === 'transaction') {
    const gameData = body[body.game_type] || body.slot || body.live || body.SB;
    if (!gameData) return json({ status: 1, user_balance: user.balance });

    const { bet_money = 0, win_money = 0, txn_id, txn_type, provider_code, game_code } = gameData;

    // Cek duplikat transaksi
    const { data: exist } = await sb
      .from('transactions')
      .select('id')
      .eq('txn_id', txn_id)
      .maybeSingle();
    if (exist) return json({ status: 1, user_balance: user.balance });

    let balanceChange = 0;
    if (txn_type === 'debit') balanceChange = -bet_money;
    else if (txn_type === 'credit') balanceChange = win_money;
    else if (txn_type === 'debit_credit') balanceChange = win_money - bet_money;

    const newBalance = Math.max(0, user.balance + balanceChange);

    // Kalau saldo tidak cukup, tetap return status 1 dengan saldo 0
    if (user.balance < bet_money && txn_type !== 'credit') {
      return json({ status: 1, user_balance: user.balance });
    }

    await sb.from('users').update({ balance: newBalance }).eq('id', user.id);
    
    await sb.from('transactions').insert({
      user_id: user.id,
      type: balanceChange >= 0 ? 'win' : 'bet',
      amount: Math.abs(balanceChange),
      balance_before: user.balance,
      balance_after: newBalance,
      description: `${game_code} (${provider_code})`,
      reference: txn_id,
      provider: provider_code,
      game_code,
      txn_id,
      status: 'success',
    });

    return json({ status: 1, user_balance: newBalance });
  }

  // Default selalu return status 1
  return json({ status: 1, user_balance: user.balance });
}
