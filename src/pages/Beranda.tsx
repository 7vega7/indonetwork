import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi } from '../lib/api'
import toast from 'react-hot-toast'

const SLIDES = [
  { tag: '🔥 Event Terbatas', judul: 'BONUS DEPOSIT\n100%', sub: 'Untuk semua member baru INDONETWORK', warna: 'linear-gradient(135deg,#0a0a30,#1a0040,#300020)', aksi: 'KLAIM SEKARANG' },
  { tag: '💎 New Member', judul: 'FREEBET\nIDR 50.000', sub: 'Daftar sekarang & langsung main tanpa deposit', warna: 'linear-gradient(135deg,#001a30,#003050,#001060)', aksi: 'DAFTAR GRATIS' },
  { tag: '⚡ Deposit Kilat', judul: 'QRIS INSTAN\n30 DETIK', sub: 'Deposit via QRIS, GoPay, OVO, Dana & Bank', warna: 'linear-gradient(135deg,#1a1000,#302000,#200010)', aksi: 'DEPOSIT SEKARANG' },
]

const PEMENANG_AWAL = [
  { nama: 'bud***to', game: 'Gates of Olympus', jumlah: 2340000, type: 'menang' },
  { nama: 'sri***ti', game: 'Sweet Bonanza 1000', jumlah: 487000, type: 'menang' },
  { nama: 'agu***an', game: 'Mahjong Ways 2', jumlah: 98000, type: 'menang' },
  { nama: 'rin***ah', game: '-', jumlah: 320000, type: 'withdraw' },
  { nama: 'har***to', game: 'Big Bass Bonanza', jumlah: 5400000, type: 'menang' },
]

const NOMINAL_ACAK = [
  50000, 63000, 87000, 98000, 125000, 150000, 187000,
  200000, 230000, 275000, 320000, 400000, 487000, 498000,
  550000, 720000, 850000, 1250000, 1800000, 2340000,
  3500000, 5400000, 12000000, 25000000,
]

const NAMA_ACAK = [
  'bud***to','sri***ti','agu***an','fit***ri','eko***di',
  'rin***ah','har***to','yul***na','and***an','pur***ti',
  'dew***ri','sun***to','ind***ti','wah***di','rat***ah',
]

