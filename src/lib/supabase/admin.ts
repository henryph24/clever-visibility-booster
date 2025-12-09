import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Lazy singleton for service role client
// This avoids initialization errors during build when env vars aren't available
let _supabaseAdmin: SupabaseClient<Database> | null = null;

export const supabaseAdmin = {
  get client(): SupabaseClient<Database> {
    if (!_supabaseAdmin) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase environment variables');
      }
      _supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return _supabaseAdmin;
  },

  from<T extends keyof Database['public']['Tables']>(table: T) {
    return this.client.from(table);
  },

  rpc<T extends keyof Database['public']['Functions']>(
    fn: T,
    args?: Database['public']['Functions'][T]['Args']
  ) {
    return this.client.rpc(fn, args);
  },
};
