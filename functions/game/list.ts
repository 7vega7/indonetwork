// @ts-nocheck
import { ok, err, getAuth, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  if (!provider) return err('Parameter provider diperlukan');

  const v2 = ['PRAGMATIC','PGSOFT','REELKINGDOM','FATPANDA','HABANERO','CQ9'].includes(provider.toUpperCase());
  const data = await nexus(env, { method: v2 ? 'game_list_v2' : 'game_list', provider_code: provider.toUpperCase() });
  if (!data || data.status !== 1) return err('Gagal mengambil game');

  return ok({
    provider,
    games: (data.games || []).map(g => ({
      kode: g.game_code,
      nama: typeof g.game_name === 'string' ? g.game_name : (g.game_name?.id || g.game_name?.en || g.game_code),
      banner: g.banner || null,
    }))
  });
}
