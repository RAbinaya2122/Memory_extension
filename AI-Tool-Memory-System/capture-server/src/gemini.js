import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { readCategories } from './category_storage.js';

dotenv.config();

/**
 * Helper to fetch allowed category names
 */
async function getAllowedCategories() {
  const categories = await readCategories();
  return categories.map(c => c.name);
}

/**
 * Execute Gemini call with exponential backoff and retry handling
 */
async function callGeminiWithRetry(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3.7-flash';
  console.log(`[Gemini] Using model: ${modelName}`);

  let response;
  let attempt = 1;
  const maxRetries = 3;

  while (attempt <= maxRetries) {
    try {
      console.log(`[Gemini] Attempt ${attempt}: calling API...`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      console.log(`[Gemini] Attempt ${attempt}: Success!`);
      break;
    } catch (err) {
      console.log(`[Gemini] Attempt ${attempt}: Caught error:`, err.message);
      const errMsg = err.message || '';
      const status = err.status || '';
      if (
        errMsg.includes('503') || 
        errMsg.toLowerCase().includes('unavailable') || 
        errMsg.toLowerCase().includes('high demand') ||
        errMsg.toLowerCase().includes('fetch failed') ||
        status === 503 ||
        errMsg.includes('429')
      ) {
        if (attempt === maxRetries) {
          throw new Error('Gemini is temporarily unavailable. Please try again in a moment.');
        }
        const waitMs = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[Gemini] 503/429. Retrying attempt ${attempt + 1} in ${waitMs}ms...`);
        await new Promise(res => setTimeout(res, waitMs));
        attempt++;
      } else {
        throw err;
      }
    }
  }

  const text = response.text;
  if (!text) {
    throw new Error('Received empty response from Gemini API.');
  }

  // Clean up potential code block wrappers if any
  const cleanedJson = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  return JSON.parse(cleanedJson);
}

/**
 * Clean and validate the extracted JSON
 */
function validateExtractedTool(parsed, url, allowedCategories) {
  if (!parsed.name || typeof parsed.name !== 'string') {
    try {
      const u = new URL(url || parsed.url || 'https://example.com');
      parsed.name = u.hostname.replace(/^www\./, '').split('.')[0];
      parsed.name = parsed.name.charAt(0).toUpperCase() + parsed.name.slice(1);
    } catch {
      parsed.name = 'AI Tool';
    }
  }

  let category = parsed.category || 'Uncategorized';
  if (!allowedCategories.includes(category)) {
    const matched = allowedCategories.find(
      c => c.toLowerCase() === category.toLowerCase()
    );
    category = matched || 'Uncategorized';
  }

  const description = parsed.description && typeof parsed.description === 'string'
    ? parsed.description.trim()
    : 'AI tool discovered for productivity and automation.';

  const tags = Array.isArray(parsed.tags) && parsed.tags.length > 0
    ? parsed.tags.map(t => String(t).trim()).filter(Boolean)
    : ['AI', category];

  return {
    name: parsed.name.trim(),
    url: parsed.url || url,
    category,
    description,
    tags
  };
}

/**
 * Uses Gemini API to extract structured AI tool metadata from a standard URL.
 */
export async function analyzeToolUrl(url) {
  try {
    const allowedCategories = await getAllowedCategories();
    const categoriesList = allowedCategories.map(c => `   - ${c}`).join('\n');

    const prompt = `
You are an expert AI software analyst. Analyze the following URL or tool reference and return structured information about the AI tool.

URL to analyze: "${url}"

CRITICAL INSTRUCTIONS:
1. Identify the official tool name, its main category, a concise 1-2 sentence description of what it does, and 3-5 relevant keywords/tags.
2. Select EXACTLY ONE category from this allowed list:
${categoriesList}

3. Output MUST be valid JSON conforming strictly to this structure:
{
  "name": "Tool Name",
  "url": "${url}",
  "category": "One of the allowed categories",
  "description": "Concise summary of the tool features",
  "tags": ["Tag1", "Tag2", "Tag3"]
}

Do not include any conversational text or markdown formatting outside the JSON object.
`;

    const parsed = await callGeminiWithRetry(prompt);
    return validateExtractedTool(parsed, url, allowedCategories);
  } catch (err) {
    console.error('[Gemini] Analysis error:', err.message);
    if (err.message === 'Gemini is temporarily unavailable. Please try again in a moment.') {
      throw err;
    }
    throw new Error(`Failed to analyze tool with Gemini AI: ${err.message}`);
  }
}

/**
 * Uses Gemini API to extract AI tool info from social media content context.
 */
export async function analyzeSocialContent(socialUrl, metadata, platform) {
  try {
    const allowedCategories = await getAllowedCategories();
    const categoriesList = allowedCategories.map(c => `   - ${c}`).join('\n');

    const prompt = `
You are an expert AI software analyst. The user has provided a social media link (${platform}) discussing an AI tool.
Here is the metadata extracted from that link:

Title: ${metadata.title || 'N/A'}
Description: ${metadata.description || 'N/A'}
Main Heading/Content: ${metadata.h1 || 'N/A'}
Source URL: ${socialUrl}

CRITICAL INSTRUCTIONS:
1. Determine the ACTUAL AI tool being discussed. Do NOT say the tool is Instagram, YouTube, Twitter, etc.
2. If you cannot confidently identify an AI tool from the metadata, return: { "error": "Could not identify an AI tool from this content." }
3. If you can identify it, provide its official website URL (e.g. https://gamma.app). Do not use the social URL as the tool URL.
4. Select EXACTLY ONE category from this allowed list:
${categoriesList}

5. Output MUST be valid JSON conforming strictly to this structure (do not include markdown outside JSON):
{
  "name": "Actual Tool Name",
  "url": "https://official-tool-website.com",
  "category": "One of the allowed categories",
  "description": "Concise summary of what the tool does",
  "tags": ["Tag1", "Tag2"]
}
`;

    const parsed = await callGeminiWithRetry(prompt);
    
    if (parsed.error) {
      throw new Error(parsed.error);
    }

    if (!parsed.url || parsed.url === socialUrl || parsed.url.includes(platform)) {
        throw new Error("Could not confidently determine the official website of the AI tool.");
    }

    return validateExtractedTool(parsed, parsed.url, allowedCategories);
  } catch (err) {
    console.error('[Gemini] Social Analysis error:', err.message);
    throw new Error(`Social Analysis failed: ${err.message}`);
  }
}

/**
 * Uses Gemini API to extract multiple AI tools from video content (transcripts/metadata).
 */
export async function analyzeVideoContent(extractedContent) {
  try {
    const allowedCategories = await getAllowedCategories();
    const categoriesList = allowedCategories.map(c => `   - ${c}`).join('\n');
    
    let contentContext = `Platform: ${extractedContent.platform}\n`;
    if (extractedContent.title) contentContext += `Title: ${extractedContent.title}\n`;
    if (extractedContent.description) contentContext += `Description: ${extractedContent.description}\n`;
    if (extractedContent.transcript) contentContext += `Transcript/Text:\n${extractedContent.transcript}\n`;

    const prompt = `
You are an expert AI software analyst. The user has provided content from a ${extractedContent.platform} video.
Here is the available context:
${contentContext}

CRITICAL INSTRUCTIONS:
1. Identify all ACTUAL AI tools/products that are meaningfully demonstrated, recommended, or explicitly discussed in this content.
2. Do NOT classify the platform (e.g. YouTube, Instagram, CapCut if it's just the video editor of the reel) as the AI tool being demonstrated.
3. If no AI tools can be confidently identified from this content, set "needsMoreInformation" to true and return an empty "tools" array.
4. For each identified tool, attempt to determine its official website URL. Use trustworthy knowledge. Do NOT blindly invent URLs. If you are unsure of the official domain, return an empty string ("") for the url. Do NOT return the social media video URL as the tool's url.
5. Select EXACTLY ONE category for each tool from this allowed list:
${categoriesList}

6. Provide "evidence" (a brief sentence explaining why this tool was identified based on the content) and "confidence" (high, medium, low).
7. Output MUST be valid JSON conforming strictly to this structure:
{
  "success": true,
  "platform": "${extractedContent.platform}",
  "videoTitle": "The title of the video",
  "tools": [
    {
      "name": "Tool Name",
      "url": "https://official-tool-website.com",
      "category": "One of the allowed categories",
      "description": "Concise summary of what the tool does",
      "tags": ["Tag1", "Tag2"],
      "evidence": "Brief explanation from transcript",
      "confidence": "high"
    }
  ],
  "needsMoreInformation": false
}
`;

    const parsed = await callGeminiWithRetry(prompt);
    
    // Validate each tool
    if (parsed.tools && Array.isArray(parsed.tools)) {
      parsed.tools = parsed.tools.map(tool => {
        const validated = validateExtractedTool(tool, tool.url || '', allowedCategories);
        return {
          ...validated,
          evidence: tool.evidence || 'Identified from video content.',
          confidence: ['high', 'medium', 'low'].includes(tool.confidence) ? tool.confidence : 'medium',
          url: tool.url && !tool.url.includes(extractedContent.platform) ? tool.url : ''
        };
      });
    } else {
      parsed.tools = [];
      parsed.needsMoreInformation = true;
    }

    parsed.contentSources = extractedContent.sources;
    
    return parsed;
  } catch (err) {
    console.error('[Gemini] Video Analysis error:', err.message);
    throw new Error(`Video Analysis failed: ${err.message}`);
  }
}

