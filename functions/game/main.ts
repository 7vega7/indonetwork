// @ts-nocheck
import { ok, err, getAuth, nexus } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { provider, kode_game, bahasa = 'id' } = body;
  if (!provider || !kode_game) return err('Provider dan kode_game diperlukan');

  const data = await nexus(env, {
    method: 'game_launch',
    user_code: auth.username,
    provider_code: provider,
    game_code: kode_game,
    lang: bahasa,
  });

  if (!data || data.status !== 1) return err(data?.msg || 'Gagal meluncurkan game');
  return ok({ url_game: data.launch_url });
}
