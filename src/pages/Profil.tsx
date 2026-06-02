import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Profil() {
  const { user, syncSaldo } = useAuth()
  const [profil, setProfil] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [passForm, setPassForm] = useState({ password_lama: '', password_baru: '', konfirmasi: '' })
  const isMobile = window.innerWidth < 768

  const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

  useEffect(() => { muatProfil(); syncSaldo() }, [])

  async function muatProfil() {
    try {
      const res = await fetch('/user/profil', { headers: authHeader() })
      const data = await res.json()
      if (data.user) setProfil(data.user)
    } catch { }
  }

  async function ubahPassword(e: React.FormEvent) {
    e.preventDefault()
    if (passForm.password_baru !== passForm.konfirmasi) { toast.error('Konfirmasi password tidak cocok'); return }
    if (passForm.password_baru.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setLoading(true)
    try {
      const res = await fetch('/user/ubah-password', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ password_lama: passForm.password_lama, password_baru: passForm.password_baru })
      })
      const data = await res.json()
      if (data.status === 0) toast.error(data.error)
      else { toast.success('Password berhasil diubah!'); setPassForm({ password_lama: '', password_baru: '', konfirmasi: '' }) }
    } catch { toast.error('Gagal ubah password') }
    finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block' as const, marginBottom: 6 }
  const BANK_LIST = ['BCA','BRI','BNI','Mandiri','CIMB Niaga','Permata','Danamon','BTN','BSI','Jenius','SeaBank','GoPay','OVO','Dana']

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>

      {/* Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: '20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, margin: '0 auto 10px', fontFamily: 'var(--display)' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700 }}>{user?.username}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{profil?.email}</div>
        <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', borderRadius: 20, padding: '4px 16px' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 900, color: 'var(--gold)' }}>Rp {(user?.saldo || 0).toLocaleString('id-ID')}</span>
        </div>
        {profil?.referral_code && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            Kode Referral: <strong style={{ color: 'var(--blue)' }}>{profil.referral_code}</strong>
          </div>
        )}
      </div>

      {/* Data Pribadi - read only */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--blue)' }}>📋 Data Pribadi</div>
        {[
          { label: 'Nama Lengkap', value: profil?.nama_lengkap },
          { label: 'No. WhatsApp', value: profil?.no_whatsapp },
          { label: 'Bank', value: profil?.bank },
          { label: 'No. Rekening', value: profil?.no_rekening },
          { label: 'Atas Nama', value: profil?.atas_nama },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: item.value ? 'var(--text)' : 'var(--muted)' }}>{item.value || '-'}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
          Untuk mengubah data pribadi, hubungi CS.
        </div>
      </div>

      {/* Ubah Password */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--pink)' }}>🔑 Ubah Password</div>
        <form onSubmit={ubahPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={labelStyle}>Password Lama</label>
            <input style={inputStyle} type="password" placeholder="Password saat ini" value={passForm.password_lama} onChange={e => setPassForm(f => ({ ...f, password_lama: e.target.value }))} required />
          </div>
          <div><label style={labelStyle}>Password Baru</label>
            <input style={inputStyle} type="password" placeholder="Min 6 karakter" value={passForm.password_baru} onChange={e => setPassForm(f => ({ ...f, password_baru: e.target.value }))} required />
          </div>
          <div><label style={labelStyle}>Konfirmasi Password Baru</label>
            <input style={inputStyle} type="password" placeholder="Ulangi password baru" value={passForm.konfirmasi} onChange={e => setPassForm(f => ({ ...f, konfirmasi: e.target.value }))} required />
            {passForm.konfirmasi && passForm.password_baru !== passForm.konfirmasi && (
              <div style={{ fontSize: 11, color: 'var(--pink)', marginTop: 4 }}>Password tidak cocok</div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 12 }}>
            {loading ? 'Mengubah...' : '🔑 Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
