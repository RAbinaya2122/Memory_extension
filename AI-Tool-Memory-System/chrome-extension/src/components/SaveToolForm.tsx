import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, CheckCircle2, AlertTriangle, XCircle, Link2, Eye, Check } from 'lucide-react';
import { ProcessToolResult, AnalyzeUrlResult, ToolPreview, CustomCategory } from '../lib/types';

interface SaveToolFormProps {
  onSave: (url: string, source?: string, sourceUrl?: string, toolPreview?: ToolPreview) => Promise<ProcessToolResult>;
  onAnalyze: (url: string) => Promise<AnalyzeUrlResult>;
  categories: CustomCategory[];
  isSaving: boolean;
  isServerConnected: boolean;
}

export const SaveToolForm: React.FC<SaveToolFormProps> = ({
  onSave,
  onAnalyze,
  categories,
  isSaving,
  isServerConnected
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [feedback, setFeedback] = useState<ProcessToolResult | AnalyzeUrlResult | null>(null);
  const [previewData, setPreviewData] = useState<{ tool: ToolPreview, sourceUrl?: string } | null>(null);
  const [editPreview, setEditPreview] = useState<ToolPreview | null>(null);

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isSaving) return;

    setFeedback(null);
    setPreviewData(null);
    setEditPreview(null);
    
    const res = await onAnalyze(urlInput.trim());
    
    if (res.success && res.tool) {
      setPreviewData({ tool: res.tool, sourceUrl: res.sourceUrl });
      setEditPreview({ ...res.tool });
    } else {
      setFeedback(res);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleConfirmSave = async () => {
    if (!editPreview || !previewData) return;
    
    setFeedback(null);
    const res = await onSave(editPreview.url, 'extension', previewData.sourceUrl, editPreview);
    
    setFeedback(res as ProcessToolResult);
    
    if (res.success && !(res as ProcessToolResult).isDuplicate) {
      setUrlInput('');
      setPreviewData(null);
      setEditPreview(null);
    }
    
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className="p-3 bg-[#111111] border-b border-[#27272A]">
      <form onSubmit={handleAnalyzeSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste AI tool URL or social media post..."
            disabled={isSaving || !isServerConnected || previewData !== null}
            className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#27272A] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-200 disabled:opacity-50"
          />
        </div>

        {!previewData && (
          <button
            type="submit"
            disabled={!urlInput.trim() || isSaving || !isServerConnected}
            className="px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] active:scale-95 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Analyze</span>
              </>
            )}
          </button>
        )}
      </form>

      <AnimatePresence>
        {previewData && editPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="bg-[#0A0A0A] border border-[#8B5CF6]/50 rounded-xl p-3 flex flex-col gap-2 relative">
              <h4 className="text-xs font-semibold text-[#A78BFA] mb-1">Preview Analysis</h4>
              
              <button 
                onClick={() => setPreviewData(null)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>

              <input 
                value={editPreview.name} 
                onChange={e => setEditPreview({...editPreview, name: e.target.value})}
                className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white" 
                placeholder="Tool Name"
              />
              <input 
                value={editPreview.url} 
                onChange={e => setEditPreview({...editPreview, url: e.target.value})}
                className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-zinc-300" 
                placeholder="Official Website URL"
              />
              <select 
                value={editPreview.category} 
                onChange={e => setEditPreview({...editPreview, category: e.target.value})}
                className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white"
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea 
                value={editPreview.description} 
                onChange={e => setEditPreview({...editPreview, description: e.target.value})}
                className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white resize-none h-12" 
                placeholder="Description"
              />
              <input 
                value={editPreview.tags.join(', ')} 
                onChange={e => setEditPreview({...editPreview, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                className="bg-[#111111] border border-[#27272A] rounded p-1.5 text-xs text-white" 
                placeholder="Tags (comma separated)"
              />
              
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="mt-1 w-full py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add to Memory
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mt-2.5 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
              feedback.success && !(feedback as ProcessToolResult).isDuplicate
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : (feedback as ProcessToolResult).isDuplicate
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {feedback.success && !(feedback as ProcessToolResult).isDuplicate && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {(feedback as ProcessToolResult).isDuplicate && (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            {!feedback.success && (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              {feedback.success && !(feedback as ProcessToolResult).isDuplicate && (
                <div>
                  <p className="font-semibold text-emerald-400">✅ Tool Saved Successfully</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    <span className="font-medium text-white">{feedback.tool?.name}</span> ({feedback.tool?.category})
                  </p>
                </div>
              )}

              {(feedback as ProcessToolResult).isDuplicate && (
                <div>
                  <p className="font-semibold text-amber-400">⚠️ Already Saved</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    <span className="font-medium text-white">{feedback.tool?.name}</span> is already present in your AI Tool Memory.
                  </p>
                </div>
              )}

              {!feedback.success && (
                <div>
                  <p className="font-semibold text-rose-400">Error</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{feedback.error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
