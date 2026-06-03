// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Login diperlukan', 401);

  const sb = getSupabase(env);

  const { data: user } = await sb.from('users')
    .select('username, created_at')
    .eq('id', auth.sub).single();
  if (!user) return err('User tidak ditemukan');

  const now = new Date()
  const start = new Date(user.created_at).toISOString().replace('T', ' ').substring(0, 19)
  const end = now.toISOString().replace('T', ' ').substring(0, 19)

  let totalTurnover = 0
  try {
    for (const tipe of ['slot', 'live', 'crash']) {
      const log = await nexus(env, {
        method: 'get_game_log',
        user_code: user.username,
        game_type: tipe,
        start, end,
        page: 0,
        perPage: 1000,
      })
      const arr = log?.[tipe] || log?.data || []
      if (log?.status === 1 && Array.isArray(arr)) {
        for (const r of arr) {
          totalTurnover += parseFloat(r.bet_money || r.bet || r.total_bet || 0)
        }
      }
    }
  } catch(e) {}

  const { data: deposits } = await sb.from('deposits')
    .select('amount').eq('user_id', auth.sub).eq('status', 'success')
  const totalDeposit = deposits?.reduce((s, d) => s + (d.amount || 0), 0) || 0

  const tercapai = totalTurnover >= totalDeposit
  const kurang = Math.max(0, totalDeposit - totalTurnover)
  const persen = totalDeposit > 0 ? Math.min(100, Math.round((totalTurnover / totalDeposit) * 100)) : 100

  return ok({
    total_deposit: totalDeposit,
    total_turnover: totalTurnover,
    target_turnover: totalDeposit,
    kurang,
    persen,
    tercapai,
  })
}
