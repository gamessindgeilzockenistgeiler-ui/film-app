'use client';

import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Einziger Client-seitiger Supabase-Client (Singleton), abgesichert durch
// Row Level Security — siehe supabase/schema.sql.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function getSafeSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase-Session konnte nicht geladen werden:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.warn('Supabase-Auth ist vorübergehend nicht verfügbar:', error);
    return null;
  }
}

export async function getSafeUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Supabase-User konnte nicht geladen werden:', error.message);
      return null;
    }
    return data.user;
  } catch (error) {
    console.warn('Supabase-Auth ist vorübergehend nicht verfügbar:', error);
    return null;
  }
}
