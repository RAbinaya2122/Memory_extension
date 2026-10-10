import { AITool, ProcessToolResult, HealthStatus, ToolPreview, AnalyzeUrlResult } from './types';

const API_BASE_URL = 'http://127.0.0.1:3000/api';

/**
 * Checks backend health status.
 */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { status: 'error', error: `Server responded with ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    return { status: 'error', error: 'Capture Server is unreachable. Make sure backend is running on port 3000.' };
  }
}

/**
 * Fetches all saved tools from backend.
 */
export async function fetchTools(): Promise<AITool[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/tools`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[API Client] Error fetching tools from backend:', err.message);
    throw err;
  }
}

/**
 * Sends a URL to backend to analyze via Gemini AI and save.
 */
export async function saveToolUrl(url: string, source: string = 'extension', sourceUrl?: string, tool?: ToolPreview): Promise<ProcessToolResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url, source, sourceUrl, tool }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || `Server error (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: 'Unable to connect to Capture Server.' };
  }
}

export async function analyzeUrl(url: string): Promise<AnalyzeUrlResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to analyze URL' };
    return data;
  } catch (err) {
    return { success: false, error: 'Network error. Capture server may be unreachable.' };
  }
}

export async function analyzeVideo(url: string, additionalText?: string): Promise<import('./types').AnalyzeVideoResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/analyze-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, additionalText }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to analyze video URL' };
    return data;
  } catch (err) {
    return { success: false, error: 'Network error. Capture server may be unreachable.' };
  }
}

export async function editTool(id: string, updates: Partial<AITool>): Promise<{ success: boolean; tool?: AITool; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Network error.' };
  }
}

export async function deleteTool(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tools/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Network error.' };
  }
}

export async function fetchCategories(): Promise<import('./types').CustomCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    return res.ok ? await res.json() : [];
  } catch (err) {
    return [];
  }
}

export async function addCategory(name: string) {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return await res.json();
}

export async function editCategory(id: string, name: string) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return await res.json();
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
  return await res.json();
}
