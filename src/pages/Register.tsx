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
  const [step, setStep] = useState(1)
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
  const isMobile = window.innerWidth < 768

  useEffect(() => { if (isLoggedIn) navigate('/') }, [isLoggedIn])

  useEffect(() => {
    if (step !== 2) return
    if (!tsRef.current) return
    // Hapus widget lama jika ada
    if (tsRef.current.innerHTML) tsRef.current.innerHTML = ''
    if (!window.turnstile) return
    window.turnstile.render(tsRef.current, {
      sitekey: '0x4AAAAAAABkMYinukE8nsd9',
      callback: (token: string) => setTsToken(token),
      'expired-callback': () => setTsToken(''),
      theme: 'dark', size: 'normal',
    })
  }, [step])

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

    setLoading(true)
    try {
      const res = await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        turnstile_token: tsToken,
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

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block' as const, marginBottom: 6 }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>DAFTAR AKUN</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sudah punya akun? <Link to="/masuk" style={{ color: 'var(--blue)' }}>Masuk di sini</Link></p>
          {refCode && <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', borderRadius: 6, padding: '4px 10px', color: '#00e676', display: 'inline-block' }}>🎁 Kamu akan mendapat Freebet!</div>}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'var(--blue)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Step 1 - Akun */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 }}>📋 Data Akun</div>
              <div>
                <label style={labelStyle}>Username *</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 36 }} type="text" placeholder="Min 4 karakter"
                    value={form.username} onChange={e => { const v = e.target.value.replace(/[^a-zA-Z0-9_]/g,''); setForm(f => ({ ...f, username: v })); if (v.length >= 4) cekUsername(v) }} />
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                    {usernameStatus === 'checking' ? '⏳' : usernameStatus === 'ok' ? '✅' : usernameStatus === 'taken' ? '❌' : ''}
                  </div>
                </div>
                {usernameStatus === 'taken' && <div style={{ fontSize: 11, color: 'var(--pink)', marginTop: 4 }}>Username sudah digunakan</div>}
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <input style={inputStyle} type="password" placeholder="Min 6 karakter" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Konfirmasi Password *</label>
                <input style={inputStyle} type="password" placeholder="Ulangi password" value={form.konfirmasi} onChange={e => setForm(f => ({ ...f, konfirmasi: e.target.value }))} required />
                {form.konfirmasi && form.password !== form.konfirmasi && <div style={{ fontSize: 11, color: 'var(--pink)', marginTop: 4 }}>Password tidak cocok</div>}
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%', padding: 13 }}
                onClick={() => {
                  if (!form.username || form.username.length < 4) { toast.error('Username minimal 4 karakter'); return }
                  if (usernameStatus === 'taken') { toast.error('Username sudah digunakan'); return }
                  if (!form.email) { toast.error('Email wajib diisi'); return }
                  if (!form.password || form.password.length < 6) { toast.error('Password minimal 6 karakter'); return }
                  if (form.password !== form.konfirmasi) { toast.error('Password tidak cocok'); return }
                  setStep(2)
                }}>
                Lanjut →
              </button>
            </>
          )}

          {/* Step 2 - Data Pribadi & Rekening */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 }}>👤 Data Pribadi & Rekening</div>
              <div>
                <label style={labelStyle}>Nama Lengkap *</label>
                <input style={inputStyle} type="text" placeholder="Sesuai KTP/rekening" value={form.nama_lengkap} onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>No. WhatsApp *</label>
                <input style={inputStyle} type="tel" placeholder="08xxxxxxxxxx" value={form.no_whatsapp} onChange={e => setForm(f => ({ ...f, no_whatsapp: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Bank *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} required>
                  <option value="" style={{ background: '#111130' }}>Pilih Bank</option>
                  {BANK_LIST.map(b => <option key={b} value={b} style={{ background: '#111130' }}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>No. Rekening *</label>
                <input style={inputStyle} type="text" placeholder="Nomor rekening" value={form.no_rekening} onChange={e => setForm(f => ({ ...f, no_rekening: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Atas Nama *</label>
                <input style={inputStyle} type="text" placeholder="Nama pemilik rekening" value={form.atas_nama} onChange={e => setForm(f => ({ ...f, atas_nama: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Kode Referral (opsional)</label>
                <input style={inputStyle} type="text" placeholder="Masukkan kode referral jika ada" value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value.toUpperCase() }))} />
              </div>

              <div ref={tsRef} style={{ borderRadius: 6, overflow: 'hidden' }} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: 13 }} onClick={() => setStep(1)}>← Kembali</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, padding: 13 }}>
                  {loading ? 'Mendaftar...' : '🚀 Daftar Sekarang'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
