import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "paste_here") {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase not initialized! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local file.");
}

export { supabase };
