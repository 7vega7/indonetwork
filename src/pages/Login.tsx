import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

declare global {
  interface Window { turnstile: any }
}

export default function Login() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [tsToken, setTsToken] = useState('')
  const tsRef = useRef<HTMLDivElement>(null)
  const tsId = useRef('')

  useEffect(() => { if (isLoggedIn) navigate('/', { replace: true }) }, [isLoggedIn])

  useEffect(() => {
    const t = setInterval(() => {
      if (window.turnstile && tsRef.current && !tsId.current) {
        tsId.current = window.turnstile.render(tsRef.current, {
          sitekey: '0x4AAAAAADYmCs4M4HZbuWER',
          callback: (token: string) => setTsToken(token),
          'expired-callback': () => setTsToken(''),
          theme: 'dark',
        })
        clearInterval(t)
      }
    }, 200)
    return () => { clearInterval(t); if (tsId.current && window.turnstile) window.turnstile.remove(tsId.current) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tsToken) { toast.error('Selesaikan verifikasi keamanan'); return }
    setLoading(true)
    try {
      const res = await authApi.login({ ...form, turnstile_token: tsToken })
      login(res.token, res.user)
      toast.success('Selamat datang!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Login gagal')
      if (tsId.current && window.turnstile) window.turnstile.reset(tsId.current)
      setTsToken('')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, textAlign: 'center', marginBottom: 8, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MASUK</h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Masuk ke akun INDONETWORK kamu</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Username</label>
            <input className="input" type="text" placeholder="Masukkan username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input" type="password" placeholder="Masukkan password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div ref={tsRef} style={{ borderRadius: 6, overflow: 'hidden' }} />
          <button type="submit" className="btn btn-primary" disabled={loading || !tsToken} style={{ width: '100%', padding: 12, fontSize: 15 }}>
            {loading ? 'Memproses...' : 'MASUK'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
          Belum punya akun? <Link to="/daftar" style={{ color: 'var(--blue)', fontWeight: 600 }}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  )
}
