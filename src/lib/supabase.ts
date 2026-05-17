import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes("seu-projeto") &&
  !supabaseAnonKey.includes("sua-chave");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
