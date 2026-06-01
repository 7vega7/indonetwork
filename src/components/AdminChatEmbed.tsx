import { useState, useEffect, useRef } from 'react'

interface ChatUser {
  user_id: string
  username: string
  pesan_terakhir: string
  dari_terakhir: string
  created_at: string
  belum_dibaca: number
}

interface Chat {
  id: string
  pesan: string
  dari: 'user' | 'admin'
  created_at: string
  username: string
}

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

export default function AdminChatEmbed() {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    muatUsers()
    const t = setInterval(muatUsers, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    muatChat(selectedUser.user_id)
    const t = setInterval(() => muatChat(selectedUser.user_id), 3000)
    return () => clearInterval(t)
  }, [selectedUser?.user_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats])

  async function muatUsers() {
    try {
      const res = await fetch('/chat', { headers: authHeader() })
      const data = await res.json()
      if (data.users) setChatUsers(data.users)
    } catch { }
  }

  async function muatChat(userId: string) {
    try {
      const res = await fetch(`/chat?user_id=${userId}`, { headers: authHeader() })
      const data = await res.json()
      if (data.chats) setChats(data.chats)
      await fetch('/chat', { method: 'PATCH', headers: authHeader(), body: JSON.stringify({ user_id: userId }) })
    } catch { }
  }

  async function kirimPesan(e: React.FormEvent) {
    e.preventDefault()
    if (!pesan.trim() || !selectedUser || loading) return
    setLoading(true)
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ pesan, user_id: selectedUser.user_id }),
      })
      const data = await res.json()
      if (data.chat) { setChats(prev => [...prev, data.chat]); setPesan('') }
    } catch { }
    finally { setLoading(false) }
  }

  const totalUnread = chatUsers.reduce((s, u) => s + u.belum_dibaca, 0)

  return (
    <div style={{ display: 'flex', height: '100%', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

      {/* Sidebar Users */}
      {(!isMobile || !selectedUser) && (
        <div style={{ width: isMobile ? '100%' : 240, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--gold)' }}>💬 PERCAKAPAN</span>
            {totalUnread > 0 && (
              <span style={{ background: 'var(--pink)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{totalUnread}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {chatUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)', fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                Belum ada chat
              </div>
            ) : chatUsers.map(u => (
              <div key={u.user_id} onClick={() => setSelectedUser(u)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedUser?.user_id === u.user_id ? 'rgba(0,200,255,0.08)' : 'transparent', transition: 'background 0.2s' }}
                onMouseEnter={e => { if (selectedUser?.user_id !== u.user_id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (selectedUser?.user_id !== u.user_id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{u.username}</span>
                      {u.belum_dibaca > 0 && (
                        <span style={{ background: 'var(--pink)', color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{u.belum_dibaca}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.dari_terakhir === 'admin' ? '✓ ' : ''}{u.pesan_terakhir}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedUser ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 13 }}>Pilih user untuk membalas</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)' }}>
              {isMobile && (
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>←</button>
              )}
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedUser.username}</div>
                <div style={{ fontSize: 10, color: '#00e676' }}>● Online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
              {chats.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: c.dari === 'admin' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '8px 12px',
                    borderRadius: c.dari === 'admin' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: c.dari === 'admin' ? 'linear-gradient(135deg,var(--blue),var(--purple))' : 'var(--bg3)',
                    border: c.dari === 'user' ? '1px solid var(--border)' : 'none',
                    fontSize: 13, lineHeight: 1.5,
                  }}>
                    {c.dari === 'user' && <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>{c.username}</div>}
                    <div>{c.pesan}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'right' }}>
                      {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
              <form onSubmit={kirimPesan} style={{ display: 'flex', gap: 8 }}>
                <input className="input"
                  placeholder={`Balas ${selectedUser.username}...`}
                  value={pesan} onChange={e => setPesan(e.target.value)}
                  disabled={loading} style={{ flex: 1, padding: '8px 12px' }} autoFocus />
                <button type="submit" className="btn btn-primary"
                  disabled={loading || !pesan.trim()} style={{ padding: '8px 16px', fontSize: 13 }}>
                  ➤
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
