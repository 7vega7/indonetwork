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
  syncSaldo: () => Promise<void>
}

function restoreUser(): User | null {
  try {
    const stored = localStorage.getItem('user')
    if (stored) return JSON.parse(stored)
  } catch { }
  return null
}

export const useAuth = create<AuthStore>((set, get) => ({
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
  syncSaldo: async () => {
    const { token, user } = get()
    if (!token || !user) return
    try {
      const res = await fetch('/user/saldo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.status === 1 && data.saldo !== undefined) {
        const updatedUser = { ...user, saldo: data.saldo }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        set({ user: updatedUser })
      }
    } catch(e) { console.error('syncSaldo error:', e) }
  },
}))
