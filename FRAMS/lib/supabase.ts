import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Try to get from process.env first (local dev), then from app.json extra config (production builds)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // SECURITY: Do NOT create a placeholder client – it silently fails all operations
  // and hides the root cause. Fail loudly so the developer knows immediately.
  console.error('❌ Supabase credentials are missing! Check your .env file or app.json extra config.');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'Present' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  throw new Error(
    'FATAL: Supabase credentials are required. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env or app.json extra.'
  );
}

// SecureStore adapter – session persistence for Supabase auth.
// NOTE: setItem and removeItem MUST return their promises so the Supabase
// client can await them. Previously they were fire-and-forget, which caused
// silent session loss on device between app restarts.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);   // return added – was missing
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);        // return added – was missing
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});