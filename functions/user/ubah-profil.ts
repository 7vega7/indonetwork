// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { nama_lengkap, no_telepon, bank, no_rekening, atas_nama } = body;
  const sb = getSupabase(env);

  await sb.from('users').update({
    nama_lengkap: nama_lengkap || null,
    no_telepon: no_telepon || null,
    bank: bank || null,
    no_rekening: no_rekening || null,
    atas_nama: atas_nama || null,
    profil_lengkap: !!(nama_lengkap && no_telepon && bank && no_rekening && atas_nama),
  }).eq('id', auth.sub);

  return ok({ pesan: 'Profil berhasil diupdate' });
}
