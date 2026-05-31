import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi } from '../lib/api'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { kode: 'PRAGMATIC', nama: 'Pragmatic Play', tipe: 'slot' },
  { kode: 'PGSOFT', nama: 'PG Soft', tipe: 'slot' },
  { kode: 'HABANERO', nama: 'Habanero', tipe: 'slot' },
  { kode: 'BOOONGO', nama: 'Booongo', tipe: 'slot' },
  { kode: 'PLAYSON', nama: 'Playson', tipe: 'slot' },
  { kode: 'CQ9', nama: 'CQ9', tipe: 'slot' },
  { kode: 'EVOPLAY', nama: 'Evoplay', tipe: 'slot' },
  { kode: 'TOPTREND', nama: 'TopTrend', tipe: 'slot' },
  { kode: 'DREAMTECH', nama: 'DreamTech', tipe: 'slot' },
  { kode: 'REELKINGDOM', nama: 'Reel Kingdom', tipe: 'slot' },
  { kode: 'HACKSAW', nama: 'Hacksaw', tipe: 'slot' },
  { kode: 'FATPANDA', nama: 'Fat Panda', tipe: 'slot' },
  { kode: 'FACHAI', nama: 'Fachai', tipe: 'slot' },
  { kode: 'PLAYNGO', nama: 'Playngo', tipe: 'slot' },
  { kode: 'AMUSNET', nama: 'Amusnet', tipe: 'slot' },
  { kode: 'EGT', nama: 'EGT Digital', tipe: 'slot' },
  { kode: 'SPADEGAMING', nama: 'Spade Gaming', tipe: 'slot' },
  { kode: 'FASTSPIN', nama: 'FastSpin', tipe: 'slot' },
  { kode: 'PP_LIVE_PRO', nama: 'Pragmatic Live', tipe: 'live' },
  { kode: 'SPRIBE', nama: 'SPRIBE', tipe: 'crash' },
  { kode: 'SPORTSBOOK', nama: 'Sportsbook', tipe: 'sport' },
]

const KATEGORI = [
  { kode: 'semua', nama: '🎮 Semua', tipe: null },
  { kode: 'slot', nama: '🎰 Slot', tipe: 'slot' },
  { kode: 'live', nama: '🃏 Live', tipe: 'live' },
  { kode: 'crash', nama: '🚀 Crash', tipe: 'crash' },
  { kode: 'sport', nama: '⚽ Sport', tipe: 'sport' },
]

