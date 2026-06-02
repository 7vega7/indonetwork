# Platform Game Online

Platform game online berbasis web yang dapat dikustomisasi sepenuhnya.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Cloudflare Pages Functions
- Database: Supabase (PostgreSQL)
- Game API: NexusGGR (Transfer API)
- Payment: JayaPay
- Proxy: Render.com (Node.js)
- Auth: Cloudflare Turnstile
- Storage: Supabase Storage
- Notifikasi: Telegram Bot

## Setup

### 1. Clone & Install

    git clone https://github.com/7vega7/indonetwork.git
    cd indonetwork
    npm install

### 2. Cloudflare Pages Environment Variables

    SUPABASE_URL         = URL project Supabase
    SUPABASE_SERVICE_KEY = Service role key Supabase
    JWT_SECRET           = Secret key JWT min 32 karakter
    NEXUS_AGENT_CODE     = Agent code NexusGGR
    NEXUS_AGENT_TOKEN    = Agent token NexusGGR
    TURNSTILE_SECRET_KEY = Secret key Cloudflare Turnstile

### 3. Build Settings

    Build command : npm run build
    Build output  : dist

### 4. Buat Akun Owner Pertama

Register akun lalu jalankan SQL di Supabase:

    UPDATE public.users SET role = 'owner' WHERE username = 'USERNAME_KAMU';

## API yang Digunakan

### NexusGGR
- Mode: Transfer API
- Proxy via Render.com (IP harus di-whitelist)
- Methods: user_create, user_deposit, user_withdraw, user_balance, game_list, game_launch

### JayaPay
- Endpoint: https://openapi.jayapayment.com
- Signature: RSA PKCS#1 v1.5
- Metode: QRIS, DANA, BRI, BNI, PERMATA, MANDIRI, CIMB
- Callback URL: https://DOMAIN/deposit/callback

### Supabase
- REST API untuk database
- Storage untuk upload gambar
- Realtime untuk live chat

### Cloudflare Turnstile
- Anti-bot di halaman login dan register

### Telegram Bot
- Notifikasi deposit dan withdraw masuk
- Setup: dapatkan token dari @BotFather, chat ID dari @userinfobot

## Settings Dashboard Admin

### Brand
    brand_nama, brand_tagline, brand_logo_url, brand_favicon_url
    brand_warna_utama, brand_warna_aksen, brand_warna_ketiga

### Sistem
    maintenance_aktif, maintenance_pesan

### Transaksi
    min_deposit, min_withdraw, max_withdraw, deposit_timeout_menit

### Freebet dan Bonus
    freebet_aktif, freebet_jumlah, freebet_ref, freebet_nominal_display
    register_bonus_aktif, register_bonus_jumlah

### Popup dan Download
    popup_aktif       = on/off popup
    popup_tipe        = freebet / pengumuman / promo / custom
    popup_judul       = judul popup
    popup_pesan       = isi pesan popup
    popup_ikon        = emoji ikon
    popup_warna       = warna gradient header CSS
    popup_gambar_url  = URL gambar opsional
    popup_tombol_teks = teks tombol
    popup_tombol_url  = URL tombol
    popup_target      = semua / belum_login / sudah_login
    popup_frekuensi   = sekali_sesi / setiap_kunjungan / sekali_selamanya
    download_apk_url  = URL download APK

### Konten
    marquee_teks, footer_teks
    whatsapp_url, telegram_url, livechat_url

### JayaPay
    jayapay_aktif, jayapay_merchant_code
    jayapay_private_key, jayapay_public_key
    jayapay_notify_url, jayapay_mode

### Telegram
    telegram_bot_token, telegram_chat_id

## Sistem Role

    owner  = Semua fitur + kelola staff
    admin  = Deposit, Withdraw, Users, Live Chat
    cs     = Live Chat saja
    user   = User biasa

## Game Provider (NexusGGR)

Slot: PRAGMATIC, PGSOFT, HABANERO, BOOONGO, PLAYSON, CQ9, EVOPLAY,
      TOPTREND, DREAMTECH, REELKINGDOM, HACKSAW, FATPANDA, FACHAI,
      PLAYNGO, AMUSNET, EGT, SPADEGAMING, FASTSPIN

Live Casino : PP_LIVE_PRO
Crash Game  : SPRIBE
Sportsbook  : SPORTSBOOK

## Android App

Link freebet untuk APK:

    https://DOMAIN/daftar?ref=app

User yang mendaftar melalui link ini otomatis mendapat freebet.
Kode ref dapat diubah di setting freebet_ref.

## Keamanan

- Password di-hash dengan PBKDF2 100.000 iterasi
- JWT untuk autentikasi session
- Cloudflare Turnstile untuk anti-bot
- Validasi duplikat email, WhatsApp, dan rekening
- Role-based access control

## Catatan Penting

1. Hapus bypass Turnstile bypass-dev-2024 sebelum production
2. Whitelist IP Render.com di panel NexusGGR
3. Set callback URL JayaPay ke https://DOMAIN/deposit/callback
4. Backup JWT_SECRET karena jika berubah semua user harus login ulang
5. Jangan expose SUPABASE_SERVICE_KEY ke frontend
