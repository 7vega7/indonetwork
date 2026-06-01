// @ts-nocheck
import { getSupabase } from './_utils';

export async function getSettings(env: any): Promise<Record<string, string>> {
  const sb = getSupabase(env);
  const { data } = await sb.from('settings').select('kunci, nilai');
  return (data || []).reduce((acc: any, s: any) => {
    acc[s.kunci] = s.nilai || ''
    return acc
  }, {})
}
