// @ts-nocheck
import { ok, err, getAuth, getSupabase, nexus } from '../_utils';

export async function onRequestGet({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);
  const sb = getSupabase(env);
  const { data } = await sb
    .from('withdrawals')
    .select('*')
    .eq('user_id', auth.sub)
    .order('created_at', { ascending: false });
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

  // Cek profil lengkap
  const { data: user } = await sb
    .from('users')
    .select('balance, profil_lengkap, username')
    .eq('id', auth.sub)
    .single();

  if (!user) return err('Pengguna tidak ditemukan', 404);
  if (!user.profil_lengkap) return err('Lengkapi profil terlebih dahulu');

  // Ambil saldo real dari NexusGGR
  let saldoAktual = user.balance;
  try {
    const moneyInfo = await nexus(env, {
      method: 'money_info',
      user_code: user.username,
    });
    if (moneyInfo?.status === 1 && moneyInfo?.user) {
      saldoAktual = moneyInfo.user.balance;
      // Sync ke Supabase
      await sb.from('users').update({ balance: saldoAktual }).eq('id', auth.sub);
    }
  } catch(e) { console.error('money_info error:', e); }

  if (saldoAktual < jumlah) return err('Saldo tidak mencukupi');

  // Catat withdrawal request - status pending
  // Saldo TIDAK di-freeze karena ada di NexusGGR
  // Admin yang akan panggil user_withdraw ke NexusGGR
  const { data: wd } = await sb.from('withdrawals').insert({
    user_id: auth.sub,
    amount: jumlah,
    bank,
    no_rekening,
    atas_nama,
    status: 'pending',
  }).select().single();

  // Catat transaksi pending
  await sb.from('transactions').insert({
    user_id: auth.sub,
    type: 'withdraw',
    amount: jumlah,
    balance_before: saldoAktual,
    balance_after: saldoAktual, // Belum berubah, tunggu admin konfirmasi
    description: `Withdraw ke ${bank} - ${no_rekening}`,
    status: 'pending',
  });

  return ok({
    pesan: 'Permintaan withdraw berhasil dikirim, menunggu konfirmasi admin',
    withdrawal: wd,
  });
}
