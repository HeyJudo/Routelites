// IMPORTANT: This file MUST use the anon (public) key, never the service_role key.
// The service_role key has admin privileges and must never be shipped in client code.
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing env var EXPO_PUBLIC_SUPABASE_URL — add it to your .env file.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing env var EXPO_PUBLIC_SUPABASE_ANON_KEY — add it to your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
