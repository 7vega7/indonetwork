import { useNavigate } from 'react-router-dom'
import { useBrand } from '../hooks/useBrand'

export default function Download() {
  const { nama, download_apk_url, freebet_nominal_display } = useBrand()
  const navigate = useNavigate()
  const isMobile = window.innerWidth < 768

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>

      {/* Hero */}
      <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 16, background: 'linear-gradient(135deg,rgba(123,47,255,0.2),rgba(255,45,120,0.2))', borderColor: 'rgba(255,45,120,0.3)' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>📱</div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#00c8ff,#7b2fff,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>
          Download Aplikasi {nama}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Download aplikasi dan daftar akun baru untuk mendapatkan freebet {freebet_nominal_display} secara gratis!
        </p>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,230,118,0.1)', border: '1px solid #00e676', borderRadius: 20, padding: '8px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 900, color: '#00e676' }}>FREEBET {freebet_nominal_display}</span>
        </div>

        {download_apk_url ? (
          <a href={download_apk_url} className="btn btn-primary"
            style={{ display: 'block', width: '100%', padding: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', borderRadius: 10 }}>
            📲 Download APK Sekarang
          </a>
        ) : (
          <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', borderRadius: 10, padding: 14, fontSize: 13, color: 'var(--gold)' }}>
            🔜 Aplikasi segera tersedia!
          </div>
        )}
      </div>

      {/* Cara dapat freebet */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--gold)' }}>🎯 Cara Dapat Freebet</div>
        {[
          { no: 1, judul: 'Download Aplikasi', desc: 'Download APK aplikasi resmi kami secara gratis', ikon: '📲' },
          { no: 2, judul: 'Install di HP Kamu', desc: 'Aktifkan "Install dari sumber tidak dikenal" di pengaturan', ikon: '⚙️' },
          { no: 3, judul: 'Daftar Akun Baru', desc: 'Buat akun baru melalui aplikasi dengan data lengkap', ikon: '📝' },
          { no: 4, judul: 'Freebet Otomatis Masuk', desc: `Saldo freebet ${freebet_nominal_display} langsung masuk ke akun kamu!`, ikon: '🎉' },
        ].map(s => (
          <div key={s.no} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flexShrink: 0, fontFamily: 'var(--display)' }}>{s.no}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.ikon} {s.judul}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Syarat */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--blue)' }}>📋 Syarat & Ketentuan</div>
        {[
          'Freebet hanya untuk pendaftar baru melalui aplikasi',
          'Setiap perangkat hanya bisa mendapat freebet 1 kali',
          'Freebet tidak dapat ditarik, hanya untuk bermain',
          `Minimal turnover ${freebet_nominal_display} sebelum withdraw`,
          'Program dapat berubah sewaktu-waktu',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0 }}>•</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
