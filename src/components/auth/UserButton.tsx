'use client';

import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function UserButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!session) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4" />
          </div>
        )}
        <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
