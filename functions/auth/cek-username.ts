// @ts-nocheck
import { ok, err, getSupabase } from '../_utils';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }
  const { username } = body;
  if (!username) return err('Username diperlukan');
  const sb = getSupabase(env);
  const { data } = await sb.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
  return ok({ tersedia: !data });
}
