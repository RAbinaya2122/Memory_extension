export interface CustomCategory {
  id: string;
  name: string;
}

export interface AITool {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  source: 'telegram' | 'extension' | 'manual' | 'youtube' | 'instagram' | 'x' | 'website' | string;
  sourceUrl?: string;
  addedAt: string;
}

export interface ToolPreview {
  name: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
}

export interface ProcessToolResult {
  success: boolean;
  tool?: AITool;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}

export interface AnalyzeUrlResult {
  success: boolean;
  type?: 'social' | 'website';
  platform?: string;
  tool?: ToolPreview;
  sourceUrl?: string;
  error?: string;
}

export interface VideoToolPreview extends ToolPreview {
  evidence?: string;
  confidence?: 'high' | 'medium' | 'low';
  isDuplicate?: boolean;
  existingId?: string;
}

export interface AnalyzeVideoResult {
  success: boolean;
  platform?: string;
  videoTitle?: string;
  tools?: VideoToolPreview[];
  contentSources?: string[];
  needsMoreInformation?: boolean;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp?: string;
  toolsCount?: number;
  error?: string;
}

export interface RelevanceResult {
  tool: AITool;
  score: number;
  matchedTerms: string[];
}
