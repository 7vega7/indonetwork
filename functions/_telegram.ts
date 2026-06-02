// @ts-nocheck
import { getSettings } from './_settings';

export async function sendTelegram(env: any, pesan: string) {
  const settings = await getSettings(env);
  const token = settings['telegram_bot_token'];
  const chatId = settings['telegram_chat_id'];

  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: pesan,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch { return false; }
}
