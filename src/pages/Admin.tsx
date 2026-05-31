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
  { kode: 'providers', label: '🎮 Providers' },
]

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)', success: '#00e676', sukses: '#00e676',
  failed: 'var(--pink)', ditolak: 'var(--pink)',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending', success: '✅ Sukses', sukses: '✅ Sukses',
  failed: '❌ Gagal', ditolak: '❌ Ditolak',
}

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })
const apiCall = async (url: string, opt?: RequestInit) => {
  const res = await fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opt?.headers as any) } })
  return res.json()
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cari, setCari] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [modalUser, setModalUser] = useState<any>(null)
  const [modalProvider, setModalProvider] = useState<any>(null)
  const [tambahSaldo, setTambahSaldo] = useState('')
  const [keteranganSaldo, setKeteranganSaldo] = useState('')
  const [isMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    muatStats()
  }, [])

  useEffect(() => {
    if (tab === 'deposit') muatDeposit()
    else if (tab === 'withdraw') muatWithdraw()
    else if (tab === 'users') muatUsers()
    else if (tab === 'providers') muatProviders()
  }, [tab, statusFilter])

  const muatStats = async () => {
    const data = await apiCall('/admin/stats')
    setStats(data.stats)
  }

  const muatDeposit = async () => {
    setLoading(true)
    const res = await apiCall(`/admin/deposit?status=${statusFilter}`)
    setDeposits(res.deposits || [])
    setLoading(false)
  }

  const muatWithdraw = async () => {
    setLoading(true)
    const res = await apiCall(`/admin/withdraw?status=${statusFilter}`)
    setWithdrawals(res.withdrawals || [])
    setLoading(false)
  }

  const muatUsers = async () => {
    setLoading(true)
    const res = await apiCall(`/admin/users?cari=${cari}`)
    setUsers(res.users || [])
    setLoading(false)
  }

  const muatProviders = async () => {
    setLoading(true)
    const res = await apiCall('/admin/providers')
    setProviders(res.providers || [])
    setLoading(false)
  }

  const konfirmasiDeposit = async (id: string) => {
    try {
      await adminApi.konfirmasiDeposit(id)
      toast.success('Deposit dikonfirmasi!')
      muatDeposit(); muatStats()
    } catch (e: any) { toast.error(e.message) }
  }

  const tolakDeposit = async (id: string) => {
    const res = await apiCall('/admin/deposit/tolak', { method: 'POST', body: JSON.stringify({ deposit_id: id }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Deposit ditolak'); muatDeposit() }
  }

  const prosesWithdraw = async (id: string, aksi: string, catatan?: string) => {
    try {
      await adminApi.prosesWithdraw({ withdrawal_id: id, aksi, catatan_admin: catatan })
      toast.success(`Withdraw ${aksi}!`)
      muatWithdraw(); muatStats()
    } catch (e: any) { toast.error(e.message) }
  }

  const aksiBulkUser = async (aksi: string, userId: string) => {
    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi, user_id: userId }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success(res.pesan); muatUsers() }
  }

  const handleTambahSaldo = async () => {
    const jumlah = parseInt(tambahSaldo.replace(/\D/g, ''))
    if (!jumlah) { toast.error('Jumlah tidak valid'); return }
    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi: 'tambah_saldo', user_id: modalUser.id, jumlah, keterangan: keteranganSaldo }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Saldo berhasil ditambahkan!'); setModalUser(null); setTambahSaldo(''); setKeteranganSaldo(''); muatUsers() }
  }

  const handleUpdateProvider = async () => {
    const res = await apiCall('/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ aksi: 'update', ...modalProvider })
    })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Provider diupdate!'); setModalProvider(null); muatProviders() }
  }

  const handleSyncUsers = async () => {
    toast.loading('Sinkronisasi user ke NexusGGR...')
    const res = await apiCall('/admin/sync-users', { method: 'POST' })
    toast.dismiss()
    if (res.status === 1) toast.success(res.pesan)
    else toast.error('Gagal sync')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 8px' : 20, paddingBottom: 80 }}>

      <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 16 : 20, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 20 }}>
        👑 ADMIN PANEL
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TAB.map(t => (
          <button key={t.kode} onClick={() => { setTab(t.kode); setStatusFilter('pending') }}
            style={{ padding: isMobile ? '7px 10px' : '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap', flexShrink: 0, background: tab === t.kode ? 'linear-gradient(135deg,#ffd700,#ff9500)' : 'var(--bg2)', border: `1px solid ${tab === t.kode ? 'var(--gold)' : 'var(--border)'}`, color: tab === t.kode ? '#000' : 'var(--muted)' }}>
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
                <button className="btn btn-primary" onClick={() => setTab('deposit')} style={{ width: '100%' }}>💰 Deposit Pending ({stats?.deposit_pending || 0})</button>
                <button className="btn btn-primary" onClick={() => setTab('withdraw')} style={{ width: '100%', background: 'linear-gradient(135deg,#ff9500,#ff2d78)' }}>💸 Withdraw Pending ({stats?.withdraw_pending || 0})</button>
                <button className="btn btn-outline" onClick={handleSyncUsers} style={{ width: '100%' }}>🔄 Sync Users ke NexusGGR</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>📋 Panduan Admin</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
                <div>✅ Konfirmasi deposit setelah transfer masuk</div>
                <div>✅ Konfirmasi withdraw setelah transfer ke user</div>
                <div>✅ Tambah saldo untuk bonus/kompensasi</div>
                <div>✅ Edit logo provider di tab Providers</div>
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
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.method} • {d.reference}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>Rp {d.amount.toLocaleString('id-ID')}</div>
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
                        <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: '#ff9500' }}>Rp {w.amount.toLocaleString('id-ID')}</div>
                        <div style={{ fontSize: 11, color: STATUS_COLOR[w.status], marginBottom: 8 }}>{STATUS_LABEL[w.status]}</div>
                        {w.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => prosesWithdraw(w.id, 'sukses')} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>✅ Sukses</button>
                            <button onClick={() => {
                              const catatan = prompt('Alasan penolakan:') || ''
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
            <button className="btn btn-outline" onClick={muatUsers}>Cari</button>
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
                          <div style={{ fontSize: 10, color: u.is_active ? '#00e676' : 'var(--pink)' }}>{u.is_active ? '● Aktif' : '● Nonaktif'}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>Rp {u.balance.toLocaleString('id-ID')}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => setModalUser(u)} style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>+ Saldo</button>
                          {u.role !== 'admin' && (
                            <button onClick={() => aksiBulkUser(u.is_active ? 'nonaktifkan' : 'aktifkan', u.id)}
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

      {/* Providers */}
      {tab === 'providers' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Kelola logo dan urutan provider. Upload logo ke imgur.com atau imgbb.com lalu paste URL di sini.
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {providers.map((p, i) => (
                  <div key={p.id} style={{ padding: '10px 16px', borderBottom: i < providers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 12, opacity: p.aktif ? 1 : 0.5 }}>
                    {/* Logo preview */}
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {p.logo_url
                        ? <img src={p.logo_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : <span style={{ fontSize: 24 }}>🎮</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nama}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.kode} • {p.tipe} • urutan: {p.urutan}</div>
                      <div style={{ fontSize: 10, color: p.aktif ? '#00e676' : 'var(--pink)' }}>{p.aktif ? '● Aktif' : '● Nonaktif'}</div>
                    </div>
                    <button onClick={() => setModalProvider({ ...p })}
                      style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>
                      ✏️ Edit
                    </button>
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
              Saldo: <strong style={{ color: 'var(--gold)' }}>Rp {modalUser.balance.toLocaleString('id-ID')}</strong>
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

      {/* Modal Edit Provider */}
      {modalProvider && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>✏️ Edit Provider — {modalProvider.kode}</div>

            {/* Preview logo */}
            {modalProvider.logo_url && (
              <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden' }}>
                <img src={modalProvider.logo_url} alt={modalProvider.nama}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Nama</label>
                <input className="input" type="text" value={modalProvider.nama}
                  onChange={e => setModalProvider((p: any) => ({ ...p, nama: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>URL Logo</label>
                <input className="input" type="text" placeholder="https://..."
                  value={modalProvider.logo_url || ''}
                  onChange={e => setModalProvider((p: any) => ({ ...p, logo_url: e.target.value }))} />
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Upload ke imgur.com atau imgbb.com, paste URL di sini</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tipe</label>
                  <select className="input" value={modalProvider.tipe}
                    onChange={e => setModalProvider((p: any) => ({ ...p, tipe: e.target.value }))}
                    style={{ background: 'var(--bg)', cursor: 'pointer' }}>
                    <option value="slot">Slot</option>
                    <option value="live">Live Casino</option>
                    <option value="crash">Crash</option>
                    <option value="sport">Sport</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Urutan</label>
                  <input className="input" type="number" value={modalProvider.urutan}
                    onChange={e => setModalProvider((p: any) => ({ ...p, urutan: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={modalProvider.aktif}
                  onChange={e => setModalProvider((p: any) => ({ ...p, aktif: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label style={{ fontSize: 13, cursor: 'pointer' }}>Provider Aktif</label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleUpdateProvider} style={{ flex: 1 }}>💾 Simpan</button>
                <button className="btn btn-outline" onClick={() => setModalProvider(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
