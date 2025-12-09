import { GoogleGenAI } from '@google/genai';
import { Citation, LLMClient, LLMQueryResult } from './types';

export class GoogleAIClient implements LLMClient {
  provider = 'GOOGLE' as const;
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
  }

  async query(prompt: string): Promise<LLMQueryResult> {
    const start = Date.now();

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract citations from grounding metadata
      const citations: Citation[] = [];
      const metadata = response.candidates?.[0]?.groundingMetadata;

      if (metadata?.groundingChunks) {
        for (const chunk of metadata.groundingChunks) {
          if (chunk.web?.uri) {
            const url = chunk.web.uri;
            let domain = '';
            try {
              domain = new URL(url).hostname.replace(/^www\./, '');
            } catch {
              domain = url;
            }
            if (!citations.some((c) => c.url === url)) {
              citations.push({
                url,
                title: chunk.web.title || null,
                domain,
              });
            }
          }
        }
      }

      // Count web search queries if available
      const searchQueries = metadata?.webSearchQueries?.length || 0;

      return {
        provider: this.provider,
        response: response.text || '',
        citations,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
          searchQueries,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.error('Google AI query failed:', error);
      throw error;
    }
  }
}
