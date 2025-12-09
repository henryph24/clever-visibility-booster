import { AnthropicClient } from './anthropic';
import { GoogleAIClient } from './google';
import { OpenAIClient } from './openai';
import { PerplexityClient } from './perplexity';
import { LLMClient, LLMProvider, LLMQueryResult } from './types';

export type { Citation, LLMClient, LLMProvider, LLMQueryResult } from './types';

export function createLLMClient(provider: LLMProvider): LLMClient {
  switch (provider) {
    case 'OPENAI':
      return new OpenAIClient();
    case 'ANTHROPIC':
      return new AnthropicClient();
    case 'GOOGLE':
      return new GoogleAIClient();
    case 'PERPLEXITY':
      return new PerplexityClient();
  }
}

export async function queryAllLLMs(prompt: string): Promise<LLMQueryResult[]> {
  const clients: LLMClient[] = [new OpenAIClient(), new AnthropicClient(), new PerplexityClient()];

  const results = await Promise.allSettled(clients.map((c) => c.query(prompt)));

  return results
    .filter((r): r is PromiseFulfilledResult<LLMQueryResult> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export async function queryLLM(provider: LLMProvider, prompt: string): Promise<LLMQueryResult> {
  const client = createLLMClient(provider);
  return client.query(prompt);
}
