// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const sb = getSupabase(env);
  const { data: users } = await sb
    .from('users')
    .select('username')
    .eq('role', 'user');

  const results = [];
  for (const user of users || []) {
    try {
      const res = await nexus(env, {
        method: 'user_create',
        user_code: user.username,
      });
      results.push({ username: user.username, status: res.status, msg: res.msg });
    } catch(e) {
      results.push({ username: user.username, status: 0, msg: 'error' });
    }
  }

  return ok({ pesan: `${results.length} user diproses`, results });
}
