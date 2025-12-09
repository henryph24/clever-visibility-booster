import { OpenAIClient } from '../llm/openai';

export async function generatePrompts(
  topic: string,
  brandName: string,
  competitors: string[],
  count: number = 10
): Promise<string[]> {
  const llm = new OpenAIClient();

  const competitorList = competitors.length > 0 ? competitors.join(', ') : 'major players';

  const prompt = `Generate ${count} realistic search prompts that users would ask AI assistants about "${topic}".

Context: Brand is ${brandName}, competitors include ${competitorList}.

Examples:
- "What are the best alternatives to Google Analytics?"
- "Compare Mixpanel vs Amplitude for product analytics"
- "Which analytics tool is best for startups?"

Return as JSON array of strings only.`;

  try {
    const result = await llm.query(prompt);
    const prompts = JSON.parse(result.response);
    return Array.isArray(prompts) ? prompts : [];
  } catch (error) {
    console.error('Failed to generate prompts:', error);
    return [];
  }
}

export const seedPrompts: Record<string, string[]> = {
  'product analytics tools': [
    'What is the best product analytics tool?',
    'Alternatives to Google Analytics for product teams',
    'Compare Amplitude vs Mixpanel',
    'Best analytics for mobile apps',
    'Free product analytics tools',
  ],
  'user behavior tracking': [
    'Best user behavior tracking tools',
    'How to track user behavior on websites',
    'Session replay tools comparison',
    'Heatmap tools for websites',
    'User tracking for mobile apps',
  ],
  'CRM software comparison': [
    'Best CRM for small business',
    'Salesforce alternatives',
    'CRM for startups',
    'Compare HubSpot vs Salesforce',
    'Free CRM software',
  ],
};

export function getSeedPrompts(topic: string): string[] {
  return seedPrompts[topic] || [];
}
