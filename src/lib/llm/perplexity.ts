import OpenAI from 'openai';
import { Citation, LLMClient, LLMQueryResult } from './types';

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    num_search_queries?: number;
  };
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  citations?: string[];
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
}

export class PerplexityClient implements LLMClient {
  provider = 'PERPLEXITY' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  async query(prompt: string): Promise<LLMQueryResult> {
    const start = Date.now();

    try {
      const response = (await this.client.chat.completions.create({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
      })) as unknown as PerplexityResponse;

      // Extract citations from response
      const citations: Citation[] = [];

      // First add search_results (have titles)
      if (response.search_results) {
        for (const result of response.search_results) {
          const url = result.url;
          let domain = '';
          try {
            domain = new URL(url).hostname.replace(/^www\./, '');
          } catch {
            domain = url;
          }
          if (!citations.some((c) => c.url === url)) {
            citations.push({
              url,
              title: result.title || null,
              domain,
            });
          }
        }
      }

      // Then add any citations not in search_results
      if (response.citations) {
        for (const url of response.citations) {
          if (!citations.some((c) => c.url === url)) {
            let domain = '';
            try {
              domain = new URL(url).hostname.replace(/^www\./, '');
            } catch {
              domain = url;
            }
            citations.push({
              url,
              title: null,
              domain,
            });
          }
        }
      }

      const responseText = response.choices[0]?.message?.content || '';

      return {
        provider: this.provider,
        response: responseText,
        citations,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          searchQueries: response.usage?.num_search_queries,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.error('Perplexity query failed:', error);
      throw error;
    }
  }
}
