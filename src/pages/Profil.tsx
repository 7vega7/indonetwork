import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { userApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function Profil() {
  const { updateSaldo } = useAuth()
  const [profil, setProfil] = useState<any>(null)

  useEffect(() => {
    userApi.profil().then(res => {
      setProfil(res.pengguna)
      updateSaldo(res.pengguna.saldo)
    }).catch(() => toast.error('Gagal memuat profil'))
  }, [])

  if (!profil) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 20 }}>
      <div className="card fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900 }}>
            {profil.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>{profil.username}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{profil.email}</div>
            <div style={{ fontSize: 11, color: profil.role === 'admin' ? 'var(--gold)' : 'var(--blue)', marginTop: 2, fontWeight: 700 }}>
              {profil.role === 'admin' ? '👑 ADMIN' : '👤 MEMBER'}
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.1),rgba(123,47,255,0.1))', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>SALDO ANDA</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
            Rp {profil.saldo.toLocaleString('id-ID')}
          </div>
        </div>

        {[
          ['Kode Referral', profil.kode_referral || '-'],
          ['Bergabung', new Date(profil.bergabung).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })],
          ['Login Terakhir', profil.login_terakhir ? new Date(profil.login_terakhir).toLocaleString('id-ID') : '-'],
        ].map(([label, nilai]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: label === 'Kode Referral' ? 'var(--blue)' : undefined }}>{nilai}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
