import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readTools, findToolById, updateTool, deleteTool, updateToolsCategory, normalizeUrl, findToolByUrl } from './storage.js';
import { readCategories, addCategory, updateCategory, deleteCategory } from './category_storage.js';
import { processTool } from './processor.js';
import { fetchPageMetadata, detectPlatform } from './socialAnalyzer.js';
import { extractVideoContent } from './videoAnalyzer.js';
import { analyzeSocialContent, analyzeVideoContent } from './gemini.js';
import { initTelegramBot } from './telegram.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Chrome Extension and local clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[REST API] ${req.method} ${req.url}`);
  next();
});

// Endpoint: Root Welcome & Status Page
app.get('/', async (req, res) => {
  try {
    const tools = await readTools();
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Tool Memory Capture Server</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #f4f4f5; padding: 40px; line-height: 1.6; }
            .card { background: #111111; border: 1px solid #27272a; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #8b5cf6; margin-top: 0; font-size: 20px; }
            a { color: #a78bfa; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
            ul { padding-left: 20px; }
            code { background: #18181b; padding: 2px 6px; border-radius: 4px; color: #e4e4e7; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🚀 AI Tool Memory Server</h1>
            <span class="badge">STATUS: ONLINE</span>
            <p>The capture server backend is active and serving <strong>${tools.length}</strong> saved AI tools.</p>
            <p><strong>Available API Endpoints:</strong></p>
            <ul>
              <li><a href="/api/health"><code>GET /api/health</code></a> - Server Status & Count</li>
              <li><a href="/api/tools"><code>GET /api/tools</code></a> - List All Saved Tools</li>
            </ul>
            <p style="font-size: 12px; color: #71717a; margin-top: 20px; border-top: 1px solid #27272a; padding-top: 12px;">
              Connect your Chrome Extension or Telegram Bot to capture AI tools.
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Endpoint: Health Check
app.get('/api/health', async (req, res) => {
  try {
    const tools = await readTools();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      toolsCount: tools.length
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Endpoint: GET all saved tools
app.get('/api/tools', async (req, res) => {
  try {
    const tools = await readTools();
    res.json(tools);
  } catch (err) {
    console.error('[API] Error fetching tools:', err);
    res.status(500).json({ error: 'Failed to retrieve tools' });
  }
});

// Endpoint: GET tool by ID
app.get('/api/tools/:id', async (req, res) => {
  try {
    const tool = await findToolById(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json(tool);
  } catch (err) {
    console.error('[API] Error fetching tool by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve tool' });
  }
});

// Endpoint: POST save new tool URL
app.post('/api/tools', async (req, res) => {
  const { url, source, sourceUrl, tool } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: "url"'
    });
  }

  const captureSource = source || 'extension';

  try {
    if (tool && tool.name) {
      // Direct save from frontend preview
      const { normalizeUrl, findToolByUrl, addTool } = await import('./storage.js');
      const normalizedUrl = normalizeUrl(url);
      const existingTool = await findToolByUrl(normalizedUrl);
      
      if (existingTool) {
        return res.status(200).json({
          success: true,
          tool: existingTool,
          isDuplicate: true,
          message: `Tool "${existingTool.name}" is already saved in your AI Tool Memory.`
        });
      }

      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const toolRecord = {
        id: `tool_${Date.now()}_${randomSuffix}`,
        name: tool.name,
        url: url,
        category: tool.category || 'Uncategorized',
        description: tool.description || '',
        tags: tool.tags || [],
        source: captureSource,
        sourceUrl: sourceUrl || null,
        addedAt: new Date().toISOString()
      };

      const result = await addTool(toolRecord);
      return res.status(201).json({ success: true, tool: result.tool, isDuplicate: false, message: `Successfully saved "${toolRecord.name}".` });
    }

    // Fallback to normal processing flow
    const result = await processTool(url, captureSource, sourceUrl);
    res.status(result.isDuplicate ? 200 : 201).json(result);
  } catch (err) {
    console.error('[API] Error processing tool:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to process AI tool URL'
    });
  }
});

// --- TOOL MANAGEMENT ENDPOINTS ---

app.put('/api/tools/:id', async (req, res) => {
  try {
    const updatedTool = await updateTool(req.params.id, req.body);
    res.json({ success: true, tool: updatedTool });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/tools/:id', async (req, res) => {
  try {
    const deletedTool = await deleteTool(req.params.id);
    res.json({ success: true, tool: deletedTool });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- CATEGORY MANAGEMENT ENDPOINTS ---

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await readCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    if (!req.body.name) throw new Error('Category name is required');
    const newCat = await addCategory(req.body.name);
    res.status(201).json({ success: true, category: newCat });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (!req.body.name) throw new Error('Category name is required');
    const result = await updateCategory(req.params.id, req.body.name);
    
    // Update tools that used the old category name
    await updateToolsCategory(result.oldName, result.newName);
    
    res.json({ success: true, category: result.updatedCategory });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const deletedCat = await deleteCategory(req.params.id);
    // Update tools to use Uncategorized
    await updateToolsCategory(deletedCat.name, 'Uncategorized');
    res.json({ success: true, category: deletedCat });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- SOCIAL ANALYSIS PIPELINE ---

app.post('/api/analyze-url', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Missing required field: "url"' });
  }

  try {
    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);
    
    if (platform === 'unknown' || platform === 'website') {
      // standard analysis, just return a preview without saving
      // We can use processTool internally, but processTool saves it.
      // So instead, we just call the API directly if we want a preview for normal sites.
      // Actually, feature request says "Normal AI tool URL analysis" should work identically.
      // But let's keep it simple for now, if it's a website we can use social analyzer too.
    }
    
    // Fetch metadata
    const metadata = await fetchPageMetadata(cleanUrl);
    
    if (!metadata.success && !metadata.title && !metadata.description) {
       return res.status(400).json({ 
         success: false, 
         error: 'Unable to access this content directly. Paste the caption, transcript, or text from the post.' 
       });
    }

    // Call Gemini to identify the tool from the metadata
    const extractedTool = await analyzeSocialContent(cleanUrl, metadata, platform);

    res.json({
      success: true,
      type: 'social',
      platform,
      tool: extractedTool,
      sourceUrl: cleanUrl
    });

  } catch (err) {
    console.error('[API] Error analyzing social URL:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to analyze content'
    });
  }
});

app.post('/api/analyze-video', async (req, res) => {
  const { url, additionalText } = req.body || {};
  
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Missing required field: "url"' });
  }

  try {
    const cleanUrl = url.trim();
    
    // 1. Extract content from the video URL
    const extractedContent = await extractVideoContent(cleanUrl, additionalText);
    
    // 2. Pass to Gemini for analysis
    const analysisResult = await analyzeVideoContent(extractedContent);
    
    // 3. Duplicate detection for identified tools
    if (analysisResult.tools && analysisResult.tools.length > 0) {
      for (const tool of analysisResult.tools) {
        if (tool.url) {
          const normalized = normalizeUrl(tool.url);
          const existing = await findToolByUrl(normalized);
          if (existing) {
            tool.isDuplicate = true;
            tool.existingId = existing.id;
          }
        }
      }
    }
    
    // Ensure we don't return success false if there are no tools, but just needsMoreInformation true
    res.json(analysisResult);

  } catch (err) {
    console.error('[API] Error in /api/analyze-video:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to analyze video'
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 AI Tool Memory Capture Server running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 REST API:     http://localhost:${PORT}/api/tools`);
  console.log(`==================================================\n`);

  // Initialize Telegram Bot
  initTelegramBot();
});
