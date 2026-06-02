import { useState, useEffect } from 'react'
import { useBrand } from '../hooks/useBrand'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function PopupApp() {
  const { popup_aktif, popup_judul, popup_pesan, popup_gambar_url, popup_tombol_teks, popup_tombol_url, freebet_nominal_display } = useBrand()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!popup_aktif) return
    if (isLoggedIn) return // Tidak tampil untuk yang sudah login
    // Tampil sekali per sesi
    const sudahTampil = sessionStorage.getItem('popup_shown')
    if (sudahTampil) return
    // Delay 2 detik sebelum muncul
    const t = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem('popup_shown', '1')
    }, 2000)
    return () => clearTimeout(t)
  }, [popup_aktif, isLoggedIn])

  if (!show) return null

  const handleTombol = () => {
    setShow(false)
    if (popup_tombol_url.startsWith('http')) {
      window.open(popup_tombol_url, '_blank')
    } else {
      navigate(popup_tombol_url)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) setShow(false) }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: 16, maxWidth: 380, width: '100%',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeInUp 0.3s ease',
      }}>
        {/* Header gradient */}
        <div style={{
          background: 'linear-gradient(135deg,#7b2fff,#ff2d78)',
          padding: '24px 20px 20px', textAlign: 'center', position: 'relative',
        }}>
          <button onClick={() => setShow(false)} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', width: 28, height: 28, borderRadius: '50%',
            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          {popup_gambar_url ? (
            <img src={popup_gambar_url} alt="promo"
              style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 12, borderRadius: 12 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎁</div>
          )}

          <div style={{
            fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900,
            color: 'white', lineHeight: 1.2, marginBottom: 6,
          }}>{popup_judul}</div>

          {/* Badge freebet */}
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '4px 14px', fontSize: 13, color: 'white', fontWeight: 700,
          }}>
            🎰 FREEBET {freebet_nominal_display}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
            {popup_pesan}
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { no: '1', teks: 'Download aplikasi GRATIS', ikon: '📱' },
              { no: '2', teks: 'Daftar akun baru via aplikasi', ikon: '📝' },
              { no: '3', teks: `Dapat freebet ${freebet_nominal_display} langsung!`, ikon: '🎉' },
            ].map(s => (
              <div key={s.no} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.no}</div>
                <span style={{ fontSize: 13 }}>{s.ikon} {s.teks}</span>
              </div>
            ))}
          </div>

          <button onClick={handleTombol} className="btn btn-primary"
            style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 10 }}>
            📲 {popup_tombol_teks}
          </button>

          <button onClick={() => setShow(false)}
            style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 8 }}>
            Tidak, terima kasih
          </button>
        </div>
      </div>
    </div>
  )
}
