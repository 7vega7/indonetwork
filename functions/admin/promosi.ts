// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);
  const sb = getSupabase(env);
  const { data } = await sb.from('promosi').select('*').order('urutan', { ascending: true });
  return ok({ promosi: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, id, ...data } = body;
  const sb = getSupabase(env);

  if (aksi === 'tambah') {
    const slug = data.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: baru, error } = await sb.from('promosi').insert({
      judul: data.judul, slug: data.slug || slug,
      deskripsi: data.deskripsi, konten: data.konten,
      gambar_url: data.gambar_url, jenis: data.jenis,
      jenis_custom: data.jenis_custom, min_deposit: data.min_deposit || 0,
      bonus_persen: data.bonus_persen || 0, bonus_max: data.bonus_max || 0,
      turnover: data.turnover || 1, urutan: data.urutan || 99, aktif: true,
    }).select().single();
    if (error) return err('Gagal tambah promosi: ' + error.message);
    return ok({ pesan: 'Promosi ditambahkan', promosi: baru });
  }

  if (aksi === 'update') {
    if (!id) return err('id diperlukan');
    await sb.from('promosi').update({
      judul: data.judul, slug: data.slug,
      deskripsi: data.deskripsi, konten: data.konten,
      gambar_url: data.gambar_url, jenis: data.jenis,
      jenis_custom: data.jenis_custom, min_deposit: data.min_deposit,
      bonus_persen: data.bonus_persen, bonus_max: data.bonus_max,
      turnover: data.turnover, urutan: data.urutan, aktif: data.aktif,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return ok({ pesan: 'Promosi diupdate' });
  }

  if (aksi === 'hapus') {
    if (!id) return err('id diperlukan');
    await sb.from('promosi').delete().eq('id', id);
    return ok({ pesan: 'Promosi dihapus' });
  }

  return err('Aksi tidak valid');
}
