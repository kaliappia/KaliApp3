import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation des variables d'environnement
if (!supabaseUrl) {
  throw new Error(
    '❌ VITE_SUPABASE_URL is not defined.\n\n' +
    'Please set the environment variable in:\n' +
    '- Vercel Dashboard: Project Settings > Environment Variables\n' +
    '- Local: Create a .env file with VITE_SUPABASE_URL=your_supabase_url\n\n' +
    'See .env.example for reference.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ VITE_SUPABASE_ANON_KEY is not defined.\n\n' +
    'Please set the environment variable in:\n' +
    '- Vercel Dashboard: Project Settings > Environment Variables\n' +
    '- Local: Create a .env file with VITE_SUPABASE_ANON_KEY=your_anon_key\n\n' +
    'See .env.example for reference.'
  );
}

console.log('✅ Supabase configuration loaded successfully');
console.log('Supabase URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);