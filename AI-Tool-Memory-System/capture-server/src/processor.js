import { normalizeUrl, findToolByUrl, addTool } from './storage.js';
import { analyzeToolUrl } from './gemini.js';

/**
 * Shared central workflow for capturing and categorizing an AI Tool URL.
 * Shared by both Telegram Bot and Chrome Extension REST API.
 * 
 * @param {string} rawUrl - The URL pasted by user
 * @param {string} source - Capture source ('telegram' | 'extension' | 'manual' | 'youtube' | 'instagram' | 'x' | 'website')
 * @returns {Promise<{ success: boolean, tool: object, isDuplicate: boolean, message?: string }>}
 */
export async function processTool(rawUrl, source = 'manual', sourceUrl = null) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('A valid tool URL must be provided.');
  }

  let cleanUrl = rawUrl.trim();
  // Ensure protocol
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // 1. Basic URL Validation
  try {
    new URL(cleanUrl);
  } catch (err) {
    throw new Error(`Invalid URL format: "${rawUrl}"`);
  }

  // 2. Normalize URL for duplicate comparison
  const normalizedUrl = normalizeUrl(cleanUrl);

  // 3. Duplicate Detection
  const existingTool = await findToolByUrl(normalizedUrl);
  if (existingTool) {
    console.log(`[Processor] Duplicate detected for URL: ${normalizedUrl}`);
    return {
      success: true,
      tool: existingTool,
      isDuplicate: true,
      message: `Tool "${existingTool.name}" is already saved in your AI Tool Memory.`
    };
  }

  // 4. Gemini AI Analysis
  console.log(`[Processor] Analyzing new tool URL via Gemini AI: ${cleanUrl}`);
  // If we already analyzed it (e.g., from frontend preview), we shouldn't analyze it again.
  // Actually, the new flow will send the pre-analyzed tool data to /api/tools?
  // Wait, no. The new flow sends `url`, `source`, `sourceUrl`, and maybe `preAnalyzedTool`.
  // Let's modify index.js instead to allow direct saves if tool data is provided!
  const extracted = await analyzeToolUrl(cleanUrl);

  // 5. Generate Unique ID & Record Structure
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const id = `tool_${Date.now()}_${randomSuffix}`;

  const toolRecord = {
    id,
    name: extracted.name,
    url: cleanUrl,
    category: extracted.category,
    description: extracted.description,
    tags: extracted.tags,
    source: source.toLowerCase(),
    sourceUrl: sourceUrl || null,
    addedAt: new Date().toISOString()
  };

  // 6. Safe Save to JSON Database
  const result = await addTool(toolRecord);

  console.log(`[Processor] Successfully saved tool "${toolRecord.name}" (${toolRecord.category})`);

  return {
    success: true,
    tool: result.tool,
    isDuplicate: result.isDuplicate,
    message: `Successfully captured and categorized "${toolRecord.name}".`
  };
}
