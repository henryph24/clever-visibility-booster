'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Competitor {
  id: string;
  name: string;
  domain: string;
}

interface CompetitorListProps {
  brandId: string;
  competitors: Competitor[];
}

export function CompetitorList({ brandId, competitors: initialCompetitors }: CompetitorListProps) {
  const router = useRouter();
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/brands/${brandId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add competitor');
        return;
      }

      const competitor = await res.json();
      setCompetitors([...competitors, competitor]);
      setName('');
      setDomain('');
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (competitorId: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/competitors/${competitorId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCompetitors(competitors.filter((c) => c.id !== competitorId));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete competitor:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitors</CardTitle>
        <CardDescription>
          Add competitors to compare their AI visibility against your brand.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No competitors added yet.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {competitors.map((competitor) => (
                <div key={competitor.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{competitor.name}</p>
                    <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(competitor.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAdd} className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium">Add Competitor</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="competitor-name">Name</Label>
              <Input
                id="competitor-name"
                placeholder="Competitor Inc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitor-domain">Domain</Label>
              <Input
                id="competitor-domain"
                placeholder="competitor.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Competitor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
