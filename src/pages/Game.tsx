import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi } from '../lib/api'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { kode: 'PRAGMATIC', nama: 'Pragmatic Play' },
  { kode: 'PGSOFT', nama: 'PG Soft' },
  { kode: 'JILI', nama: 'JILI Games' },
  { kode: 'HABANERO', nama: 'Habanero' },
  { kode: 'EVOLUTION', nama: 'Evolution' },
  { kode: 'EZUGI', nama: 'Ezugi' },
  { kode: 'CQ9', nama: 'CQ9' },
  { kode: 'EVOPLAY', nama: 'Evoplay' },
  { kode: 'FATPANDA', nama: 'Fat Panda' },
]

export default function Game() {
  const { provider: providerParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [provider, setProvider] = useState(providerParam?.toUpperCase() || 'PRAGMATIC')
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [memuat, setMemuat] = useState('')
  const [urlGame, setUrlGame] = useState('')
  const [cari, setCari] = useState('')

  useEffect(() => { muatGames(provider) }, [provider])

  useEffect(() => {
    const kode = searchParams.get('kode')
    if (kode && isLoggedIn) launchGame(provider, kode)
  }, [])

  async function muatGames(p: string) {
    setLoading(true)
    setGames([])
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
    } catch (err: any) { toast.error(err.message || 'Gagal membuka game') }
    finally { setMemuat('') }
  }

  const filtered = games.filter(g => !cari || g.nama.toLowerCase().includes(cari.toLowerCase()))

  if (urlGame) return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg3)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>INDONETWORK — Sedang Bermain</span>
        <button onClick={() => setUrlGame('')} style={{ background: 'var(--pink)', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>✕ Keluar Game</button>
      </div>
      <iframe src={urlGame} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen title="Game" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      {/* Provider Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
        {PROVIDERS.map(p => (
          <button key={p.kode} onClick={() => { setProvider(p.kode); navigate(`/game/${p.kode}`) }}
            style={{ background: provider === p.kode ? 'rgba(255,45,120,0.12)' : 'var(--bg2)', border: `1px solid ${provider === p.kode ? 'var(--pink)' : 'var(--border)'}`, color: provider === p.kode ? 'var(--pink)' : 'var(--muted)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700 }}>
            {p.nama}
          </button>
        ))}
      </div>

      {/* Cari */}
      <input className="input" type="text" placeholder="🔍 Cari nama game..." value={cari} onChange={e => setCari(e.target.value)} style={{ maxWidth: 300, marginBottom: 16 }} />

      {/* Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700 }}>
          <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
          {PROVIDERS.find(p => p.kode === provider)?.nama || provider}
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} game</span>
      </div>

      {/* Loading */}
      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}

      {/* Grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
          {filtered.map(game => (
            <div key={game.kode} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}>
              {game.banner
                ? <img src={game.banner} alt={game.nama} style={{ width: '100%', height: '75%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <div style={{ height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 32 }}>🎰</div>
              }
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
              </div>
              <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <button className="btn btn-primary" onClick={() => launchGame(provider, game.kode)} disabled={memuat === game.kode} style={{ padding: '6px 20px', fontSize: 12 }}>
                  {memuat === game.kode ? '...' : 'MAIN'}
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
  )
}
