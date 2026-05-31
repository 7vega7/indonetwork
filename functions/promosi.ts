// @ts-nocheck
import { ok, err, getSupabase } from './_utils';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const sb = getSupabase(env);

  if (slug) {
    const { data } = await sb.from('promosi').select('*').eq('slug', slug).eq('aktif', true).single();
    if (!data) return err('Promosi tidak ditemukan', 404);
    return ok({ promosi: data });
  }

  const { data } = await sb
    .from('promosi')
    .select('id, judul, slug, deskripsi, gambar_url, jenis, jenis_custom, min_deposit, bonus_persen, bonus_max, turnover, urutan')
    .eq('aktif', true)
    .order('urutan', { ascending: true });
  return ok({ promosi: data || [] });
}
