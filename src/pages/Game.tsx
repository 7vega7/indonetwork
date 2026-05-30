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
  { kode: 'live', nama: '🃏 Live Casino', tipe: 'live' },
  { kode: 'crash', nama: '🚀 Crash Game', tipe: 'crash' },
  { kode: 'sport', nama: '⚽ Sportsbook', tipe: 'sport' },
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

  const providerFiltered = PROVIDERS.filter(p =>
    kategoriAktif === 'semua' || p.tipe === tipeAktif
  )

  // Load game setiap kali provider berubah di URL
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
    if (!isLoggedIn) {
      toast.error('Silakan masuk terlebih dahulu')
      navigate('/masuk')
      return
    }
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
      <div style={{ background: 'var(--bg3)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
          INDONETWORK — Sedang Bermain
        </span>
        <button onClick={() => setUrlGame('')} style={{ background: 'var(--pink)', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
          ✕ Keluar Game
        </button>
      </div>
      <iframe src={urlGame} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Game" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>

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
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>
            {k.nama}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>

        {/* Sidebar Provider */}
        <aside>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, marginBottom: 8 }}>PROVIDER</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {providerFiltered.map((p, i) => (
              <div key={p.kode} onClick={() => navigate(`/game/${p.kode}`)}
                style={{
                  padding: '10px 14px', fontSize: 12, fontWeight: 700,
                  color: providerAktif === p.kode ? 'white' : 'var(--muted)',
                  background: providerAktif === p.kode ? 'linear-gradient(135deg,rgba(255,45,120,0.3),rgba(123,47,255,0.3))' : 'transparent',
                  borderLeft: `3px solid ${providerAktif === p.kode ? 'var(--pink)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                  borderBottom: i < providerFiltered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
                onMouseEnter={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'rgba(0,200,255,0.05)' }}
                onMouseLeave={e => { if (providerAktif !== p.kode) e.currentTarget.style.background = 'transparent' }}>
                {p.nama}
              </div>
            ))}
          </div>
        </aside>

        {/* Konten Game */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700 }}>
                {PROVIDERS.find(p => p.kode === providerAktif)?.nama || providerAktif}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>({filtered.length} game)</span>
            </div>
            <input className="input" type="text" placeholder="🔍 Cari game..."
              value={cari} onChange={e => setCari(e.target.value)}
              style={{ maxWidth: 220, padding: '8px 14px', fontSize: 13 }} />
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <div className="spinner" />
            </div>
          )}

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
              {filtered.map(game => (
                <div key={game.kode}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.25s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'var(--blue)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,200,255,0.2)';
                    (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none';
                    (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0'
                  }}>

                  {game.banner
                    ? <img src={game.banner} alt={game.nama}
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                        onError={e => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none';
                          (img.nextSibling as HTMLElement).style.display = 'flex'
                        }} />
                    : null
                  }
                  <div style={{ display: game.banner ? 'none' : 'flex', aspectRatio: '4/3', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 36 }}>🎰</div>

                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                  </div>

                  <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', backdropFilter: 'blur(2px)' }}>
                    <button className="btn btn-primary"
                      onClick={() => launchGame(providerAktif, game.kode)}
                      disabled={memuat === game.kode}
                      style={{ padding: '8px 24px', fontSize: 13 }}>
                      {memuat === game.kode ? '⏳' : '▶ MAIN'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎰</div>
              <div>Tidak ada game ditemukan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
