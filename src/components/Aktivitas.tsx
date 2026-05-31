import { useState, useEffect, useRef } from 'react'
import { aktivitasApi } from '../lib/api'
import { randomAktivitas, AKTIVITAS_AWAL } from '../lib/aktivitas'

interface Item {
  nama: string
  jumlah: number
  type: string
  isReal?: boolean
}

const TYPE_COLOR: Record<string, string> = {
  deposit: '#00c8ff',
  withdraw: '#ff9500',
}

const TYPE_LABEL: Record<string, string> = {
  deposit: '💰 Deposit',
  withdraw: '💸 Withdraw',
}

const TYPE_ICON: Record<string, string> = {
  deposit: '💰',
  withdraw: '💸',
}

const TYPE_BG: Record<string, string> = {
  deposit: 'linear-gradient(135deg,#00c8ff,#7b2fff)',
  withdraw: 'linear-gradient(135deg,#ff9500,#ff2d78)',
}

export default function Aktivitas({ mobile = false }: { mobile?: boolean }) {
  const [items, setItems] = useState<Item[]>(AKTIVITAS_AWAL)
  const realDataRef = useRef<Item[]>([])

  useEffect(() => {
    aktivitasApi.get().then(res => {
      if (res.aktivitas && res.aktivitas.length > 0) {
        realDataRef.current = res.aktivitas
          .filter((a: any) => ['deposit', 'withdraw'].includes(a.type))
          .map((a: any) => ({ ...a, isReal: true }))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const interval = () => {
      const delay = 2000 + Math.random() * 2000
      return setTimeout(() => {
        setItems(prev => {
          let newItem: Item
          if (realDataRef.current.length > 0 && Math.random() < 0.3) {
            const idx = Math.floor(Math.random() * realDataRef.current.length)
            newItem = realDataRef.current[idx]
          } else {
            newItem = randomAktivitas()
          }
          return [newItem, ...prev.slice(0, mobile ? 7 : 9)]
        })
        t = interval()
      }, delay)
    }
    let t = interval()
    return () => clearTimeout(t)
  }, [mobile])

  const shown = items.slice(0, mobile ? 8 : 10)

  if (mobile) return (
    <div style={{ background: 'var(--bg2)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {shown.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px',
          borderBottom: i < shown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          animation: i === 0 ? 'fadeIn 0.4s ease' : 'none',
          background: transparent,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: TYPE_BG[p.type] || TYPE_BG.deposit,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>
            {TYPE_ICON[p.type] || '💰'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {p.nama}
              
            </div>
            <div style={{ fontSize: 10, color: TYPE_COLOR[p.type] || 'var(--muted)' }}>
              {TYPE_LABEL[p.type] || '-'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[p.type] }}>
              {p.type === 'withdraw' ? '-' : '+'}Rp {p.jumlah.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Sidebar desktop
  return (
    <div>
      {shown.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 0',
          borderBottom: i < shown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          animation: i === 0 ? 'fadeIn 0.4s ease' : 'none',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: TYPE_BG[p.type] || TYPE_BG.deposit,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
          }}>
            {TYPE_ICON[p.type] || '💰'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700 }}>
              {p.nama}
              
            </div>
            <div style={{ fontSize: 9, color: TYPE_COLOR[p.type] }}>
              {TYPE_LABEL[p.type]}
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[p.type], whiteSpace: 'nowrap' }}>
            {p.type === 'withdraw' ? '-' : '+'}{(p.jumlah / 1000).toFixed(0)}K
          </div>
        </div>
      ))}
    </div>
  )
}
