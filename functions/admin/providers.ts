// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  const sb = getSupabase(env);
  const { data } = await sb
    .from('providers')
    .select('*')
    .order('urutan', { ascending: true });

  return ok({ providers: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { aksi, id, kode, nama, logo_url, tipe, urutan, aktif } = body;
  const sb = getSupabase(env);

  if (aksi === 'update') {
    if (!id) return err('id diperlukan');
    await sb.from('providers').update({
      nama, logo_url, tipe, urutan,
      aktif: aktif !== undefined ? aktif : true,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return ok({ pesan: 'Provider berhasil diupdate' });
  }

  if (aksi === 'tambah') {
    if (!kode || !nama) return err('kode dan nama diperlukan');
    const { data, error } = await sb.from('providers').insert({
      kode: kode.toUpperCase(), nama, logo_url, tipe: tipe || 'slot',
      urutan: urutan || 99, aktif: true,
    }).select().single();
    if (error) return err('Gagal tambah provider: ' + error.message);
    return ok({ pesan: 'Provider berhasil ditambahkan', provider: data });
  }

  if (aksi === 'hapus') {
    if (!id) return err('id diperlukan');
    await sb.from('providers').delete().eq('id', id);
    return ok({ pesan: 'Provider berhasil dihapus' });
  }

  return err('Aksi tidak valid');
}
