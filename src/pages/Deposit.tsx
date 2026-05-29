import { useState } from 'react'
import { depositApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const METODE = [
  { kode: 'QRIS', nama: 'QRIS', ikon: '📱' },
  { kode: 'GOPAY', nama: 'GoPay', ikon: '💚' },
  { kode: 'OVO', nama: 'OVO', ikon: '💜' },
  { kode: 'DANA', nama: 'Dana', ikon: '💙' },
  { kode: 'SHOPEEPAY', nama: 'ShopeePay', ikon: '🧡' },
  { kode: 'BCA', nama: 'BCA', ikon: '🏦' },
  { kode: 'BRI', nama: 'BRI', ikon: '🏦' },
  { kode: 'BNI', nama: 'BNI', ikon: '🏦' },
  { kode: 'MANDIRI', nama: 'Mandiri', ikon: '🏦' },
  { kode: 'PULSA', nama: 'Pulsa', ikon: '📞' },
]

const NOMINAL_CEPAT = [25000, 50000, 100000, 200000, 500000, 1000000]

export default function Deposit() {
  const { user } = useAuth()
  const [metode, setMetode] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nominal = parseInt(jumlah.replace(/\D/g, ''))
    if (!metode) { toast.error('Pilih metode pembayaran'); return }
    if (!nominal || nominal < 10000) { toast.error('Minimal deposit Rp 10.000'); return }

    setLoading(true)
    try {
      const res = await depositApi.buat(nominal, metode)
      setHasil(res.deposit)
      toast.success('Permintaan deposit berhasil!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat deposit')
    } finally { setLoading(false) }
  }

  const fmt = (val: string) => {
    const n = val.replace(/\D/g, '')
    return n ? parseInt(n).toLocaleString('id-ID') : ''
  }

  if (hasil) return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20 }}>
      <div className="card fade-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 8, color: '#00e676' }}>Deposit Dibuat!</h2>
        <div style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, margin: '16px 0', textAlign: 'left' }}>
          {[['Referensi', hasil.referensi], ['Jumlah', `Rp ${hasil.jumlah.toLocaleString('id-ID')}`], ['Metode', hasil.metode], ['Status', 'Menunggu Konfirmasi']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: 6, padding: 12, fontSize: 13, textAlign: 'left', marginBottom: 16, color: 'var(--gold)' }}>
          📋 {hasil.instruksi}
        </div>
        <button className="btn btn-primary" onClick={() => setHasil(null)} style={{ width: '100%' }}>Buat Deposit Baru</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '32px auto', padding: 20 }}>
      <div className="card fade-in">
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, marginBottom: 6, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DEPOSIT</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Saldo: <strong style={{ color: 'var(--gold)' }}>Rp {(user?.saldo || 0).toLocaleString('id-ID')}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 10, fontWeight: 700 }}>PILIH METODE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {METODE.map(m => (
                <div key={m.kode} onClick={() => setMetode(m.kode)} style={{ background: metode === m.kode ? 'rgba(0,200,255,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${metode === m.kode ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 8, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{m.ikon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: metode === m.kode ? 'var(--blue)' : 'var(--muted)' }}>{m.nama}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 10, fontWeight: 700 }}>PILIH NOMINAL</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {NOMINAL_CEPAT.map(n => (
                <button type="button" key={n} onClick={() => setJumlah(n.toLocaleString('id-ID'))}
                  style={{ background: jumlah === n.toLocaleString('id-ID') ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--border)'}`, color: jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--muted)', padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {n >= 1000000 ? `${n/1000000}Jt` : `${n/1000}K`}
                </button>
              ))}
            </div>
            <input className="input" type="text" placeholder="Atau masukkan nominal manual" value={jumlah} onChange={e => setJumlah(fmt(e.target.value))} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 15 }}>
            {loading ? 'Memproses...' : 'KONFIRMASI DEPOSIT'}
          </button>
        </form>
      </div>
    </div>
  )
}
