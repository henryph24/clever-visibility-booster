import { createLLMClient, LLMProvider } from '@/lib/llm';

interface SimulationInput {
  brandName: string;
  originalContent: string;
  modifiedContent: string;
  prompts: Array<{ id: string; text: string }>;
  providers?: LLMProvider[];
}

interface ProviderResult {
  provider: LLMProvider;
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

export interface SimulationResults {
  prompts: PromptSimulation[];
  summary: {
    improved: number;
    unchanged: number;
    degraded: number;
  };
}

export class ContentSimulator {
  private defaultProviders: LLMProvider[] = ['OPENAI', 'ANTHROPIC', 'PERPLEXITY'];

  async simulate(input: SimulationInput): Promise<SimulationResults> {
    const providers = input.providers || this.defaultProviders;
    const results: PromptSimulation[] = [];

    for (const prompt of input.prompts) {
      const providerResults: ProviderResult[] = [];

      for (const provider of providers) {
        try {
          const client = createLLMClient(provider);

          // Query with original content context
          const beforePrompt = this.buildContextualPrompt(
            prompt.text,
            input.originalContent,
            input.brandName
          );
          const beforeResult = await client.query(beforePrompt);
          const beforeParsed = this.parseForBrand(beforeResult.response, input.brandName);

          // Query with modified content context
          const afterPrompt = this.buildContextualPrompt(
            prompt.text,
            input.modifiedContent,
            input.brandName
          );
          const afterResult = await client.query(afterPrompt);
          const afterParsed = this.parseForBrand(afterResult.response, input.brandName);

          providerResults.push({
            provider,
            before: beforeParsed,
            after: afterParsed,
            change: this.determineChange(beforeParsed, afterParsed),
          });
        } catch {
          // If a provider fails, add a neutral result
          providerResults.push({
            provider,
            before: { mentioned: false, rank: null, context: 'Error querying' },
            after: { mentioned: false, rank: null, context: 'Error querying' },
            change: 'unchanged',
          });
        }
      }

      results.push({
        promptId: prompt.id,
        promptText: prompt.text,
        providers: providerResults,
      });
    }

    return {
      prompts: results,
      summary: this.calculateSummary(results),
    };
  }

  private buildContextualPrompt(query: string, content: string, brandName: string): string {
    return `You are evaluating content for ${brandName}. Based on the following reference content, answer this user question: "${query}"

Reference Content:
${content.slice(0, 6000)}

Instructions:
- Provide a helpful, informative response
- If the content mentions ${brandName} or related products/services, include them in your recommendations if relevant
- Be objective and mention alternatives if appropriate
- Format your response clearly

Answer:`;
  }

  private parseForBrand(
    response: string,
    brandName: string
  ): { mentioned: boolean; rank: number | null; context: string } {
    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // Check if brand is mentioned
    const mentioned = lowerResponse.includes(lowerBrand);

    // Try to determine rank position (look for numbered lists, "first", "top", etc.)
    let rank: number | null = null;
    if (mentioned) {
      // Look for patterns like "1. BrandName" or "First, BrandName"
      const lines = response.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes(lowerBrand)) {
          // Check for numbered position
          const numMatch = line.match(/^(\d+)[.\)]/);
          if (numMatch) {
            rank = parseInt(numMatch[1], 10);
            break;
          }
          // Check for ordinal words
          if (line.includes('first') || line.includes('top pick') || line.includes('best')) {
            rank = 1;
            break;
          }
          if (line.includes('second')) {
            rank = 2;
            break;
          }
          if (line.includes('third')) {
            rank = 3;
            break;
          }
        }
      }
    }

    // Extract context around brand mention
    let context = '';
    if (mentioned) {
      const brandIndex = lowerResponse.indexOf(lowerBrand);
      const start = Math.max(0, brandIndex - 100);
      const end = Math.min(response.length, brandIndex + lowerBrand.length + 100);
      context = response.slice(start, end).trim();
      if (start > 0) context = '...' + context;
      if (end < response.length) context = context + '...';
    }

    return { mentioned, rank, context };
  }

  private determineChange(
    before: { mentioned: boolean; rank: number | null },
    after: { mentioned: boolean; rank: number | null }
  ): 'improved' | 'unchanged' | 'degraded' {
    // Not mentioned before, mentioned now = improved
    if (!before.mentioned && after.mentioned) return 'improved';

    // Mentioned before, not mentioned now = degraded
    if (before.mentioned && !after.mentioned) return 'degraded';

    // Both mentioned, compare ranks
    if (before.rank !== null && after.rank !== null) {
      if (after.rank < before.rank) return 'improved';
      if (after.rank > before.rank) return 'degraded';
    }

    // Rank appeared where there was none = improved
    if (before.rank === null && after.rank !== null) return 'improved';

    // Rank disappeared = degraded
    if (before.rank !== null && after.rank === null) return 'degraded';

    return 'unchanged';
  }

  private calculateSummary(results: PromptSimulation[]): {
    improved: number;
    unchanged: number;
    degraded: number;
  } {
    let improved = 0;
    let unchanged = 0;
    let degraded = 0;

    for (const prompt of results) {
      for (const provider of prompt.providers) {
        switch (provider.change) {
          case 'improved':
            improved++;
            break;
          case 'degraded':
            degraded++;
            break;
          default:
            unchanged++;
        }
      }
    }

    return { improved, unchanged, degraded };
  }
}

export const contentSimulator = new ContentSimulator();
