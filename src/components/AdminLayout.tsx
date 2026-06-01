import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { label: '📊 Dashboard', path: '/admin' },
  { label: '💰 Deposit', path: '/admin?tab=deposit' },
  { label: '💸 Withdraw', path: '/admin?tab=withdraw' },
  { label: '👥 Users', path: '/admin?tab=users' },
  { label: '🎮 Providers', path: '/admin?tab=providers' },
  { label: '🖼️ Banner', path: '/admin?tab=banner' },
  { label: '🎁 Promosi', path: '/admin?tab=promosi' },
  { label: '⚙️ Settings', path: '/admin?tab=settings' },
  { label: '💬 Live Chat', path: '/admin/chat' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { nama } = useBrand()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = window.innerWidth < 768

  const handleLogout = () => {
    logout()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin' && !location.search) return true
    if (path.includes('?tab=')) {
      const tab = path.split('?tab=')[1]
      return location.search.includes(`tab=${tab}`)
    }
    return location.pathname === path
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Header Admin */}
      <header style={{ background: 'rgba(8,8,32,0.98)', borderBottom: '1px solid rgba(255,215,0,0.2)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Logo - klik refresh dashboard */}
          <div onClick={() => navigate('/admin')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
              👑 DASHBOARD
              <div style={{ fontSize: 7, letterSpacing: 4, color: 'var(--gold)', WebkitTextFillColor: 'var(--gold)', marginTop: 1 }}>{nama || 'INDONETWORK'}</div>
            </div>
          </div>

          {/* Desktop Nav */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {NAV_ITEMS.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ padding: '6px 10px', fontSize: 11, color: isActive(item.path) ? 'var(--gold)' : 'var(--muted)', fontWeight: 600, borderRadius: 6, transition: 'all 0.2s', whiteSpace: 'nowrap', background: isActive(item.path) ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'rgba(255,215,0,0.05)' }}}
                  onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}}>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a href="/" target="_blank" style={{ fontSize: 11, color: 'var(--muted)', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', textDecoration: 'none' }}>🌐 Website</a>
            <button onClick={handleLogout} style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid var(--pink)', color: 'var(--pink)', cursor: 'pointer', fontSize: 11, padding: '5px 12px', borderRadius: 6, fontWeight: 600 }}>Keluar</button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobile && (
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 8px 8px', gap: 4, borderTop: '1px solid rgba(255,215,0,0.1)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ padding: '5px 10px', fontSize: 10, color: isActive(item.path) ? 'var(--gold)' : 'var(--muted)', fontWeight: 600, borderRadius: 6, whiteSpace: 'nowrap', background: isActive(item.path) ? 'rgba(255,215,0,0.1)' : 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

    </div>
  )
}
