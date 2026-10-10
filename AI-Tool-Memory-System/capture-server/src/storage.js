import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/ai_tools.json');

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'fbclid',
  'gclid',
  's',
  'source',
  'referrer'
];

/**
 * Normalizes a URL for comparison and storage.
 * Strips tracking query parameters and standardizes formatting.
 */
export function normalizeUrl(rawUrl) {
  try {
    let inputUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = 'https://' + inputUrl;
    }
    const parsed = new URL(inputUrl);
    
    // Normalize hostname to lowercase
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // Strip tracking parameters
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    
    // Normalize pathname (remove trailing slash except for root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    
    return parsed.toString();
  } catch (err) {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Ensures data directory and ai_tools.json file exist.
 */
async function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Storage] Error ensuring data file:', err);
  }
}

/**
 * Safely reads all tools from JSON database.
 */
export async function readTools() {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[Storage] Error reading tools file, fallback to empty array:', err.message);
    return [];
  }
}

/**
 * Safely writes tools array to JSON database using atomic operation.
 */
export async function writeTools(tools) {
  await ensureDataFile();
  const tempFile = `${DATA_FILE}.tmp_${Date.now()}`;
  try {
    await fs.writeFile(tempFile, JSON.stringify(tools, null, 2), 'utf-8');
    await fs.rename(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('[Storage] Error writing tools:', err);
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw err;
  }
}

/**
 * Checks if a tool already exists by comparing normalized URLs.
 */
export async function findToolByUrl(url) {
  const tools = await readTools();
  const normalized = normalizeUrl(url);
  return tools.find(tool => normalizeUrl(tool.url) === normalized) || null;
}

/**
 * Finds a tool by unique ID.
 */
export async function findToolById(id) {
  const tools = await readTools();
  return tools.find(tool => tool.id === id) || null;
}

/**
 * Appends a new tool record to the database safely.
 */
export async function addTool(toolRecord) {
  const tools = await readTools();
  const normalized = normalizeUrl(toolRecord.url);
  
  // Final duplicate check guard
  const existing = tools.find(t => normalizeUrl(t.url) === normalized);
  if (existing) {
    return { tool: existing, isDuplicate: true };
  }

  tools.unshift(toolRecord); // Put newest tool first
  await writeTools(tools);
  return { tool: toolRecord, isDuplicate: false };
}

export async function updateTool(id, updates) {
  const tools = await readTools();
  const index = tools.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Tool not found');
  }

  // Validate URL duplicate if URL is being updated
  if (updates.url && normalizeUrl(updates.url) !== normalizeUrl(tools[index].url)) {
    const existing = tools.find(t => t.id !== id && normalizeUrl(t.url) === normalizeUrl(updates.url));
    if (existing) {
      throw new Error(`Duplicate URL: "${existing.name}" already uses this URL.`);
    }
  }

  tools[index] = { ...tools[index], ...updates };
  await writeTools(tools);
  return tools[index];
}

export async function deleteTool(id) {
  const tools = await readTools();
  const index = tools.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Tool not found');
  }

  const deletedTool = tools[index];
  tools.splice(index, 1);
  await writeTools(tools);
  return deletedTool;
}

export async function updateToolsCategory(oldName, newName) {
  const tools = await readTools();
  let updatedCount = 0;
  for (let i = 0; i < tools.length; i++) {
    if (tools[i].category === oldName) {
      tools[i].category = newName;
      updatedCount++;
    }
  }
  if (updatedCount > 0) {
    await writeTools(tools);
  }
  return updatedCount;
}
