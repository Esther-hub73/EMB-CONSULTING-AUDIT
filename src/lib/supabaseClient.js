import { createClient } from '@supabase/supabase-js';

let client = null;
let attempted = false;

export function getSupabase() {
  if (attempted) return client;
  attempted = true;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) {
    client = createClient(url, key);
  }
  return client;
}
