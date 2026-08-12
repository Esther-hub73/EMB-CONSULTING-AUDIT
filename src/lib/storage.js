import { getSupabase } from './supabaseClient';

/**
 * Storage abstraction — same get/set shape the app already used.
 * - If Supabase is configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set),
 *   data is persisted in the `kv_store` table → available on any device.
 * - Otherwise it falls back to the browser's localStorage so the app still
 *   works immediately after deployment, before Supabase is wired up.
 */

const LOCAL_PREFIX = 'emb-audit:';

export async function storageGet(key) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('kv_store').select('value').eq('key', key).maybeSingle();
    if (error) throw error;
    return data ? { key, value: data.value } : null;
  }
  const raw = localStorage.getItem(LOCAL_PREFIX + key);
  return raw ? { key, value: raw } : null;
}

export async function storageSet(key, value) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('kv_store').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { key, value };
  }
  localStorage.setItem(LOCAL_PREFIX + key, value);
  return { key, value };
}
