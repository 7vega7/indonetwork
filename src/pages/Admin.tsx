import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../lib/api'
import toast from 'react-hot-toast'
import AdminChatEmbed from '../components/AdminChatEmbed'
import ImageUpload from '../components/ImageUpload'

const TAB_ALL = [
  { kode: 'dashboard', label: '📊 Dashboard' },
  { kode: 'deposit', label: '💰 Deposit' },
  { kode: 'withdraw', label: '💸 Withdraw' },
  { kode: 'users', label: '👥 Users' },
  { kode: 'providers', label: '🎮 Providers' },
  { kode: 'banner', label: '🖼️ Banner' },
  { kode: 'promosi', label: '🎁 Promosi' },
  { kode: 'settings', label: '⚙️ Settings' },
  { kode: 'chat', label: '💬 Live Chat' },
  { kode: 'logs', label: '📋 Log Aktivitas' },
  { kode: 'export', label: '📥 Export' },
  { kode: 'staff', label: '👑 Staff' },
]



const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)', success: '#00e676', sukses: '#00e676',
  failed: 'var(--pink)', ditolak: 'var(--pink)',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending', success: '✅ Sukses', sukses: '✅ Sukses',
  failed: '❌ Gagal', ditolak: '❌ Ditolak',
}

const JENIS_PROMOSI = ['deposit', 'turnover', 'cashback', 'referral', 'lainnya']

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })
const apiCall = async (url: string, opt?: RequestInit) => {
  const res = await fetch(url, {
    ...opt,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opt?.headers as any) }
  })
  return res.json()
}

const BANNER_KOSONG = {
  judul: '', subjudul: '', tag: '', teks_tombol: 'KLAIM SEKARANG',
  link_tombol: '/deposit', jenis: 'deposit', jenis_custom: '',
  warna_bg: 'linear-gradient(135deg,#0a0a30,#1a0040,#300020)',
  gambar_url: '', urutan: 99, aktif: true,
}

const PROMOSI_KOSONG = {
  judul: '', slug: '', deskripsi: '', konten: '', gambar_url: '',
  jenis: 'deposit', jenis_custom: '', min_deposit: 0,
  bonus_persen: 0, bonus_max: 0, turnover: 1, urutan: 99, aktif: true,
}

