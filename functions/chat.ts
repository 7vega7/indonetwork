// @ts-nocheck
import { ok, err, getAuth, getSupabase } from './_utils';

// Helper ambil atau buat session aktif
async function getOrCreateSession(sb, userId, username) {
  const { data: existing } = await sb
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) return existing

  const { data: session } = await sb
    .from('chat_sessions')
    .insert({ user_id: userId, username, status: 'active' })
    .select()
    .single()

  return session
}

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env)
  if (!auth) return err('Tidak terautentikasi', 401)

  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id')
  const sb = getSupabase(env)

  if (['admin','owner','cs'].includes(auth.role)) {
    if (userId) {
      // Chat per user
      const { data } = await sb
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(100)

      // Cek status session
      const { data: session } = await sb
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      // Mark admin read
      await sb.from('chats')
        .update({ dibaca: true })
        .eq('user_id', userId)
        .eq('dari', 'user')
        .eq('dibaca', false)

      return ok({ chats: data || [], session_aktif: !!session })
    }

    // List semua user yang punya session aktif
    const { data: sessions } = await sb
      .from('chat_sessions')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    // Ambil pesan terakhir per user
    const users = []
    for (const s of sessions || []) {
      const { data: lastChat } = await sb
        .from('chats')
        .select('*')
        .eq('user_id', s.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unread } = await sb
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', s.user_id)
        .eq('dari', 'user')
        .eq('dibaca', false)

      users.push({
        user_id: s.user_id,
        username: s.username,
        session_id: s.id,
        pesan_terakhir: lastChat?.pesan || '(belum ada pesan)',
        dari_terakhir: lastChat?.dari || 'user',
        created_at: lastChat?.created_at || s.created_at,
        belum_dibaca: unread || 0,
      })
    }

    return ok({ users })
  }

  // User - lihat chat sendiri
  const session = await getOrCreateSession(sb, auth.sub, auth.username)

  const { data } = await sb
    .from('chats')
    .select('*')
    .eq('user_id', auth.sub)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark as read
  await sb.from('chats')
    .update({ dibaca: true })
    .eq('user_id', auth.sub)
    .eq('dari', 'admin')
    .eq('dibaca', false)

  return ok({ chats: data || [], session_aktif: session?.status === 'active' })
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env)
  if (!auth) return err('Tidak terautentikasi', 401)

  let body
  try { body = await request.json() } catch { return err('Body tidak valid') }

  const { pesan, user_id, aksi } = body
  const sb = getSupabase(env)

  // End chat session
  if (aksi === 'end_chat') {
    const targetUserId = ['admin','owner','cs'].includes(auth.role) ? user_id : auth.sub
    if (!targetUserId) return err('user_id diperlukan')

    await sb.from('chat_sessions')
      .update({
        status: 'ended',
        ended_by: ['admin','owner','cs'].includes(auth.role) ? 'admin' : 'user',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId)
      .eq('status', 'active')

    // Kirim pesan sistem
    const siapaMengakhiri = ['admin','owner','cs'].includes(auth.role) ? 'Admin' : auth.username
    await sb.from('chats').insert({
      user_id: targetUserId,
      username: auth.username,
      pesan: `— Chat diakhiri oleh ${siapaMengakhiri} —`,
      dari: ['admin','owner','cs'].includes(auth.role) ? 'admin' : 'user',
      dibaca: false,
    })

    return ok({ pesan: 'Chat berhasil diakhiri' })
  }

  // Kirim pesan
  if (!pesan?.trim()) return err('Pesan tidak boleh kosong')

  if (['admin','owner','cs'].includes(auth.role)) {
    if (!user_id) return err('user_id diperlukan')
    const { data: user } = await sb.from('users').select('username').eq('id', user_id).single()

    // Update session updated_at
    await sb.from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('status', 'active')

    const { data } = await sb.from('chats').insert({
      user_id,
      username: user?.username || 'user',
      pesan: pesan.trim(),
      dari: 'admin',
      dibaca: false,
    }).select().single()

    return ok({ chat: data })
  }

  // User kirim pesan - pastikan session aktif
  const session = await getOrCreateSession(sb, auth.sub, auth.username)

  await sb.from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', session.id)

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
  const auth = await getAuth(request, env)
  if (!auth || !['admin','owner','cs'].includes(auth.role)) return err('Akses admin diperlukan', 403)

  let body
  try { body = await request.json() } catch { return err('Body tidak valid') }

  const { user_id } = body
  const sb = getSupabase(env)

  await sb.from('chats')
    .update({ dibaca: true })
    .eq('user_id', user_id)
    .eq('dari', 'user')

  return ok({ pesan: 'Pesan ditandai sudah dibaca' })
}

export async function onRequestDelete({ request, env }) {
  // Auto cleanup chat lama (dipanggil dari cron)
  const auth = await getAuth(request, env)
  if (!auth || !['admin','owner','cs'].includes(auth.role)) return err('Akses admin diperlukan', 403)

  const sb = getSupabase(env)

  // Hapus chat lebih dari 7 hari
  const { count: hapusChat } = await sb
    .from('chats')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Hapus session tidak aktif lebih dari 7 hari
  const { count: hapusSession } = await sb
    .from('chat_sessions')
    .delete({ count: 'exact' })
    .eq('status', 'ended')
    .lt('ended_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Auto-end session tidak aktif lebih dari 2 hari
  await sb.from('chat_sessions')
    .update({ status: 'ended', ended_by: 'system', ended_at: new Date().toISOString() })
    .eq('status', 'active')
    .lt('updated_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())

  return ok({ pesan: `Cleanup selesai`, hapus_chat: hapusChat, hapus_session: hapusSession })
}
