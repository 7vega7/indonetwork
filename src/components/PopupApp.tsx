import { useState, useEffect } from 'react'
import { useBrand } from '../hooks/useBrand'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function PopupApp() {
  const brand = useBrand()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!brand.popup_aktif || !brand.loaded) return

    // Cek target
    const target = brand.popup_target || 'semua'
    if (target === 'belum_login' && isLoggedIn) return
    if (target === 'sudah_login' && !isLoggedIn) return

    // Cek frekuensi
    const freq = brand.popup_frekuensi || 'sekali_sesi'
    const storageKey = `popup_shown_${brand.popup_judul?.substring(0,10)}`

    if (freq === 'sekali_selamanya') {
      if (localStorage.getItem(storageKey)) return
    } else if (freq === 'sekali_sesi') {
      if (sessionStorage.getItem(storageKey)) return
    }
    // 'setiap_kunjungan' = selalu tampil

    const t = setTimeout(() => {
      setShow(true)
      if (freq === 'sekali_selamanya') localStorage.setItem(storageKey, '1')
      else if (freq === 'sekali_sesi') sessionStorage.setItem(storageKey, '1')
    }, 1500)

    return () => clearTimeout(t)
  }, [brand.popup_aktif, brand.loaded, isLoggedIn])

  if (!show) return null

  const handleTombol = () => {
    setShow(false)
    if (!brand.popup_tombol_url) return
    if (brand.popup_tombol_url.startsWith('http')) {
      window.open(brand.popup_tombol_url, '_blank')
    } else {
      navigate(brand.popup_tombol_url)
    }
  }

  const tipe = brand.popup_tipe || 'custom'
  const warna = brand.popup_warna || 'linear-gradient(135deg,#7b2fff,#ff2d78)'
  const ikon = brand.popup_ikon || '📢'

  // Render konten berdasarkan tipe
  const renderKonten = () => {
    if (tipe === 'freebet') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { no: '1', teks: 'Download aplikasi GRATIS', ikon: '📲' },
          { no: '2', teks: 'Daftar akun baru via aplikasi', ikon: '📝' },
          { no: '3', teks: `Dapat freebet ${brand.freebet_nominal_display} langsung!`, ikon: '🎉' },
        ].map(s => (
          <div key={s.no} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: warna, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.no}</div>
            <span style={{ fontSize: 13 }}>{s.ikon} {s.teks}</span>
          </div>
        ))}
      </div>
    )

    if (tipe === 'pengumuman') return (
      <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{brand.popup_pesan}</p>
      </div>
    )

    if (tipe === 'promo') return (
      <div style={{ marginBottom: 20 }}>
        {brand.popup_gambar_url && (
          <img src={brand.popup_gambar_url} alt="promo"
            style={{ width: '100%', borderRadius: 10, marginBottom: 12, maxHeight: 160, objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, textAlign: 'center' }}>{brand.popup_pesan}</p>
      </div>
    )

    // Custom / default
    return (
      <div style={{ marginBottom: 20 }}>
        {brand.popup_gambar_url && (
          <img src={brand.popup_gambar_url} alt="popup"
            style={{ width: '100%', borderRadius: 10, marginBottom: 12, maxHeight: 160, objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, textAlign: 'center' }}>{brand.popup_pesan}</p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) setShow(false) }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, maxWidth: 380, width: '100%', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ background: warna, padding: '24px 20px 20px', textAlign: 'center', position: 'relative' }}>
          <button onClick={() => setShow(false)} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', width: 28, height: 28, borderRadius: '50%',
            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          <div style={{ fontSize: 52, marginBottom: 10 }}>{ikon}</div>

          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
            {brand.popup_judul}
          </div>

          {tipe === 'freebet' && (
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'white', fontWeight: 700 }}>
              🎰 FREEBET {brand.freebet_nominal_display}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 24px' }}>
          {renderKonten()}

          {brand.popup_tombol_teks && brand.popup_tombol_url && (
            <button onClick={handleTombol} className="btn btn-primary"
              style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700, borderRadius: 10, marginBottom: 10 }}>
              {brand.popup_tombol_teks}
            </button>
          )}

          <button onClick={() => setShow(false)}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 8 }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
