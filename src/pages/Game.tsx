import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBrand } from '../hooks/useBrand'
import { gameApi } from '../lib/api'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { kode: 'PRAGMATIC', nama: 'Pragmatic', icon: '🎯', tipe: 'slot' },
  { kode: 'PGSOFT', nama: 'PG Soft', icon: '🐼', tipe: 'slot' },
  { kode: 'HABANERO', nama: 'Habanero', icon: '🌶️', tipe: 'slot' },
  { kode: 'FACHAI', nama: 'Fachai', icon: '⚡', tipe: 'slot' },
  { kode: 'HACKSAW', nama: 'Hacksaw', icon: '🔪', tipe: 'slot' },
  { kode: 'BOOONGO', nama: 'Booongo', icon: '🎪', tipe: 'slot' },
  { kode: 'PLAYSON', nama: 'Playson', icon: '🎨', tipe: 'slot' },
  { kode: 'CQ9', nama: 'CQ9', icon: '🎲', tipe: 'slot' },
  { kode: 'EVOPLAY', nama: 'Evoplay', icon: '🚀', tipe: 'slot' },
  { kode: 'TOPTREND', nama: 'TopTrend', icon: '📈', tipe: 'slot' },
  { kode: 'DREAMTECH', nama: 'Dreamtech', icon: '💫', tipe: 'slot' },
  { kode: 'REELKINGDOM', nama: 'Reel Kingdom', icon: '👑', tipe: 'slot' },
  { kode: 'FATPANDA', nama: 'Fat Panda', icon: '🐼', tipe: 'slot' },
  { kode: 'PLAYNGO', nama: 'Playngo', icon: '🎭', tipe: 'slot' },
  { kode: 'AMUSNET', nama: 'Amusnet', icon: '🎠', tipe: 'slot' },
  { kode: 'EGT', nama: 'EGT', icon: '💎', tipe: 'slot' },
  { kode: 'SPADEGAMING', nama: 'Spade', icon: '♠️', tipe: 'slot' },
  { kode: 'FASTSPIN', nama: 'FastSpin', icon: '🌀', tipe: 'slot' },
  { kode: 'PP_LIVE_PRO', nama: 'Pragmatic Live', icon: '🃏', tipe: 'live' },
  { kode: 'SPRIBE', nama: 'SPRIBE', icon: '💥', tipe: 'crash' },
  { kode: 'SPORTSBOOK', nama: 'Sportsbook', icon: '⚽', tipe: 'sport' },
]

const KATEGORI = [
  { kode: 'semua', nama: '🎮 Semua', tipe: null },
  { kode: 'slot', nama: '🎰 Slot', tipe: 'slot' },
  { kode: 'live', nama: '🃏 Live', tipe: 'live' },
  { kode: 'crash', nama: '💥 Crash', tipe: 'crash' },
  { kode: 'sport', nama: '⚽ Sport', tipe: 'sport' },
]

