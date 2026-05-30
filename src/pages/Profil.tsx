import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { userApi } from '../lib/api'
import toast from 'react-hot-toast'

const BANK_LIST = [
  '-- Pilih Bank/E-Wallet --',
  'BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga', 'Danamon',
  'Permata', 'BTN', 'Maybank', 'Panin', 'OCBC NISP',
  'BSI', 'Bank Jago', 'Jenius (BTPN)',
  '--- E-Wallet ---',
  'GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja',
]

export default function Profil() {
  const { updateSaldo } = useAuth()
  const [profil, setProfil] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nama_lengkap: '', no_telepon: '', bank: '', no_rekening: '', atas_nama: '' })

  useEffect(() => {
    userApi.profil().then(res => {
      setProfil(res.pengguna)
      updateSaldo(res.pengguna.balance)
      setForm({
        nama_lengkap: res.pengguna.nama_lengkap || '',
        no_telepon: res.pengguna.no_telepon || '',
        bank: res.pengguna.bank || '',
        no_rekening: res.pengguna.no_rekening || '',
        atas_nama: res.pengguna.atas_nama || '',
      })
    }).catch(() => toast.error('Gagal memuat profil'))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama_lengkap || !form.no_telepon || !form.bank || !form.no_rekening || !form.atas_nama) {
      toast.error('Semua kolom wajib diisi'); return
    }
    if (form.bank === '-- Pilih Bank/E-Wallet --' || form.bank === '--- E-Wallet ---') {
      toast.error('Pilih bank/e-wallet yang valid'); return
    }
    setLoading(true)
    try {
      await userApi.updateProfil(form)
      toast.success('Profil berhasil diperbarui')
      setEditMode(false)
      const res = await userApi.profil()
      setProfil(res.pengguna)
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui profil')
    } finally { setLoading(false) }
  }

  if (!profil) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 640, margin: '32px auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Info Akun */}
      <div className="card fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900 }}>
            {profil.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>{profil.username}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{profil.email}</div>
            <div style={{ fontSize: 11, color: profil.role === 'admin' ? 'var(--gold)' : 'var(--blue)', marginTop: 2, fontWeight: 700 }}>
              {profil.role === 'admin' ? '👑 ADMIN' : '👤 MEMBER'}
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.1),rgba(123,47,255,0.1))', border: '1px solid var(--border)', borderRadius: 8, padding: 16, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>SALDO</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
            Rp {(profil.balance || 0).toLocaleString('id-ID')}
          </div>
        </div>

        {/* Status Profil */}
        <div style={{
          background: profil.profil_lengkap ? 'rgba(0,230,118,0.1)' : 'rgba(255,45,120,0.1)',
          border: `1px solid ${profil.profil_lengkap ? '#00e676' : 'var(--pink)'}`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>{profil.profil_lengkap ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontWeight: 700, color: profil.profil_lengkap ? '#00e676' : 'var(--pink)' }}>
              {profil.profil_lengkap ? 'Profil Lengkap' : 'Profil Belum Lengkap'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {profil.profil_lengkap ? 'Kamu bisa melakukan withdraw' : 'Lengkapi profil untuk bisa withdraw'}
            </div>
          </div>
        </div>

        {[
          ['Kode Referral', profil.referral_code || '-'],
          ['Bergabung', new Date(profil.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })],
          ['Login Terakhir', profil.last_login ? new Date(profil.last_login).toLocaleString('id-ID') : '-'],
        ].map(([label, nilai]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: label === 'Kode Referral' ? 'var(--blue)' : undefined }}>{nilai}</span>
          </div>
        ))}
      </div>

      {/* Form Profil */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700 }}>DATA REKENING</div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn btn-outline" style={{ padding: '6px 16px', fontSize: 12 }}>
              ✏️ Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
              <input className="input" type="text" placeholder="Sesuai KTP" value={form.nama_lengkap} onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>No. Telepon</label>
              <input className="input" type="tel" placeholder="08xxxxxxxxxx" value={form.no_telepon} onChange={e => setForm(f => ({ ...f, no_telepon: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Bank / E-Wallet</label>
              <select className="input" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                {BANK_LIST.map(b => (
                  <option key={b} value={b} disabled={b.startsWith('--')} style={{ background: '#111130' }}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>No. Rekening / No. Akun</label>
              <input className="input" type="text" placeholder="Nomor rekening atau akun e-wallet" value={form.no_rekening} onChange={e => setForm(f => ({ ...f, no_rekening: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Atas Nama</label>
              <input className="input" type="text" placeholder="Nama pemilik rekening" value={form.atas_nama} onChange={e => setForm(f => ({ ...f, atas_nama: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: 12 }}>
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)} style={{ padding: '12px 20px' }}>
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div>
            {[
              ['Nama Lengkap', profil.nama_lengkap || '-'],
              ['No. Telepon', profil.no_telepon || '-'],
              ['Bank / E-Wallet', profil.bank || '-'],
              ['No. Rekening', profil.no_rekening || '-'],
              ['Atas Nama', profil.atas_nama || '-'],
            ].map(([label, nilai]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: nilai === '-' ? 'var(--pink)' : 'var(--text)' }}>{nilai}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
