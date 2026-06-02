// @ts-nocheck
import { sendTelegram } from '../_telegram';
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
    }
  } catch(e) {}

  if (saldoAktual < jumlah) return err('Saldo tidak mencukupi');

  // Buat withdrawal record dulu untuk dapat ID
  const { data: wd } = await sb.from('withdrawals').insert({
    user_id: auth.sub,
    amount: jumlah,
    bank,
    no_rekening,
    atas_nama,
    status: 'pending',
  }).select().single();

  if (!wd) return err('Gagal membuat permintaan withdraw');

  // Langsung tarik saldo dari NexusGGR
  const agentSign = `wd_${wd.id.replace(/-/g, '_')}`;
  const nexusRes = await nexus(env, {
    method: 'user_withdraw',
    user_code: user.username,
    amount: jumlah,
    agent_sign: agentSign,
  });

  if (!nexusRes || nexusRes.status !== 1) {
    // Gagal tarik dari NexusGGR - hapus withdrawal record
    await sb.from('withdrawals').delete().eq('id', wd.id);
    return err(`Gagal memproses withdraw: ${nexusRes?.msg || 'Unknown error'}`);
  }

  const saldoSetelah = nexusRes.user_balance;

  // Update saldo Supabase
  await sb.from('users').update({ balance: saldoSetelah }).eq('id', auth.sub);

  // Catat transaksi pending
  await sb.from('transactions').insert({
    user_id: auth.sub,
    type: 'withdraw',
    amount: jumlah,
    balance_before: saldoAktual,
    balance_after: saldoSetelah,
    description: `Withdraw ke ${bank} - ${no_rekening}`,
    status: 'pending',
  });

  return ok({
    pesan: 'Permintaan withdraw berhasil, menunggu konfirmasi admin',
    withdrawal: wd,
    saldo_sekarang: saldoSetelah,
  });
}
