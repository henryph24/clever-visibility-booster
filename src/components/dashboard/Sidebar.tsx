'use client';

import { cn } from '@/lib/utils';
import { LayoutDashboard, Link, Menu, MessageSquare, Settings, Users, Zap, X } from 'lucide-react';
import NextLink from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../ui/button';

const navItems = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Prompts', href: '/prompts', icon: MessageSquare },
  { label: 'Sources', href: '/sources', icon: Link },
  { label: 'Competitors', href: '/competitors', icon: Users },
  { label: 'Actions', href: '/actions', icon: Zap },
];

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const brandId = params.brandId as string | undefined;
  const [isOpen, setIsOpen] = useState(false);

  if (!brandId) {
    return null;
  }

  const basePath = `/dashboard/${brandId}`;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <NextLink href="/dashboard" className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-5 w-5" />
              <span>AI Visibility</span>
            </NextLink>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const href = `${basePath}${item.href}`;
              const isActive = item.href === '' ? pathname === basePath : pathname.startsWith(href);

              return (
                <NextLink
                  key={item.label}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NextLink>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <NextLink
              href={`/dashboard/brands/${brandId}/settings`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Brand Settings
            </NextLink>
          </div>
        </div>
      </aside>
    </>
  );
}
