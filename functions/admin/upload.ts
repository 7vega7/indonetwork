// @ts-nocheck
import { ok, err, getAuth } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'misc';

    if (!file) return err('File tidak ditemukan');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    if (!allowed.includes(ext)) return err('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF');

    if (file.size > 5 * 1024 * 1024) return err('Ukuran file maksimal 5MB');

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/assets/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: arrayBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errData = await uploadRes.json();
      return err(`Gagal upload: ${errData.message || uploadRes.statusText}`);
    }

    const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`;
    return ok({ url: publicUrl, fileName });

  } catch(e) {
    return err('Gagal upload: ' + e.message);
  }
}
