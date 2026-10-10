import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Calendar, Send, Laptop, Youtube, Instagram, Twitter, Globe, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { AITool, CustomCategory } from '../lib/types';

interface ToolCardProps {
  tool: AITool;
  categories: CustomCategory[];
  onEdit: (id: string, updates: Partial<AITool>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'telegram': return <Send className="w-3 h-3 text-sky-400" />;
    case 'youtube': return <Youtube className="w-3 h-3 text-red-400" />;
    case 'instagram': return <Instagram className="w-3 h-3 text-pink-400" />;
    case 'x':
    case 'twitter': return <Twitter className="w-3 h-3 text-blue-400" />;
    case 'extension': return <Laptop className="w-3 h-3 text-[#A78BFA]" />;
    default: return <Globe className="w-3 h-3 text-zinc-400" />;
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, categories, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: tool.name, category: tool.category, description: tool.description, tags: tool.tags.join(', ') });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = new Date(tool.addedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await onDelete(tool.id);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await onEdit(tool.id, {
      name: editForm.name,
      category: editForm.category,
      description: editForm.description,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setIsSubmitting(false);
    setIsEditing(false);
    setShowMenu(false);
  };

  if (isEditing) {
    return (
      <div className="p-3.5 bg-[#111111] border border-[#8B5CF6] rounded-2xl flex flex-col gap-2 shadow-lg">
        <input 
          value={editForm.name} 
          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
          className="bg-[#0A0A0A] border border-[#27272A] rounded p-1.5 text-xs text-white" 
          placeholder="Name" 
        />
        <select 
          value={editForm.category} 
          onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
          className="bg-[#0A0A0A] border border-[#27272A] rounded p-1.5 text-xs text-white"
        >
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <textarea 
          value={editForm.description} 
          onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
          className="bg-[#0A0A0A] border border-[#27272A] rounded p-1.5 text-xs text-white resize-none h-16" 
          placeholder="Description" 
        />
        <input 
          value={editForm.tags} 
          onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
          className="bg-[#0A0A0A] border border-[#27272A] rounded p-1.5 text-xs text-white" 
          placeholder="Tags (comma separated)" 
        />
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 rounded bg-[#27272A] text-zinc-300">Cancel</button>
          <button onClick={handleSave} disabled={isSubmitting} className="text-xs px-3 py-1 rounded bg-[#8B5CF6] text-white flex items-center gap-1">
            <Check className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative p-3.5 bg-[#111111] hover:bg-[#161616] border border-[#27272A] hover:border-[#8B5CF6]/50 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 pr-6">
            <h3 className="font-semibold text-sm text-white group-hover:text-[#A78BFA] transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-zinc-500/10 text-zinc-300 border-zinc-500/20 whitespace-nowrap">
              {tool.category}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 absolute top-3.5 right-3.5">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-[#0A0A0A] hover:bg-[#8B5CF6] text-zinc-400 hover:text-white border border-[#27272A] hover:border-[#8B5CF6] transition-all duration-200"
              title={`Open ${tool.name}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg bg-[#0A0A0A] hover:bg-[#27272A] text-zinc-400 hover:text-white border border-[#27272A] transition-all duration-200"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-full mt-1 w-28 bg-[#111111] border border-[#27272A] rounded-lg shadow-xl z-10 overflow-hidden flex flex-col"
                  >
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-[#27272A] hover:text-white text-left">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-left border-t border-[#27272A]">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2 pr-2">
          {tool.description}
        </p>

        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tool.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-[#0A0A0A] border border-[#27272A] text-[10px] text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-[#27272A]/50">
        <div className="flex items-center gap-1.5">
          {getSourceIcon(tool.source)}
          <span className="capitalize">{tool.source}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-zinc-600" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
};
