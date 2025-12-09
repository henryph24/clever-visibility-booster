'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Settings, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  domain: string;
  industry: string | null;
  competitors: { id: string; name: string }[];
  _count?: { topics: number; metrics: number };
}

interface BrandCardProps {
  brand: Brand;
  onDelete: (id: string) => void;
}

export function BrandCard({ brand, onDelete }: BrandCardProps) {
  return (
    <Card className="group relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            <Link href={`/dashboard/${brand.id}`} className="hover:underline">
              {brand.name}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{brand.domain}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/brands/${brand.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(brand.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {brand.industry && (
            <Badge variant="secondary" className="text-xs">
              {brand.industry}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {brand.competitors.length} competitors
          </Badge>
          {brand._count && (
            <Badge variant="outline" className="text-xs">
              {brand._count.topics} topics
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
