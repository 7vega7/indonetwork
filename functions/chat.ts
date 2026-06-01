// @ts-nocheck
import { ok, err, getAuth, getSupabase, json } from './_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const sb = getSupabase(env);

  // Admin bisa lihat semua chat atau per user
  if (auth.role === 'admin') {
    if (userId) {
      // Chat per user
      const { data } = await sb.from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(100)
      return ok({ chats: data || [] })
    } else {
      // Semua user yang pernah chat (distinct)
      const { data } = await sb.from('chats')
        .select('user_id, username, pesan, dari, dibaca, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      // Group by user_id - ambil pesan terakhir per user
      const userMap: Record<string, any> = {}
      for (const c of data || []) {
        if (!userMap[c.user_id]) {
          userMap[c.user_id] = {
            user_id: c.user_id,
            username: c.username,
            pesan_terakhir: c.pesan,
            dari_terakhir: c.dari,
            created_at: c.created_at,
            belum_dibaca: 0,
          }
        }
        if (!c.dibaca && c.dari === 'user') {
          userMap[c.user_id].belum_dibaca++
        }
      }
      return ok({ users: Object.values(userMap) })
    }
  }

  // User lihat chat sendiri
  const { data } = await sb.from('chats')
    .select('*')
    .eq('user_id', auth.sub)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark as read (pesan dari admin)
  await sb.from('chats')
    .update({ dibaca: true })
    .eq('user_id', auth.sub)
    .eq('dari', 'admin')
    .eq('dibaca', false)

  return ok({ chats: data || [] })
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { pesan, user_id } = body;
  if (!pesan?.trim()) return err('Pesan tidak boleh kosong');

  const sb = getSupabase(env);

  if (auth.role === 'admin') {
    // Admin kirim ke user tertentu
    if (!user_id) return err('user_id diperlukan');
    const { data: user } = await sb.from('users').select('username').eq('id', user_id).single()
    const { data } = await sb.from('chats').insert({
      user_id,
      username: user?.username || 'user',
      pesan: pesan.trim(),
      dari: 'admin',
      dibaca: false,
    }).select().single()
    return ok({ chat: data })
  }

  // User kirim pesan
  const { data } = await sb.from('chats').insert({
    user_id: auth.sub,
    username: auth.username,
    pesan: pesan.trim(),
    dari: 'user',
    dibaca: false,
  }).select().single()

  return ok({ chat: data })
}

export async function onRequestPatch({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || auth.role !== 'admin') return err('Akses admin diperlukan', 403);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { user_id } = body;
  const sb = getSupabase(env);

  await sb.from('chats')
    .update({ dibaca: true })
    .eq('user_id', user_id)
    .eq('dari', 'user')

  return ok({ pesan: 'Pesan ditandai sudah dibaca' })
}
