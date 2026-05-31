// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const sb = getSupabase(env);
  const [
    { count: totalUser },
    { count: depositPending },
    { count: withdrawPending },
    { data: saldoData },
  ] = await Promise.all([
    sb.from('users').select('*', { count: 'exact', head: true }),
    sb.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('users').select('balance'),
  ]);

  const totalSaldo = (saldoData || []).reduce((sum, u) => sum + (u.balance || 0), 0);

  return ok({
    stats: {
      total_user: totalUser || 0,
      deposit_pending: depositPending || 0,
      withdraw_pending: withdrawPending || 0,
      total_saldo_user: totalSaldo,
    }
  });
}
