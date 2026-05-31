const getToken = () => localStorage.getItem('token')

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers as any) } })
  const data = await res.json()
  if (data.status === 0) throw new Error(data.error || data.msg || 'Terjadi kesalahan')
  return data as T
}

const get = <T>(path: string) => call<T>(path)
const post = <T>(path: string, body: unknown) => call<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const authApi = {
  register: (d: any) => post<any>('/auth/register', d),
  login: (d: any) => post<any>('/auth/login', d),
  cekUsername: (username: string) => post<any>('/auth/cek-username', { username }),
}

export const gameApi = {
  providers: () => get<any>('/game/provider'),
  list: (provider: string) => get<any>(`/game/list?provider=${provider}`),
  main: (d: any) => post<any>('/game/main', d),
}

export const userApi = {
  profil: () => get<any>('/user/profil'),
  updateProfil: (d: any) => post<any>('/user/profil', d),
  saldo: () => get<any>('/user/saldo'),
  riwayat: (halaman = 0) => get<any>(`/user/riwayat?halaman=${halaman}`),
  withdraw: () => get<any>('/user/withdraw'),
  buatWithdraw: (d: any) => post<any>('/user/withdraw', d),
}

export const depositApi = {
  buat: (jumlah: number, metode: string) => post<any>('/deposit/buat', { jumlah, metode }),
}

export const adminApi = {
  withdrawList: (status = 'pending') => get<any>(`/admin/withdraw?status=${status}`),
  prosesWithdraw: (d: any) => post<any>('/admin/withdraw', d),
  depositList: (status = 'pending') => get<any>(`/admin/deposit?status=${status}`),
  konfirmasiDeposit: (deposit_id: string) => post<any>('/deposit/konfirmasi', { deposit_id }),
}

export const aktivitasApi = {
  get: () => get<any>('/aktivitas'),
}
