// @ts-nocheck
import { ok, err, getAuth, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const data = await nexus(env, { method: 'provider_list' });
  if (!data || data.status !== 1) return err('Gagal mengambil provider');

  return ok({
    providers: (data.providers || []).map(p => ({ kode: p.code, nama: p.name, aktif: p.status === 1 }))
  });
}
