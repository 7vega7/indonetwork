import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'
import { depositApi, userApi } from '../lib/api'
import toast from 'react-hot-toast'

const METODE_LIST = [
  { kode: 'QRIS', label: 'QRIS', icon: '📱', grup: 'E-Money' },
  { kode: 'DANA', label: 'DANA', icon: '💙', grup: 'E-Money' },
  { kode: 'BRI', label: 'BRI', icon: '🔵', grup: 'VA Transfer' },
  { kode: 'BNI', label: 'BNI', icon: '🟠', grup: 'VA Transfer' },
  { kode: 'PERMATA', label: 'Permata', icon: '💎', grup: 'VA Transfer' },
  { kode: 'MANDIRI', label: 'Mandiri', icon: '🟡', grup: 'VA Transfer' },
  { kode: 'CIMB', label: 'CIMB', icon: '🔴', grup: 'VA Transfer' },
]

const NOMINAL_CEPAT = [20000, 50000, 100000, 200000, 500000, 1000000]

const GRUP_URUTAN = ['E-Money', 'VA Transfer']

export default function Deposit() {
  const { user, syncSaldo } = useAuth()
  const { min_deposit } = useBrand()
  const [tab, setTab] = useState<'form' | 'pending' | 'riwayat'>('form')
  const [metode, setMetode] = useState('QRIS')
  const [jumlah, setJumlah] = useState('')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [telepon, setTelepon] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingDeposit, setPendingDeposit] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [countdown, setCountdown] = useState(0)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const countdownRef = useRef<any>(null)
  const statusCheckRef = useRef<any>(null)
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    muatRiwayat()
    cekPendingDeposit()
  }, [])

  useEffect(() => {
    if (pendingDeposit) {
      setTab('pending')
      startCountdown()
      startStatusCheck()
    }
    return () => {
      clearInterval(countdownRef.current)
      clearInterval(statusCheckRef.current)
    }
  }, [pendingDeposit])

  async function muatRiwayat() {
    try {
      const res = await fetch('/user/deposit', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      setRiwayat(data.deposits || [])
    } catch { }
  }

  async function cekPendingDeposit() {
    try {
      const res = await fetch('/user/deposit?status=pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (data.deposits?.length > 0) {
        const dep = data.deposits[0]
        const expiredAt = new Date(dep.expired_at)
        if (new Date() < expiredAt) {
          setPendingDeposit(dep)
        }
      }
    } catch { }
  }

  function startCountdown() {
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      if (!pendingDeposit?.expired_at) return
      const sisa = Math.max(0, new Date(pendingDeposit.expired_at).getTime() - Date.now())
      setCountdown(sisa)
      if (sisa === 0) {
        clearInterval(countdownRef.current)
        setPendingDeposit(null)
        setTab('form')
        toast.error('Deposit expired')
      }
    }, 1000)
  }

  function startStatusCheck() {
    clearInterval(statusCheckRef.current)
    statusCheckRef.current = setInterval(async () => {
      if (!pendingDeposit?.id) return
      setCheckingStatus(true)
      try {
        const res = await fetch(`/user/deposit?id=${pendingDeposit.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        const dep = data.deposits?.[0]
        if (dep?.status === 'success') {
          clearInterval(statusCheckRef.current)
          setPendingDeposit(null)
          syncSaldo()
          toast.success('Deposit berhasil dikonfirmasi! 🎉')
          setTab('riwayat')
          muatRiwayat()
        }
      } catch { }
      finally { setCheckingStatus(false) }
    }, 10000) // cek setiap 10 detik
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nominal = parseInt(jumlah.replace(/\D/g, ''))
    if (!nominal || nominal < 10000) { toast.error('Minimal deposit Rp 10.000'); return }
    if (!metode) { toast.error('Pilih metode pembayaran'); return }

    setLoading(true)
    try {
      const res = await depositApi.buat(nominal, metode, nama, email, telepon)
      toast.success('Deposit berhasil dibuat!')
      setPendingDeposit({
        id: res.deposit_id,
        amount: nominal,
        method: metode,
        reference: res.reference,
        payment_url: res.payment_url,
        pay_data: res.pay_data,
        plat_order_num: res.plat_order_num,
        expired_at: res.expired_at,
        mode: res.mode,
        status: 'pending',
      })
      setJumlah('')
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat deposit')
    } finally { setLoading(false) }
  }

  const formatCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const STATUS_COLOR: Record<string, string> = {
    pending: 'var(--gold)', success: '#00e676', failed: 'var(--pink)',
  }
  const STATUS_LABEL: Record<string, string> = {
    pending: '⏳ Menunggu', success: '✅ Sukses', failed: '❌ Gagal',
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '10px 10px 80px' : '24px 20px' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { kode: 'form', label: '💰 Deposit' },
          { kode: 'pending', label: `⏳ Pending${pendingDeposit ? ' 🔴' : ''}` },
          { kode: 'riwayat', label: '📋 Riwayat' },
        ].map(t => (
          <button key={t.kode} onClick={() => setTab(t.kode as any)}
            className={`btn ${tab === t.kode ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Deposit */}
      {tab === 'form' && (
        <div className="card fade-in">
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, marginBottom: 6, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            DEPOSIT
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Saldo: <strong style={{ color: 'var(--gold)' }}>Rp {(user?.saldo || 0).toLocaleString('id-ID')}</strong>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Pilih Metode */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 10, fontWeight: 700 }}>METODE PEMBAYARAN</label>
              {GRUP_URUTAN.map(grup => {
                const items = METODE_LIST.filter(m => m.grup === grup)
                if (!items.length) return null
                return (
                  <div key={grup} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{grup.toUpperCase()}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                      {items.map(m => (
                        <button type="button" key={m.kode} onClick={() => setMetode(m.kode)}
                          style={{
                            background: metode === m.kode ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${metode === m.kode ? 'var(--pink)' : 'var(--border)'}`,
                            color: metode === m.kode ? 'var(--pink)' : 'var(--muted)',
                            padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, textAlign: 'center',
                            transition: 'all 0.2s',
                          }}>
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Nominal */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 10, fontWeight: 700 }}>NOMINAL</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                {NOMINAL_CEPAT.map(n => (
                  <button type="button" key={n} onClick={() => setJumlah(n.toLocaleString('id-ID'))}
                    style={{
                      background: jumlah === n.toLocaleString('id-ID') ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--border)'}`,
                      color: jumlah === n.toLocaleString('id-ID') ? 'var(--pink)' : 'var(--muted)',
                      padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}>
                    {n >= 1000000 ? `${n/1000000}Jt` : `${n/1000}K`}
                  </button>
                ))}
              </div>
              <input className="input" type="text" placeholder="Atau masukkan nominal lain"
                value={jumlah} onChange={e => {
                  const n = e.target.value.replace(/\D/g, '')
                  setJumlah(n ? parseInt(n).toLocaleString('id-ID') : '')
                }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Minimal deposit: Rp {(min_deposit || 10000).toLocaleString('id-ID')}</div>
            </div>

            {/* Info tambahan */}
            <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 10 }}>INFO PEMBAYARAN (opsional)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input" type="text" placeholder="Nama lengkap" value={nama} onChange={e => setNama(e.target.value)} style={{ padding: '8px 12px', fontSize: 13 }} />
                <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '8px 12px', fontSize: 13 }} />
                <input className="input" type="tel" placeholder="No. telepon" value={telepon} onChange={e => setTelepon(e.target.value)} style={{ padding: '8px 12px', fontSize: 13 }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 15 }}>
              {loading ? 'Memproses...' : 'BUAT DEPOSIT'}
            </button>
          </form>
        </div>
      )}

      {/* Pending Deposit */}
      {tab === 'pending' && (
        <div className="fade-in">
          {!pendingDeposit ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div>Tidak ada deposit pending</div>
              <button className="btn btn-primary" onClick={() => setTab('form')} style={{ marginTop: 16 }}>Buat Deposit Baru</button>
            </div>
          ) : (
            <div className="card">
              {/* Status header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>⏳ Menunggu Pembayaran</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {checkingStatus && <div className="spinner" style={{ width: 14, height: 14 }} />}
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Auto cek</span>
                </div>
              </div>

              {/* Countdown */}
              {pendingDeposit.expired_at && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Berakhir dalam</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 900, color: countdown < 300000 ? 'var(--pink)' : 'var(--gold)' }}>
                    {formatCountdown(countdown)}
                  </div>
                </div>
              )}

              {/* Detail */}
              <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                {[
                  ['Jumlah', `Rp ${pendingDeposit.amount?.toLocaleString('id-ID')}`],
                  ['Metode', pendingDeposit.method],
                  ['Reference', pendingDeposit.reference || pendingDeposit.plat_order_num],
                  ['Mode', pendingDeposit.mode === 'auto' ? '🤖 Otomatis' : '👤 Manual'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Payment URL */}
              {pendingDeposit.payment_url && (
                <a href={pendingDeposit.payment_url} target="_blank" rel="noreferrer"
                  className="btn btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%', padding: 13, fontSize: 14, marginBottom: 10, textDecoration: 'none' }}>
                  💳 Bayar Sekarang
                </a>
              )}

              {/* Pay Data manual */}
              {pendingDeposit.pay_data && !pendingDeposit.payment_url && (
                <div style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>INFO PEMBAYARAN</div>
                  {Object.entries(
                    typeof pendingDeposit.pay_data === 'string'
                      ? JSON.parse(pendingDeposit.pay_data)
                      : pendingDeposit.pay_data
                  ).map(([k, v]: any) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>{k}</span>
                      <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {pendingDeposit.mode === 'manual' && (
                <div style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                  📌 Transfer sesuai jumlah dan konfirmasi ke admin via WhatsApp/Telegram dengan menyertakan bukti transfer dan reference: <strong style={{ color: 'var(--blue)' }}>{pendingDeposit.reference}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Riwayat */}
      {tab === 'riwayat' && (
        <div className="fade-in">
          {riwayat.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
              <div>Belum ada riwayat deposit</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {riwayat.map((d, i) => (
                <div key={d.id} style={{ padding: '12px 16px', borderBottom: i < riwayat.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#00e676' }}>+Rp {d.amount.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.method} • {d.reference}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[d.status] }}>{STATUS_LABEL[d.status]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
