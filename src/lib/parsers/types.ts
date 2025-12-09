import type { Citation } from '../llm/types';

export interface ParsedResponse {
  mentions: ExtractedMention[];
  sources: ExtractedSource[];
  rawText: string;
}

export interface ExtractedMention {
  brandName: string;
  rankPosition: number | null;
  context: string;
  isCited: boolean;
  confidence: number;
}

export interface ExtractedSource {
  url: string;
  domain: string;
  title: string | null;
  context: string;
}

export type { Citation };
