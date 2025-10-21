import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Créer un client Supabase avec des valeurs par défaut si non configuré
// Cela évite le crash mais l'app affichera un message si non configuré
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);