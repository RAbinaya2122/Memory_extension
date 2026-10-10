import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { CustomCategory } from '../lib/types';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onAdd: (name: string) => Promise<any>;
  onEdit: (id: string, name: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen, onClose, categories, onAdd, onEdit, onDelete
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    setError('');
    const res = await onAdd(newCatName);
    setIsSubmitting(false);
    if (res.success) {
      setNewCatName('');
    } else {
      setError(res.error || 'Failed to add category');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setIsSubmitting(true);
    setError('');
    const res = await onEdit(editingId, editName);
    setIsSubmitting(false);
    if (res.success) {
      setEditingId(null);
    } else {
      setError(res.error || 'Failed to edit category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Tools will be moved to Uncategorized.')) return;
    setIsSubmitting(true);
    setError('');
    const res = await onDelete(id);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Failed to delete category');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#111111] border border-[#27272A] rounded-xl w-full max-w-[340px] flex flex-col shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b border-[#27272A] bg-[#0A0A0A]">
            <h3 className="font-semibold text-sm text-zinc-100">Manage Categories</h3>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-[#27272A]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-3 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New category..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 bg-[#0A0A0A] border border-[#27272A] rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isSubmitting}
                className="bg-[#8B5CF6] text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-[#7C3AED] disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-1.5">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-[#0A0A0A] border border-[#27272A] rounded-md p-2 group">
                  {editingId === cat.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                      className="flex-1 bg-transparent border-none outline-none text-xs text-white"
                    />
                  ) : (
                    <span className="text-xs text-zinc-300 font-medium truncate flex-1">{cat.name}</span>
                  )}

                  <div className="flex items-center gap-1 ml-2">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={handleSaveEdit} disabled={isSubmitting} className="text-[10px] bg-[#8B5CF6] text-white px-2 py-0.5 rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-[10px] bg-[#27272A] text-zinc-300 px-2 py-0.5 rounded">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                          className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {cat.id !== 'cat_uncategorized' && (
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
