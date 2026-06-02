import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

const BANK_LIST = ['BCA','BRI','BNI','Mandiri','CIMB Niaga','Permata','Danamon','BTN','BSI','Jenius','SeaBank','GoPay','OVO','Dana']

export default function Register() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const refCode = new URLSearchParams(window.location.search).get('ref') || ''
  const [form, setForm] = useState({
    username: '', email: '', password: '', konfirmasi: '',
    nama_lengkap: '', no_whatsapp: '', bank: '', no_rekening: '', atas_nama: '',
    referral: '',
  })
  const [loading, setLoading] = useState(false)
  const [tsToken, setTsToken] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'ok'|'taken'>('idle')
  const tsRef = useRef<HTMLDivElement>(null)
  const checkRef = useRef<any>(null)
  const tsRendered = useRef(false)
  const isMobile = window.innerWidth < 768

  useEffect(() => { if (isLoggedIn) navigate('/') }, [isLoggedIn])

  useEffect(() => {
    const t = setInterval(() => {
      const el = document.getElementById('ts-register')
      if (!el || tsRendered.current) return
      if (!window.turnstile) return
      clearInterval(t)
      tsRendered.current = true
      window.turnstile.render(el, {
        sitekey: '0x4AAAAAAABkMYinukE8nsd9',
        callback: (token: string) => setTsToken(token),
        'expired-callback': () => setTsToken(''),
        theme: 'dark', size: 'normal',
      })
    }, 100)
    return () => clearInterval(t)
  }, [])

  const cekUsername = (val: string) => {
    setUsernameStatus('checking')
    clearTimeout(checkRef.current)
    checkRef.current = setTimeout(async () => {
      if (val.length < 4) { setUsernameStatus('idle'); return }
      try {
        const res = await fetch(`/auth/cek-username?username=${val}`)
        const data = await res.json()
        setUsernameStatus(data.tersedia ? 'ok' : 'taken')
      } catch { setUsernameStatus('idle') }
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.konfirmasi) { toast.error('Password tidak cocok'); return }
    if (!tsToken) { toast.error('Selesaikan verifikasi keamanan'); return }
    if (usernameStatus === 'taken') { toast.error('Username sudah digunakan'); return }
    if (!form.bank) { toast.error('Pilih bank terlebih dahulu'); return }

    setLoading(true)
    try {
      const res = await authApi.register({
        username: form.username, email: form.email,
        password: form.password, turnstile_token: tsToken,
        referral_code: form.referral || undefined,
        ref: refCode,
        nama_lengkap: form.nama_lengkap,
        no_whatsapp: form.no_whatsapp,
        bank: form.bank,
        no_rekening: form.no_rekening,
        atas_nama: form.atas_nama,
      })
      login(res.token, { ...res.user, saldo: res.user.saldo || 0 })
      toast.success('Akun berhasil dibuat!')
      navigate('/')
    } catch(err: any) {
      toast.error(err.message || 'Gagal membuat akun')
    } finally { setLoading(false) }
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 11, color: 'var(--muted)', display: 'block' as const, marginBottom: 5, fontWeight: 600 as const }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '10px 10px 80px' : '20px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>DAFTAR AKUN</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sudah punya akun? <Link to="/masuk" style={{ color: 'var(--blue)' }}>Masuk di sini</Link></p>
          {refCode && <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', borderRadius: 6, padding: '4px 10px', color: '#00e676', display: 'inline-block' }}>🎁 Kamu akan mendapat Freebet!</div>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Section Akun */}
          <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, letterSpacing: 1 }}>📋 DATA AKUN</div>

          <div>
            <label style={lbl}>Username *</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type="text" placeholder="Min 4 karakter, huruf/angka/underscore"
                value={form.username} required
                onChange={e => {
                  const v = e.target.value.replace(/[^a-zA-Z0-9_]/g,'')
                  setForm(f => ({ ...f, username: v }))
                  if (v.length >= 4) cekUsername(v)
                  else setUsernameStatus('idle')
                }} />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>
                {usernameStatus === 'checking' ? '⏳' : usernameStatus === 'ok' ? '✅' : usernameStatus === 'taken' ? '❌' : ''}
              </div>
            </div>
            {usernameStatus === 'taken' && <div style={{ fontSize: 10, color: 'var(--pink)', marginTop: 3 }}>Username sudah digunakan</div>}
          </div>

          <div>
            <label style={lbl}>Email *</label>
            <input style={inp} type="email" placeholder="email@example.com" value={form.email} required onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Password *</label>
              <input style={inp} type="password" placeholder="Min 6 karakter" value={form.password} required onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Konfirmasi Password *</label>
              <input style={{ ...inp, borderColor: form.konfirmasi && form.password !== form.konfirmasi ? 'var(--pink)' : 'var(--border)' }}
                type="password" placeholder="Ulangi password" value={form.konfirmasi} required onChange={e => setForm(f => ({ ...f, konfirmasi: e.target.value }))} />
            </div>
          </div>

          {/* Section Pribadi */}
          <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>👤 DATA PRIBADI</div>

          <div>
            <label style={lbl}>Nama Lengkap *</label>
            <input style={inp} type="text" placeholder="Nama lengkap" value={form.nama_lengkap} required onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))} />
          </div>

          <div>
            <label style={lbl}>No. WhatsApp *</label>
            <input style={inp} type="tel" placeholder="08xxxxxxxxxx" value={form.no_whatsapp} required onChange={e => setForm(f => ({ ...f, no_whatsapp: e.target.value }))} />
          </div>

          {/* Section Rekening */}
          <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>🏦 DATA REKENING</div>

          <div>
            <label style={lbl}>Bank *</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.bank} required onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}>
              <option value="" style={{ background: '#111130' }}>Pilih Bank</option>
              {BANK_LIST.map(b => <option key={b} value={b} style={{ background: '#111130' }}>{b}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>No. Rekening *</label>
              <input style={inp} type="text" placeholder="Nomor rekening" value={form.no_rekening} required onChange={e => setForm(f => ({ ...f, no_rekening: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Atas Nama *</label>
              <input style={inp} type="text" placeholder="Nama pemilik" value={form.atas_nama} required onChange={e => setForm(f => ({ ...f, atas_nama: e.target.value }))} />
            </div>
          </div>

          {/* Referral */}
          <div>
            <label style={lbl}>Kode Referral (opsional)</label>
            <input style={inp} type="text" placeholder="Masukkan kode referral jika ada" value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value.toUpperCase() }))} />
          </div>

          {/* Turnstile */}
          <div id="ts-register" style={{ minHeight: 65, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 14, marginTop: 4 }}>
            {loading ? 'Mendaftar...' : '🚀 Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  )
}
