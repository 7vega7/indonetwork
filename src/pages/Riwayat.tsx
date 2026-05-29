import { useEffect, useState } from 'react'
import { userApi } from '../lib/api'
import toast from 'react-hot-toast'

const JENIS_WARNA: Record<string, string> = {
  deposit: '#00e676', withdraw: 'var(--pink)', bet: '#ff9500', win: 'var(--blue)', bonus: 'var(--gold)',
}
const JENIS_LABEL: Record<string, string> = {
  deposit: 'Deposit', withdraw: 'Penarikan', bet: 'Taruhan', win: 'Kemenangan', bonus: 'Bonus',
}

export default function Riwayat() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [halaman, setHalaman] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => { muat() }, [halaman])

  async function muat() {
    setLoading(true)
    try {
      const res = await userApi.riwayat(halaman)
      setData(res.transaksi || [])
      setTotal(res.total || 0)
    } catch { toast.error('Gagal memuat riwayat') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: 20 }}>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 900, marginBottom: 20, background: 'linear-gradient(135deg,#00c8ff,#7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        RIWAYAT TRANSAKSI
      </h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div>Belum ada riwayat transaksi</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {data.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `rgba(0,200,255,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {t.jenis === 'deposit' ? '↓' : t.jenis === 'win' ? '🏆' : t.jenis === 'bonus' ? '🎁' : '↑'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{JENIS_LABEL[t.jenis] || t.jenis}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.keterangan}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{new Date(t.dibuat).toLocaleString('id-ID')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: JENIS_WARNA[t.jenis] || 'var(--text)' }}>
                  {['deposit','win','bonus'].includes(t.jenis) ? '+' : '-'}Rp {t.jumlah.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Saldo: Rp {t.saldo_akhir.toLocaleString('id-ID')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => setHalaman(Math.max(0, halaman - 1))} disabled={halaman === 0} style={{ padding: '6px 16px', fontSize: 13 }}>← Sebelumnya</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>Halaman {halaman + 1}</span>
          <button className="btn btn-outline" onClick={() => setHalaman(halaman + 1)} disabled={(halaman + 1) * 20 >= total} style={{ padding: '6px 16px', fontSize: 13 }}>Berikutnya →</button>
        </div>
      )}
    </div>
  )
}