export default function Admin() {
  const { user, logout } = useAuth()
  const TAB = user?.role === 'cs'
    ? TAB_ALL.filter(t => t.kode === 'chat')
    : user?.role === 'admin'
    ? TAB_ALL.filter(t => !['providers','banner','promosi','settings','logs','export','staff'].includes(t.kode))
    : TAB_ALL
  const navigate = useNavigate()
  const navigateOut = navigate
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [promosiList, setPromosiList] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [notifList, setNotifList] = useState<any[]>([])
  const [notifCount, setNotifCount] = useState(0)
  const [modalBan, setModalBan] = useState<any>(null)
  const [modalResetPass, setModalResetPass] = useState<any>(null)
  const [modalRole, setModalRole] = useState<any>(null)
  const [banReason, setBanReason] = useState('')
  const [resetPassBaru, setResetPassBaru] = useState('')
  const [exportTipe, setExportTipe] = useState('transaksi')
  const [staffList, setStaffList] = useState<any[]>([])
  const [modalStaff, setModalStaff] = useState<any>(null)
  const [modalTambahStaff, setModalTambahStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({ username: '', email: '', password: '', role: 'admin' })
  const [modalStaffResetPass, setModalStaffResetPass] = useState<any>(null)
  const [staffResetPass, setStaffResetPass] = useState('')
  const [modalEditOwner, setModalEditOwner] = useState(false)
  const [ownerForm, setOwnerForm] = useState({ nama_lengkap: '', no_telepon: '', email: '', bank: '', no_rekening: '', atas_nama: '' })
  const [ownerPassForm, setOwnerPassForm] = useState({ password_lama: '', password_baru: '', konfirmasi: '' })
  const [exportDari, setExportDari] = useState(new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0])
  const [exportSampai, setExportSampai] = useState(new Date().toISOString().split('T')[0])
  const [settingsList, setSettingsList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cari, setCari] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [modalUser, setModalUser] = useState<any>(null)
  const [modalEditUser, setModalEditUser] = useState<any>(null)
  const [editUserForm, setEditUserForm] = useState<any>({})
  const [modalKurangSaldo, setModalKurangSaldo] = useState<any>(null)
  const [kurangSaldoJumlah, setKurangSaldoJumlah] = useState('')
  const [modalProvider, setModalProvider] = useState<any>(null)
  const [modalBanner, setModalBanner] = useState<any>(null)
  const [modalPromosi, setModalPromosi] = useState<any>(null)
  const [tambahSaldo, setTambahSaldo] = useState('')
  const [keteranganSaldo, setKeteranganSaldo] = useState('')
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    undefined
    muatStats()
    muatNotif()
    const notifInterval = setInterval(muatNotif, 30000)
    return () => clearInterval(notifInterval)
  }, [])

  useEffect(() => {
    if (tab === 'deposit') muatDeposit()
    else if (tab === 'withdraw') muatWithdraw()
    else if (tab === 'users') muatUsers()
    else if (tab === 'providers') muatProviders()
    else if (tab === 'banner') muatBanners()
    else if (tab === 'promosi') muatPromosi()
    else if (tab === 'settings') muatSettings()
    else if (tab === 'logs') muatLogs()
    else if (tab === 'staff') muatStaff()
  }, [tab, statusFilter])

  const muatStats = async () => { const d = await apiCall('/admin/stats'); setStats(d.stats) }
  const muatDeposit = async () => {
    // Auto expire deposit kadaluarsa dulu
    await fetch('/cron').catch(() => {})
    setLoading(true)
    const d = await apiCall(`/admin/deposit?status=${statusFilter}`)
    setDeposits(d.deposits || [])
    setLoading(false)
  }
  const muatWithdraw = async () => { setLoading(true); const d = await apiCall(`/admin/withdraw?status=${statusFilter}`); setWithdrawals(d.withdrawals || []); setLoading(false) }
  const muatUsers = async () => { setLoading(true); const d = await apiCall(`/admin/users?cari=${cari}`); setUsers(d.users || []); setLoading(false) }
  const muatProviders = async () => { setLoading(true); const d = await apiCall('/admin/providers'); setProviders(d.providers || []); setLoading(false) }
  const muatBanners = async () => { setLoading(true); const d = await apiCall('/admin/banners'); setBanners(d.banners || []); setLoading(false) }
  const muatStaff = async () => { setLoading(true); const d = await apiCall('/admin/staff'); setStaffList(d.staff || []); setLoading(false) }
  const muatLogs = async () => { setLoading(true); const d = await apiCall('/admin/logs'); setLogs(d.logs || []); setLoading(false) }
  const muatNotif = async () => { const d = await apiCall('/admin/notifikasi'); setNotifList(d.notifikasi || []); setNotifCount(d.total || 0) }
  const muatSettings = async () => { setLoading(true); const d = await apiCall('/admin/settings'); setSettingsList(d.settings || []); setLoading(false) }
  const muatPromosi = async () => { setLoading(true); const d = await apiCall('/admin/promosi'); setPromosiList(d.promosi || []); setLoading(false) }

  const konfirmasiDeposit = async (id: string) => {
    try { await adminApi.konfirmasiDeposit(id); toast.success('Deposit dikonfirmasi!'); muatDeposit(); muatStats() }
    catch (e: any) { toast.error(e.message) }
  }

  const tolakDeposit = async (id: string) => {
    const res = await apiCall('/admin/deposit/tolak', { method: 'POST', body: JSON.stringify({ deposit_id: id }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Deposit ditolak'); muatDeposit() }
  }

  const prosesWithdraw = async (id: string, aksi: string, catatan?: string) => {
    try { await adminApi.prosesWithdraw({ withdrawal_id: id, aksi, catatan_admin: catatan }); toast.success(`Withdraw ${aksi}!`); muatWithdraw(); muatStats() }
    catch (e: any) { toast.error(e.message) }
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
    const res = await apiCall('/admin/providers', { method: 'POST', body: JSON.stringify({ aksi: 'update', ...modalProvider }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Provider diupdate!'); setModalProvider(null); muatProviders() }
  }

  const handleSimpanBanner = async () => {
    const aksi = modalBanner.id ? 'update' : 'tambah'
    const res = await apiCall('/admin/banners', { method: 'POST', body: JSON.stringify({ aksi, ...modalBanner }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success(`Banner ${aksi === 'tambah' ? 'ditambahkan' : 'diupdate'}!`); setModalBanner(null); muatBanners() }
  }

  const handleHapusBanner = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return
    const res = await apiCall('/admin/banners', { method: 'POST', body: JSON.stringify({ aksi: 'hapus', id }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Banner dihapus'); muatBanners() }
  }

  const handleSimpanPromosi = async () => {
    const aksi = modalPromosi.id ? 'update' : 'tambah'
    if (!modalPromosi.slug && modalPromosi.judul) {
      modalPromosi.slug = modalPromosi.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
    const res = await apiCall('/admin/promosi', { method: 'POST', body: JSON.stringify({ aksi, ...modalPromosi }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success(`Promosi ${aksi === 'tambah' ? 'ditambahkan' : 'diupdate'}!`); setModalPromosi(null); muatPromosi() }
  }

  const handleHapusPromosi = async (id: string) => {
    if (!confirm('Hapus promosi ini?')) return
    const res = await apiCall('/admin/promosi', { method: 'POST', body: JSON.stringify({ aksi: 'hapus', id }) })
    if (res.status === 0) toast.error(res.error)
    else { toast.success('Promosi dihapus'); muatPromosi() }
  }

  const handleSyncUsers = async () => {
    toast.loading('Sinkronisasi...')
    const res = await apiCall('/admin/sync-users', { method: 'POST' })
    toast.dismiss()
    res.status === 1 ? toast.success(res.pesan) : toast.error('Gagal sync')
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }
  const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block' as const, marginBottom: 6 }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 8px' : 20, paddingBottom: 80 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 16 : 20, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          👑 {user?.role === 'owner' ? 'OWNER' : user?.role === 'cs' ? 'CS' : 'ADMIN'} PANEL
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigateOut('/')} style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>🌐 Website</button>
          <button onClick={() => { logout(); navigateOut('/') }} style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(255,45,120,0.1)', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>🚪 Keluar</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'thin', paddingBottom: 4 }}>
        {TAB.map(t => (
          <button key={t.kode} onClick={() => { setTab(t.kode); setStatusFilter('pending') }}
            style={{ padding: isMobile ? '7px 10px' : '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 12, whiteSpace: 'nowrap', flexShrink: 0, background: tab === t.kode ? 'linear-gradient(135deg,#ffd700,#ff9500)' : 'var(--bg2)', border: `1px solid ${tab === t.kode ? 'var(--gold)' : 'var(--border)'}`, color: tab === t.kode ? '#000' : 'var(--muted)' }}>
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
              { label: 'Total Saldo', nilai: stats ? `${Math.floor(stats.total_saldo_user/1000)}K` : '-', ikon: '💎', warna: '#00e676' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', borderColor: `${s.warna}40` }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.ikon}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, color: s.warna }}>{s.nilai}</div>
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
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>📋 Panduan</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
                <div>✅ Konfirmasi deposit setelah transfer masuk</div>
                <div>✅ Konfirmasi withdraw setelah kirim ke user</div>
                <div>✅ Edit banner slider di tab Banner</div>
                <div>✅ Kelola artikel promosi di tab Promosi</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit */}
      {tab === 'deposit' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['pending','success','failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: statusFilter === s ? 'var(--bg2)' : 'transparent', border: `1px solid ${statusFilter === s ? 'var(--blue)' : 'var(--border)'}`, color: statusFilter === s ? 'var(--blue)' : 'var(--muted)' }}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : deposits.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Tidak ada deposit {statusFilter}</div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {deposits.map((d, i) => (
                <div key={d.id} style={{ padding: '12px 16px', borderBottom: i < deposits.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.users?.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.method} • {d.reference}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>Rp {d.amount.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: 11, color: STATUS_COLOR[d.status], marginBottom: 6 }}>{STATUS_LABEL[d.status]}</div>
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
            </div>}
        </div>
      )}

      {/* Withdraw */}
      {tab === 'withdraw' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['pending','sukses','ditolak'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: statusFilter === s ? 'var(--bg2)' : 'transparent', border: `1px solid ${statusFilter === s ? 'var(--blue)' : 'var(--border)'}`, color: statusFilter === s ? 'var(--blue)' : 'var(--muted)' }}>
                {STATUS_LABEL[s] || s}
              </button>
            ))}
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : withdrawals.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Tidak ada withdraw {statusFilter}</div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {withdrawals.map((w, i) => (
                <div key={w.id} style={{ padding: '12px 16px', borderBottom: i < withdrawals.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{w.users?.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{w.bank} • {w.no_rekening} • a/n {w.atas_nama}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(w.created_at).toLocaleString('id-ID')}</div>
                      {w.catatan_admin && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>📝 {w.catatan_admin}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: '#ff9500' }}>Rp {w.amount.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: 11, color: STATUS_COLOR[w.status], marginBottom: 6 }}>{STATUS_LABEL[w.status]}</div>
                      {w.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => prosesWithdraw(w.id, 'sukses')} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>✅ Sukses</button>
                          <button onClick={() => { const c = prompt('Alasan penolakan:') || ''; prosesWithdraw(w.id, 'ditolak', c) }} style={{ padding: '5px 12px', fontSize: 11, background: 'transparent', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>❌ Tolak</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input className="input" type="text" placeholder="🔍 Cari username..." value={cari}
              onChange={e => setCari(e.target.value)} onKeyDown={e => e.key === 'Enter' && muatUsers()}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
            <button className="btn btn-outline" onClick={muatUsers}>Cari</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {users.map((u, i) => (
                <div key={u.id} style={{ padding: '10px 16px', borderBottom: i < users.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: u.is_active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.username} {u.role === 'owner' && <span style={{ fontSize: 10, color: 'var(--gold)' }}>👑</span>}{u.role === 'admin' && <span style={{ fontSize: 10, color: 'var(--blue)' }}>🛡️</span>}{u.role === 'cs' && <span style={{ fontSize: 10, color: 'var(--purple)' }}>🎧</span>}{u.ban_reason && <span style={{ fontSize: 10, color: 'var(--pink)' }}> [BANNED]</span>}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email}</div>
                        <div style={{ fontSize: 10, color: u.is_active ? '#00e676' : 'var(--pink)' }}>{u.is_active ? '● Aktif' : '● Nonaktif'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>Rp {u.balance.toLocaleString('id-ID')}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setModalUser(u)} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', color: '#00e676', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>+ Saldo</button>
                        <button onClick={() => { setModalKurangSaldo(u); setKurangSaldoJumlah('') }} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,45,120,0.1)', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>- Saldo</button>
                        <button onClick={() => { setModalEditUser(u); setEditUserForm({ nama_lengkap: u.nama_lengkap||'', no_telepon: u.no_telepon||'', bank: u.bank||'', no_rekening: u.no_rekening||'', atas_nama: u.atas_nama||'' }) }} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>✏️</button>
                        <button onClick={() => { setModalResetPass(u); setResetPassBaru('') }} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>🔑</button>
                        <button onClick={() => { setModalBan(u); setBanReason('') }} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,100,0,0.1)', border: '1px solid #ff6400', color: '#ff6400', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>🚫</button>
                        {u.role !== 'admin' && (
                          <button onClick={() => aksiBulkUser(u.is_active ? 'nonaktifkan' : 'aktifkan', u.id)}
                            style={{ padding: '4px 10px', fontSize: 10, background: u.is_active ? 'rgba(255,45,120,0.1)' : 'rgba(0,230,118,0.1)', border: `1px solid ${u.is_active ? 'var(--pink)' : '#00e676'}`, color: u.is_active ? 'var(--pink)' : '#00e676', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                            {u.is_active ? '🚫' : '✅'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Providers */}
      {tab === 'providers' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Upload logo ke imgur.com atau imgbb.com lalu paste URL.</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {providers.map((p, i) => (
                <div key={p.id} style={{ padding: '10px 16px', borderBottom: i < providers.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 12, opacity: p.aktif ? 1 : 0.5 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {p.logo_url ? <img src={p.logo_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <span style={{ fontSize: 20 }}>🎮</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nama}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.kode} • {p.tipe} • #{p.urutan}</div>
                  </div>
                  <button onClick={() => setModalProvider({ ...p })} style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Banner */}
      {tab === 'banner' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Banner slider di halaman utama. Terintegrasi dengan halaman Promosi.</div>
            <button className="btn btn-primary" onClick={() => setModalBanner({ ...BANNER_KOSONG })} style={{ padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>+ Tambah</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {banners.map(b => (
                <div key={b.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: b.aktif ? 1 : 0.5 }}>
                  {/* Preview banner */}
                  <div style={{ height: 80, background: b.gambar_url ? undefined : b.warna_bg, position: 'relative', overflow: 'hidden' }}>
                    {b.gambar_url && <img src={b.gambar_url} alt={b.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.style.background = b.warna_bg }} />}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(0,0,0,0.3)' }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{b.tag}</div>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 900, color: 'white', whiteSpace: 'pre-line' }}>{b.judul}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Urutan: {b.urutan} • Jenis: {b.jenis} • Tombol: {b.teks_tombol}</div>
                      <div style={{ fontSize: 11, color: b.aktif ? '#00e676' : 'var(--pink)' }}>{b.aktif ? '● Aktif' : '● Nonaktif'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModalBanner({ ...b })} style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                      <button onClick={() => handleHapusBanner(b.id)} style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(255,45,120,0.1)', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Promosi */}
      {tab === 'promosi' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Artikel promosi yang ditampilkan di halaman Promosi.</div>
            <button className="btn btn-primary" onClick={() => setModalPromosi({ ...PROMOSI_KOSONG })} style={{ padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>+ Tambah</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {promosiList.map((p, i) => (
                <div key={p.id} style={{ padding: '12px 16px', borderBottom: i < promosiList.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 12, opacity: p.aktif ? 1 : 0.5 }}>
                  {p.gambar_url && <img src={p.gambar_url} alt={p.judul} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.judul}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.jenis} • /{p.slug} • #{p.urutan}</div>
                    <div style={{ fontSize: 10, color: p.aktif ? '#00e676' : 'var(--pink)' }}>{p.aktif ? '● Aktif' : '● Nonaktif'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setModalPromosi({ ...p })} style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(0,200,255,0.1)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                    <button onClick={() => handleHapusPromosi(p.id)} style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(255,45,120,0.1)', border: '1px solid var(--pink)', color: 'var(--pink)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Konfigurasi sistem — JayaPay, freebet, dan pengaturan deposit.
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className='spinner' /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { judul: '🏷️ Brand', prefix: 'brand_' },
                { judul: '⚙️ Maintenance', prefix: 'maintenance_' },
                { judul: '💬 Kontak CS', prefix: 'whatsapp_url' },
                { judul: '💬 Kontak CS', prefix: 'telegram_url' },
                { judul: '💬 Kontak CS', prefix: 'livechat_url' },
                { judul: '📝 Konten', prefix: 'marquee_teks' },
                { judul: '📝 Konten', prefix: 'footer_teks' },
                { judul: '💰 Transaksi', prefix: 'min_deposit' },
                { judul: '💰 Transaksi', prefix: 'min_withdraw' },
                { judul: '💰 Transaksi', prefix: 'max_withdraw' },
                { judul: '💰 Transaksi', prefix: 'deposit_timeout_menit' },
                { judul: '🎁 Bonus Register', prefix: 'register_bonus_' },
                { judul: '🎁 Freebet', prefix: 'freebet_' },
                { judul: '💳 JayaPay', prefix: 'jayapay_' },
              ].map(group => {
                const items = settingsList.filter(s => s.kunci.startsWith(group.prefix))
                return (
                  <div key={group.prefix} className='card'>
                    <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--gold)' }}>{group.judul}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {items.map(s => (
                        <div key={s.kunci}>
                          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                            {s.kunci}{s.deskripsi ? ' — ' + s.deskripsi : ''}
                          </label>
                          {s.kunci === 'jayapay_mode' ? (
                            <select style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                              value={s.nilai} onChange={e => setSettingsList(prev => prev.map(x => x.kunci === s.kunci ? { ...x, nilai: e.target.value } : x))}>
                              <option value='test' style={{ background: '#111130' }}>test</option>
                              <option value='live' style={{ background: '#111130' }}>live</option>
                            </select>
                          ) : s.kunci === 'jayapay_aktif' || s.kunci === 'freebet_aktif' || s.kunci === 'maintenance_aktif' || s.kunci === 'register_bonus_aktif' ? (
                            <select style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                              value={s.nilai} onChange={e => setSettingsList(prev => prev.map(x => x.kunci === s.kunci ? { ...x, nilai: e.target.value } : x))}>
                              <option value='false' style={{ background: '#111130' }}>❌ Nonaktif</option>
                              <option value='true' style={{ background: '#111130' }}>✅ Aktif</option>
                            </select>
                          ) : (
                            <input style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                              type={s.kunci.includes('private_key') ? 'password' : 'text'}
                              value={s.nilai || ''}
                              placeholder={s.kunci.includes('private_key') ? 'Isi untuk update private key' : ''}
                              onChange={e => setSettingsList(prev => prev.map(x => x.kunci === s.kunci ? { ...x, nilai: e.target.value } : x))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <button className='btn btn-primary' style={{ width: '100%', padding: 13 }}
                onClick={async () => {
                  const res = await apiCall('/admin/settings', { method: 'POST', body: JSON.stringify({ settings: settingsList }) })
                  if (res.status === 0) toast.error(res.error)
                  else { toast.success('Settings berhasil disimpan!'); muatSettings() }
                }}>
                💾 Simpan Semua Settings
              </button>

              <div className='card' style={{ borderColor: 'rgba(255,45,120,0.3)' }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--pink)' }}>🔧 Tools</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className='btn btn-outline' style={{ fontSize: 12 }}
                    onClick={async () => {
                      const res = await fetch('/deposit/expire')
                      const d = await res.json()
                      toast.success(d.pesan || 'Done')
                    }}>⏰ Expire Deposit Kadaluarsa</button>
                  <button className='btn btn-outline' style={{ fontSize: 12 }}
                    onClick={async () => {
                      const res = await apiCall('/admin/sync-users', { method: 'POST' })
                      toast.success(res.pesan || 'Done')
                    }}>🔄 Sync Users NexusGGR</button>
                  <button className='btn btn-outline' style={{ fontSize: 12 }}
                    onClick={async () => {
                      const res = await fetch('/chat', { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                      const d = await res.json()
                      toast.success(d.pesan || 'Cleanup selesai')
                    }}>🗑️ Cleanup Chat Lama</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Chat */}
      {tab === 'chat' && (
        <div style={{ height: 'calc(100vh - 200px)', minHeight: 500, marginTop: 16 }}>
          <AdminChatEmbed />
        </div>
      )}

      {/* Staff - hanya owner */}
      {tab === 'staff' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Kelola akun Admin dan CS</div>
            <button className='btn btn-primary' onClick={() => { setModalTambahStaff(true); setStaffForm({ username: '', email: '', password: '', role: 'admin' }) }}
              style={{ padding: '7px 14px', fontSize: 12 }}>+ Tambah Staff</button>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className='spinner' /></div> : (
            <div className='card' style={{ padding: 0, overflow: 'hidden' }}>
              {staffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Belum ada staff</div>
              ) : staffList.map((s, i) => (
                <div key={s.id} style={{ padding: '12px 16px', borderBottom: i < staffList.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: s.is_active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.role === 'owner' ? 'linear-gradient(135deg,#ffd700,#ff9500)' : s.role === 'admin' ? 'linear-gradient(135deg,var(--blue),var(--purple))' : 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {s.role === 'owner' ? '👑' : s.role === 'admin' ? '🛡️' : '🎧'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.username}
                        <span style={{ fontSize: 10, marginLeft: 6, color: s.role === 'owner' ? 'var(--gold)' : s.role === 'admin' ? 'var(--blue)' : 'var(--purple)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>{s.role.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.email}</div>
                      <div style={{ fontSize: 10, color: s.is_active ? '#00e676' : 'var(--pink)' }}>{s.is_active ? '● Aktif' : '● Nonaktif'}</div>
                    </div>
                    {s.role === 'owner' && s.id === user?.id && (
                      <button onClick={() => {
                        setModalEditOwner(true)
                        setOwnerForm({ nama_lengkap: s.nama_lengkap||'', no_telepon: s.no_telepon||'', email: s.email||'', bank: s.bank||'', no_rekening: s.no_rekening||'', atas_nama: s.atas_nama||'' })
                        setOwnerPassForm({ password_lama: '', password_baru: '', konfirmasi: '' })
                      }} style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                        ✏️ Edit
                      </button>
                    )}
                    {s.role !== 'owner' && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setModalStaffResetPass(s); setStaffResetPass('') }}
                          style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>🔑</button>
                        <button onClick={() => setModalStaff(s)}
                          style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(123,47,255,0.1)', border: '1px solid var(--purple)', color: 'var(--purple)', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>✏️</button>
                        <button onClick={async () => {
                          const aksi = s.is_active ? 'nonaktifkan' : 'aktifkan'
                          const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi, user_id: s.id }) })
                          if (res.status === 0) toast.error(res.error)
                          else { toast.success(res.pesan); muatStaff() }
                        }} style={{ padding: '4px 10px', fontSize: 10, background: s.is_active ? 'rgba(255,45,120,0.1)' : 'rgba(0,230,118,0.1)', border: `1px solid ${s.is_active ? 'var(--pink)' : '#00e676'}`, color: s.is_active ? 'var(--pink)' : '#00e676', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                          {s.is_active ? '🚫' : '✅'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Log semua aktivitas admin</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className='spinner' /></div> : (
            <div className='card' style={{ padding: 0, overflow: 'hidden' }}>
              {logs.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Belum ada log</div>
              : logs.map((l, i) => (
                <div key={l.id} style={{ padding: '10px 16px', borderBottom: i < logs.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>{l.admin_username}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}> → {l.aksi}</span>
                      {l.detail?.username && <span style={{ fontSize: 12, color: 'var(--blue)' }}> [{l.detail.username}]</span>}
                      {l.detail?.jumlah && <span style={{ fontSize: 12, color: '#00e676' }}> Rp {parseInt(l.detail.jumlah).toLocaleString('id-ID')}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(l.created_at).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {tab === 'export' && (
        <div>
          <div className='card'>
            <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>📥 Export Data CSV</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tipe Data</label>
                <select style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                  value={exportTipe} onChange={e => setExportTipe(e.target.value)}>
                  {['transaksi','deposit','withdraw','users'].map(t => <option key={t} value={t} style={{ background: '#111130' }}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Dari</label>
                  <input type='date' style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                    value={exportDari} onChange={e => setExportDari(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Sampai</label>
                  <input type='date' style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                    value={exportSampai} onChange={e => setExportSampai(e.target.value)} />
                </div>
              </div>
              <button className='btn btn-primary' style={{ width: '100%', padding: 13 }}
                onClick={async () => {
                  const res = await fetch(`/admin/export?tipe=${exportTipe}&dari=${exportDari}&sampai=${exportSampai}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${exportTipe}_${exportDari}_${exportSampai}.csv`
                  a.click()
                }}>
                📥 Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Staff */}
      {modalTambahStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--gold)' }}>👑 Tambah Staff</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Role</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={staffForm.role}
                  onChange={e => setStaffForm((f: any) => ({ ...f, role: e.target.value }))}>
                  <option value='admin' style={{ background: '#111130' }}>🛡️ Admin</option>
                  <option value='cs' style={{ background: '#111130' }}>🎧 CS</option>
                </select>
              </div>
              <div><label style={labelStyle}>Username</label>
                <input style={inputStyle} placeholder='Username staff' value={staffForm.username}
                  onChange={e => setStaffForm((f: any) => ({ ...f, username: e.target.value }))} />
              </div>
              <div><label style={labelStyle}>Email (opsional)</label>
                <input style={inputStyle} type='email' placeholder='email@staff.com' value={staffForm.email}
                  onChange={e => setStaffForm((f: any) => ({ ...f, email: e.target.value }))} />
              </div>
              <div><label style={labelStyle}>Password</label>
                <input style={inputStyle} type='password' placeholder='Min 6 karakter' value={staffForm.password}
                  onChange={e => setStaffForm((f: any) => ({ ...f, password: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1 }}
                  onClick={async () => {
                    const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'tambah_staff', username: staffForm.username, email: staffForm.email, password: staffForm.password, role_baru: staffForm.role }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success(res.pesan); setModalTambahStaff(false); muatStaff() }
                  }}>✅ Tambah</button>
                <button className='btn btn-outline' onClick={() => setModalTambahStaff(false)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Set Role Staff */}
      {modalStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--purple)' }}>✏️ Ubah Role — {modalStaff.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { role: 'admin', label: '🛡️ Admin', desc: 'Kelola deposit, withdraw, users, chat', color: 'var(--blue)' },
                { role: 'cs', label: '🎧 CS', desc: 'Hanya akses Live Chat', color: 'var(--purple)' },
              ].map(r => (
                <button key={r.role}
                  onClick={async () => {
                    const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'set_role', user_id: modalStaff.id, role_baru: r.role }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success(res.pesan); setModalStaff(null); muatStaff() }
                  }}
                  style={{ padding: '12px 16px', border: `1px solid ${r.color}`, borderRadius: 8, background: `${r.color}15`, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.desc}</div>
                </button>
              ))}
              <button className='btn btn-outline' style={{ color: 'var(--pink)', borderColor: 'var(--pink)' }}
                onClick={async () => {
                  if (!confirm('Hapus staff ini?')) return
                  const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'hapus', user_id: modalStaff.id }) })
                  if (res.status === 0) toast.error(res.error)
                  else { toast.success(res.pesan); setModalStaff(null); muatStaff() }
                }}>🗑️ Hapus dari Staff</button>
              <button className='btn btn-outline' onClick={() => setModalStaff(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password Staff */}
      {modalStaffResetPass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--gold)' }}>🔑 Reset Password — {modalStaffResetPass.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Password Baru</label>
                <input style={inputStyle} type='text' placeholder='Min 6 karakter' value={staffResetPass}
                  onChange={e => setStaffResetPass(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1 }}
                  onClick={async () => {
                    const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'reset_password', user_id: modalStaffResetPass.id, password_baru: staffResetPass }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success(res.pesan); setModalStaffResetPass(null) }
                  }}>🔑 Reset</button>
                <button className='btn btn-outline' onClick={() => setModalStaffResetPass(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Edit Owner */}
      {modalEditOwner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className='card' style={{ width: '100%', maxWidth: 460, margin: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--gold)' }}>👑 Edit Profil Owner</div>

            {/* Edit Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700, marginBottom: 12 }}>📋 Informasi Profil</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><label style={labelStyle}>Email</label>
                  <input style={inputStyle} type='email' placeholder='email@owner.com' value={ownerForm.email}
                    onChange={e => setOwnerForm((f: any) => ({ ...f, email: e.target.value }))} />
                </div>
                <div><label style={labelStyle}>Nama Lengkap</label>
                  <input style={inputStyle} placeholder='Nama lengkap' value={ownerForm.nama_lengkap}
                    onChange={e => setOwnerForm((f: any) => ({ ...f, nama_lengkap: e.target.value }))} />
                </div>
                <div><label style={labelStyle}>No. Telepon</label>
                  <input style={inputStyle} placeholder='08xxx' value={ownerForm.no_telepon}
                    onChange={e => setOwnerForm((f: any) => ({ ...f, no_telepon: e.target.value }))} />
                </div>
                <button className='btn btn-primary' style={{ width: '100%', padding: 10 }}
                  onClick={async () => {
                    const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'edit_owner', ...ownerForm }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success('Profil diupdate!'); muatStaff() }
                  }}>💾 Simpan Profil</button>
              </div>
            </div>

            {/* Garis pemisah */}
            <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }} />

            {/* Ubah Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 700, marginBottom: 12 }}>🔑 Ubah Password</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><label style={labelStyle}>Password Lama</label>
                  <input style={inputStyle} type='password' placeholder='Password saat ini' value={ownerPassForm.password_lama}
                    onChange={e => setOwnerPassForm((f: any) => ({ ...f, password_lama: e.target.value }))} />
                </div>
                <div><label style={labelStyle}>Password Baru</label>
                  <input style={inputStyle} type='password' placeholder='Min 6 karakter' value={ownerPassForm.password_baru}
                    onChange={e => setOwnerPassForm((f: any) => ({ ...f, password_baru: e.target.value }))} />
                </div>
                <div><label style={labelStyle}>Konfirmasi Password Baru</label>
                  <input style={inputStyle} type='password' placeholder='Ulangi password baru' value={ownerPassForm.konfirmasi}
                    onChange={e => setOwnerPassForm((f: any) => ({ ...f, konfirmasi: e.target.value }))} />
                </div>
                <button className='btn btn-primary' style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#ff2d78,#7b2fff)' }}
                  onClick={async () => {
                    if (ownerPassForm.password_baru !== ownerPassForm.konfirmasi) { toast.error('Konfirmasi password tidak cocok'); return }
                    if (ownerPassForm.password_baru.length < 6) { toast.error('Password minimal 6 karakter'); return }
                    const res = await apiCall('/admin/staff', { method: 'POST', body: JSON.stringify({ aksi: 'reset_password_owner', password_lama: ownerPassForm.password_lama, password_baru: ownerPassForm.password_baru }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success('Password berhasil diubah!'); setOwnerPassForm({ password_lama: '', password_baru: '', konfirmasi: '' }) }
                  }}>🔑 Ubah Password</button>
              </div>
            </div>

            <button className='btn btn-outline' onClick={() => setModalEditOwner(false)} style={{ width: '100%' }}>Tutup</button>
          </div>
        </div>
      )}

      {/* Modal Ban */}
      {modalBan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--pink)' }}>🚫 Ban User — {modalBan.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Alasan Ban</label>
                <input style={inputStyle} type='text' placeholder='Melanggar ketentuan...' value={banReason} onChange={e => setBanReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1, background: 'linear-gradient(135deg,#ff2d78,#ff0000)' }}
                  onClick={async () => {
                    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi: 'ban', user_id: modalBan.id, ban_reason: banReason }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success('User diban!'); setModalBan(null); muatUsers() }
                  }}>🚫 Ban</button>
                <button className='btn btn-outline' onClick={() => setModalBan(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password User */}
      {modalResetPass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--gold)' }}>🔑 Reset Password — {modalResetPass.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Password Baru</label>
                <input style={inputStyle} type='text' placeholder='Min 6 karakter' value={resetPassBaru} onChange={e => setResetPassBaru(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1 }}
                  onClick={async () => {
                    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi: 'reset_password', user_id: modalResetPass.id, password_baru: resetPassBaru }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success('Password direset!'); setModalResetPass(null) }
                  }}>🔑 Reset</button>
                <button className='btn btn-outline' onClick={() => setModalResetPass(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Saldo */}
      {modalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💰 Tambah Saldo — {modalUser.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Jumlah</label>
                <input style={inputStyle} type="text" placeholder="Rp 0" value={tambahSaldo}
                  onChange={e => { const n = e.target.value.replace(/\D/g,''); setTambahSaldo(n ? parseInt(n).toLocaleString('id-ID') : '') }} />
              </div>
              <div><label style={labelStyle}>Keterangan</label>
                <input style={inputStyle} type="text" placeholder="Bonus, kompensasi..." value={keteranganSaldo} onChange={e => setKeteranganSaldo(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleTambahSaldo} style={{ flex: 1 }}>Tambah</button>
                <button className="btn btn-outline" onClick={() => { setModalUser(null); setTambahSaldo(''); setKeteranganSaldo('') }} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Edit User */}
      {modalEditUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className='card' style={{ width: '100%', maxWidth: 440, margin: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>✏️ Edit Data — {modalEditUser.username}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Nama Lengkap</label>
                <input style={inputStyle} value={editUserForm.nama_lengkap} onChange={e => setEditUserForm((f: any) => ({ ...f, nama_lengkap: e.target.value }))} placeholder='Nama lengkap' />
              </div>
              <div><label style={labelStyle}>No. Telepon</label>
                <input style={inputStyle} value={editUserForm.no_telepon} onChange={e => setEditUserForm((f: any) => ({ ...f, no_telepon: e.target.value }))} placeholder='08xxx' />
              </div>
              <div><label style={labelStyle}>Bank</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={editUserForm.bank} onChange={e => setEditUserForm((f: any) => ({ ...f, bank: e.target.value }))}>
                  <option value='' style={{ background: '#111130' }}>Pilih Bank</option>
                  {['BCA','BRI','BNI','Mandiri','CIMB Niaga','Permata','Danamon','BTN','BSI','Jenius','SeaBank','GoPay','OVO','Dana'].map(b => (
                    <option key={b} value={b} style={{ background: '#111130' }}>{b}</option>
                  ))}
                </select>
              </div>
              <div><label style={labelStyle}>No. Rekening</label>
                <input style={inputStyle} value={editUserForm.no_rekening} onChange={e => setEditUserForm((f: any) => ({ ...f, no_rekening: e.target.value }))} placeholder='Nomor rekening' />
              </div>
              <div><label style={labelStyle}>Atas Nama</label>
                <input style={inputStyle} value={editUserForm.atas_nama} onChange={e => setEditUserForm((f: any) => ({ ...f, atas_nama: e.target.value }))} placeholder='Nama pemilik rekening' />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1 }}
                  onClick={async () => {
                    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi: 'edit_profil', user_id: modalEditUser.id, ...editUserForm }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success('Data user diupdate!'); setModalEditUser(null); muatUsers() }
                  }}>💾 Simpan</button>
                <button className='btn btn-outline' onClick={() => setModalEditUser(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kurang Saldo */}
      {modalKurangSaldo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className='card' style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--pink)' }}>💸 Kurang Saldo — {modalKurangSaldo.username}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Saldo saat ini: Rp {modalKurangSaldo.balance?.toLocaleString('id-ID')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Jumlah</label>
                <input style={inputStyle} type='text' placeholder='Rp 0' value={kurangSaldoJumlah}
                  onChange={e => { const n = e.target.value.replace(/\D/g,''); setKurangSaldoJumlah(n ? parseInt(n).toLocaleString('id-ID') : '') }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className='btn btn-primary' style={{ flex: 1, background: 'linear-gradient(135deg,#ff2d78,#ff9500)' }}
                  onClick={async () => {
                    const jumlah = parseInt(kurangSaldoJumlah.replace(/\D/g,''))
                    if (!jumlah) { toast.error('Jumlah tidak valid'); return }
                    const res = await apiCall('/admin/users', { method: 'POST', body: JSON.stringify({ aksi: 'kurang_saldo', user_id: modalKurangSaldo.id, jumlah }) })
                    if (res.status === 0) toast.error(res.error)
                    else { toast.success(`Saldo dikurangi! Sisa: Rp ${res.saldo_baru?.toLocaleString('id-ID')}`); setModalKurangSaldo(null); setKurangSaldoJumlah(''); muatUsers() }
                  }}>💸 Kurangi</button>
                <button className='btn btn-outline' onClick={() => { setModalKurangSaldo(null); setKurangSaldoJumlah('') }} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Provider */}
      {modalProvider && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, margin: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>✏️ Edit Provider — {modalProvider.kode}</div>
            {modalProvider.logo_url && (
              <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', margin: '0 auto 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={modalProvider.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Nama</label><input style={inputStyle} value={modalProvider.nama} onChange={e => setModalProvider((p: any) => ({ ...p, nama: e.target.value }))} /></div>
              <ImageUpload value={modalProvider.logo_url || ''} onChange={url => setModalProvider((p: any) => ({ ...p, logo_url: url }))} folder="provider" label="Logo Provider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Tipe</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={modalProvider.tipe} onChange={e => setModalProvider((p: any) => ({ ...p, tipe: e.target.value }))}>
                    {['slot','live','crash','sport'].map(t => <option key={t} value={t} style={{ background: '#111130' }}>{t}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Urutan</label><input style={inputStyle} type="number" value={modalProvider.urutan} onChange={e => setModalProvider((p: any) => ({ ...p, urutan: parseInt(e.target.value) }))} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={modalProvider.aktif} onChange={e => setModalProvider((p: any) => ({ ...p, aktif: e.target.checked }))} />
                Provider Aktif
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleUpdateProvider} style={{ flex: 1 }}>💾 Simpan</button>
                <button className="btn btn-outline" onClick={() => setModalProvider(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Banner */}
      {modalBanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{modalBanner.id ? '✏️ Edit Banner' : '+ Tambah Banner'}</div>

            {/* Preview */}
            <div style={{ height: 80, borderRadius: 8, overflow: 'hidden', marginBottom: 16, background: modalBanner.warna_bg, position: 'relative' }}>
              {modalBanner.gambar_url && <img src={modalBanner.gambar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(0,0,0,0.3)' }}>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{modalBanner.tag || 'Tag'}</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 900, color: 'white', whiteSpace: 'pre-line' }}>{modalBanner.judul || 'Judul Banner'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Tag (emoji + teks)</label><input style={inputStyle} placeholder="🔥 Event Terbatas" value={modalBanner.tag} onChange={e => setModalBanner((b: any) => ({ ...b, tag: e.target.value }))} /></div>
                <div><label style={labelStyle}>Urutan</label><input style={inputStyle} type="number" value={modalBanner.urutan} onChange={e => setModalBanner((b: any) => ({ ...b, urutan: parseInt(e.target.value) }))} /></div>
              </div>
              <div><label style={labelStyle}>Judul (Enter untuk baris baru)</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder={'BONUS DEPOSIT\n100%'} value={modalBanner.judul} onChange={e => setModalBanner((b: any) => ({ ...b, judul: e.target.value }))} /></div>
              <div><label style={labelStyle}>Sub Judul</label><input style={inputStyle} placeholder="Deskripsi singkat promo" value={modalBanner.subjudul} onChange={e => setModalBanner((b: any) => ({ ...b, subjudul: e.target.value }))} /></div>
              <ImageUpload value={modalBanner.gambar_url} onChange={url => setModalBanner((b: any) => ({ ...b, gambar_url: url }))} folder="banner" label="Gambar Background (opsional)" />
              <div><label style={labelStyle}>Warna Background (CSS gradient)</label><input style={inputStyle} placeholder="linear-gradient(135deg,#0a0a30,#1a0040)" value={modalBanner.warna_bg} onChange={e => setModalBanner((b: any) => ({ ...b, warna_bg: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Teks Tombol</label><input style={inputStyle} placeholder="KLAIM SEKARANG" value={modalBanner.teks_tombol} onChange={e => setModalBanner((b: any) => ({ ...b, teks_tombol: e.target.value }))} /></div>
                <div><label style={labelStyle}>Link Tombol</label><input style={inputStyle} placeholder="/deposit" value={modalBanner.link_tombol} onChange={e => setModalBanner((b: any) => ({ ...b, link_tombol: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Jenis Promo</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={modalBanner.jenis} onChange={e => setModalBanner((b: any) => ({ ...b, jenis: e.target.value }))}>
                    {JENIS_PROMOSI.map(j => <option key={j} value={j} style={{ background: '#111130' }}>{j}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Jenis Custom</label><input style={inputStyle} placeholder="Jika jenis = lainnya" value={modalBanner.jenis_custom} onChange={e => setModalBanner((b: any) => ({ ...b, jenis_custom: e.target.value }))} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={modalBanner.aktif} onChange={e => setModalBanner((b: any) => ({ ...b, aktif: e.target.checked }))} />
                Banner Aktif
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSimpanBanner} style={{ flex: 1 }}>💾 Simpan</button>
                <button className="btn btn-outline" onClick={() => setModalBanner(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Promosi */}
      {modalPromosi && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, margin: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{modalPromosi.id ? '✏️ Edit Promosi' : '+ Tambah Promosi'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Judul</label><input style={inputStyle} placeholder="Bonus Deposit 100%" value={modalPromosi.judul} onChange={e => setModalPromosi((p: any) => ({ ...p, judul: e.target.value }))} /></div>
              <div><label style={labelStyle}>Slug URL (auto-generate jika kosong)</label><input style={inputStyle} placeholder="bonus-deposit-100" value={modalPromosi.slug} onChange={e => setModalPromosi((p: any) => ({ ...p, slug: e.target.value }))} /></div>
              <div><label style={labelStyle}>Deskripsi Singkat</label><input style={inputStyle} placeholder="Deskripsi untuk kartu promosi" value={modalPromosi.deskripsi} onChange={e => setModalPromosi((p: any) => ({ ...p, deskripsi: e.target.value }))} /></div>
              <ImageUpload value={modalPromosi.gambar_url} onChange={url => setModalPromosi((p: any) => ({ ...p, gambar_url: url }))} folder="promosi" label="Gambar Promosi" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Jenis</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={modalPromosi.jenis} onChange={e => setModalPromosi((p: any) => ({ ...p, jenis: e.target.value }))}>
                    {JENIS_PROMOSI.map(j => <option key={j} value={j} style={{ background: '#111130' }}>{j}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Jenis Custom</label><input style={inputStyle} placeholder="Jika lainnya" value={modalPromosi.jenis_custom} onChange={e => setModalPromosi((p: any) => ({ ...p, jenis_custom: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                <div><label style={labelStyle}>Bonus %</label><input style={inputStyle} type="number" value={modalPromosi.bonus_persen} onChange={e => setModalPromosi((p: any) => ({ ...p, bonus_persen: parseInt(e.target.value) || 0 }))} /></div>
                <div><label style={labelStyle}>Max Bonus</label><input style={inputStyle} type="number" value={modalPromosi.bonus_max} onChange={e => setModalPromosi((p: any) => ({ ...p, bonus_max: parseInt(e.target.value) || 0 }))} /></div>
                <div><label style={labelStyle}>Min Deposit</label><input style={inputStyle} type="number" value={modalPromosi.min_deposit} onChange={e => setModalPromosi((p: any) => ({ ...p, min_deposit: parseInt(e.target.value) || 0 }))} /></div>
                <div><label style={labelStyle}>Turnover</label><input style={inputStyle} type="number" value={modalPromosi.turnover} onChange={e => setModalPromosi((p: any) => ({ ...p, turnover: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div><label style={labelStyle}>Konten Artikel (Markdown)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
                  placeholder={'## Judul\n\n### Sub Judul\n\n- Poin 1\n- Poin 2\n\n1. Langkah 1\n2. Langkah 2'}
                  value={modalPromosi.konten} onChange={e => setModalPromosi((p: any) => ({ ...p, konten: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Urutan</label><input style={inputStyle} type="number" value={modalPromosi.urutan} onChange={e => setModalPromosi((p: any) => ({ ...p, urutan: parseInt(e.target.value) }))} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={modalPromosi.aktif} onChange={e => setModalPromosi((p: any) => ({ ...p, aktif: e.target.checked }))} />
                    Promosi Aktif
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSimpanPromosi} style={{ flex: 1 }}>💾 Simpan</button>
                <button className="btn btn-outline" onClick={() => setModalPromosi(null)} style={{ flex: 1 }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
