import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AITool, CustomCategory, ProcessToolResult, ToolPreview } from '../lib/types';
import { fetchTools, saveToolUrl, checkHealth, fetchCategories, analyzeUrl as apiAnalyzeUrl, editTool as apiEditTool, deleteTool as apiDeleteTool, addCategory as apiAddCategory, editCategory as apiEditCategory, deleteCategory as apiDeleteCategory } from '../lib/api';

export type ConnectionState = 'connecting' | 'online' | 'reconnecting' | 'offline';

export function useTools() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const retryCount = useRef(0);
  const maxRetries = 10; // Max 10 retries before giving up completely
  const healthCheckTimeout = useRef<NodeJS.Timeout | null>(null);


  const loadData = useCallback(async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    setError(null);
    try {
      const health = await checkHealth();
      if (health.status === 'ok') {
        setConnectionState('online');
        retryCount.current = 0; // reset on success
        if (healthCheckTimeout.current) clearTimeout(healthCheckTimeout.current);

        const [toolsData, categoriesData] = await Promise.all([
          fetchTools(),
          fetchCategories()
        ]);
        setTools(toolsData);
        setCategories(categoriesData);
      } else {
        throw new Error(health.error || 'Capture server offline');
      }
    } catch (err: any) {
      if (retryCount.current < maxRetries) {
        setConnectionState('reconnecting');
        const delay = Math.min(Math.pow(2, retryCount.current) * 1000, 30000); // Exponential backoff up to 30s
        retryCount.current += 1;
        
        if (healthCheckTimeout.current) clearTimeout(healthCheckTimeout.current);
        healthCheckTimeout.current = setTimeout(() => {
          loadData(true);
        }, delay);
      } else {
        setConnectionState('offline');
      }
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (healthCheckTimeout.current) clearTimeout(healthCheckTimeout.current);
    };
  }, [loadData]);

  const handleSaveTool = async (url: string, source: string = 'extension', sourceUrl?: string, toolPreview?: ToolPreview): Promise<ProcessToolResult> => {
    setIsSaving(true);
    try {
      const result = await saveToolUrl(url, source, sourceUrl, toolPreview);
      if (result.success && result.tool) {
        await loadData();
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'REFRESH_TOOLS' }).catch(() => {});
        }
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save tool' };
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsSaving(true);
    try {
      return await apiAnalyzeUrl(url);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTool = async (id: string, updates: Partial<AITool>) => {
    const res = await apiEditTool(id, updates);
    if (res.success) await loadData();
    return res;
  };

  const handleDeleteTool = async (id: string) => {
    const res = await apiDeleteTool(id);
    if (res.success) await loadData();
    return res;
  };

  const handleAddCategory = async (name: string) => {
    const res = await apiAddCategory(name);
    if (res.success) await loadData();
    return res;
  };

  const handleEditCategory = async (id: string, name: string) => {
    const res = await apiEditCategory(id, name);
    if (res.success) await loadData();
    return res;
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await apiDeleteCategory(id);
    if (res.success) {
      if (selectedCategory === res.category?.name) setSelectedCategory('All');
      await loadData();
    }
    return res;
  };

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      if (selectedCategory !== 'All' && tool.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = tool.name.toLowerCase().includes(query);
        const descMatch = tool.description.toLowerCase().includes(query);
        const catMatch = tool.category.toLowerCase().includes(query);
        const tagMatch = tool.tags.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || descMatch || catMatch || tagMatch;
      }
      return true;
    });
  }, [tools, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tools.length };
    tools.forEach(tool => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });
    return counts;
  }, [tools]);

  return {
    tools,
    categories,
    categoryCounts,
    filteredTools,
    loading,
    error,
    isServerConnected: connectionState === 'online',
    connectionState,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isSaving,
    saveTool: handleSaveTool,
    analyzeUrl: handleAnalyzeUrl,
    editTool: handleEditTool,
    deleteTool: handleDeleteTool,
    addCategory: handleAddCategory,
    editCategory: handleEditCategory,
    deleteCategory: handleDeleteCategory,
    refreshTools: () => {
      retryCount.current = 0; // reset retries on manual refresh
      return loadData();
    }
  };
}
