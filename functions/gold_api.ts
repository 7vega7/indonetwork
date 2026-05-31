// @ts-nocheck
import { json } from './_utils';

// Transfer API tidak membutuhkan gold_api
// Endpoint ini dibiarkan untuk kompatibilitas
export async function onRequestPost({ request }) {
  return json({ status: 1, user_balance: 0 });
}
