import { OpenAIClient } from '../llm/openai';

export async function generateTopics(
  industry: string,
  brandName: string,
  count: number = 10
): Promise<string[]> {
  const llm = new OpenAIClient();

  const prompt = `Generate ${count} topic categories that potential customers would search for when looking for ${industry} solutions like ${brandName}.

Return as JSON array of strings. Examples:
- "product analytics alternatives"
- "customer data platforms"
- "user behavior tracking"

Return only the JSON array, no explanation.`;

  try {
    const result = await llm.query(prompt);
    const topics = JSON.parse(result.response);
    return Array.isArray(topics) ? topics : [];
  } catch (error) {
    console.error('Failed to generate topics:', error);
    return [];
  }
}

export const seedTopics: Record<string, string[]> = {
  analytics: [
    'product analytics tools',
    'user behavior tracking',
    'conversion optimization',
    'A/B testing platforms',
    'customer journey mapping',
  ],
  crm: [
    'CRM software comparison',
    'sales automation tools',
    'customer management',
    'pipeline management',
    'contact management',
  ],
  marketing: [
    'marketing automation',
    'email marketing tools',
    'social media management',
    'content marketing platforms',
    'SEO tools',
  ],
  ecommerce: [
    'ecommerce platforms',
    'shopping cart software',
    'payment processing',
    'inventory management',
    'shipping solutions',
  ],
  saas: [
    'SaaS tools comparison',
    'cloud software alternatives',
    'subscription management',
    'customer success platforms',
    'product management tools',
  ],
};

export function getSeedTopics(industry: string): string[] {
  const normalizedIndustry = industry.toLowerCase();
  return seedTopics[normalizedIndustry] || seedTopics['saas'] || [];
}
