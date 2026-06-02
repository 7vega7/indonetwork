import { create } from 'zustand'

interface BrandStore {
  nama: string
  tagline: string
  logo_url: string
  warna_utama: string
  warna_aksen: string
  warna_ketiga: string
  maintenance_aktif: boolean
  maintenance_pesan: string
  whatsapp_url: string
  telegram_url: string
  livechat_url: string
  footer_teks: string
  marquee_teks: string
  min_deposit: number
  min_withdraw: number
  max_withdraw: number
  loaded: boolean
  popup_aktif: boolean
  popup_judul: string
  popup_pesan: string
  popup_gambar_url: string
  popup_tombol_teks: string
  popup_tombol_url: string
  download_apk_url: string
  freebet_nominal_display: string
  load: () => Promise<void>
}

export const useBrand = create<BrandStore>((set) => ({
  nama: 'INDONETWORK',
  tagline: 'CASINO',
  logo_url: '',
  warna_utama: '#00c8ff',
  warna_aksen: '#ff2d78',
  warna_ketiga: '#7b2fff',
  maintenance_aktif: false,
  maintenance_pesan: '',
  whatsapp_url: '',
  telegram_url: '',
  livechat_url: '',
  footer_teks: 'Platform game online terpercaya dengan sistem keamanan terdepan dan layanan 24 jam.',
  marquee_teks: '🏆 DAFTAR & BONUS 100% • 🎰 DEPOSIT QRIS INSTAN • 💎 JACKPOT IDR 500 JUTA • ⚡ WITHDRAW 2 MENIT',
  min_deposit: 10000,
  min_withdraw: 50000,
  max_withdraw: 50000000,
  loaded: false,
  popup_aktif: false,
  popup_judul: 'Download Aplikasi & Dapat Freebet!',
  popup_pesan: 'Download aplikasi kami dan daftar untuk mendapatkan freebet gratis!',
  popup_gambar_url: '',
  popup_tombol_teks: 'Download Sekarang',
  popup_tombol_url: '/download',
  download_apk_url: '',
  freebet_nominal_display: 'Rp 10.000',
  load: async () => {
    try {
      const res = await fetch('/api/brand')
      const data = await res.json()
      if (data.status === 1) {
        set({ ...data.brand, loaded: true })
        // Update CSS variables
        const root = document.documentElement
        if (data.brand.warna_utama) root.style.setProperty('--blue', data.brand.warna_utama)
        if (data.brand.warna_aksen) root.style.setProperty('--pink', data.brand.warna_aksen)
        if (data.brand.warna_ketiga) root.style.setProperty('--purple', data.brand.warna_ketiga)
        // Update title
        if (data.brand.nama) document.title = data.brand.nama
        // Update favicon
        if (data.brand.favicon_url) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
          link.rel = 'icon'
          link.href = data.brand.favicon_url
          document.head.appendChild(link)
        }
      }
    } catch {}
  }
}))
