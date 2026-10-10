import React, { useState } from 'react';
import { CustomCategory } from '../lib/types';
import { ManageCategoriesModal } from './CategoryManager';
import { Settings } from 'lucide-react';

interface CategoryFilterProps {
  categories: CustomCategory[];
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: (name: string) => Promise<any>;
  onEditCategory: (id: string, name: string) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<any>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 'All' is always present
  const allCategories = [{ id: 'all', name: 'All' }, ...categories];

  return (
    <div className="px-3 pb-3 bg-[#0A0A0A] border-b border-[#27272A] mb-3 flex items-center relative">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs flex-1 pr-6">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = categoryCounts[cat.name] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 border flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                  : 'bg-[#111111] text-zinc-400 border-[#27272A] hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.name}
              <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none" />
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="ml-2 p-1.5 text-zinc-500 hover:text-white hover:bg-[#27272A] rounded-lg border border-transparent hover:border-[#3f3f46] transition-colors"
        title="Manage Categories"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      <ManageCategoriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onAdd={onAddCategory}
        onEdit={onEditCategory}
        onDelete={onDeleteCategory}
      />
    </div>
  );
};
