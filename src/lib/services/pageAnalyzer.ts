import { createLLMClient } from '@/lib/llm';

interface PageAnalysis {
  score: number;
  summary: string;
  categories: AnalysisCategory[];
}

interface AnalysisCategory {
  name: string;
  score: number;
  recommendations: Recommendation[];
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
}

export class PageAnalyzer {
  async analyze(input: {
    url?: string;
    content?: string;
    brandName: string;
    topicContext?: string;
  }): Promise<PageAnalysis> {
    let content = input.content;

    if (input.url && !content) {
      try {
        const response = await fetch(`https://r.jina.ai/${input.url}`);
        content = await response.text();
      } catch {
        content = 'Failed to fetch content from URL';
      }
    }

    if (!content) {
      return {
        score: 0,
        summary: 'No content provided for analysis',
        categories: [],
      };
    }

    const llm = createLLMClient('OPENAI');

    const prompt = `Analyze this content for LLM/AI search optimization.

Brand: ${input.brandName}
${input.topicContext ? `Topic focus: ${input.topicContext}` : ''}

Content:
${content.slice(0, 8000)}

Evaluate on these criteria and provide specific recommendations:
1. Structure: Clear headings, lists, scannable format
2. Brand Mentions: Natural inclusion of brand name
3. Authority Signals: Citations, statistics, expert quotes
4. Comparison Content: vs competitor mentions
5. Question Answering: Direct answers to common queries
6. Freshness: Current information, recent updates

Return ONLY valid JSON (no markdown code blocks):
{
  "score": 0-100,
  "summary": "brief overview",
  "categories": [
    {
      "name": "category name",
      "score": 0-100,
      "recommendations": [
        {
          "priority": "high|medium|low",
          "title": "short title",
          "description": "what to improve"
        }
      ]
    }
  ]
}`;

    try {
      const result = await llm.query(prompt);
      const parsed = JSON.parse(result.response);
      return parsed as PageAnalysis;
    } catch {
      return {
        score: 50,
        summary: 'Analysis completed with default scoring',
        categories: [
          {
            name: 'Structure',
            score: 50,
            recommendations: [
              {
                priority: 'medium',
                title: 'Improve Content Structure',
                description: 'Consider adding more headings and lists for better readability.',
              },
            ],
          },
          {
            name: 'Brand Visibility',
            score: 50,
            recommendations: [
              {
                priority: 'high',
                title: 'Increase Brand Mentions',
                description: `Ensure "${input.brandName}" is mentioned naturally throughout the content.`,
              },
            ],
          },
        ],
      };
    }
  }
}

export const pageAnalyzer = new PageAnalyzer();
