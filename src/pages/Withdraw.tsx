import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'
import { userApi } from '../lib/api'
import toast from 'react-hot-toast'

const BANK_LIST = [
  'BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga', 'Danamon',
  'Permata', 'BTN', 'Maybank', 'Panin', 'OCBC NISP',
  'BSI', 'Bank Jago', 'Jenius (BTPN)',
  'GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja',
]

const NOMINAL_CEPAT = [50000, 100000, 200000, 500000, 1000000, 5000000]

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)',
  sukses: '#00e676',
  ditolak: 'var(--pink)',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Menunggu',
  sukses: '✅ Sukses',
  ditolak: '❌ Ditolak',
}

export default function Withdraw() {
  const { user, syncSaldo } = useAuth()
  const navigate = useNavigate()
  const { min_withdraw, max_withdraw } = useBrand()
  const [profil, setProfil] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [tab, setTab] = useState<'form' | 'riwayat'>('form')
  const [jumlah, setJumlah] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [turnover, setTurnover] = useState<any>(null)
  const [loadingTurnover, setLoadingTurnover] = useState(false)

  const muatTurnover = async () => {
    setLoadingTurnover(true)
    try {
      const res = await fetch('/user/turnover', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
      const data = await res.json()
      if (data.status === 1) setTurnover(data)
    } catch(e) {}
    setLoadingTurnover(false)
  }

  useEffect(() => {
    muatTurnover()
    syncSaldo()
    userApi.profil().then(res => setProfil(res.pengguna))
    muatRiwayat()
  }, [])

  async function muatRiwayat() {
    setLoadingRiwayat(true)
    try {
      const res = await userApi.withdraw()
      setRiwayat(res.withdrawals || [])
    } catch { } finally { setLoadingRiwayat(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nominal = parseInt(jumlah.replace(/\D/g, ''))
    if (!nominal || nominal < 50000) { toast.error('Minimal withdraw Rp 50.000'); return }
    if (nominal > (user?.saldo || 0)) { toast.error('Saldo tidak mencukupi'); return }

    setLoading(true)
    try {
      await userApi.buatWithdraw({
        jumlah: nominal,
        bank: profil.bank,
        no_rekening: profil.no_rekening,
        atas_nama: profil.atas_nama,
      })
      toast.success('Permintaan withdraw berhasil dikirim!')
      setJumlah('')
      setTab('riwayat')
      muatRiwayat()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim withdraw')
    } finally { setLoading(false) }
  }

  if (!profil) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  if (!profil.profil_lengkap) return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20 }}>
      <div className="card fade-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 8, color: 'var(--pink)' }}>
          Profil Belum Lengkap
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Kamu harus melengkapi data rekening terlebih dahulu sebelum bisa melakukan withdraw.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/profil')} style={{ width: '100%', padding: 12 }}>
          Lengkapi Profil Sekarang
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 20 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['form', 'riwayat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 20px' }}>
            {t === 'form' ? '💸 Withdraw' : '📋 Riwayat'}
          </button>
        ))}
      </div>

      {/* Widget Turnover */}
      {tab === 'form' && turnover && (
        <div className='card' style={{ marginBottom: 16, borderColor: turnover.tercapai ? 'rgba(0,230,118,0.3)' : 'rgba(255,215,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: turnover.tercapai ? '#00e676' : 'var(--gold)' }}>
              {turnover.tercapai ? '✅ Turnover Tercapai!' : '⏳ Progress Turnover'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{turnover.persen}%</div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: turnover.persen + '%', background: turnover.tercapai ? '#00e676' : 'linear-gradient(90deg,var(--gold),var(--pink))', borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Total Deposit', nilai: 'Rp ' + (turnover.total_deposit || 0).toLocaleString('id-ID'), warna: 'var(--blue)' },
              { label: 'Sudah Bet', nilai: 'Rp ' + Math.round(turnover.total_turnover || 0).toLocaleString('id-ID'), warna: '#00e676' },
              { label: 'Sisa Target', nilai: turnover.tercapai ? '✅ Selesai' : 'Rp ' + Math.round(turnover.kurang || 0).toLocaleString('id-ID'), warna: turnover.tercapai ? '#00e676' : 'var(--pink)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.warna, marginBottom: 2 }}>{s.nilai}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {!turnover.tercapai && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
              Selesaikan turnover 1x deposit untuk bisa withdraw
            </div>
          )}
        </div>
      )}

      {tab === 'form' && (
        <div className="card fade-in">
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, marginBottom: 6, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            WITHDRAW
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Saldo: <strong style={{ color: 'var(--gold)' }}>Rp {(user?.saldo || 0).toLocaleString('id-ID')}</strong>
          </p>

          {/* Info rekening */}
          <div style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>REKENING TUJUAN</div>
            {[
              ['Bank/E-Wallet', profil.bank],
              ['No. Rekening', profil.no_rekening],
              ['Atas Nama', profil.atas_nama],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>{l}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 10, fontWeight: 700 }}>PILIH NOMINAL</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                {NOMINAL_CEPAT.map(n => (
                  <button type="button" key={n} onClick={() => setJumlah(n.toLocaleString('id-ID'))}
                    style={{
                      background: jumlah === n.toLocaleString('id-ID') ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--border)'}`,
                      color: jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--muted)',
                      padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}>
                    {n >= 1000000 ? `${n/1000000}Jt` : `${n/1000}K`}
                  </button>
                ))}
              </div>
              <input className="input" type="text" placeholder="Atau masukkan nominal manual"
                value={jumlah} onChange={e => {
                  const n = e.target.value.replace(/\D/g, '')
                  setJumlah(n ? parseInt(n).toLocaleString('id-ID') : '')
                }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                Minimal withdraw: Rp {(min_withdraw || 50000).toLocaleString('id-ID')} • Saldo tersedia: Rp {(user?.saldo || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 15 }}>
              {loading ? 'Memproses...' : 'KIRIM PERMINTAAN WITHDRAW'}
            </button>
          </form>
        </div>
      )}

      {tab === 'riwayat' && (
        <div>
          {loadingRiwayat ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : riwayat.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
              <div>Belum ada riwayat withdraw</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {riwayat.map((w, i) => (
                <div key={w.id} style={{ padding: '14px 16px', borderBottom: i < riwayat.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--pink)' }}>
                      -Rp {w.amount.toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[w.status] }}>
                      {STATUS_LABEL[w.status]}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {w.bank} • {w.no_rekening} • {w.atas_nama}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(w.created_at).toLocaleString('id-ID')}
                  </div>
                  {w.catatan_admin && (
                    <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 6, background: 'rgba(255,215,0,0.07)', padding: '4px 8px', borderRadius: 4 }}>
                      📝 {w.catatan_admin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
