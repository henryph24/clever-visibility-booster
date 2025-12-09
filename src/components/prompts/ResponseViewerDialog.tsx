'use client';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePromptResponses } from '@/hooks/useTopics';
import { ExternalLink } from 'lucide-react';

interface ResponseViewerDialogProps {
  promptId: string | null;
  open: boolean;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: 'ChatGPT',
  ANTHROPIC: 'Claude',
  GOOGLE: 'Gemini',
};

export function ResponseViewerDialog({ promptId, open, onClose }: ResponseViewerDialogProps) {
  const { data: responses, isLoading } = usePromptResponses(promptId || '');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Responses</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded bg-muted" />
          </div>
        ) : responses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No responses available.</div>
        ) : (
          <Tabs defaultValue={responses[0]?.provider || 'OPENAI'}>
            <TabsList>
              {responses.map((response) => (
                <TabsTrigger key={response.provider} value={response.provider}>
                  {PROVIDER_LABELS[response.provider] || response.provider}
                </TabsTrigger>
              ))}
            </TabsList>

            {responses.map((response) => (
              <TabsContent key={response.provider} value={response.provider} className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 text-sm font-medium">Response</h4>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                    <HighlightedResponse
                      text={response.responseText}
                      mentions={response.mentions.map((m) => m.brandName)}
                    />
                  </div>
                </div>

                {response.mentions.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 text-sm font-medium">Brand Mentions</h4>
                    <div className="space-y-2">
                      {response.mentions.map((mention, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded bg-muted/50 px-3 py-2"
                        >
                          <span className="font-medium">{mention.brandName}</span>
                          <div className="flex items-center gap-2">
                            {mention.rankPosition && (
                              <Badge variant="outline">Rank #{mention.rankPosition}</Badge>
                            )}
                            {mention.isCited && (
                              <Badge className="bg-blue-100 text-blue-800">Cited</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.sources.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 text-sm font-medium">Cited Sources</h4>
                    <ul className="space-y-1">
                      {response.sources.map((source, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {source.title || source.domain}
                          </a>
                          <span className="text-muted-foreground">({source.domain})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HighlightedResponse({ text, mentions }: { text: string; mentions: string[] }) {
  if (mentions.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${mentions.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = mentions.some((m) => m.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
