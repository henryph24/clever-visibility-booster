import { GoogleGenerativeAI } from '@google/generative-ai';
import { Citation, LLMClient, LLMQueryResult } from './types';

export class GoogleAIClient implements LLMClient {
  provider = 'GOOGLE' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async query(prompt: string): Promise<LLMQueryResult> {
    const start = Date.now();

    try {
      // Note: Google Search grounding requires specific API tier access
      // For now, we use standard generation without grounding
      // TODO: Enable grounding when available: { tools: [{ googleSearchRetrieval: {} }] }
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      // Extract citations from grounding metadata if available
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

      return {
        provider: this.provider,
        response: response.text(),
        citations,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.error('Google AI query failed:', error);
      throw error;
    }
  }
}
