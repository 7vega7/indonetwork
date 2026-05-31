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

export const NAMA_POOL = [
  'budi','sari','agus','fitri','eko','rina','harto',
  'yuli','andi','putra','dewi','sunu','indah','wahyu',
  'ratna','dian','reza','maya','bayu','laras','farhan',
  'nadia','rizky','tania','gilang','putri','kevin','sinta',
  'arif','cindy','doni','elsa','fajar','gita','hendra',
  'irma','joko','kiki','lina','mira','nanda','oka',
  'pandu','rini','stevn','tika','umar','vina',
  'wawan','yoga','zara','bram','cici','dedi','evi',
]

export const TYPE_POOL = [
  'deposit','deposit','deposit','deposit', // 50%
  'withdraw','withdraw','withdraw',        // 37.5%
  'deposit','withdraw',                   // mixed
]

export function sensorNama(nama: string): string {
  if (!nama || nama.length === 0) return 'a***a'
  if (nama.length === 1) return nama + '***'
  if (nama.length === 2) return nama[0] + '***' + nama[1]
  const depan = nama[0]
  const belakang = nama[nama.length - 1]
  const bintang = '*'.repeat(Math.min(Math.max(nama.length - 2, 2), 5))
  return `${depan}${bintang}${belakang}`
}

export function randomAktivitas() {
  const type = TYPE_POOL[Math.floor(Math.random() * TYPE_POOL.length)]
  const nama = NAMA_POOL[Math.floor(Math.random() * NAMA_POOL.length)]
  const jumlah = NOMINAL_POOL[Math.floor(Math.random() * NOMINAL_POOL.length)]
  return { nama: sensorNama(nama), jumlah, type }
}

export const AKTIVITAS_AWAL = Array.from({ length: 10 }, randomAktivitas)
