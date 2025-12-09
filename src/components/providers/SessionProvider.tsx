'use client';

import { ReactNode } from 'react';

// Supabase handles auth state internally via cookies
// This wrapper is kept for compatibility but doesn't need a provider
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
