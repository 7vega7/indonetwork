export const NOMINAL_POOL = [
  12000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
  50000, 55000, 60000, 75000, 80000, 85000, 90000, 95000,
  100000, 125000, 150000, 175000, 187500, 200000, 225000,
  250000, 275000, 300000, 320000, 350000, 375000, 400000,
  425000, 450000, 475000, 487000, 498000, 500000,
  550000, 600000, 650000, 700000, 750000, 800000, 850000,
  900000, 950000, 1000000, 1250000, 1500000, 1750000,
  2000000, 2500000, 3000000, 3500000, 4000000, 5000000,
  7500000, 10000000, 15000000, 20000000, 25000000,
]

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const ANGKA = '0123456789'
const ALPHANUMERIC = ALPHABET + ANGKA

export const TYPE_POOL = [
  'deposit','deposit','deposit','deposit',
  'withdraw','withdraw','withdraw',
  'deposit','withdraw',
]

// Generate nama fiktif: 1 huruf acak + 2-5 bintang + 1 huruf/angka acak
export function randomNamaFiktif(): string {
  const depan = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  const jumlahBintang = 2 + Math.floor(Math.random() * 4) // 2-5 bintang
  const bintang = '*'.repeat(jumlahBintang)
  const belakang = ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]
  return `${depan}${bintang}${belakang}`
}

// Sensor nama user asli: huruf depan + bintang + huruf/angka belakang
export function sensorNama(nama: string): string {
  if (!nama || nama.length === 0) return randomNamaFiktif()
  if (nama.length === 1) return nama[0] + '***' + ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]
  const depan = nama[0]
  const belakang = nama[nama.length - 1]
  const jumlahBintang = Math.min(Math.max(nama.length - 2, 2), 5)
  const bintang = '*'.repeat(jumlahBintang)
  return `${depan}${bintang}${belakang}`
}

export function randomAktivitas() {
  const type = TYPE_POOL[Math.floor(Math.random() * TYPE_POOL.length)]
  const jumlah = NOMINAL_POOL[Math.floor(Math.random() * NOMINAL_POOL.length)]
  return { nama: randomNamaFiktif(), jumlah, type }
}

export const AKTIVITAS_AWAL = Array.from({ length: 10 }, randomAktivitas)
