// @ts-nocheck
import { err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses admin diperlukan', 403);

  const url = new URL(request.url);
  const tipe = url.searchParams.get('tipe') || 'transaksi';
  const dari = url.searchParams.get('dari') || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  const sampai = url.searchParams.get('sampai') || new Date().toISOString().split('T')[0];

  const sb = getSupabase(env);
  let csv = '';
  let filename = '';

  if (tipe === 'transaksi') {
    const { data } = await sb.from('transactions')
      .select('*, users(username)')
      .gte('created_at', dari)
      .lte('created_at', sampai + 'T23:59:59')
      .order('created_at', { ascending: false })
      .limit(10000);

    filename = `transaksi_${dari}_${sampai}.csv`;
    csv = 'Tanggal,Username,Tipe,Jumlah,Saldo Sebelum,Saldo Sesudah,Deskripsi,Status\n';
    for (const t of data || []) {
      csv += `"${new Date(t.created_at).toLocaleString('id-ID')}","${t.users?.username}","${t.type}","${t.amount}","${t.balance_before}","${t.balance_after}","${t.description}","${t.status}"\n`;
    }
  }

  if (tipe === 'deposit') {
    const { data } = await sb.from('deposits')
      .select('*, users(username)')
      .gte('created_at', dari)
      .lte('created_at', sampai + 'T23:59:59')
      .order('created_at', { ascending: false })
      .limit(10000);

    filename = `deposit_${dari}_${sampai}.csv`;
    csv = 'Tanggal,Username,Jumlah,Metode,Reference,Status\n';
    for (const d of data || []) {
      csv += `"${new Date(d.created_at).toLocaleString('id-ID')}","${d.users?.username}","${d.amount}","${d.method}","${d.reference}","${d.status}"\n`;
    }
  }

  if (tipe === 'withdraw') {
    const { data } = await sb.from('withdrawals')
      .select('*, users(username)')
      .gte('created_at', dari)
      .lte('created_at', sampai + 'T23:59:59')
      .order('created_at', { ascending: false })
      .limit(10000);

    filename = `withdraw_${dari}_${sampai}.csv`;
    csv = 'Tanggal,Username,Jumlah,Bank,No Rekening,Atas Nama,Status\n';
    for (const w of data || []) {
      csv += `"${new Date(w.created_at).toLocaleString('id-ID')}","${w.users?.username}","${w.amount}","${w.bank}","${w.no_rekening}","${w.atas_nama}","${w.status}"\n`;
    }
  }

  if (tipe === 'users') {
    const { data } = await sb.from('users')
      .select('username, email, balance, role, is_active, created_at, last_login, login_count')
      .not('role', 'in', '("owner")')
      .order('created_at', { ascending: false })
      .limit(10000);

    filename = `users_${dari}_${sampai}.csv`;
    csv = 'Username,Email,Saldo,Role,Status,Terdaftar,Login Terakhir,Total Login\n';
    for (const u of data || []) {
      csv += `"${u.username}","${u.email}","${u.balance}","${u.role}","${u.is_active ? 'Aktif' : 'Nonaktif'}","${new Date(u.created_at).toLocaleString('id-ID')}","${u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-'}","${u.login_count || 0}"\n`;
    }
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  });
}
