// @ts-nocheck
import { ok, err, getAuth, getSupabase } from '../_utils';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth) return err('Tidak terautentikasi', 401);

  let body;
  try { body = await request.json(); } catch { return err('Body tidak valid'); }

  const { jumlah, metode } = body;
  if (!jumlah || jumlah < 10000) return err('Minimal deposit Rp 10.000');
  if (jumlah > 50000000) return err('Maksimal deposit Rp 50.000.000');

  const metodeDiizinkan = ['QRIS','GOPAY','OVO','DANA','SHOPEEPAY','BCA','BRI','BNI','MANDIRI','PULSA'];
  if (!metode || !metodeDiizinkan.includes(metode.toUpperCase())) return err('Metode tidak valid');

  const referensi = `DEP-${auth.username.toUpperCase()}-${Date.now()}`;
  const sb = getSupabase(env);

  const { data: deposit, error } = await sb.from('deposits').insert({
    user_id: auth.sub,
    amount: jumlah,
    method: metode.toUpperCase(),
    reference: referensi,
    status: 'pending',
    payment_url: null,
  }).select('id, amount, method, reference, status, created_at').single();

  if (error || !deposit) return err('Gagal membuat deposit');

  const fmt = (n) => `Rp ${n.toLocaleString('id-ID')}`;
  const instruksi = {
    QRIS: `Scan QRIS transfer tepat ${fmt(jumlah)}. Kode: ${referensi}`,
    GOPAY: `Transfer ${fmt(jumlah)} ke GoPay kami. Keterangan: ${referensi}`,
    OVO: `Transfer ${fmt(jumlah)} ke OVO kami. Keterangan: ${referensi}`,
    DANA: `Transfer ${fmt(jumlah)} ke Dana kami. Keterangan: ${referensi}`,
    SHOPEEPAY: `Transfer ${fmt(jumlah)} ke ShopeePay kami. Keterangan: ${referensi}`,
    BCA: `Transfer ${fmt(jumlah)} ke BCA 1234567890 a/n INDONETWORK. Keterangan: ${referensi}`,
    BRI: `Transfer ${fmt(jumlah)} ke BRI 9876543210 a/n INDONETWORK. Keterangan: ${referensi}`,
    BNI: `Transfer ${fmt(jumlah)} ke BNI 1122334455 a/n INDONETWORK. Keterangan: ${referensi}`,
    MANDIRI: `Transfer ${fmt(jumlah)} ke Mandiri 5566778899 a/n INDONETWORK. Keterangan: ${referensi}`,
    PULSA: `Kirim pulsa ${fmt(jumlah)} ke nomor kami. Keterangan: ${referensi}`,
  }[metode.toUpperCase()];

  return ok({
    pesan: 'Permintaan deposit berhasil dibuat',
    deposit: {
      id: deposit.id,
      jumlah: deposit.amount,
      metode: deposit.method,
      referensi: deposit.reference,
      status: deposit.status,
      instruksi,
      dibuat: deposit.created_at,
    },
  });
}
