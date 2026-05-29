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

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  login: (token, user) => {
    localStorage.setItem('token', token)
    set({ token, user, isLoggedIn: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, isLoggedIn: false })
  },
  updateSaldo: (saldo) => set((s) => ({ user: s.user ? { ...s.user, saldo } : null })),
}))
