import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Profil() {
  const { user, syncSaldo } = useAuth()
  const [tab, setTab] = useState<'info' | 'password' | 'rekening'>('info')
  const [loading, setLoading] = useState(false)
  const [profil, setProfil] = useState<any>(null)
  const [form, setForm] = useState({ nama_lengkap: '', no_telepon: '', bank: '', no_rekening: '', atas_nama: '' })
  const [passForm, setPassForm] = useState({ password_lama: '', password_baru: '', konfirmasi: '' })
  const isMobile = window.innerWidth < 768

  const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

  useEffect(() => {
    muatProfil()
    syncSaldo()
  }, [])

  async function muatProfil() {
    try {
      const res = await fetch('/user/profil', { headers: authHeader() })
      const data = await res.json()
      if (data.user) {
        setProfil(data.user)
        setForm({
          nama_lengkap: data.user.nama_lengkap || '',
          no_telepon: data.user.no_telepon || '',
          bank: data.user.bank || '',
          no_rekening: data.user.no_rekening || '',
          atas_nama: data.user.atas_nama || '',
        })
      }
    } catch { }
  }

  async function simpanProfil(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/user/ubah-profil', { method: 'POST', headers: authHeader(), body: JSON.stringify(form) })
      const data = await res.json()
      if (data.status === 0) toast.error(data.error)
      else { toast.success('Profil berhasil diupdate!'); muatProfil() }
    } catch { toast.error('Gagal update profil') }
    finally { setLoading(false) }
  }

  async function ubahPassword(e: React.FormEvent) {
    e.preventDefault()
    if (passForm.password_baru !== passForm.konfirmasi) { toast.error('Konfirmasi password tidak cocok'); return }
    if (passForm.password_baru.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setLoading(true)
    try {
      const res = await fetch('/user/ubah-password', { method: 'POST', headers: authHeader(), body: JSON.stringify({ password_lama: passForm.password_lama, password_baru: passForm.password_baru }) })
      const data = await res.json()
      if (data.status === 0) toast.error(data.error)
      else { toast.success('Password berhasil diubah!'); setPassForm({ password_lama: '', password_baru: '', konfirmasi: '' }) }
    } catch { toast.error('Gagal ubah password') }
    finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block' as const, marginBottom: 6 }

  const BANK_LIST = ['BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga', 'Permata', 'Danamon', 'BTN', 'BSI', 'Jenius', 'SeaBank', 'GoPay', 'OVO', 'Dana']

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>

      {/* Header profil */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 20, padding: '24px 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, margin: '0 auto 12px', fontFamily: 'var(--display)' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>{user?.username}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{profil?.email}</div>
        <div style={{ marginTop: 12, display: 'inline-block', background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', borderRadius: 20, padding: '4px 14px' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>Rp {(user?.saldo || 0).toLocaleString('id-ID')}</span>
        </div>
        {profil?.referral_code && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
            Kode Referral: <strong style={{ color: 'var(--blue)' }}>{profil.referral_code}</strong>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { kode: 'info', label: '👤 Info' },
          { kode: 'rekening', label: '🏦 Rekening' },
          { kode: 'password', label: '🔑 Password' },
        ].map(t => (
          <button key={t.kode} onClick={() => setTab(t.kode as any)}
            className={`btn ${tab === t.kode ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '8px', fontSize: 12 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Info */}
      {tab === 'info' && (
        <div className="card fade-in">
          <form onSubmit={simpanProfil} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Nama Lengkap</label>
              <input style={inputStyle} placeholder="Nama sesuai rekening" value={form.nama_lengkap} onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))} />
            </div>
            <div><label style={labelStyle}>No. Telepon</label>
              <input style={inputStyle} type="tel" placeholder="08xxx" value={form.no_telepon} onChange={e => setForm(f => ({ ...f, no_telepon: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 12 }}>
              {loading ? 'Menyimpan...' : '💾 Simpan Info'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Rekening */}
      {tab === 'rekening' && (
        <div className="card fade-in">
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Data rekening untuk proses withdraw</div>
          <form onSubmit={simpanProfil} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Bank</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}>
                <option value="" style={{ background: '#111130' }}>Pilih Bank</option>
                {BANK_LIST.map(b => <option key={b} value={b} style={{ background: '#111130' }}>{b}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>No. Rekening</label>
              <input style={inputStyle} type="text" placeholder="Nomor rekening" value={form.no_rekening} onChange={e => setForm(f => ({ ...f, no_rekening: e.target.value }))} />
            </div>
            <div><label style={labelStyle}>Atas Nama</label>
              <input style={inputStyle} type="text" placeholder="Nama pemilik rekening" value={form.atas_nama} onChange={e => setForm(f => ({ ...f, atas_nama: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 12 }}>
              {loading ? 'Menyimpan...' : '💾 Simpan Rekening'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Password */}
      {tab === 'password' && (
        <div className="card fade-in">
          <form onSubmit={ubahPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={labelStyle}>Password Lama</label>
              <input style={inputStyle} type="password" placeholder="Password saat ini" value={passForm.password_lama} onChange={e => setPassForm(f => ({ ...f, password_lama: e.target.value }))} />
            </div>
            <div><label style={labelStyle}>Password Baru</label>
              <input style={inputStyle} type="password" placeholder="Min 6 karakter" value={passForm.password_baru} onChange={e => setPassForm(f => ({ ...f, password_baru: e.target.value }))} />
            </div>
            <div><label style={labelStyle}>Konfirmasi Password Baru</label>
              <input style={inputStyle} type="password" placeholder="Ulangi password baru" value={passForm.konfirmasi} onChange={e => setPassForm(f => ({ ...f, konfirmasi: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 12 }}>
              {loading ? 'Mengubah...' : '🔑 Ubah Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
