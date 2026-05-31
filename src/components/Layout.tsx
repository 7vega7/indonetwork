import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { label: 'Beranda', icon: '🏠', path: '/' },
  { label: 'Game', icon: '🎰', path: '/game/PRAGMATIC' },
  { label: 'Deposit', icon: '💰', path: '/deposit' },
  { label: 'Withdraw', icon: '💸', path: '/withdraw' },
  { label: 'Profil', icon: '👤', path: '/profil' },
]

export default function Layout() {
  const { isLoggedIn, user, logout, syncSaldo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    syncSaldo()
    // Sync saat user kembali ke tab
    const onVisible = () => { if (document.visibilityState === 'visible') syncSaldo() }
    document.addEventListener('visibilitychange', onVisible)
    // Sync setiap 60 detik
    const interval = setInterval(() => syncSaldo(), 60000)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isLoggedIn])

  const handleLogout = () => {
    logout()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: isLoggedIn ? 60 : 0 }}>

      {/* Ticker */}
      <div style={{ background: '#0d0d2b', borderBottom: '1px solid rgba(255,45,120,0.3)', padding: '5px 0', overflow: 'hidden' }}>
        <div style={{ whiteSpace: 'nowrap', animation: 'marquee 35s linear infinite', fontSize: 11, color: 'var(--gold)', fontWeight: 600, letterSpacing: 1 }}>
          🏆 DAFTAR & BONUS 100%&nbsp;&nbsp;•&nbsp;&nbsp;🎰 DEPOSIT QRIS INSTAN&nbsp;&nbsp;•&nbsp;&nbsp;💎 JACKPOT IDR 500 JUTA&nbsp;&nbsp;•&nbsp;&nbsp;⚡ WITHDRAW 2 MENIT&nbsp;&nbsp;•&nbsp;&nbsp;🎁 FREEBET IDR 50.000&nbsp;&nbsp;•&nbsp;&nbsp;🏆 DAFTAR & BONUS 100%&nbsp;&nbsp;•&nbsp;&nbsp;🎰 DEPOSIT QRIS INSTAN
        </div>
      </div>

      {/* Header */}
      <header style={{ background: 'rgba(8,8,32,0.98)', borderBottom: '1px solid rgba(0,200,255,0.15)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, letterSpacing: 2, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
              INDONETWORK
              <div style={{ fontSize: 7, letterSpacing: 5, color: 'var(--gold)', WebkitTextFillColor: 'var(--gold)', marginTop: 1 }}>CASINO</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          {isLoggedIn && (
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
              {NAV_ITEMS.map(item => (
                <Link key={item.path} to={item.path} style={{
                  padding: '6px 10px', fontSize: 12, color: isActive(item.path) ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: 600, borderRadius: 6, transition: 'all 0.2s', whiteSpace: 'nowrap',
                  background: isActive(item.path) ? 'rgba(0,200,255,0.08)' : 'transparent',
                }}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isLoggedIn && user ? (
              <>
                <div style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--blue)', whiteSpace: 'nowrap' }}>
                  💰 {user.saldo.toLocaleString('id-ID')}
                </div>
                <span className="desktop-only" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {user.username}
                </span>
                <button onClick={handleLogout} className="desktop-only" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: '5px 10px', borderRadius: 6 }}>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/masuk" className="btn btn-outline" style={{ padding: '7px 16px', fontSize: 13 }}>Masuk</Link>
                <Link to="/daftar" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Daftar</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Bottom Navigation Mobile */}
      {isLoggedIn && (
        <nav className="mobile-only" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,8,32,0.98)', borderTop: '1px solid rgba(0,200,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
        }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 4px', fontSize: 9, fontWeight: 600, gap: 3,
              color: isActive(item.path) ? 'var(--blue)' : 'var(--muted)',
              transition: 'color 0.2s',
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', fontSize: 9, fontWeight: 600, gap: 3, color: 'var(--muted)', cursor: 'pointer' }}
            onClick={handleLogout}>
            <span style={{ fontSize: 20 }}>🚪</span>
            Keluar
          </div>
        </nav>
      )}

      {/* Footer - desktop only */}
      <footer className="desktop-only" style={{ background: 'var(--bg3)', borderTop: '1px solid rgba(0,200,255,0.1)', padding: '24px 20px 16px', marginTop: 32 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>INDONETWORK</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 300, lineHeight: 1.6 }}>Platform game online terpercaya dengan sistem keamanan terdepan dan layanan 24 jam.</div>
          </div>
          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { judul: 'Game', links: ['🎰 Slot', '🃏 Live Casino', '🚀 Crash Game', '⚽ Sportsbook'] },
              { judul: 'Bantuan', links: ['📱 WhatsApp', '💬 Live Chat', '📩 Telegram'] },
            ].map(({ judul, links }) => (
              <div key={judul}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 8, letterSpacing: 1 }}>{judul.toUpperCase()}</div>
                {links.map(l => <div key={l} style={{ fontSize: 12, color: 'var(--muted)', padding: '2px 0', cursor: 'pointer' }}>{l}</div>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap', gap: 8 }}>
          <span>© 2024 INDONETWORK. Hak Cipta Dilindungi.</span>
          <span>⚠️ Khusus 18+ | Bermain Secara Bertanggung Jawab</span>
        </div>
      </footer>
    </div>
  )
}
// Auto sync saldo setiap 30 detik
