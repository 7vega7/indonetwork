import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi } from '../lib/api'
import { useBrand } from '../hooks/useBrand'
import Aktivitas from '../components/Aktivitas'
import toast from 'react-hot-toast'

const SLIDES = [
  { tag: '🔥 Event Terbatas', judul: 'BONUS DEPOSIT\n100%', sub: 'Untuk semua member baru', warna: 'linear-gradient(135deg,#0a0a30,#1a0040,#300020)', aksi: 'KLAIM SEKARANG' },
  { tag: '💎 New Member', judul: 'FREEBET\nIDR 50.000', sub: 'Daftar sekarang & langsung main tanpa deposit', warna: 'linear-gradient(135deg,#001a30,#003050,#001060)', aksi: 'DAFTAR GRATIS' },
  { tag: '⚡ Deposit Kilat', judul: 'QRIS INSTAN\n30 DETIK', sub: 'Deposit via QRIS, GoPay, OVO, Dana & Bank', warna: 'linear-gradient(135deg,#1a1000,#302000,#200010)', aksi: 'DEPOSIT SEKARANG' },
]

const HOT_GAMES = [
  { nama: 'Gates of Olympus 1000', provider: 'PRAGMATIC', kode: 'vs20olympgate', badge: 'HOT' },
  { nama: 'Sweet Bonanza 1000', provider: 'PRAGMATIC', kode: 'vs20fruitswx', badge: 'HOT' },
  { nama: 'Starlight Princess 1000', provider: 'PRAGMATIC', kode: 'vs20starlight', badge: 'HOT' },
  { nama: 'Sugar Rush 1000', provider: 'PRAGMATIC', kode: 'vs20sugarrush', badge: 'HOT' },
  { nama: 'Big Bass Bonanza', provider: 'PRAGMATIC', kode: 'vs10bbbonanza', badge: '' },
  { nama: 'Mahjong Ways 2', provider: 'PGSOFT', kode: 'mahjong-ways2', badge: 'HOT' },
  { nama: 'Treasures of Aztec', provider: 'PGSOFT', kode: 'treasures-aztec', badge: '' },
  { nama: 'Wild Bounty Showdown', provider: 'PGSOFT', kode: 'wild-bounty-sd', badge: '' },
  { nama: 'Fortune Goddess', provider: 'FACHAI', kode: 'fortune-goddess', badge: 'BARU' },
  { nama: 'Hot Hot Fruit', provider: 'HABANERO', kode: 'SGHotHotFruit', badge: '' },
]

const PROVIDER_LIST = [
  { kode: 'PRAGMATIC', nama: 'Pragmatic', icon: '🎯' },
  { kode: 'PGSOFT', nama: 'PG Soft', icon: '🐼' },
  { kode: 'FACHAI', nama: 'Fachai', icon: '⚡' },
  { kode: 'HACKSAW', nama: 'Hacksaw', icon: '🔪' },
  { kode: 'HABANERO', nama: 'Habanero', icon: '🌶️' },
  { kode: 'PP_LIVE_PRO', nama: 'Live', icon: '🃏' },
  { kode: 'SPRIBE', nama: 'Crash', icon: '💥' },
  { kode: 'SPORTSBOOK', nama: 'Sport', icon: '⚽' },
  { kode: 'BOOONGO', nama: 'Booongo', icon: '🎪' },
  { kode: 'CQ9', nama: 'CQ9', icon: '🎲' },
]

