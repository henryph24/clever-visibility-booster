'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, ArrowUp, Loader2, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Prompt {
  id: string;
  text: string;
  topicName: string;
}

interface ProviderResult {
  provider: string;
  before: {
    mentioned: boolean;
    rank: number | null;
    context: string;
  };
  after: {
    mentioned: boolean;
    rank: number | null;
    context: string;
  };
  change: 'improved' | 'unchanged' | 'degraded';
}

interface PromptSimulation {
  promptId: string;
  promptText: string;
  providers: ProviderResult[];
}

interface SimulationResults {
  prompts: PromptSimulation[];
  summary: {
    improved: number;
    unchanged: number;
    degraded: number;
  };
}

interface SimulationEditorProps {
  brandId: string;
}

export function SimulationEditor({ brandId }: SimulationEditorProps) {
  const [originalContent, setOriginalContent] = useState('');
  const [modifiedContent, setModifiedContent] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}/topics`);
        if (response.ok) {
          const topics = await response.json();
          const allPrompts: Prompt[] = [];

          for (const topic of topics) {
            const promptsRes = await fetch(`/api/brands/${brandId}/topics/${topic.id}/prompts`);
            if (promptsRes.ok) {
              const topicPrompts = await promptsRes.json();
              allPrompts.push(
                ...topicPrompts.map((p: { id: string; text: string }) => ({
                  ...p,
                  topicName: topic.name,
                }))
              );
            }
          }
          setPrompts(allPrompts);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setIsLoadingPrompts(false);
      }
    };
    fetchPrompts();
  }, [brandId]);

  const togglePrompt = (promptId: string) => {
    if (selectedPrompts.includes(promptId)) {
      setSelectedPrompts(selectedPrompts.filter((id) => id !== promptId));
    } else if (selectedPrompts.length < 5) {
      setSelectedPrompts([...selectedPrompts, promptId]);
    }
  };

  const runSimulation = async () => {
    if (!originalContent || !modifiedContent || selectedPrompts.length === 0) return;

    setIsRunning(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent,
          modifiedContent,
          promptIds: selectedPrompts,
        }),
      });

      if (!response.ok) throw new Error('Simulation failed');
      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulate Changes</CardTitle>
          <CardDescription>
            Test how content changes affect LLM responses before publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Original Content</Label>
              <Textarea
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                rows={12}
                placeholder="Paste your current/original content here..."
              />
            </div>

            <div className="space-y-2">
              <Label>Modified Content</Label>
              <Textarea
                value={modifiedContent}
                onChange={(e) => setModifiedContent(e.target.value)}
                rows={12}
                placeholder="Paste your modified/improved content here..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Test Prompts</CardTitle>
          <CardDescription>Choose up to 5 prompts to test against (max 5)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPrompts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : prompts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No prompts found. Create prompts in the Prompts tab first.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={prompt.id}
                    checked={selectedPrompts.includes(prompt.id)}
                    onCheckedChange={() => togglePrompt(prompt.id)}
                    disabled={!selectedPrompts.includes(prompt.id) && selectedPrompts.length >= 5}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={prompt.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {prompt.text}
                    </label>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {prompt.topicName}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={runSimulation}
        disabled={isRunning || !originalContent || !modifiedContent || selectedPrompts.length === 0}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Simulation...
          </>
        ) : (
          `Run Simulation (${selectedPrompts.length} prompts)`
        )}
      </Button>

      {results && <SimulationResultsDisplay results={results} />}
    </div>
  );
}

function SimulationResultsDisplay({ results }: { results: SimulationResults }) {
  const total = results.summary.improved + results.summary.unchanged + results.summary.degraded;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{results.summary.improved}</div>
            <div className="text-sm text-muted-foreground">
              Improved ({Math.round((results.summary.improved / total) * 100)}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{results.summary.unchanged}</div>
            <div className="text-sm text-muted-foreground">
              Unchanged ({Math.round((results.summary.unchanged / total) * 100)}%)
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">{results.summary.degraded}</div>
            <div className="text-sm text-muted-foreground">
              Degraded ({Math.round((results.summary.degraded / total) * 100)}%)
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Prompt</TableHead>
                <TableHead>ChatGPT</TableHead>
                <TableHead>Claude</TableHead>
                <TableHead>Perplexity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.prompts.map((prompt) => (
                <TableRow key={prompt.promptId}>
                  <TableCell className="font-medium">
                    <span className="line-clamp-2">{prompt.promptText}</span>
                  </TableCell>
                  {['OPENAI', 'ANTHROPIC', 'PERPLEXITY'].map((provider) => {
                    const result = prompt.providers.find((p) => p.provider === provider);
                    if (!result) {
                      return (
                        <TableCell key={provider}>
                          <span className="text-muted-foreground">-</span>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={provider}>
                        <ChangeIndicator
                          before={result.before}
                          after={result.after}
                          change={result.change}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangeIndicator({
  before,
  after,
  change,
}: {
  before: { mentioned: boolean; rank: number | null };
  after: { mentioned: boolean; rank: number | null };
  change: 'improved' | 'unchanged' | 'degraded';
}) {
  const icons = {
    improved: <ArrowUp className="h-4 w-4 text-green-600" />,
    unchanged: <Minus className="h-4 w-4 text-gray-400" />,
    degraded: <ArrowDown className="h-4 w-4 text-red-600" />,
  };

  const formatRank = (mentioned: boolean, rank: number | null) => {
    if (!mentioned) return 'N/A';
    if (rank) return `#${rank}`;
    return 'Yes';
  };

  return (
    <div className="flex items-center gap-2">
      {icons[change]}
      <span className="text-sm">
        {formatRank(before.mentioned, before.rank)} {'→'} {formatRank(after.mentioned, after.rank)}
      </span>
    </div>
  );
}
