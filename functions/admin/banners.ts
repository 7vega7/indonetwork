// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);
  const sb = getSupabase(env);
  const { data } = await sb.from('banners').select('*').order('urutan', { ascending: true });
  return ok({ banners: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, id, ...data } = body;
  const sb = getSupabase(env);

  if (aksi === 'tambah') {
    const { data: baru, error } = await sb.from('banners').insert({
      judul: data.judul, subjudul: data.subjudul, tag: data.tag,
      teks_tombol: data.teks_tombol, link_tombol: data.link_tombol,
      jenis: data.jenis, jenis_custom: data.jenis_custom,
      warna_bg: data.warna_bg, gambar_url: data.gambar_url,
      urutan: data.urutan || 99, aktif: true,
    }).select().single();
    if (error) return err('Gagal tambah banner');
    return ok({ pesan: 'Banner ditambahkan', banner: baru });
  }

  if (aksi === 'update') {
    if (!id) return err('id diperlukan');
    await sb.from('banners').update({
      judul: data.judul, subjudul: data.subjudul, tag: data.tag,
      teks_tombol: data.teks_tombol, link_tombol: data.link_tombol,
      jenis: data.jenis, jenis_custom: data.jenis_custom,
      warna_bg: data.warna_bg, gambar_url: data.gambar_url,
      urutan: data.urutan, aktif: data.aktif,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return ok({ pesan: 'Banner diupdate' });
  }

  if (aksi === 'hapus') {
    if (!id) return err('id diperlukan');
    await sb.from('banners').delete().eq('id', id);
    return ok({ pesan: 'Banner dihapus' });
  }

  return err('Aksi tidak valid');
}
