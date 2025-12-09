export type LLMProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'PERPLEXITY';

export interface Citation {
  url: string;
  title: string | null;
  domain: string;
  citedText?: string;
}

export interface LLMQueryResult {
  provider: LLMProvider;
  response: string;
  citations: Citation[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    searchQueries?: number;
  };
  latencyMs: number;
}

export interface LLMClient {
  provider: LLMProvider;
  query(prompt: string): Promise<LLMQueryResult>;
}
