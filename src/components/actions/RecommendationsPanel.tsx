'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Recommendation {
  id: string;
  type: 'content' | 'technical' | 'outreach' | 'competitor';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: {
    type: 'analyze' | 'generate' | 'external';
    label: string;
    data?: Record<string, unknown>;
  };
  status: 'pending' | 'done' | 'dismissed';
}

interface RecommendationsPanelProps {
  brandId: string;
}

export function RecommendationsPanel({ brandId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/recommendations`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/recommendations`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateStatus = async (recommendationId: string, status: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/recommendations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, status }),
      });
      if (response.ok) {
        setRecommendations((prev) =>
          prev.map((rec) =>
            rec.id === recommendationId
              ? { ...rec, status: status.toLowerCase() as Recommendation['status'] }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Failed to update recommendation:', error);
    }
  };

  const filteredRecs = recommendations.filter((rec) => {
    if (filter === 'all') return rec.status === 'pending';
    return rec.type === filter && rec.status === 'pending';
  });

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'content', label: 'Content' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'competitor', label: 'Competitor' },
    { value: 'technical', label: 'Technical' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <Badge
              key={option.value}
              variant={filter === option.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshRecommendations}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('mr-1 h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {filteredRecs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {recommendations.length === 0
                ? 'No recommendations yet. Click Refresh to generate recommendations based on your visibility data.'
                : 'No pending recommendations in this category.'}
            </p>
            {recommendations.length === 0 && (
              <Button className="mt-4" onClick={refreshRecommendations} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Recommendations'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              brandId={brandId}
              onStatusChange={(status) => updateStatus(rec.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  brandId,
  onStatusChange,
}: {
  recommendation: Recommendation;
  brandId: string;
  onStatusChange: (status: string) => void;
}) {
  const router = useRouter();

  const priorityColors = {
    high: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
    medium: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20',
    low: 'border-l-gray-300',
  };

  const typeIcons = {
    content: <FileText className="h-5 w-5" />,
    technical: <Settings className="h-5 w-5" />,
    outreach: <Mail className="h-5 w-5" />,
    competitor: <Users className="h-5 w-5" />,
  };

  const handleAction = () => {
    switch (recommendation.action.type) {
      case 'analyze':
        const analyzeUrl = recommendation.action.data?.url as string | undefined;
        if (analyzeUrl) {
          router.push(
            `/dashboard/${brandId}/actions?tab=analyze&url=${encodeURIComponent(analyzeUrl)}`
          );
        } else {
          router.push(`/dashboard/${brandId}/actions?tab=analyze`);
        }
        break;
      case 'generate':
        const topicId = recommendation.action.data?.topicId as string | undefined;
        if (topicId) {
          router.push(
            `/dashboard/${brandId}/actions?tab=generate&topic=${encodeURIComponent(topicId)}`
          );
        } else {
          router.push(`/dashboard/${brandId}/actions?tab=generate`);
        }
        break;
      case 'external':
        const externalUrl = recommendation.action.data?.url as string | undefined;
        if (externalUrl) {
          window.open(externalUrl, '_blank');
        }
        break;
    }
  };

  return (
    <Card className={cn('border-l-4 transition-opacity', priorityColors[recommendation.priority])}>
      <CardContent className="pt-4">
        <div className="flex gap-4">
          <div className="text-muted-foreground">{typeIcons[recommendation.type]}</div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{recommendation.title}</h4>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {recommendation.priority}
              </Badge>
            </div>

            <p className="text-sm">
              <span className="font-medium">Impact:</span> {recommendation.impact}
            </p>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAction}>
                {recommendation.action.type === 'external' && (
                  <ExternalLink className="mr-1 h-3 w-3" />
                )}
                {recommendation.action.label}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onStatusChange('done')}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onStatusChange('dismissed')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