export default function Game() {
  const { provider: providerParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()

  const providerAktif = providerParam?.toUpperCase() || 'PRAGMATIC'
  const tipeAktif = PROVIDERS.find(p => p.kode === providerAktif)?.tipe || 'slot'
  const kategoriAktif = KATEGORI.find(k => k.tipe === tipeAktif)?.kode || 'semua'

  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [memuat, setMemuat] = useState('')
  const [urlGame, setUrlGame] = useState('')
  const [cari, setCari] = useState('')
  const [showProvider, setShowProvider] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const providerFiltered = PROVIDERS.filter(p =>
    kategoriAktif === 'semua' || p.tipe === tipeAktif
  )

  useEffect(() => {
    setGames([])
    setCari('')
    muatGames(providerAktif)
    const kode = searchParams.get('kode')
    if (kode && isLoggedIn) launchGame(providerAktif, kode)
  }, [location.pathname])

  async function muatGames(p: string) {
    setLoading(true)
    try {
      const res = await gameApi.list(p)
      setGames(res.games || [])
    } catch { toast.error('Gagal memuat game') }
    finally { setLoading(false) }
  }

  async function launchGame(p: string, kode: string) {
    if (!isLoggedIn) { toast.error('Silakan masuk terlebih dahulu'); navigate('/masuk'); return }
    setMemuat(kode)
    try {
      const res = await gameApi.main({ provider: p, kode_game: kode })
      setUrlGame(res.url_game)
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuka game')
    } finally { setMemuat('') }
  }

  const filtered = games.filter(g =>
    !cari || g.nama.toLowerCase().includes(cari.toLowerCase())
  )

  if (urlGame) return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg3)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>INDONETWORK</span>
        <button onClick={() => setUrlGame('')} style={{ background: 'var(--pink)', border: 'none', color: 'white', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>✕ Keluar</button>
      </div>
      <iframe src={urlGame} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Game" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '10px 8px' : 16 }}>

      {/* Kategori Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {KATEGORI.map(k => (
          <button key={k.kode} onClick={() => {
            const first = PROVIDERS.find(p => k.tipe === null || p.tipe === k.tipe)
            if (first) navigate(`/game/${first.kode}`)
          }}
            style={{
              background: kategoriAktif === k.kode ? 'linear-gradient(135deg,var(--pink),var(--purple))' : 'var(--bg2)',
              border: `1px solid ${kategoriAktif === k.kode ? 'var(--pink)' : 'var(--border)'}`,
              color: kategoriAktif === k.kode ? 'white' : 'var(--muted)',
              padding: isMobile ? '7px 12px' : '10px 20px',
              borderRadius: 8, cursor: 'pointer', fontSize: isMobile ? 11 : 13,
              fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
            }}>
            {k.nama}
          </button>
        ))}
      </div>

      {/* Mobile: Provider dropdown button */}
      {isMobile && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setShowProvider(!showProvider)}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📦 {PROVIDERS.find(p => p.kode === providerAktif)?.nama || providerAktif}</span>
            <span>{showProvider ? '▲' : '▼'}</span>
          </button>
          {showProvider && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              {providerFiltered.map((p, i) => (
                <div key={p.kode} onClick={() => { navigate(`/game/${p.kode}`); setShowProvider(false) }}
                  style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: providerAktif === p.kode ? 'var(--pink)' : 'var(--muted)', background: providerAktif === p.kode ? 'rgba(255,45,120,0.1)' : 'transparent', cursor: 'pointer', borderBottom: i < providerFiltered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  {p.nama}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 16 }}>

        {/* Sidebar Provider - desktop */}
        {!isMobile && (
          <aside>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, marginBottom: 8 }}>PROVIDER</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {providerFiltered.map((p, i) => (
                <div key={p.kode} onClick={() => navigate(`/game/${p.kode}`)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: providerAktif === p.kode ? 'white' : 'var(--muted)', background: providerAktif === p.kode ? 'linear-gradient(135deg,rgba(255,45,120,0.3),rgba(123,47,255,0.3))' : 'transparent', borderLeft: `3px solid ${providerAktif === p.kode ? 'var(--pink)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s', borderBottom: i < providerFiltered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  onMouseEnter={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'rgba(0,200,255,0.05)' }}
                  onMouseLeave={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'transparent' }}>
                  {p.nama}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Konten Game */}
        <div>
          {/* Header & Cari */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 11 : 13, fontWeight: 700 }}>
                {PROVIDERS.find(p => p.kode === providerAktif)?.nama}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>({filtered.length})</span>
            </div>
            <input className="input" type="text" placeholder="🔍 Cari..."
              value={cari} onChange={e => setCari(e.target.value)}
              style={{ maxWidth: isMobile ? 130 : 200, padding: '7px 12px', fontSize: 12 }} />
          </div>

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(auto-fill,minmax(150px,1fr))', gap: isMobile ? 8 : 12 }}>
              {filtered.map(game => (
                <div key={game.kode}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
                  onClick={() => launchGame(providerAktif, game.kode)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {game.banner
                    ? <img src={game.banner} alt={game.nama} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                        onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                    : null
                  }
                  <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: isMobile ? 22 : 28 }}>🎰</div>
                  <div style={{ padding: isMobile ? '4px 6px' : '6px 8px' }}>
                    <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                  </div>
                  {memuat === game.kode && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎰</div>
              <div>Tidak ada game ditemukan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