export default function Game() {
  const { provider: providerParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, syncSaldo } = useAuth()

  const providerAktif = providerParam?.toUpperCase() || 'PRAGMATIC'
  const tipeAktif = PROVIDERS.find(p => p.kode === providerAktif)?.tipe || 'slot'
  const kategoriAktif = KATEGORI.find(k => k.tipe === tipeAktif)?.kode || 'slot'

  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [memuat, setMemuat] = useState('')
  const [urlGame, setUrlGame] = useState('')
  const [cari, setCari] = useState('')
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

  useEffect(() => {
  }, [urlGame])

  const filtered = games.filter(g =>
    !cari || g.nama.toLowerCase().includes(cari.toLowerCase())
  )

  if (urlGame) return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg3)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{brandNama || 'CASINO'}</span>
        <button onClick={() => { setUrlGame(''); syncSaldo(); }} style={{ background: 'var(--pink)', border: 'none', color: 'white', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>✕ Keluar</button>
      </div>
      <iframe src={urlGame} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Game" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ===== MOBILE LAYOUT ===== */}
      {isMobile ? (
        <div>
          {/* Kategori scroll horizontal */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 10px 6px', overflowX: 'auto', scrollbarWidth: 'none', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
            {KATEGORI.map(k => (
              <button key={k.kode} onClick={() => {
                const first = PROVIDERS.find(p => k.tipe === null || p.tipe === k.tipe)
                if (first) navigate(`/game/${first.kode}`)
              }}
                style={{
                  background: kategoriAktif === k.kode ? 'linear-gradient(135deg,var(--pink),var(--purple))' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: kategoriAktif === k.kode ? 'white' : 'var(--muted)',
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {k.nama}
              </button>
            ))}
          </div>

          {/* Provider scroll landscape */}
          <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 10px' }}>
              {providerFiltered.map(p => (
                <div key={p.kode} onClick={() => navigate(`/game/${p.kode}`)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
                    borderBottom: providerAktif === p.kode ? '2px solid var(--pink)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: providerAktif === p.kode ? 'var(--pink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {p.nama}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Info */}
          <div style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg)' }}>
            <input className="input" type="text" placeholder="🔍 Cari game..."
              value={cari} onChange={e => setCari(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{filtered.length} game</span>
          </div>

          {/* Game Grid Mobile */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '0 8px 80px' }}>
              {filtered.map(game => (
                <div key={game.kode}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', active: { transform: 'scale(0.97)' } as any }}
                  onClick={() => launchGame(providerAktif, game.kode)}>
                  {game.banner
                    ? <img src={game.banner} alt={(game.nama || '').replace(/_/g, ' ')} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                        onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                    : null
                  }
                  <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 24 }}>🎰</div>
                  <div style={{ padding: '4px 6px 6px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{(game.nama || '').replace(/_/g, ' ')}</div>
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

      ) : (
        /* ===== DESKTOP LAYOUT ===== */
        <div style={{ padding: 16 }}>
          {/* Kategori */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {KATEGORI.map(k => (
              <button key={k.kode} onClick={() => {
                const first = PROVIDERS.find(p => k.tipe === null || p.tipe === k.tipe)
                if (first) navigate(`/game/${first.kode}`)
              }}
                style={{
                  background: kategoriAktif === k.kode ? 'linear-gradient(135deg,var(--pink),var(--purple))' : 'var(--bg2)',
                  border: `1px solid ${kategoriAktif === k.kode ? 'var(--pink)' : 'var(--border)'}`,
                  color: kategoriAktif === k.kode ? 'white' : 'var(--muted)',
                  padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                {k.nama}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
            {/* Sidebar */}
            <aside>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, marginBottom: 8 }}>PROVIDER</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {providerFiltered.map((p, i) => (
                  <div key={p.kode} onClick={() => navigate(`/game/${p.kode}`)}
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: providerAktif === p.kode ? 'white' : 'var(--muted)', background: providerAktif === p.kode ? 'linear-gradient(135deg,rgba(255,45,120,0.3),rgba(123,47,255,0.3))' : 'transparent', borderLeft: `3px solid ${providerAktif === p.kode ? 'var(--pink)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s', borderBottom: i < providerFiltered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    onMouseEnter={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'rgba(0,200,255,0.05)' }}
                    onMouseLeave={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'transparent' }}>
                    {p.icon} {p.nama}
                  </div>
                ))}
              </div>
            </aside>

            {/* Game Content */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
                  <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700 }}>
                    {PROVIDERS.find(p => p.kode === providerAktif)?.nama}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>({filtered.length} game)</span>
                </div>
                <input className="input" type="text" placeholder="🔍 Cari game..."
                  value={cari} onChange={e => setCari(e.target.value)}
                  style={{ maxWidth: 200, padding: '7px 12px', fontSize: 12 }} />
              </div>

              {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}

              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                  {filtered.map(game => (
                    <div key={game.kode}
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-3px)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}>
                      {game.banner
                        ? <img src={game.banner} alt={(game.nama || '').replace(/_/g, ' ')} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                            onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextSibling as HTMLElement).style.display = 'flex' }} />
                        : null
                      }
                      <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 28 }}>🎰</div>
                      <div style={{ padding: '6px 8px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(game.nama || '').replace(/_/g, ' ')}</div>
                      </div>
                      <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                        <button className="btn btn-primary" onClick={() => launchGame(providerAktif, game.kode)} disabled={memuat === game.kode} style={{ padding: '7px 20px', fontSize: 12 }}>
                          {memuat === game.kode ? '⏳' : '▶ MAIN'}
                        </button>
                      </div>
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
      )}
    </div>
  )
}
