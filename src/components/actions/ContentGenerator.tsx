'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Topic {
  id: string;
  name: string;
}

interface ContentGeneratorProps {
  brandId: string;
}

type ContentType = 'blog' | 'landing' | 'comparison' | 'faq' | 'guide';

export function ContentGenerator({ brandId }: ContentGeneratorProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}/topics`);
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setIsLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [brandId]);

  const handleAddUrl = () => {
    if (newUrl && referenceUrls.length < 3) {
      setReferenceUrls([...referenceUrls, newUrl]);
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setReferenceUrls(referenceUrls.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic || undefined,
          contentType,
          referenceUrls: referenceUrls.length > 0 ? referenceUrls : undefined,
          additionalContext: additionalContext || undefined,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const result = await response.json();
      setGeneratedContent(result.content);
      setWordCount(result.wordCount);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedContent);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contentType}-content.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contentTypeLabels: Record<ContentType, string> = {
    blog: 'Blog Post',
    landing: 'Landing Page',
    comparison: 'Comparison Article',
    faq: 'FAQ Section',
    guide: 'How-to Guide',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>Create LLM-optimized content for your brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTopics ? 'Loading...' : 'Select a topic'} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reference Pages (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Add URLs of high-performing pages to use as style reference
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/article"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={referenceUrls.length >= 3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddUrl}
                disabled={!newUrl || referenceUrls.length >= 3}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {referenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {referenceUrls.map((url, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    {new URL(url).hostname}
                    <button onClick={() => handleRemoveUrl(i)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Textarea
              placeholder="Any specific points to cover, keywords to include, or style notes..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>{wordCount} words</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{generatedContent}</ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="markdown" className="mt-4">
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={20}
                  className="font-mono"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
