import { create } from 'zustand'

interface User {
  id: string
  username: string
  email: string
  saldo: number
  role: 'user' | 'admin'
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateSaldo: (saldo: number) => void
}

// Restore user dari localStorage saat app load
function restoreUser(): User | null {
  try {
    const stored = localStorage.getItem('user')
    if (stored) return JSON.parse(stored)
  } catch { }
  return null
}

export const useAuth = create<AuthStore>((set) => ({
  user: restoreUser(),
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token') && !!localStorage.getItem('user'),
  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isLoggedIn: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null, isLoggedIn: false })
  },
  updateSaldo: (saldo) => set((s) => {
    if (!s.user) return {}
    const updatedUser = { ...s.user, saldo }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    return { user: updatedUser }
  }),
}))
