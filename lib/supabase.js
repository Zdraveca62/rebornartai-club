import { createClient } from '@supabase/supabase-js';

// Вземи променливите от environment (от .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Проверка дали променливите съществуват
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Липсват Supabase променливи в .env.local');
  console.error('Моля, добавете:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
}

// Създай и експортирай Supabase клиента
export const supabase = createClient(supabaseUrl, supabaseAnonKey);