export default function Beranda() {
  const { isLoggedIn } = useAuth()
  const brand = useBrand()
  const brandNama = brand.nama
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [hotGames, setHotGames] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [loadingHot, setLoadingHot] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    // Load banners dari database
    fetch('/api/banners')
      .then(r => r.json())
      .then(res => { if (res.banners?.length > 0) setBanners(res.banners) })
      .catch(() => {})

    const loadHotGames = async () => {
      setLoadingHot(true)
      try {
        const providers = [...new Set(HOT_GAMES.map(g => g.provider))]
        const allGames: Record<string, any[]> = {}
        await Promise.all(providers.map(async (provider) => {
          try {
            const res = await gameApi.list(provider)
            allGames[provider] = res.games || []
          } catch { allGames[provider] = [] }
        }))
        const result = HOT_GAMES.map(hg => {
          const found = (allGames[hg.provider] || []).find((g: any) => g.kode === hg.kode)
          return { ...hg, banner: found?.banner || null }
        })
        setHotGames(result)
      } catch {
        setHotGames(HOT_GAMES.map(hg => ({ ...hg, banner: null })))
      } finally { setLoadingHot(false) }
    }
    loadHotGames()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSlide(s => s + 1), 4000)
    return () => clearInterval(t)
  }, [])

  const mainGame = (game: any) => {
    if (!isLoggedIn) { toast.error('Silakan masuk terlebih dahulu'); navigate('/masuk'); return }
    navigate(`/game/${game.provider}?kode=${game.kode}`)
  }

  const slideData = (banners.length > 0 ? banners : SLIDES).map((b: any) => ({
    tag: b.tag || '',
    judul: b.judul || '',
    sub: b.subjudul || b.sub || '',
    warna: b.warna_bg || b.warna || 'linear-gradient(135deg,#0a0a30,#1a0040,#300020)',
    gambar: b.gambar_url || '',
    aksi: b.teks_tombol || b.aksi || 'KLAIM SEKARANG',
    link: b.link_tombol || '/deposit',
  }))
  const totalSlide = slideData.length || 1
  const s = slideData[slide % totalSlide]

  // ===== MOBILE =====
  if (isMobile) return (
    <div style={{ paddingBottom: 70 }}>

      {/* Banner */}
      <div style={{ position: 'relative', height: 160, background: s.gambar ? undefined : s.warna, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'background 0.5s' }}>
        {s.gambar && <img src={s.gambar} alt={s.judul} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 16px', background: s.gambar ? 'rgba(0,0,0,0.45)' : 'none', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'inline-block', background: 'var(--pink)', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 3, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{s.tag}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 900, lineHeight: 1.1, background: 'linear-gradient(135deg,#00c8ff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6, whiteSpace: 'pre-line' }}>{s.judul}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{s.sub}</div>
          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => navigate(isLoggedIn ? (s.link || '/deposit') : '/daftar')}>{s.aksi}</button>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
          {slideData.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 16 : 6, height: 6, borderRadius: 3, background: i === (slide % totalSlide) ? 'var(--pink)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Provider Mendatar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '8px 6px' }}>
          {PROVIDER_LIST.map(p => (
            <div key={p.kode} onClick={() => navigate(`/game/${p.kode}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, minWidth: 56 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {p.icon}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', textAlign: 'center' }}>{p.nama}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifikasi */}
      <div style={{ background: 'rgba(0,200,255,0.05)', borderBottom: '1px solid var(--border)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        <span style={{ color: 'var(--blue)', flexShrink: 0, fontSize: 12 }}>📢</span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', fontSize: 11, color: 'var(--muted)' }}>
            SELAMAT DATANG DI INDONETWORK &nbsp;•&nbsp; Deposit minimal IDR 10.000 &nbsp;•&nbsp; CS 24 jam &nbsp;•&nbsp; Pembayaran dijamin 100%
          </div>
        </div>
      </div>

      {/* Promo */}
      <div style={{ padding: '10px 8px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { label: 'Bonus Deposit', nilai: '100%', warna: 'linear-gradient(135deg,#1a0030,#ff2d78)', ikon: '💰' },
          { label: 'Cashback', nilai: '10%', warna: 'linear-gradient(135deg,#001a30,#00c8ff)', ikon: '🔄' },
          { label: 'Referral', nilai: '50K', warna: 'linear-gradient(135deg,#1a1000,#ffd700)', ikon: '👥' },
        ].map(p => (
          <div key={p.label} style={{ background: p.warna, borderRadius: 10, padding: '10px 14px', flexShrink: 0, minWidth: 120, position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 8, fontWeight: 700, opacity: 0.8, letterSpacing: 1 }}>{p.label.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, marginTop: 2 }}>IDR {p.nilai}</div>
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 28, opacity: 0.2 }}>{p.ikon}</div>
          </div>
        ))}
      </div>

      {/* Hot Games */}
      <div style={{ padding: '0 8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
            <span style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700 }}>HOT GAMES</span>
          </div>
          <Link to="/game/PRAGMATIC" style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>Lihat Semua →</Link>
        </div>
        {loadingHot ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {hotGames.map((game, idx) => (
              <div key={idx} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                onClick={() => mainGame(game)}>
                {game.badge && (
                  <div style={{ position: 'absolute', top: 4, left: 4, background: game.badge === 'HOT' ? 'var(--pink)' : 'var(--gold)', color: game.badge === 'HOT' ? 'white' : '#000', fontSize: 7, padding: '1px 5px', borderRadius: 3, fontWeight: 700, zIndex: 2 }}>
                    {game.badge}
                  </div>
                )}
                {game.banner
                  ? <img src={game.banner} alt={game.nama} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                      onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                  : null
                }
                <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 22 }}>🎰</div>
                <div style={{ padding: '4px 6px 5px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metode Pembayaran */}
      <div style={{ padding: '0 8px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 8 }}>METODE PEMBAYARAN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {['QRIS','GoPay','OVO','Dana','ShopeePay','BCA','BRI','BNI','Mandiri','Pulsa'].map(m => (
            <div key={m} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>{m}</div>
          ))}
        </div>
      </div>

      {/* Aktivitas */}
      <div style={{ padding: '0 8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg,var(--blue),var(--purple))', borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700 }}>AKTIVITAS TERBARU</span>
        </div>
        <Aktivitas mobile />
      </div>

    </div>
  )

  // ===== DESKTOP =====
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>

        {/* Sidebar */}
        <aside>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            {[
              { label: '🔥 Hot Games', path: '/' },
              { label: '🎰 Slot Games', path: '/game/PRAGMATIC' },
              { label: '🃏 Live Casino', path: '/game/PP_LIVE_PRO' },
              { label: '🚀 Crash Game', path: '/game/SPRIBE' },
              { label: '⚽ Sportsbook', path: '/game/SPORTSBOOK' },
              { label: '🎯 Pragmatic', path: '/game/PRAGMATIC' },
              { label: '🐼 PG Soft', path: '/game/PGSOFT' },
              { label: '⚡ Fachai', path: '/game/FACHAI' },
              { label: '🔪 Hacksaw', path: '/game/HACKSAW' },
              { label: '🌶️ Habanero', path: '/game/HABANERO' },
            ].map((item, i) => (
              <div key={item.path + i} onClick={() => navigate(item.path)}
                style={{ padding: '10px 14px', fontSize: 13, color: i === 0 ? 'var(--pink)' : 'var(--muted)', cursor: 'pointer', borderLeft: `3px solid ${i === 0 ? 'var(--pink)' : 'transparent'}`, fontWeight: 600, transition: 'all 0.2s', borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(0,200,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = i === 0 ? 'var(--pink)' : 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}>
                {item.label}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 10 }}>🏆 AKTIVITAS</div>
            <Aktivitas />
          </div>
        </aside>

        {/* Konten */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Banner */}
          <div style={{ borderRadius: 10, overflow: 'hidden', height: 220, background: s.warna, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.5s' }}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ display: 'inline-block', background: 'var(--pink)', color: 'white', fontSize: 10, padding: '3px 10px', borderRadius: 3, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{s.tag}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, lineHeight: 1.1, background: 'linear-gradient(135deg,#00c8ff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 10, whiteSpace: 'pre-line' }}>{s.judul}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{s.sub}</div>
              <button className="btn btn-primary" onClick={() => navigate(isLoggedIn ? (s.link || '/deposit') : '/daftar')}>{s.aksi}</button>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {slideData.map((_, i) => (
                <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 8, height: 8, borderRadius: 4, background: i === (slide % totalSlide) ? 'var(--pink)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          {/* Notifikasi */}
          <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0 }}>📢</span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite', fontSize: 12, color: 'var(--muted)' }}>
                SELAMAT DATANG DI INDONETWORK — Situs game online terpercaya &nbsp;•&nbsp; Pembayaran dijamin 100% &nbsp;•&nbsp; CS online 24 jam &nbsp;•&nbsp; Minimal deposit IDR 10.000
              </div>
            </div>
          </div>

          {/* Promo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Bonus Deposit', nilai: '100%', desk: 'Untuk deposit pertama kamu', warna: 'linear-gradient(135deg,#1a0030,#3d0060,#ff2d78)', ikon: '💰' },
              { label: 'Cashback Mingguan', nilai: '10%', desk: 'Cashback otomatis setiap Senin', warna: 'linear-gradient(135deg,#001a30,#003060,#00c8ff)', ikon: '🔄' },
              { label: 'Bonus Referral', nilai: '50K', desk: 'Per teman yang berhasil daftar', warna: 'linear-gradient(135deg,#1a1000,#302000,#ffd700)', ikon: '👥' },
            ].map(p => (
              <div key={p.label} style={{ background: p.warna, borderRadius: 8, padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 90, transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }}>{p.label.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 900, margin: '4px 0' }}>IDR {p.nilai}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{p.desk}</div>
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 36, opacity: 0.25 }}>{p.ikon}</div>
              </div>
            ))}
          </div>

          {/* Hot Games */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
                HOT GAMES
              </div>
              <Link to="/game/PRAGMATIC" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Lihat Semua →</Link>
            </div>
            {loadingHot ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {hotGames.map((game, idx) => (
                  <div key={idx} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,200,255,0.2)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}>
                    {game.badge && <div style={{ position: 'absolute', top: 6, left: 6, background: game.badge === 'HOT' ? 'var(--pink)' : 'var(--gold)', color: game.badge === 'HOT' ? 'white' : '#000', fontSize: 8, padding: '2px 6px', borderRadius: 3, fontWeight: 700, zIndex: 2 }}>{game.badge}</div>}
                    {game.banner
                      ? <img src={game.banner} alt={game.nama} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                          onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                      : null
                    }
                    <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 32 }}>🎰</div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>{game.provider}</div>
                    </div>
                    <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                      <button className="btn btn-primary" onClick={() => mainGame(game)} style={{ padding: '8px 24px', fontSize: 13 }}>▶ MAIN</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metode Bayar */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 10 }}>METODE PEMBAYARAN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['QRIS','GoPay','OVO','Dana','ShopeePay','BCA','BRI','BNI','Mandiri','Pulsa'].map(m => (
                <div key={m} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />{m}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
