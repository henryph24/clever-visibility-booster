'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePrompts } from '@/hooks/useTopics';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { ResponseViewerDialog } from './ResponseViewerDialog';

interface PromptListProps {
  topicId: string;
}

const PROVIDERS = [
  { key: 'OPENAI', label: 'ChatGPT' },
  { key: 'ANTHROPIC', label: 'Claude' },
  { key: 'GOOGLE', label: 'Gemini' },
] as const;

export function PromptList({ topicId }: PromptListProps) {
  const { data: prompts, isLoading } = usePrompts(topicId);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No prompts in this topic yet. Generate prompts to start tracking.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Prompt</TableHead>
            {PROVIDERS.map((provider) => (
              <TableHead key={provider.key} className="text-center">
                {provider.label}
              </TableHead>
            ))}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="max-w-md">
                <span className="line-clamp-2">{prompt.text}</span>
              </TableCell>
              {PROVIDERS.map((provider) => {
                const response = prompt.responses.find((r) => r.provider === provider.key);
                if (!response) {
                  return (
                    <TableCell key={provider.key} className="text-center">
                      <Badge variant="outline" className="text-muted-foreground">
                        —
                      </Badge>
                    </TableCell>
                  );
                }
                return (
                  <TableCell key={provider.key} className="text-center">
                    {response.hasMention ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        #{response.rank || '✓'}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Not mentioned</Badge>
                    )}
                  </TableCell>
                );
              })}
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPromptId(prompt.id)}
                  disabled={prompt.responses.length === 0}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ResponseViewerDialog
        promptId={selectedPromptId}
        open={!!selectedPromptId}
        onClose={() => setSelectedPromptId(null)}
      />
    </>
  );
}
