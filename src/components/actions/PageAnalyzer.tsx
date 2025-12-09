'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PageAnalysis {
  score: number;
  summary: string;
  categories: {
    name: string;
    score: number;
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
    }[];
  }[];
}

interface PageAnalyzerProps {
  brandId: string;
}

export function PageAnalyzer({ brandId }: PageAnalyzerProps) {
  const [inputType, setInputType] = useState<'url' | 'content'>('url');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputType === 'url' ? url : undefined,
          content: inputType === 'content' ? content : undefined,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analyze Page</CardTitle>
          <CardDescription>
            Analyze a URL or paste content to get LLM optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'url' | 'content')}>
            <TabsList>
              <TabsTrigger value="url">Analyze URL</TabsTrigger>
              <TabsTrigger value="content">Analyze Content</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-4">
              <Input
                placeholder="https://example.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <Textarea
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (inputType === 'url' ? !url : !content)}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && <AnalysisResults analysis={analysis} />}
    </div>
  );
}

function AnalysisResults({ analysis }: { analysis: PageAnalysis }) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </div>
            <div>
              <div className="text-lg font-medium">LLM Optimization Score</div>
              <p className="text-muted-foreground">{analysis.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis.categories.map((category) => (
        <Card key={category.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <Badge variant="outline" className={getScoreColor(category.score)}>
                {category.score}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.recommendations.map((rec, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    <div>
                      <div className="font-medium">{rec.title}</div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
