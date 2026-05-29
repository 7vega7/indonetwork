import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const SLIDES = [
  { tag: '🔥 Event Terbatas', judul: 'BONUS DEPOSIT\n100%', sub: 'Untuk semua member baru INDONETWORK', warna: 'linear-gradient(135deg,#0a0a30,#1a0040,#300020)', aksi: 'KLAIM SEKARANG' },
  { tag: '💎 New Member', judul: 'FREEBET\nIDR 50.000', sub: 'Daftar sekarang & langsung main tanpa deposit', warna: 'linear-gradient(135deg,#001a30,#003050,#001060)', aksi: 'DAFTAR GRATIS' },
  { tag: '⚡ Deposit Kilat', judul: 'QRIS INSTAN\n30 DETIK', sub: 'Deposit via QRIS, GoPay, OVO, Dana & Bank', warna: 'linear-gradient(135deg,#1a1000,#302000,#200010)', aksi: 'DEPOSIT SEKARANG' },
]

const GAMES = [
  { nama: 'Gates of Olympus', provider: 'PRAGMATIC', ikon: '⚡', badge: 'HOT', kode: 'vs20olympgate' },
  { nama: 'Sweet Bonanza 1000', provider: 'PRAGMATIC', ikon: '🍬', badge: 'HOT', kode: 'vs20swbon2500' },
  { nama: 'Mahjong Ways 2', provider: 'PGSOFT', ikon: '🀄', badge: '', kode: 'mahjong-ways-2' },
  { nama: 'Fortune Gems 3', provider: 'JILI', ikon: '💎', badge: 'BARU', kode: 'FortuneGems3' },
  { nama: 'Starlight Princess', provider: 'PRAGMATIC', ikon: '⭐', badge: 'HOT', kode: 'vs20starlight' },
  { nama: 'Money Train 4', provider: 'NLC', ikon: '🚂', badge: '', kode: 'moneytrain4' },
  { nama: 'Treasures of Aztec', provider: 'PGSOFT', ikon: '🏛️', badge: 'HOT', kode: 'treasures-aztec' },
  { nama: 'Le Fisherman', provider: 'HACKSAW', ikon: '🎣', badge: 'BARU', kode: 'le-fisherman' },
  { nama: 'Hot Hot Nexus', provider: 'HABANERO', ikon: '🌶️', badge: '', kode: 'SGHotHotNexus' },
  { nama: 'Wild Walker', provider: 'PGSOFT', ikon: '🐺', badge: '', kode: 'wild-walker' },
]

const PEMENANG = [
  { nama: 'ari***a', game: 'Gates of Olympus', jumlah: 3839000 },
  { nama: 'bud***i', game: 'Sweet Bonanza', jumlah: 2345000 },
  { nama: 'cin***a', game: 'Mahjong Ways 2', jumlah: 1780000 },
  { nama: 'dew***i', game: 'Fortune Gems 3', jumlah: 5600000 },
  { nama: 'eko***o', game: 'Starlight Princess', jumlah: 987000 },
]

export default function Beranda() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [pemenang, setPemenang] = useState(PEMENANG)

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const names = ['ari***a','bud***i','cin***a','xyz***1','abc***2']
      const games = ['Gates of Olympus','Sweet Bonanza','Mahjong Ways','Fortune Gems']
      setPemenang(prev => [{
        nama: names[Math.floor(Math.random() * names.length)],
        game: games[Math.floor(Math.random() * games.length)],
        jumlah: Math.floor(Math.random() * 9000 + 500) * 1000,
      }, ...prev.slice(0, 4)])
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const mainGame = (game: typeof GAMES[0]) => {
    if (!isLoggedIn) { toast.error('Silakan masuk terlebih dahulu'); navigate('/masuk'); return }
    navigate(`/game/${game.provider}?kode=${game.kode}`)
  }

  const s = SLIDES[slide]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>

        {/* Sidebar */}
        <aside>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            {['🔥 Hot Games','🎰 Pragmatic','⚡ JILI','🐼 PG Soft','🎯 Slot88','🔪 Hacksaw','🌙 No Limit','💎 Microgaming'].map((item, i) => (
              <div key={item} onClick={() => navigate(`/game/${item.split(' ').slice(1).join('')}`)}
                style={{ padding: '10px 14px', fontSize: 13, color: i === 0 ? 'var(--pink)' : 'var(--muted)', cursor: 'pointer', borderLeft: `3px solid ${i === 0 ? 'var(--pink)' : 'transparent'}`, fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(0,200,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = i === 0 ? 'var(--pink)' : 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}>
                {item}
              </div>
            ))}
          </div>

          {/* Pemenang */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 10 }}>🏆 PEMENANG</div>
            {pemenang.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < pemenang.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {p.nama[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{p.nama}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.game}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>+{(p.jumlah/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Konten */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Banner */}
          <div style={{ borderRadius: 10, overflow: 'hidden', height: 220, background: s.warna, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'background 0.5s' }}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ display: 'inline-block', background: 'var(--pink)', color: 'white', fontSize: 10, padding: '3px 10px', borderRadius: 3, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{s.tag}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, lineHeight: 1.1, background: 'linear-gradient(135deg,#00c8ff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 10, whiteSpace: 'pre-line' }}>{s.judul}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{s.sub}</div>
              <button className="btn btn-primary" onClick={() => navigate(isLoggedIn ? '/deposit' : '/daftar')}>{s.aksi}</button>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {SLIDES.map((_, i) => (
                <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 8, height: 8, borderRadius: 4, background: i === slide ? 'var(--pink)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          {/* Notifikasi */}
          <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0 }}>📢</span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite', fontSize: 12, color: 'var(--muted)' }}>
                SELAMAT DATANG DI INDONETWORK — Situs game online terpercaya &nbsp;•&nbsp; Pembayaran dijamin 100% &nbsp;•&nbsp; CS online 24 jam &nbsp;•&nbsp; Minimal deposit IDR 10.000 &nbsp;•&nbsp; WASPADA PENIPUAN - hanya percaya domain resmi
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

          {/* Game Populer */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,var(--pink),var(--purple))', borderRadius: 2 }} />
                GAME POPULER
              </div>
              <Link to="/game/PRAGMATIC" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Lihat Semua →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
              {GAMES.map(game => (
                <div key={game.kode} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--blue)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}>
                  {game.badge && <div style={{ position: 'absolute', top: 6, left: 6, background: game.badge === 'HOT' ? 'var(--pink)' : 'var(--gold)', color: game.badge === 'HOT' ? 'white' : '#000', fontSize: 8, padding: '2px 6px', borderRadius: 3, fontWeight: 700, zIndex: 2 }}>{game.badge}</div>}
                  <div style={{ height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a40,#2a1050)', fontSize: 36 }}>{game.ikon}</div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.nama}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)' }}>{game.provider}</div>
                  </div>
                  <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                    <button className="btn btn-primary" onClick={() => mainGame(game)} style={{ padding: '6px 20px', fontSize: 12 }}>MAIN</button>
                  </div>
                </div>
              ))}
            </div>
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