const GAME_ACAK = [
  'Gates of Olympus','Sweet Bonanza 1000','Mahjong Ways 2',
  'Starlight Princess','Sugar Rush 1000','Fortune Goddess',
  'Big Bass Bonanza','Wild Bounty Showdown','Hot Hot Fruit',
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

export default function Beranda() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [pemenang, setPemenang] = useState(PEMENANG_AWAL)
  const [hotGames, setHotGames] = useState<any[]>([])
  const [loadingHot, setLoadingHot] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
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
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const isWd = Math.random() < 0.2
      setPemenang(prev => [{
        nama: NAMA_ACAK[Math.floor(Math.random() * NAMA_ACAK.length)],
        game: isWd ? '-' : GAME_ACAK[Math.floor(Math.random() * GAME_ACAK.length)],
        jumlah: NOMINAL_ACAK[Math.floor(Math.random() * NOMINAL_ACAK.length)],
        type: isWd ? 'withdraw' : 'menang',
      }, ...prev.slice(0, 6)])
    }, 2500)
    return () => clearInterval(t)
  }, [])

  const mainGame = (game: any) => {
    if (!isLoggedIn) { toast.error('Silakan masuk terlebih dahulu'); navigate('/masuk'); return }
    navigate(`/game/${game.provider}?kode=${game.kode}`)
  }

  const s = SLIDES[slide]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px 10px' : 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: 16 }}>

        {/* Sidebar - desktop only */}
        {!isMobile && (
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

            {/* Pemenang Sidebar */}
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 10 }}>🏆 AKTIVITAS</div>
              {pemenang.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < pemenang.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.type === 'withdraw' ? 'linear-gradient(135deg,#ff9500,#ff2d78)' : 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {p.type === 'withdraw' ? '💸' : p.nama[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{p.nama}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)' }}>{p.type === 'withdraw' ? 'Withdraw' : p.game}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.type === 'withdraw' ? '#ff9500' : 'var(--gold)', whiteSpace: 'nowrap' }}>
                    {p.type === 'withdraw' ? '-' : '+'}{(p.jumlah / 1000).toFixed(0)}K
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Konten Utama */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>

          {/* Banner Slider */}
          <div style={{ borderRadius: 10, overflow: 'hidden', height: isMobile ? 160 : 220, background: s.warna, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'background 0.5s' }}>
            <div style={{ textAlign: 'center', padding: isMobile ? 12 : 20 }}>
              <div style={{ display: 'inline-block', background: 'var(--pink)', color: 'white', fontSize: 9, padding: '3px 10px', borderRadius: 3, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{s.tag}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 20 : 28, fontWeight: 900, lineHeight: 1.1, background: 'linear-gradient(135deg,#00c8ff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8, whiteSpace: 'pre-line' }}>{s.judul}</div>
              <div style={{ fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{s.sub}</div>
              <button className="btn btn-primary" style={{ padding: isMobile ? '7px 16px' : '10px 24px', fontSize: isMobile ? 12 : 14 }} onClick={() => navigate(isLoggedIn ? '/deposit' : '/daftar')}>{s.aksi}</button>
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {SLIDES.map((_, i) => (
                <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 4, background: i === slide ? 'var(--pink)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          {/* Aktivitas mobile */}
          {isMobile && (
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 8 }}>🏆 AKTIVITAS TERBARU</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {pemenang.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: p.type === 'withdraw' ? 'linear-gradient(135deg,#ff9500,#ff2d78)' : 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                      {p.type === 'withdraw' ? '💸' : p.nama[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{p.nama}</span>
                      <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 6 }}>{p.type === 'withdraw' ? 'Withdraw' : p.game}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: p.type === 'withdraw' ? '#ff9500' : 'var(--gold)', whiteSpace: 'nowrap' }}>
                      {p.type === 'withdraw' ? '-' : '+'}{(p.jumlah / 1000).toFixed(0)}K
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifikasi */}
          <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0, fontSize: 13 }}>📢</span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite', fontSize: 11, color: 'var(--muted)' }}>
                SELAMAT DATANG DI INDONETWORK — Situs game online terpercaya &nbsp;•&nbsp; Pembayaran dijamin 100% &nbsp;•&nbsp; CS online 24 jam &nbsp;•&nbsp; Minimal deposit IDR 10.000
              </div>
            </div>
          </div>

          {/* Promo */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Bonus Deposit', nilai: '100%', desk: 'Deposit pertama kamu', warna: 'linear-gradient(135deg,#1a0030,#3d0060,#ff2d78)', ikon: '💰' },
              { label: 'Cashback', nilai: '10%', desk: 'Otomatis setiap Senin', warna: 'linear-gradient(135deg,#001a30,#003060,#00c8ff)', ikon: '🔄' },
              { label: 'Referral', nilai: '50K', desk: 'Per teman daftar', warna: 'linear-gradient(135deg,#1a1000,#302000,#ffd700)', ikon: '👥', mobileHide: true },
            ].filter(p => !p.mobileHide || !isMobile).map(p => (
              <div key={p.label} style={{ background: p.warna, borderRadius: 8, padding: isMobile ? 12 : 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: isMobile ? 70 : 90, transition: 'transform 0.2s' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>{p.label.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 16 : 22, fontWeight: 900, margin: '3px 0' }}>IDR {p.nilai}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{p.desk}</div>
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: isMobile ? 24 : 36, opacity: 0.2 }}>{p.ikon}</div>
              </div>
            ))}
          </div>

          {/* Hot Games */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontSize: isMobile ? 11 : 13, fontWeight: 700, letterSpacing: 1 }}>
                <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
                HOT GAMES
              </div>
              <Link to="/game/PRAGMATIC" style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>Lihat Semua →</Link>
            </div>

            {loadingHot ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap: isMobile ? 8 : 10 }}>
                {hotGames.map((game, idx) => (
                  <div key={idx}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.25s' }}
                    onClick={() => mainGame(game)}>
                    {game.badge && (
                      <div style={{ position: 'absolute', top: 4, left: 4, background: game.badge === 'HOT' ? 'var(--pink)' : 'var(--gold)', color: game.badge === 'HOT' ? 'white' : '#000', fontSize: 7, padding: '2px 5px', borderRadius: 3, fontWeight: 700, zIndex: 2, letterSpacing: 1 }}>
                        {game.badge}
                      </div>
                    )}
                    {game.banner
                      ? <img src={game.banner} alt={game.nama} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                          onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                      : null
                    }
                    <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: isMobile ? 24 : 32 }}>🎰</div>
                    <div style={{ padding: isMobile ? '4px 6px' : '6px 8px' }}>
                      <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metode Bayar */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 8 }}>METODE PEMBAYARAN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['QRIS','GoPay','OVO','Dana','ShopeePay','BCA','BRI','BNI','Mandiri','Pulsa'].map(m => (
                <div key={m} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />{m}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
