import OpenAI from 'openai';
import { Citation, LLMClient, LLMQueryResult } from './types';

export class OpenAIClient implements LLMClient {
  provider = 'OPENAI' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async query(prompt: string): Promise<LLMQueryResult> {
    const start = Date.now();

    try {
      // Use Responses API with web search tool
      const response = await this.client.responses.create({
        model: 'gpt-4o',
        input: prompt,
        tools: [{ type: 'web_search' as const }],
      });

      // Extract citations from response output
      const citations: Citation[] = [];
      const output = response.output as Array<{
        type: string;
        content?: Array<{
          type: string;
          text?: string;
          annotations?: Array<{
            type: string;
            url_citation?: {
              url: string;
              title?: string;
              start_index: number;
              end_index: number;
            };
          }>;
        }>;
      }>;

      for (const item of output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.annotations) {
              for (const annotation of content.annotations) {
                if (annotation.type === 'url_citation' && annotation.url_citation) {
                  const url = annotation.url_citation.url;
                  let domain = '';
                  try {
                    domain = new URL(url).hostname.replace(/^www\./, '');
                  } catch {
                    domain = url;
                  }
                  // Avoid duplicates
                  if (!citations.some((c) => c.url === url)) {
                    citations.push({
                      url,
                      title: annotation.url_citation.title || null,
                      domain,
                    });
                  }
                }
              }
            }
          }
        }
      }

      return {
        provider: this.provider,
        response: response.output_text || '',
        citations,
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.error('OpenAI query failed:', error);
      throw error;
    }
  }
}
