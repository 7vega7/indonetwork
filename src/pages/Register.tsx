import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function Register() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', konfirmasi: '', referral: '' })
  const [loading, setLoading] = useState(false)
  const [tsToken, setTsToken] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'ok'|'taken'>('idle')
  const tsRef = useRef<HTMLDivElement>(null)
  const tsId = useRef('')
  const usernameTimer = useRef<any>()

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

  const cekUsername = (val: string) => {
    setForm(f => ({ ...f, username: val }))
    clearTimeout(usernameTimer.current)
    if (val.length >= 4) {
      setUsernameStatus('checking')
      usernameTimer.current = setTimeout(async () => {
        try {
          const res = await authApi.cekUsername(val)
          setUsernameStatus(res.tersedia ? 'ok' : 'taken')
        } catch { setUsernameStatus('idle') }
      }, 600)
    } else { setUsernameStatus('idle') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tsToken) { toast.error('Selesaikan verifikasi keamanan'); return }
    if (form.password !== form.konfirmasi) { toast.error('Password tidak cocok'); return }
    if (usernameStatus === 'taken') { toast.error('Username sudah digunakan'); return }
    setLoading(true)
    try {
      const res = await authApi.register({ username: form.username, email: form.email, password: form.password, turnstile_token: tsToken, referral_code: form.referral || undefined })
      login(res.token, res.user)
      toast.success('Akun berhasil dibuat!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Pendaftaran gagal')
      if (tsId.current && window.turnstile) window.turnstile.reset(tsId.current)
      setTsToken('')
    } finally { setLoading(false) }
  }

  const statusColor = { idle: 'var(--muted)', checking: 'var(--gold)', ok: '#00e676', taken: 'var(--pink)' }[usernameStatus]
  const statusMsg = { idle: '', checking: 'Memeriksa...', ok: '✓ Tersedia', taken: '✗ Sudah digunakan' }[usernameStatus]

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 440 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, textAlign: 'center', marginBottom: 8, background: 'linear-gradient(135deg,#ff2d78,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DAFTAR SEKARANG</h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Buat akun & dapatkan bonus new member</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Username</label>
            <input className="input" type="text" placeholder="4-20 karakter (huruf & angka)" value={form.username} onChange={e => cekUsername(e.target.value)} />
            {statusMsg && <div style={{ fontSize: 11, color: statusColor, marginTop: 4 }}>{statusMsg}</div>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input" type="email" placeholder="contoh@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Konfirmasi Password</label>
            <input className="input" type="password" placeholder="Ulangi password" value={form.konfirmasi} onChange={e => setForm(f => ({ ...f, konfirmasi: e.target.value }))} />
            {form.konfirmasi && form.password !== form.konfirmasi && <div style={{ fontSize: 11, color: 'var(--pink)', marginTop: 4 }}>✗ Password tidak cocok</div>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Kode Referral <span style={{ opacity: 0.6 }}>(opsional)</span></label>
            <input className="input" type="text" placeholder="Masukkan kode referral jika ada" value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} />
          </div>
          <div ref={tsRef} style={{ borderRadius: 6, overflow: 'hidden' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
            Dengan mendaftar, kamu menyatakan berusia 18+ dan menyetujui <span style={{ color: 'var(--blue)', cursor: 'pointer' }}>Syarat & Ketentuan</span>.
          </p>
          <button type="submit" className="btn btn-primary" disabled={loading || !tsToken || usernameStatus === 'taken'} style={{ width: '100%', padding: 12, fontSize: 15 }}>
            {loading ? 'Membuat Akun...' : 'DAFTAR GRATIS'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
          Sudah punya akun? <Link to="/masuk" style={{ color: 'var(--blue)', fontWeight: 600 }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
