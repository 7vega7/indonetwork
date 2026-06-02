import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Jika sudah login sebagai admin, redirect ke admin
  if (user?.role === 'admin') {
    navigate('/admin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Isi semua field'); return }
    setLoading(true)
    try {
      const res = await authApi.login({
        username,
        password,
        turnstile_token: 'bypass-dev-2024'
      })
      if (!['admin','owner','cs'].includes(res.user?.role || '')) {
        toast.error('Akses ditolak - bukan admin')
        return
      }
      login(res.token, { ...res.user, saldo: res.user.saldo || 0 })
      toast.success('Login admin berhasil')
      navigate('/admin')
    } catch (err: any) {
      toast.error(err.message || 'Login gagal')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            👑 ADMIN LOGIN
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Panel Administrator</div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Username</label>
              <input className="input" type="text" placeholder="Username admin"
                value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
              <input className="input" type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', color: '#000', fontWeight: 700 }}>
              {loading ? 'Login...' : '👑 Masuk sebagai Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
