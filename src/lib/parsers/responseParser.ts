import type { Citation } from '../llm/types';
import { ExtractedMention, ExtractedSource, ParsedResponse } from './types';

export class ResponseParser {
  private brandNames: string[];
  private competitorNames: string[];

  constructor(brandNames: string[], competitorNames: string[]) {
    this.brandNames = brandNames;
    this.competitorNames = competitorNames;
  }

  parse(responseText: string, apiCitations?: Citation[]): ParsedResponse {
    const textSources = this.extractSources(responseText);
    const mergedSources = this.mergeCitations(apiCitations || [], textSources);

    return {
      mentions: this.extractMentions(responseText),
      sources: mergedSources,
      rawText: responseText,
    };
  }

  private mergeCitations(
    apiCitations: Citation[],
    textSources: ExtractedSource[]
  ): ExtractedSource[] {
    const merged: ExtractedSource[] = [];
    const seenUrls = new Set<string>();

    // API citations take precedence (have proper titles from search results)
    for (const citation of apiCitations) {
      if (!seenUrls.has(citation.url)) {
        seenUrls.add(citation.url);
        merged.push({
          url: citation.url,
          domain: citation.domain,
          title: citation.title,
          context: citation.citedText || '',
        });
      }
    }

    // Add text-extracted sources that weren't in API citations
    for (const source of textSources) {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        merged.push(source);
      }
    }

    return merged;
  }

  private extractMentions(text: string): ExtractedMention[] {
    const allBrands = [...this.brandNames, ...this.competitorNames];
    const mentionsMap = new Map<string, { index: number; brand: string }>();

    // Find first occurrence of each brand
    for (const brand of allBrands) {
      const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, 'gi');
      const match = regex.exec(text);

      if (match) {
        mentionsMap.set(brand.toLowerCase(), {
          index: match.index,
          brand: brand,
        });
      }
    }

    // Sort by position to determine rank
    const sortedMentions = Array.from(mentionsMap.values()).sort((a, b) => a.index - b.index);

    // Create ExtractedMention objects with rank
    return sortedMentions.map((mention, index) => ({
      brandName: mention.brand,
      rankPosition: index + 1,
      context: this.extractContext(text, mention.index, 150),
      isCited: this.hasCitation(text, mention.brand),
      confidence: this.calculateConfidence(text, mention.brand),
    }));
  }

  private extractSources(text: string): ExtractedSource[] {
    const urlRegex = /https?:\/\/[^\s\)\]\}]+/g;
    const sources: ExtractedSource[] = [];
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
      try {
        const url = match[0].replace(/[.,;:!?]+$/, ''); // Remove trailing punctuation
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname.replace(/^www\./, '');

        sources.push({
          url,
          domain,
          title: null,
          context: this.extractContext(text, match.index, 100),
        });
      } catch {
        // Invalid URL, skip
      }
    }

    return sources;
  }

  private extractContext(text: string, position: number, chars: number): string {
    const start = Math.max(0, position - chars);
    const end = Math.min(text.length, position + chars);

    let context = text.slice(start, end);

    // Clean up context
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context.trim();
  }

  private hasCitation(text: string, brand: string): boolean {
    // Check if brand name appears near a URL (within 200 chars)
    const brandIndex = text.toLowerCase().indexOf(brand.toLowerCase());
    if (brandIndex === -1) return false;

    const nearbyText = text.slice(
      Math.max(0, brandIndex - 200),
      Math.min(text.length, brandIndex + brand.length + 200)
    );

    return /https?:\/\//.test(nearbyText);
  }

  private calculateConfidence(text: string, brand: string): number {
    let score = 0.5;

    // Exact case match
    if (text.includes(brand)) {
      score += 0.15;
    }

    // Appears in numbered list format (1. Brand, 2. Brand)
    const numberedListRegex = new RegExp(`\\d+\\.\\s*[^.]*\\b${this.escapeRegex(brand)}\\b`, 'i');
    if (numberedListRegex.test(text)) {
      score += 0.15;
    }

    // Appears in bullet list
    const bulletListRegex = new RegExp(`[-•*]\\s*[^.]*\\b${this.escapeRegex(brand)}\\b`, 'i');
    if (bulletListRegex.test(text)) {
      score += 0.1;
    }

    // Has citation
    if (this.hasCitation(text, brand)) {
      score += 0.1;
    }

    // Multiple mentions
    const mentionCount = (text.match(new RegExp(`\\b${this.escapeRegex(brand)}\\b`, 'gi')) || [])
      .length;
    if (mentionCount > 1) {
      score += Math.min(0.1, mentionCount * 0.02);
    }

    return Math.min(score, 1);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export function createParser(brandNames: string[], competitorNames: string[]): ResponseParser {
  return new ResponseParser(brandNames, competitorNames);
}
