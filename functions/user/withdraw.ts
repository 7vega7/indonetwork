// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);
  const sb = getSupabase(env);
  const { data } = await sb.from('withdrawals').select('*').eq('user_id', auth.sub).order('created_at', { ascending: false });
  return ok({ withdrawals: data || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { jumlah, bank, no_rekening, atas_nama } = body;

  if (!jumlah || jumlah < 50000) return err('Minimal withdraw Rp 50.000');
  if (jumlah > 50000000) return err('Maksimal withdraw Rp 50.000.000');
  if (!bank || !no_rekening || !atas_nama) return err('Data bank wajib diisi');

  const sb = getSupabase(env);

  // Cek saldo
  const { data: user } = await sb.from('users').select('balance, profil_lengkap').eq('id', auth.sub).single();
  if (!user) return err('Pengguna tidak ditemukan', 404);
  if (!user.profil_lengkap) return err('Lengkapi profil terlebih dahulu');
  if (user.balance < jumlah) return err('Saldo tidak mencukupi');

  // Freeze saldo
  const { error } = await sb.from('users').update({ balance: user.balance - jumlah }).eq('id', auth.sub);
  if (error) return err('Gagal memproses withdraw');

  // Catat transaksi
  await sb.from('transactions').insert({
    user_id: auth.sub, type: 'withdraw', amount: jumlah,
    balance_before: user.balance, balance_after: user.balance - jumlah,
    description: `Withdraw ke ${bank} - ${no_rekening}`,
    status: 'pending',
  });

  // Buat withdrawal request
  const { data: wd } = await sb.from('withdrawals').insert({
    user_id: auth.sub, amount: jumlah, bank, no_rekening, atas_nama, status: 'pending',
  }).select().single();

  return ok({ pesan: 'Permintaan withdraw berhasil dikirim', withdrawal: wd });
}
