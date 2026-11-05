import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zdhhqbljyjeeddhnebuu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7emER4hD6CSHtpvUVcz-eA_XTYjPNrM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
