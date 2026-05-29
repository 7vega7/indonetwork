// @ts-nocheck
import { json, getSupabase } from './_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ status: 0, msg: 'INVALID_JSON' }, 400); }

  if (body.agent_code !== env.NEXUS_AGENT_CODE || body.agent_secret !== env.NEXUS_AGENT_TOKEN) {
    return json({ status: 0, msg: 'INVALID_AGENT' }, 401);
  }

  const { method, user_code } = body;
  const sb = getSupabase(env);

  const { data: user } = await sb.from('users').select('id, username, balance, is_active').eq('username', user_code).maybeSingle();
  if (!user) return json({ status: 0, msg: 'USER_NOT_FOUND' });
  if (!user.is_active) return json({ status: 0, msg: 'USER_INACTIVE' });

  if (method === 'user_balance') return json({ status: 1, user_balance: user.balance });

  if (method === 'transaction') {
    const gameData = body[body.game_type] || body.slot || body.live || body.SB;
    if (!gameData) return json({ status: 0, msg: 'INVALID_GAME_DATA' });

    const { bet_money = 0, win_money = 0, txn_id, txn_type, provider_code, game_code } = gameData;

    const { data: exist } = await sb.from('transactions').select('id').eq('txn_id', txn_id).maybeSingle();
    if (exist) return json({ status: 1, user_balance: user.balance });

    let balanceChange = txn_type === 'debit' ? -bet_money : txn_type === 'credit' ? win_money : win_money - bet_money;
    let jenis = balanceChange >= 0 ? 'win' : 'bet';

    const newBalance = user.balance + balanceChange;
    if (newBalance < 0) return json({ status: 0, msg: 'INSUFFICIENT_USER_FUNDS' });

    await sb.from('users').update({ balance: newBalance }).eq('id', user.id);
    await sb.from('transactions').insert({
      user_id: user.id, type: jenis, amount: Math.abs(balanceChange),
      balance_before: user.balance, balance_after: newBalance,
      description: `${game_code} (${provider_code})`,
      reference: txn_id, provider: provider_code, game_code, txn_id, status: 'success',
    });

    return json({ status: 1, user_balance: newBalance });
  }

  return json({ status: 0, msg: 'UNKNOWN_METHOD' });
}
