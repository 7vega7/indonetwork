import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'

interface Chat {
  id: string
  pesan: string
  dari: 'user' | 'admin'
  created_at: string
  dibaca: boolean
}

export default function LiveChat() {
  const { isLoggedIn, user, token } = useAuth()
  const { nama } = useBrand()
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

  useEffect(() => {
    if (!isLoggedIn) return
    muatChat()
    // Poll setiap 5 detik
    pollRef.current = setInterval(muatChat, 5000)
    return () => clearInterval(pollRef.current)
  }, [isLoggedIn])

  useEffect(() => {
    if (open) {
      muatChat()
      setUnread(0)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats])

  async function muatChat() {
    try {
      const res = await fetch('/chat', { headers: authHeader() })
      const data = await res.json()
      if (data.chats) {
        setChats(data.chats)
        if (!open) {
          const unreadCount = data.chats.filter((c: Chat) => c.dari === 'admin' && !c.dibaca).length
          setUnread(unreadCount)
        }
      }
    } catch { }
  }

  async function kirimPesan(e: React.FormEvent) {
    e.preventDefault()
    if (!pesan.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ pesan }),
      })
      const data = await res.json()
      if (data.chat) {
        setChats(prev => [...prev, data.chat])
        setPesan('')
      }
    } catch { }
    finally { setLoading(false) }
  }

  if (!isLoggedIn) return null

  return (
    <>
      {/* Widget Button */}
      <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 500 }}>
        <button onClick={() => setOpen(!open)}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--pink),var(--purple))', border: 'none', cursor: 'pointer', fontSize: 22, boxShadow: '0 4px 20px rgba(255,45,120,0.4)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
          {open ? '✕' : '💬'}
          {unread > 0 && !open && (
            <div style={{ position: 'absolute', top: -2, right: -2, background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread}
            </div>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div style={{ position: 'fixed', bottom: 140, right: 16, zIndex: 500, width: 320, maxWidth: 'calc(100vw - 32px)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', height: 420 }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,var(--pink),var(--purple))', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎧</div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'white' }}>{nama || 'INDONETWORK'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>● CS Online 24 Jam</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, opacity: 0.8 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
            {chats.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                <div>Halo {user?.username}! Ada yang bisa kami bantu?</div>
              </div>
            )}
            {chats.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: c.dari === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: c.dari === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: c.dari === 'user' ? 'linear-gradient(135deg,var(--pink),var(--purple))' : 'var(--bg3)',
                  border: c.dari === 'admin' ? '1px solid var(--border)' : 'none',
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {c.dari === 'admin' && <div style={{ fontSize: 10, color: 'var(--blue)', marginBottom: 2, fontWeight: 700 }}>CS {nama || 'INDONETWORK'}</div>}
                  <div>{c.pesan}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' }}>
                    {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <form onSubmit={kirimPesan} style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                placeholder="Ketik pesan..."
                value={pesan}
                onChange={e => setPesan(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !pesan.trim()}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--pink),var(--purple))', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !pesan.trim() ? 0.5 : 1 }}>
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
