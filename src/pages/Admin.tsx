import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../lib/api'
import toast from 'react-hot-toast'

const TAB = [
  { kode: 'dashboard', label: '📊 Dashboard' },
  { kode: 'deposit', label: '💰 Deposit' },
  { kode: 'withdraw', label: '💸 Withdraw' },
  { kode: 'users', label: '👥 Users' },
]

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)',
  success: '#00e676',
  sukses: '#00e676',
  failed: 'var(--pink)',
  ditolak: 'var(--pink)',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending',
  success: '✅ Sukses',
  sukses: '✅ Sukses',
  failed: '❌ Gagal',
  ditolak: '❌ Ditolak',
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cari, setCari] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [modalUser, setModalUser] = useState<any>(null)
  const [tambahSaldo, setTambahSaldo] = useState('')
  const [keteranganSaldo, setKeteranganSaldo] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    muatStats()
  }, [])

  useEffect(() => {
    if (tab === 'deposit') muatDeposit()
    if (tab === 'withdraw') muatWithdraw()
    if (tab === 'users') muatUsers()
  }, [tab, statusFilter])

  async function muatStats() {
    try {
      const res = await fetch('/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const data = await res.json()
      setStats(data.stats)
    } catch { }
  }

  async function muatDeposit() {
    setLoading(true)
    try {
      const res = await adminApi.depositList(statusFilter)
      setDeposits(res.deposits || [])
    } catch { toast.error('Gagal memuat deposit') }
    finally { setLoading(false) }
  }

  async function muatWithdraw() {
    setLoading(true)
    try {
      const res = await adminApi.withdrawList(statusFilter)
      setWithdrawals(res.withdrawals || [])
    } catch { toast.error('Gagal memuat withdraw') }
    finally { setLoading(false) }
  }

  async function muatUsers() {
    setLoading(true)
    try {
      const res = await fetch(`/admin/users?cari=${cari}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const data = await res.json()
      setUsers(data.users || [])
    } catch { toast.error('Gagal memuat users') }
    finally { setLoading(false) }
  }

  async function konfirmasiDeposit(id: string) {
    try {
      await adminApi.konfirmasiDeposit(id)
      toast.success('Deposit dikonfirmasi!')
      muatDeposit()
      muatStats()
    } catch (e: any) { toast.error(e.message) }
  }

  async function tolakDeposit(id: string) {
    try {
      const res = await fetch('/admin/deposit/tolak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ deposit_id: id }),
      })
      const data = await res.json()
      if (data.status === 0) throw new Error(data.error)
      toast.success('Deposit ditolak')
      muatDeposit()
    } catch (e: any) { toast.error(e.message) }
  }

  async function prosesWithdraw(id: string, aksi: 'sukses' | 'ditolak', catatan?: string) {
    try {
      await adminApi.prosesWithdraw({ withdrawal_id: id, aksi, catatan_admin: catatan })
      toast.success(`Withdraw ${aksi}!`)
      muatWithdraw()
      muatStats()
    } catch (e: any) { toast.error(e.message) }
  }

  async function aksiBulk(aksi: string, userId: string) {
    try {
      const res = await fetch('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ aksi, user_id: userId }),
      })
      const data = await res.json()
      if (data.status === 0) throw new Error(data.error)
      toast.success(data.pesan)
      muatUsers()
    } catch (e: any) { toast.error(e.message) }
  }

  async function handleTambahSaldo() {
    const jumlah = parseInt(tambahSaldo.replace(/\D/g, ''))
    if (!jumlah || jumlah <= 0) { toast.error('Jumlah tidak valid'); return }
    try {
      const res = await fetch('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ aksi: 'tambah_saldo', user_id: modalUser.id, jumlah, keterangan: keteranganSaldo }),
      })
      const data = await res.json()
      if (data.status === 0) throw new Error(data.error)
      toast.success('Saldo berhasil ditambahkan!')
      setModalUser(null)
      setTambahSaldo('')
      setKeteranganSaldo('')
      muatUsers()
    } catch (e: any) { toast.error(e.message) }
  }

  const isMobile = window.innerWidth < 768

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 8px' : 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 16 : 20, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          👑 ADMIN PANEL
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TAB.map(t => (
          <button key={t.kode} onClick={() => setTab(t.kode)}
            style={{ padding: isMobile ? '7px 12px' : '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap', flexShrink: 0, background: tab === t.kode ? 'linear-gradient(135deg,#ffd700,#ff9500)' : 'var(--bg2)', border: `1px solid ${tab === t.kode ? 'var(--gold)' : 'var(--border)'}`, color: tab === t.kode ? '#000' : 'var(--muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total User', nilai: stats?.total_user ?? '-', ikon: '👥', warna: 'var(--blue)' },
              { label: 'Deposit Pending', nilai: stats?.deposit_pending ?? '-', ikon: '💰', warna: 'var(--gold)' },
              { label: 'Withdraw Pending', nilai: stats?.withdraw_pending ?? '-', ikon: '💸', warna: '#ff9500' },
              { label: 'Total Saldo User', nilai: stats ? `Rp ${Math.floor(stats.total_saldo_user / 1000)}K` : '-', ikon: '💎', warna: '#00e676' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', borderColor: `${s.warna}40` }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.ikon}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.warna }}>{s.nilai}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>⚡ Aksi Cepat</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => setTab('deposit')} style={{ width: '100%' }}>💰 Lihat Deposit Pending ({stats?.deposit_pending || 0})</button>
                <button className="btn btn-primary" onClick={() => setTab('withdraw')} style={{ width: '100%', background: 'linear-gradient(135deg,#ff9500,#ff2d78)' }}>💸 Lihat Withdraw Pending ({stats?.withdraw_pending || 0})</button>
                <button className="btn btn-outline" onClick={() => setTab('users')} style={{ width: '100%' }}>👥 Kelola Users</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>📋 Panduan Admin</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
                <div>✅ Konfirmasi deposit setelah transfer masuk</div>
                <div>✅ Proses withdraw ke rekening user</div>
                <div>✅ Tambah saldo untuk bonus/kompensasi</div>
                <div>✅ Nonaktifkan user yang melanggar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit */}
      {tab === 'deposit' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {['pending','success','failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: statusFilter === s ? 'var(--bg2)' : 'transparent', border: `1px solid ${statusFilter === s ? 'var(--blue)' : 'var(--border)'}`, color: statusFilter === s ? 'var(--blue)' : 'var(--muted)' }}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : deposits.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Tidak ada deposit {statusFilter}</div>
            : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {deposits.map((d, i) => (
                  <div key={d.id} style={{ padding: '12px 16px', borderBottom: i < deposits.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.users?.username || '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.users?.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{d.method} • {d.reference}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>
                          Rp {d.amount.toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: 11, color: STATUS_COLOR[d.status], marginBottom: 8 }}>{STATUS_LABEL[d.status]}</div>
                        {d.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => konfirmasiDeposit(d.id)} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>✅ Konfirmasi</button>
                            <button onClick={() => tolakDeposit(d.id)} style={{ padding: '5px 12px', fontSize: 11, background: 'transparent', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>❌ Tolak</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Withdraw */}
      {tab === 'withdraw' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {['pending','sukses','ditolak'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: statusFilter === s ? 'var(--bg2)' : 'transparent', border: `1px solid ${statusFilter === s ? 'var(--blue)' : 'var(--border)'}`, color: statusFilter === s ? 'var(--blue)' : 'var(--muted)' }}>
                {STATUS_LABEL[s] || s}
              </button>
            ))}
          </div>

          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : withdrawals.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Tidak ada withdraw {statusFilter}</div>
            : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {withdrawals.map((w, i) => (
                  <div key={w.id} style={{ padding: '12px 16px', borderBottom: i < withdrawals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{w.users?.username || '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{w.bank} • {w.no_rekening}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>a/n {w.atas_nama}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(w.created_at).toLocaleString('id-ID')}</div>
                        {w.catatan_admin && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>📝 {w.catatan_admin}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: '#ff9500' }}>
                          Rp {w.amount.toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: 11, color: STATUS_COLOR[w.status], marginBottom: 8 }}>{STATUS_LABEL[w.status]}</div>
                        {w.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => prosesWithdraw(w.id, 'sukses')} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>✅ Sukses</button>
                            <button onClick={() => {
                              const catatan = prompt('Alasan penolakan (opsional):') || ''
                              prosesWithdraw(w.id, 'ditolak', catatan)
                            }} style={{ padding: '5px 12px', fontSize: 11, background: 'transparent', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>❌ Tolak</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input className="input" type="text" placeholder="🔍 Cari username..."
              value={cari} onChange={e => setCari(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && muatUsers()}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
            <button className="btn btn-outline" onClick={muatUsers} style={{ padding: '8px 16px', fontSize: 13 }}>Cari</button>
          </div>

          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {users.map((u, i) => (
                  <div key={u.id} style={{ padding: '10px 16px', borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: u.is_active ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {u.username}
                            {u.role === 'admin' && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 6 }}>👑 ADMIN</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email}</div>
                          <div style={{ fontSize: 10, color: u.is_active ? '#00e676' : 'var(--pink)' }}>
                            {u.is_active ? '● Aktif' : '● Nonaktif'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                          Rp {u.balance.toLocaleString('id-ID')}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => setModalUser(u)}
                            style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                            + Saldo
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => aksiBulk(u.is_active ? 'nonaktifkan' : 'aktifkan', u.id)}
                              style={{ padding: '4px 10px', fontSize: 10, background: u.is_active ? 'rgba(255,45,120,0.1)' : 'rgba(0,230,118,0.1)', border: `1px solid ${u.is_active ? 'var(--pink)' : '#00e676'}`, color: u.is_active ? 'var(--pink)' : '#00e676', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                              {u.is_active ? '🚫 Nonaktif' : '✅ Aktifkan'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Modal Tambah Saldo */}
      {modalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💰 Tambah Saldo — {modalUser.username}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Saldo saat ini: <strong style={{ color: 'var(--gold)' }}>Rp {modalUser.balance.toLocaleString('id-ID')}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Jumlah</label>
                <input className="input" type="text" placeholder="Rp 0"
                  value={tambahSaldo} onChange={e => {
                    const n = e.target.value.replace(/\D/g, '')
                    setTambahSaldo(n ? parseInt(n).toLocaleString('id-ID') : '')
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Keterangan</label>
                <input className="input" type="text" placeholder="Bonus, kompensasi, dll"
                  value={keteranganSaldo} onChange={e => setKeteranganSaldo(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleTambahSaldo} style={{ flex: 1 }}>Tambah Saldo</button>
                <button className="btn btn-outline" onClick={() => { setModalUser(null); setTambahSaldo(''); setKeteranganSaldo('') }} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
