import { AITool } from '../lib/types';
import { fetchTools } from '../lib/api';
import { findRelevantTools, buildContextBlock } from '../lib/relevance';

let cachedTools: AITool[] = [];

/**
 * Syncs tools from the backend server to memory and chrome.storage.local cache.
 */
async function syncTools(): Promise<AITool[]> {
  try {
    const tools = await fetchTools();
    cachedTools = tools;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ ai_tools: tools, lastSynced: Date.now() });
    }
    return tools;
  } catch (err: any) {
    console.warn('[Background Worker] Unable to sync tools from backend API:', err.message);
    // Attempt fallback to local chrome storage cache if offline
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const stored = await chrome.storage.local.get(['ai_tools']);
      if (stored && Array.isArray(stored.ai_tools)) {
        cachedTools = stored.ai_tools;
        return cachedTools;
      }
    }
    return cachedTools;
  }
}

// Initial sync on service worker start
syncTools();

// Set up periodic sync alarm (every 5 minutes)
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('sync_tools', { periodInMinutes: 5 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sync_tools') {
      syncTools();
    }
  });
}

// Listen to Extension Messages
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TOOLS') {
      if (cachedTools.length > 0) {
        sendResponse({ success: true, tools: cachedTools });
      } else {
        syncTools().then(tools => {
          sendResponse({ success: true, tools });
        }).catch(err => {
          sendResponse({ success: false, error: err.message, tools: [] });
        });
        return true; // Keep channel open for async response
      }
    }

    if (message.type === 'REFRESH_TOOLS') {
      syncTools().then(tools => {
        sendResponse({ success: true, tools });
        // Notify content scripts in active tabs
        chrome.tabs.query({ active: true }, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'TOOLS_UPDATED', tools }).catch(() => {});
            }
          });
        });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    if (message.type === 'SEARCH_RELEVANT_TOOLS') {
      const query = message.query || '';
      
      const executeSearch = (tools: AITool[]) => {
        const relevantResults = findRelevantTools(query, tools, 5);
        const contextBlock = buildContextBlock(relevantResults);
        sendResponse({
          success: true,
          relevantResults,
          contextBlock,
          matchedCount: relevantResults.length
        });
      };

      if (cachedTools.length > 0) {
        executeSearch(cachedTools);
      } else {
        syncTools().then(tools => {
          executeSearch(tools);
        }).catch(() => {
          executeSearch([]);
        });
        return true;
      }
    }

    return true;
  });
}
