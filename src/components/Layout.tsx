import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Hot Games', icon: '🔥', path: '/game/PRAGMATIC' },
  { label: 'Slot', icon: '🎰', path: '/game/PGSOFT' },
  { label: 'Live Casino', icon: '🃏', path: '/game/EVOLUTION' },
  { label: 'Olahraga', icon: '⚽', path: '/game/sport' },
  { label: 'Promosi', icon: '🎁', path: '/' },
]

export default function Layout() {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Berhasil keluar')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Ticker */}
      <div style={{ background: '#0d0d2b', borderBottom: '1px solid rgba(255,45,120,0.3)', padding: '5px 0', overflow: 'hidden' }}>
        <div style={{ whiteSpace: 'nowrap', animation: 'marquee 35s linear infinite', fontSize: 11, color: 'var(--gold)', fontWeight: 600, letterSpacing: 1 }}>
          🏆 DAFTAR SEKARANG & DAPATKAN BONUS 100%&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;🎰 DEPOSIT QRIS INSTAN&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;💎 JACKPOT HINGGA IDR 500 JUTA&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;⚡ WITHDRAW CEPAT 2 MENIT&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;🎁 FREEBET NEW MEMBER IDR 50.000&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;🏆 DAFTAR SEKARANG & DAPATKAN BONUS 100%&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;🎰 DEPOSIT QRIS INSTAN&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;💎 JACKPOT HINGGA IDR 500 JUTA
        </div>
      </div>

      {/* Header */}
      <header style={{ background: 'rgba(8,8,32,0.98)', borderBottom: '1px solid rgba(0,200,255,0.15)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <Link to="/">
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
              INDONETWORK
              <div style={{ fontSize: 8, letterSpacing: 6, color: 'var(--gold)', WebkitTextFillColor: 'var(--gold)', marginTop: 1 }}>CASINO</div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isLoggedIn && user ? (
              <>
                <div style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, padding: '6px 14px', fontSize: 13, color: 'var(--blue)' }}>
                  💰 Rp {user.saldo.toLocaleString('id-ID')}
                </div>
                <Link to="/profil" style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 10px' }}>
                  👤 {user.username}
                </Link>
                <Link to="/deposit" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>+ Deposit</Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Keluar</button>
              </>
            ) : (
              <>
                <Link to="/masuk" className="btn btn-outline" style={{ padding: '8px 20px' }}>Masuk</Link>
                <Link to="/daftar" className="btn btn-primary" style={{ padding: '8px 20px' }}>Daftar</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: 'var(--bg3)', borderBottom: '1px solid rgba(255,45,120,0.15)', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', padding: '0 16px' }}>
          {NAV.map(item => (
            <Link key={item.path} to={item.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', fontWeight: 600, gap: 3, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--bg3)', borderTop: '1px solid rgba(0,200,255,0.1)', padding: '24px 20px 16px', marginTop: 32 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>INDONETWORK</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 300, lineHeight: 1.6 }}>Platform game online terpercaya dengan sistem keamanan terdepan dan layanan 24 jam.</div>
          </div>
          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { judul: 'Game', links: ['Slot Online', 'Live Casino', 'Olahraga'] },
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
