import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'
import toast from 'react-hot-toast'

interface Chat {
  id: string
  pesan: string
  dari: 'user' | 'admin'
  created_at: string
  dibaca: boolean
}

export default function LiveChat() {
  const { isLoggedIn, user } = useAuth()
  const { nama } = useBrand()
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [sessionAktif, setSessionAktif] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<any>(null)

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  useEffect(() => {
    if (!isLoggedIn) return
    muatChat()
    pollRef.current = setInterval(muatChat, 5000)
    return () => clearInterval(pollRef.current)
  }, [isLoggedIn])

  useEffect(() => {
    if (open) { muatChat(); setUnread(0) }
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
        setSessionAktif(data.session_aktif !== false)
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
        headers: authHeader(),
        body: JSON.stringify({ pesan }),
      })
      const data = await res.json()
      if (data.chat) {
        setChats(prev => [...prev, data.chat])
        setPesan('')
      } else {
        toast.error(data.error || 'Gagal kirim pesan')
      }
    } catch { toast.error('Gagal kirim pesan') }
    finally { setLoading(false) }
  }

  async function endChat() {
    if (!confirm('Akhiri sesi chat ini?')) return
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ aksi: 'end_chat' }),
      })
      const data = await res.json()
      if (data.status === 1) {
        setSessionAktif(false)
        muatChat()
        toast.success('Chat diakhiri')
      }
    } catch { }
  }

  async function mulaiChatBaru() {
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ pesan: 'Halo, saya ingin bertanya.' }),
      })
      const data = await res.json()
      if (data.chat) {
        setSessionAktif(true)
        muatChat()
      }
    } catch { }
  }

  if (!isLoggedIn || user?.role === 'admin') return null

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
          <div style={{ background: 'linear-gradient(135deg,var(--pink),var(--purple))', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎧</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'white' }}>{nama || 'INDONETWORK'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>● CS Online 24 Jam</div>
            </div>
            {sessionAktif && (
              <button onClick={endChat} title="Akhiri chat"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                Akhiri
              </button>
            )}
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, opacity: 0.8 }}>✕</button>
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
                  maxWidth: '80%', padding: '8px 12px',
                  borderRadius: c.dari === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: c.dari === 'user' ? 'linear-gradient(135deg,var(--pink),var(--purple))' : 'var(--bg3)',
                  border: c.dari === 'admin' ? '1px solid var(--border)' : 'none',
                  fontSize: 13, lineHeight: 1.5,
                  opacity: c.pesan.startsWith('—') ? 0.6 : 1,
                  fontStyle: c.pesan.startsWith('—') ? 'italic' : 'normal',
                  textAlign: c.pesan.startsWith('—') ? 'center' : 'left',
                }}>
                  {c.dari === 'admin' && !c.pesan.startsWith('—') && (
                    <div style={{ fontSize: 10, color: 'var(--blue)', marginBottom: 2, fontWeight: 700 }}>CS {nama || 'INDONETWORK'}</div>
                  )}
                  <div>{c.pesan}</div>
                  {!c.pesan.startsWith('—') && (
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' }}>
                      {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input atau tombol mulai baru */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
            {!sessionAktif ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Sesi chat telah berakhir</div>
                <button onClick={mulaiChatBaru} className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: 13 }}>
                  💬 Mulai Chat Baru
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </>
  )
}
