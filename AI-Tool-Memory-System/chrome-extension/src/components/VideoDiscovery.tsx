import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Video, Search, ChevronDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AnalyzeVideoResult, VideoToolPreview, CustomCategory, ProcessToolResult } from '../lib/types';

interface VideoDiscoveryProps {
  onAnalyzeVideo: (url: string, additionalText?: string) => Promise<AnalyzeVideoResult>;
  onSaveTool: (url: string, source?: string, sourceUrl?: string, toolPreview?: any) => Promise<ProcessToolResult>;
  categories: CustomCategory[];
  isServerConnected: boolean;
}

export const VideoDiscovery: React.FC<VideoDiscoveryProps> = ({
  onAnalyzeVideo,
  onSaveTool,
  categories,
  isServerConnected
}) => {
  const [url, setUrl] = useState('');
  const [additionalText, setAdditionalText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeVideoResult | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Keep track of edited tools before saving
  const [editedTools, setEditedTools] = useState<Record<number, VideoToolPreview>>({});
  const [savingIndices, setSavingIndices] = useState<Record<number, boolean>>({});

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setFeedback(null);
    
    const res = await onAnalyzeVideo(url.trim(), additionalText.trim());
    setIsAnalyzing(false);
    
    if (res.success) {
      setResult(res);
      if (res.needsMoreInformation) {
        setShowManualInput(true);
      }
      
      if (res.tools) {
        const initialEdits: Record<number, VideoToolPreview> = {};
        res.tools.forEach((t, i) => { initialEdits[i] = { ...t }; });
        setEditedTools(initialEdits);
      }
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to analyze video' });
      setShowManualInput(true); // Allow manual fallback on error
    }
  };

  const handleSave = async (index: number) => {
    const toolToSave = editedTools[index];
    if (!toolToSave) return;
    
    setSavingIndices(prev => ({ ...prev, [index]: true }));
    setFeedback(null);
    
    const res = await onSaveTool(toolToSave.url, result?.platform || 'video', url.trim(), toolToSave);
    
    setSavingIndices(prev => ({ ...prev, [index]: false }));
    
    if (res.success && !res.isDuplicate) {
      setFeedback({ type: 'success', message: `Saved ${toolToSave.name} successfully!` });
      // Remove from list
      setEditedTools(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } else if (res.isDuplicate) {
      setFeedback({ type: 'error', message: `${toolToSave.name} is already in your memory.` });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save tool' });
    }
  };

  return (
    <div className="p-3 bg-[#111111] border-b border-[#27272A] flex flex-col gap-3">
      <div className="flex items-center gap-2 text-zinc-300 px-1">
        <Video className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-xs font-semibold">Discover AI Tools from Videos</span>
      </div>

      <form onSubmit={handleAnalyze} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Instagram URL..."
            disabled={isAnalyzing || !isServerConnected}
            className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-[#27272A] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
          />
          <button
            type="submit"
            disabled={!url.trim() || isAnalyzing || !isServerConnected}
            className="px-3 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Analyze
          </button>
        </div>
        
        {(showManualInput || (result && result.needsMoreInformation)) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-1">
            <p className="text-[10px] text-zinc-400 px-1">
              {result?.needsMoreInformation ? "We couldn't extract enough context automatically. " : ""}
              Paste caption or transcript manually:
            </p>
            <textarea
              value={additionalText}
              onChange={e => setAdditionalText(e.target.value)}
              placeholder="Paste transcript or video text here..."
              disabled={isAnalyzing}
              className="w-full h-16 p-2 bg-[#0A0A0A] border border-[#27272A] rounded-lg text-xs text-white resize-none focus:border-[#8B5CF6]"
            />
          </motion.div>
        )}
      </form>

      {/* Feedback Message */}
      {feedback && (
        <div className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Results */}
      {result && result.tools && result.tools.length > 0 && (
        <div className="flex flex-col gap-3 mt-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          {Object.entries(editedTools).map(([indexStr, tool]) => {
            const i = parseInt(indexStr);
            const originalTool = result.tools![i];
            
            return (
              <div key={i} className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-semibold text-white truncate max-w-[200px]">{tool.name}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    tool.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                    tool.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {tool.confidence?.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                
                <p className="text-[10px] text-zinc-400 italic border-l-2 border-[#27272A] pl-2">{tool.evidence}</p>
                
                {tool.isDuplicate && (
                  <div className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Already in your memory
                  </div>
                )}
                
                <input 
                  value={tool.name} onChange={e => setEditedTools(prev => ({...prev, [i]: {...tool, name: e.target.value}}))}
                  className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white" placeholder="Tool Name"
                />
                <input 
                  value={tool.url} onChange={e => setEditedTools(prev => ({...prev, [i]: {...tool, url: e.target.value}}))}
                  className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-zinc-300" placeholder="Official Website URL"
                />
                <select 
                  value={tool.category} onChange={e => setEditedTools(prev => ({...prev, [i]: {...tool, category: e.target.value}}))}
                  className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <textarea 
                  value={tool.description} onChange={e => setEditedTools(prev => ({...prev, [i]: {...tool, description: e.target.value}}))}
                  className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white resize-none h-10" placeholder="Description"
                />
                <input 
                  value={tool.tags.join(', ')} onChange={e => setEditedTools(prev => ({...prev, [i]: {...tool, tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean)}}))}
                  className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white" placeholder="Tags (comma separated)"
                />
                
                <div className="flex gap-2 mt-1">
                  <button onClick={() => {
                    setEditedTools(prev => { const n = {...prev}; delete n[i]; return n; });
                  }} className="flex-1 py-1.5 bg-[#111111] hover:bg-[#161616] border border-[#27272A] text-zinc-300 rounded-lg text-xs transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleSave(i)} disabled={savingIndices[i]} className="flex-1 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-medium flex justify-center items-center gap-1 transition-colors disabled:opacity-50">
                    {savingIndices[i] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add to Memory
                  </button>
                </div>
              </div>
            );
          })}
          
          {Object.keys(editedTools).length === 0 && (
            <p className="text-center text-xs text-zinc-500 py-4">No remaining tools to save.</p>
          )}
        </div>
      )}
    </div>
  );
};
