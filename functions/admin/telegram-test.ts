// @ts-nocheck
import { ok, err, getAuth } from '../_utils';
import { getSettings } from '../_settings';

export async function onRequestPost({ request, env }) {
  const auth = await getAuth(request, env);
  if (!auth || !['admin','owner'].includes(auth.role)) return err('Akses diperlukan', 403);

  const settings = await getSettings(env);
  const token = settings['telegram_bot_token'];
  const chatId = settings['telegram_chat_id'];

  if (!token) return err('Token bot belum diisi');
  if (!chatId) return err('Chat ID belum diisi');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ <b>Test Notifikasi Berhasil!</b>\n\n🎰 <b>INDONETWORK</b>\nBot Telegram sudah terhubung dengan dashboard admin.\n\n🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (!data.ok) return err('Gagal kirim: ' + (data.description || 'Unknown error'));
    return ok({ pesan: 'Pesan test berhasil dikirim ke Telegram!' });
  } catch(e) {
    return err('Gagal kirim: ' + e.message);
  }
}
