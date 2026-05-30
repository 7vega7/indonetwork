// @ts-nocheck
import { ok, err, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const data = await nexus(env, { method: 'provider_list' });
  if (!data || data.status !== 1) return err('Gagal mengambil provider');

  return ok({
    providers: (data.providers || []).map(p => ({
      kode: p.code,
      nama: p.name,
      tipe: p.type,
      aktif: p.status === 1
    }))
  });
}
