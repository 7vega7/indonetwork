// @ts-nocheck
import { json } from './_utils';

export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); } catch { body = 'INVALID JSON'; }
  console.log('TEST CALLBACK RECEIVED:', JSON.stringify(body));
  return json({ status: 1, user_balance: 99999, msg: 'TEST OK' });
}

export async function onRequestGet({ request }) {
  console.log('TEST GET RECEIVED');
  return json({ status: 1, msg: 'TEST ENDPOINT ACTIVE' });
}
