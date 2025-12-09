import { createLLMClient } from '@/lib/llm';

export type ContentType = 'blog' | 'landing' | 'comparison' | 'faq' | 'guide';

interface GenerateInput {
  brandName: string;
  brandDomain: string;
  topic: string;
  contentType: ContentType;
  referenceContent?: string[];
  additionalContext?: string;
  competitors: string[];
}

interface GenerateResult {
  content: string;
  wordCount: number;
}

export class ContentGenerator {
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const llm = createLLMClient('OPENAI');
    const prompt = this.buildPrompt(input);

    const result = await llm.query(prompt);
    const wordCount = result.response.split(/\s+/).length;

    return {
      content: result.response,
      wordCount,
    };
  }

  private buildPrompt(input: GenerateInput): string {
    const templates: Record<ContentType, string> = {
      blog: this.blogTemplate(input),
      landing: this.landingTemplate(input),
      comparison: this.comparisonTemplate(input),
      faq: this.faqTemplate(input),
      guide: this.guideTemplate(input),
    };

    return templates[input.contentType];
  }

  private blogTemplate(input: GenerateInput): string {
    return `Write a comprehensive blog post about "${input.topic}" for ${input.brandName}.

Requirements:
- Natural, engaging writing style
- Include ${input.brandName} as a solution/recommendation (don't force it)
${input.competitors.length > 0 ? `- Mention competitors ${input.competitors.join(', ')} where relevant for comparison` : ''}
- Include statistics, data points, or expert quotes where possible
- Structure with clear headings (H2, H3)
- Include a compelling introduction and conclusion
- Optimize for AI search engines (clear structure, direct answers)
- Length: 1500-2000 words

${input.referenceContent?.length ? `Reference style from these examples:\n${input.referenceContent.join('\n\n---\n\n')}` : ''}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Write the content in markdown format.`;
  }

  private landingTemplate(input: GenerateInput): string {
    return `Write compelling landing page content about "${input.topic}" for ${input.brandName} (${input.brandDomain}).

Requirements:
- Strong, benefit-focused headline
- Clear value proposition
- Feature highlights with benefits
- Social proof suggestions (where to add testimonials)
- Clear call-to-action sections
- Address common objections
- SEO-optimized structure

${input.competitors.length > 0 ? `Competitors to differentiate from: ${input.competitors.join(', ')}` : ''}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Write in markdown format with clear section headers.`;
  }

  private comparisonTemplate(input: GenerateInput): string {
    const competitorList =
      input.competitors.length > 0 ? input.competitors.join(', ') : 'leading alternatives';

    return `Write a detailed comparison article about ${input.topic} solutions.

Compare ${input.brandName} with ${competitorList}.

Requirements:
- Objective, balanced tone
- Feature-by-feature comparison
- Pros and cons for each
- Clear recommendation at the end
- Include a comparison table in markdown
- Be honest about limitations
- Structure for easy scanning
- Include "Best for" summary for each option

${input.referenceContent?.length ? `Reference content:\n${input.referenceContent.join('\n\n---\n\n')}` : ''}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Write in markdown format with tables where appropriate.`;
  }

  private faqTemplate(input: GenerateInput): string {
    return `Create a comprehensive FAQ section about ${input.topic}.

Brand: ${input.brandName}
${input.competitors.length > 0 ? `Competitors: ${input.competitors.join(', ')}` : ''}

Requirements:
- 10-15 common questions users would ask
- Direct, concise answers
- Naturally include ${input.brandName} where relevant
- Use schema-friendly Q&A format
- Cover beginner to advanced questions
- Include questions about pricing, features, comparisons

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Format as markdown with ## for each question.`;
  }

  private guideTemplate(input: GenerateInput): string {
    return `Write a comprehensive how-to guide about "${input.topic}".

Brand: ${input.brandName} (${input.brandDomain})
${input.competitors.length > 0 ? `Alternatives to mention: ${input.competitors.join(', ')}` : ''}

Requirements:
- Step-by-step instructions
- Clear prerequisites section
- Numbered steps with explanations
- Include tips, warnings, and best practices
- Add troubleshooting section
- Include relevant screenshots/diagram placeholders
- Natural mention of ${input.brandName} as a tool/solution
- Length: 1500-2500 words

${input.referenceContent?.length ? `Reference material:\n${input.referenceContent.join('\n\n---\n\n')}` : ''}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Write in markdown format.`;
  }

  async fetchReferenceContent(urls: string[]): Promise<string[]> {
    const contents: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch(`https://r.jina.ai/${url}`);
        if (response.ok) {
          const text = await response.text();
          contents.push(text.slice(0, 4000)); // Limit each reference
        }
      } catch {
        // Skip failed fetches
      }
    }

    return contents;
  }
}

export const contentGenerator = new ContentGenerator();
