import Anthropic from '@anthropic-ai/sdk';
import { Citation, LLMClient, LLMQueryResult } from './types';

export class AnthropicClient implements LLMClient {
  provider = 'ANTHROPIC' as const;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async query(prompt: string): Promise<LLMQueryResult> {
    const start = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5,
          },
        ],
      });

      // Extract text content and citations
      let responseText = '';
      const citations: Citation[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          responseText += block.text;
          // Extract citations from text block if present
          if ('citations' in block && Array.isArray(block.citations)) {
            for (const citation of block.citations) {
              if (citation.type === 'web_search_result_location') {
                const url = citation.url;
                let domain = '';
                try {
                  domain = new URL(url).hostname.replace(/^www\./, '');
                } catch {
                  domain = url;
                }
                citations.push({
                  url,
                  title: citation.title || null,
                  domain,
                  citedText: citation.cited_text,
                });
              }
            }
          }
        } else if (block.type === 'web_search_tool_result') {
          // Extract sources from web search results
          if (Array.isArray(block.content)) {
            for (const result of block.content) {
              if (result.type === 'web_search_result') {
                const url = result.url;
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
                    title: result.title || null,
                    domain,
                  });
                }
              }
            }
          }
        }
      }

      return {
        provider: this.provider,
        response: responseText,
        citations,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.error('Anthropic query failed:', error);
      throw error;
    }
  }
}
