import { AITool, RelevanceResult } from './types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'to', 'from', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
  'just', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our',
  'ours', 'want', 'need', 'help', 'make', 'create', 'build', 'using',
  'best', 'good', 'tool', 'ai', 'software', 'app'
]);

/**
 * Tokenizes and cleans query text into lowercase unique terms.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Finds top 3 to 5 relevant saved tools for a user prompt query.
 */
export function findRelevantTools(
  query: string,
  tools: AITool[],
  maxResults: number = 5
): RelevanceResult[] {
  if (!query || !query.trim() || !tools || tools.length === 0) {
    return [];
  }

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return [];
  }

  const rawQueryLower = query.toLowerCase();

  const results: RelevanceResult[] = [];

  for (const tool of tools) {
    let score = 0;
    const matchedTerms: string[] = [];

    const toolNameLower = tool.name.toLowerCase();
    const toolCatLower = tool.category.toLowerCase();
    const toolDescLower = tool.description.toLowerCase();
    const toolTagsLower = tool.tags.map(t => t.toLowerCase());

    // 1. Direct Tool Name match (Highest Weight)
    if (rawQueryLower.includes(toolNameLower)) {
      score += 15;
      matchedTerms.push(`name:${tool.name}`);
    }

    // 2. Category match
    if (rawQueryLower.includes(toolCatLower)) {
      score += 8;
      matchedTerms.push(`category:${tool.category}`);
    }

    // Term-by-term checks
    for (const term of queryTerms) {
      // Name word match
      if (toolNameLower.includes(term)) {
        score += 6;
        matchedTerms.push(term);
      }
      // Category match
      if (toolCatLower.includes(term)) {
        score += 5;
        matchedTerms.push(term);
      }
      // Tag match
      if (toolTagsLower.some(t => t.includes(term))) {
        score += 4;
        matchedTerms.push(term);
      }
      // Description match
      if (toolDescLower.includes(term)) {
        score += 2;
        matchedTerms.push(term);
      }
    }

    if (score > 3) {
      results.push({
        tool,
        score,
        matchedTerms: Array.from(new Set(matchedTerms))
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Formats a list of relevant tools into a structured context prompt block.
 */
export function buildContextBlock(relevantResults: RelevanceResult[]): string {
  if (!relevantResults || relevantResults.length === 0) return '';

  const toolLines = relevantResults.map((res, index) => {
    const t = res.tool;
    return `${index + 1}. ${t.name}\n   Category: ${t.category}\n   Description: ${t.description}\n   URL: ${t.url}`;
  }).join('\n\n');

  return `<context>\nThe user has previously saved these AI tools that may be relevant:\n\n${toolLines}\n\nRecommend these only if they are relevant.\n</context>`;
}
