import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

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

export default function AdminChat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    muatUsers()
    pollRef.current = setInterval(muatUsers, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (selectedUser) {
      muatChat(selectedUser.user_id)
      const t = setInterval(() => muatChat(selectedUser.user_id), 3000)
      return () => clearInterval(t)
    }
  }, [selectedUser])

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
      // Mark as read
      await fetch('/chat', {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ user_id: userId }),
      })
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
      if (data.chat) {
        setChats(prev => [...prev, data.chat])
        setPesan('')
      }
    } catch { }
    finally { setLoading(false) }
  }

  const totalUnread = chatUsers.reduce((s, u) => s + u.belum_dibaca, 0)

  return (
    <div style={{ height: 'calc(100vh - 110px)', display: 'flex', overflow: 'hidden' }}>

      {/* Sidebar Users */}
      {(!isMobile || !selectedUser) && (
        <div style={{ width: isMobile ? '100%' : 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
              💬 Live Chat
            </div>
            {totalUnread > 0 && (
              <div style={{ background: 'var(--pink)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                {totalUnread} baru
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {chatUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                Belum ada chat masuk
              </div>
            ) : chatUsers.map(u => (
              <div key={u.user_id}
                onClick={() => setSelectedUser(u)}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedUser?.user_id === u.user_id ? 'rgba(0,200,255,0.08)' : 'transparent', transition: 'background 0.2s' }}
                onMouseEnter={e => { if (selectedUser?.user_id !== u.user_id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (selectedUser?.user_id !== u.user_id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{u.username}</span>
                      {u.belum_dibaca > 0 && (
                        <span style={{ background: 'var(--pink)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{u.belum_dibaca}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.dari_terakhir === 'admin' ? '✓ ' : ''}{u.pesan_terakhir}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(u.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {(!isMobile || selectedUser) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedUser ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div>Pilih user untuk memulai chat</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg2)' }}>
                {isMobile && (
                  <button onClick={() => setSelectedUser(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>←</button>
                )}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedUser.username}</div>
                  <div style={{ fontSize: 11, color: '#00e676' }}>● Online</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
                {chats.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: c.dari === 'admin' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px',
                      borderRadius: c.dari === 'admin' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: c.dari === 'admin' ? 'linear-gradient(135deg,var(--blue),var(--purple))' : 'var(--bg2)',
                      border: c.dari === 'user' ? '1px solid var(--border)' : 'none',
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      {c.dari === 'user' && <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{c.username}</div>}
                      <div>{c.pesan}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' }}>
                        {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
                <form onSubmit={kirimPesan} style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="input"
                    placeholder={`Balas ${selectedUser.username}...`}
                    value={pesan}
                    onChange={e => setPesan(e.target.value)}
                    disabled={loading}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading || !pesan.trim()}
                    style={{ padding: '8px 20px', flexShrink: 0 }}>
                    Kirim ➤
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
