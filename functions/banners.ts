// @ts-nocheck
import { ok, err, getSupabase } from './_utils';

export async function onRequestGet({ request, env }) {
  const sb = getSupabase(env);
  const { data } = await sb
    .from('banners')
    .select('*')
    .eq('aktif', true)
    .order('urutan', { ascending: true });
  return ok({ banners: data || [] });
}
