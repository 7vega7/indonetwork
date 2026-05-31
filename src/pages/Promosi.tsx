import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const JENIS_LABEL: Record<string, string> = {
  deposit: '💰 Bonus Deposit',
  turnover: '🔄 Turnover',
  cashback: '💸 Cashback',
  referral: '👥 Referral',
  lainnya: '🎁 Promo Lainnya',
}

const JENIS_COLOR: Record<string, string> = {
  deposit: 'var(--pink)',
  turnover: 'var(--blue)',
  cashback: '#ff9500',
  referral: 'var(--gold)',
  lainnya: 'var(--purple)',
}

export default function Promosi() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [promosiList, setPromosiList] = useState<any[]>([])
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    if (slug) {
      // Load detail promosi
      fetch(`/promosi?slug=${slug}`)
        .then(r => r.json())
        .then(res => { if (res.promosi) setDetail(res.promosi) })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      // Load list promosi
      fetch('/promosi')
        .then(r => r.json())
        .then(res => setPromosiList(res.promosi || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [slug])

  // Render konten markdown sederhana
  const renderKonten = (konten: string) => {
    if (!konten) return null
    return konten.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, marginTop: 20, marginBottom: 10, color: 'var(--blue)' }}>{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, marginTop: 16, marginBottom: 8, color: 'var(--gold)' }}>{line.slice(4)}</h3>
      if (line.startsWith('- ')) return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 14 }}><span style={{ color: 'var(--pink)', flexShrink: 0 }}>•</span><span style={{ color: 'var(--muted)' }}>{line.slice(2)}</span></div>
      if (line.match(/^\d+\./)) return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 14 }}><span style={{ color: 'var(--blue)', flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span><span style={{ color: 'var(--muted)' }}>{line.replace(/^\d+\./, '').trim()}</span></div>
      if (line === '') return <div key={i} style={{ height: 8 }} />
      return <p key={i} style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 6 }}>{line}</p>
    })
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  // Halaman detail promosi
  if (slug && detail) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>
      <button onClick={() => navigate('/promosi')}
        style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Kembali ke Promosi
      </button>

      {/* Banner gambar */}
      {detail.gambar_url && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, height: isMobile ? 160 : 240, background: 'var(--bg2)' }}>
          <img src={detail.gambar_url} alt={detail.judul}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
      )}

      <div className="card">
        {/* Badge jenis */}
        <div style={{ display: 'inline-block', background: `${JENIS_COLOR[detail.jenis] || 'var(--purple)'}22`, border: `1px solid ${JENIS_COLOR[detail.jenis] || 'var(--purple)'}`, color: JENIS_COLOR[detail.jenis] || 'var(--purple)', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, marginBottom: 12 }}>
          {JENIS_LABEL[detail.jenis] || detail.jenis_custom || '🎁 Promo'}
        </div>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 20 : 26, fontWeight: 900, marginBottom: 8, whiteSpace: 'pre-line', background: 'linear-gradient(135deg,#00c8ff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {detail.judul}
        </h1>

        {detail.deskripsi && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>{detail.deskripsi}</p>
        )}

        {/* Info bonus */}
        {(detail.bonus_persen > 0 || detail.min_deposit > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
            {detail.bonus_persen > 0 && (
              <div style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--pink)', fontFamily: 'var(--display)' }}>{detail.bonus_persen}%</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>BONUS</div>
              </div>
            )}
            {detail.bonus_max > 0 && (
              <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--display)' }}>Rp {detail.bonus_max.toLocaleString('id-ID')}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>MAX BONUS</div>
              </div>
            )}
            {detail.min_deposit > 0 && (
              <div style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)', fontFamily: 'var(--display)' }}>Rp {detail.min_deposit.toLocaleString('id-ID')}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>MIN DEPOSIT</div>
              </div>
            )}
            {detail.turnover > 0 && (
              <div style={{ background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--purple)', fontFamily: 'var(--display)' }}>{detail.turnover}x</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>TURNOVER</div>
              </div>
            )}
          </div>
        )}

        {/* Konten */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {renderKonten(detail.konten)}
        </div>

        {/* Tombol CTA */}
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-primary"
            onClick={() => navigate(isLoggedIn ? '/deposit' : '/daftar')}
            style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700 }}>
            {isLoggedIn ? '💰 Klaim Sekarang' : '🎮 Daftar & Klaim'}
          </button>
        </div>
      </div>
    </div>
  )

  // Halaman list promosi
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '24px 20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
        <h1 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 16 : 20, fontWeight: 900 }}>PROMOSI</h1>
      </div>

      {promosiList.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <div>Belum ada promosi tersedia</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 16 }}>
        {promosiList.map(p => (
          <div key={p.id} className="card"
            style={{ cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', padding: 0 }}
            onClick={() => navigate(`/promosi/${p.slug}`)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}>

            {/* Gambar */}
            {p.gambar_url ? (
              <img src={p.gambar_url} alt={p.judul}
                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div style={{ height: 100, background: 'linear-gradient(135deg,#1a0030,#3d0060,#ff2d78)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                🎁
              </div>
            )}

            <div style={{ padding: 16 }}>
              {/* Badge */}
              <div style={{ display: 'inline-block', background: `${JENIS_COLOR[p.jenis] || 'var(--purple)'}22`, border: `1px solid ${JENIS_COLOR[p.jenis] || 'var(--purple)'}`, color: JENIS_COLOR[p.jenis] || 'var(--purple)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, marginBottom: 8 }}>
                {JENIS_LABEL[p.jenis] || p.jenis_custom || '🎁 Promo'}
              </div>

              <h2 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 900, marginBottom: 6, whiteSpace: 'pre-line' }}>{p.judul}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>{p.deskripsi}</p>

              {/* Info singkat */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.bonus_persen > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700, background: 'rgba(255,45,120,0.1)', padding: '2px 8px', borderRadius: 4 }}>+{p.bonus_persen}% Bonus</span>
                )}
                {p.min_deposit > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, background: 'rgba(0,200,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>Min Rp {(p.min_deposit/1000).toFixed(0)}K</span>
                )}
                {p.turnover > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>TO {p.turnover}x</span>
                )}
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                Lihat Detail →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
