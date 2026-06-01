import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useBrand } from './hooks/useBrand'
import Layout from './components/Layout'
import Beranda from './pages/Beranda'
import Login from './pages/Login'
import Register from './pages/Register'
import Game from './pages/Game'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import Profil from './pages/Profil'
import Riwayat from './pages/Riwayat'
import Admin from './pages/Admin'
import Promosi from './pages/Promosi'
import AdminLogin from './pages/AdminLogin'
import AdminChat from './pages/AdminChat'

function Guard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/masuk" replace />
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/admin-login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { user } = useAuth()
  const { maintenance_aktif, maintenance_pesan, nama, loaded } = useBrand()

  const isAdmin = user?.role === 'admin'
  const isAdminLoginPath = window.location.hash.includes('/admin-login')
  const path = window.location.hash

// Maintenance mode
  if (maintenance_aktif && loaded && !isAdmin && !isAdminLoginPath) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 20 }}>{nama || 'INDONETWORK'}</div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>MAINTENANCE</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{maintenance_pesan || 'Website sedang dalam pemeliharaan.'}</div>

      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Beranda />} />
        <Route path="masuk" element={<Login />} />
        <Route path="daftar" element={<Register />} />
        <Route path="game/:provider?" element={<Guard><Game /></Guard>} />
        <Route path="deposit" element={<Guard><Deposit /></Guard>} />
        <Route path="withdraw" element={<Guard><Withdraw /></Guard>} />
        <Route path="profil" element={<Guard><Profil /></Guard>} />
        <Route path="riwayat" element={<Guard><Riwayat /></Guard>} />
        <Route path="promosi" element={<Promosi />} />
        <Route path="promosi/:slug" element={<Promosi />} />
        <Route path="admin" element={<AdminGuard><Admin /></AdminGuard>} />
        <Route path="admin-login" element={<AdminLogin />} />
      </Route>
      <Route path="/admin/chat" element={<AdminGuard><AdminChat /></AdminGuard>} />
    </Routes>
  )
}
