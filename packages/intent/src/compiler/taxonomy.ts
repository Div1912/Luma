/**
 * @file packages/intent/src/compiler/taxonomy.ts
 * Commercial category classification and taxonomy mapping for intent normalization.
 */

import { StandardCommerceCategory } from '../types.js';

export const CATEGORY_KEYWORDS: Record<StandardCommerceCategory, string[]> = {
  travel: [
    'flight', 'hotel', 'airline', 'booking', 'airbnb', 'train', 'car rental',
    'travel', 'delta', 'united', 'american airlines', 'expedia', 'flight ticket',
    'lodging', 'trip', 'conference ticket'
  ],
  cloud_compute: [
    'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'ec2',
    's3', 'gpu', 'h100', 'a100', 'compute', 'cluster', 'serverless', 'lambda',
    'fly.io', 'render', 'digitalocean', 'hetzner'
  ],
  ai_apis: [
    'openai', 'anthropic', 'claude', 'gpt-4', 'huggingface', 'together.ai',
    'replicate', 'groq', 'perplexity', 'mistral', 'cohere', 'inference',
    'llm api', 'model tokens', 'embedding'
  ],
  saas_subscription: [
    'github', 'datadog', 'figma', 'slack', 'notion', 'jira', 'linear',
    'sentry', 'zoom', 'subscription', 'software license', 'seat', 'workspace'
  ],
  hardware: [
    'laptop', 'monitor', 'dgx', 'macbook', 'keyboard', 'server rack',
    'hard drive', 'ssd', 'nvme', 'workstation', 'gpu card'
  ],
  office_supplies: [
    'paper', 'desk', 'chair', 'stationery', 'office equipment', 'printer'
  ],
  freelance_services: [
    'contractor', 'consulting', 'audit', 'freelance', 'bounty', 'design review'
  ],
  general_procurement: [
    'procurement', 'purchase', 'order', 'buy', 'vendor payment'
  ],
};

/**
 * Classifies arbitrary natural language task text into a standardized commerce category.
 */
export function classifyCategory(text: string, fallback: StandardCommerceCategory = 'general_procurement'): StandardCommerceCategory {
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [StandardCommerceCategory, string[]][]) {
    if (category === 'general_procurement') continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }

  return fallback;
}

/**
 * Normalizes user-supplied category strings into the standard taxonomy.
 */
export function normalizeCategory(category: string): StandardCommerceCategory {
  const cleaned = category.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (cleaned in CATEGORY_KEYWORDS) {
    return cleaned as StandardCommerceCategory;
  }
  return classifyCategory(category);
}
