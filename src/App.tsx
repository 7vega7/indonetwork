import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Beranda from './pages/Beranda'
import Login from './pages/Login'
import Register from './pages/Register'
import Game from './pages/Game'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import Profil from './pages/Profil'
import Riwayat from './pages/Riwayat'

function Guard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/masuk" replace />
}

export default function App() {
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
      </Route>
    </Routes>
  )
}
