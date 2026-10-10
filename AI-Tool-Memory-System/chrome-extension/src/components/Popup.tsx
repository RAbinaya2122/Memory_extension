import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Inbox, AlertTriangle, Loader2 } from 'lucide-react';
import { useTools } from '../hooks/useTools';
import { Header } from './Header';
import { SaveToolForm } from './SaveToolForm';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ToolCard } from './ToolCard';
import { VideoDiscovery } from './VideoDiscovery';
import { analyzeVideo } from '../lib/api';

export const Popup: React.FC = () => {
  const {
    tools,
    categories,
    categoryCounts,
    filteredTools,
    loading,
    error,
    isServerConnected,
    connectionState,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isSaving,
    saveTool,
    analyzeUrl,
    editTool,
    deleteTool,
    addCategory,
    editCategory,
    deleteCategory,
    refreshTools
  } = useTools();

  const [activeTab, setActiveTab] = useState<'quick' | 'video'>('quick');

  return (
    <div className="w-[420px] h-[600px] bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans overflow-hidden select-none border border-[#27272A]">
      <Header
        toolCount={tools.length}
        connectionState={connectionState}
        onRefresh={refreshTools}
        isLoading={loading}
      />

      <div className="flex border-b border-[#27272A] bg-[#0A0A0A]">
        <button 
          onClick={() => setActiveTab('quick')}
          className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'quick' ? 'text-[#8B5CF6] border-b-2 border-[#8B5CF6]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Quick Save
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'video' ? 'text-[#8B5CF6] border-b-2 border-[#8B5CF6]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Discover from Videos
        </button>
      </div>

      {activeTab === 'quick' ? (
        <SaveToolForm
          onSave={saveTool}
          onAnalyze={analyzeUrl}
          categories={categories}
          isSaving={isSaving}
          isServerConnected={isServerConnected}
        />
      ) : (
        <VideoDiscovery
          onAnalyzeVideo={analyzeVideo}
          onSaveTool={saveTool}
          categories={categories}
          isServerConnected={isServerConnected}
        />
      )}

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <CategoryFilter
        categories={categories}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddCategory={addCategory}
        onEditCategory={editCategory}
        onDeleteCategory={deleteCategory}
      />

      {/* Main Tool List Scroll Area */}
      <main className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
        {!isServerConnected && (
          <div className={`my-6 p-4 rounded-2xl text-center border ${
            connectionState === 'reconnecting' ? 'bg-amber-500/10 border-amber-500/20' :
            connectionState === 'connecting' ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20' :
            'bg-rose-500/10 border-rose-500/20'
          }`}>
            {connectionState === 'reconnecting' ? (
              <>
                <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-spin" />
                <h3 className="font-semibold text-xs text-amber-300">Reconnecting to Backend...</h3>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  The connection was lost. We are automatically trying to reconnect.
                </p>
              </>
            ) : connectionState === 'connecting' ? (
              <>
                <Loader2 className="w-8 h-8 text-[#8B5CF6] mx-auto mb-2 animate-spin" />
                <h3 className="font-semibold text-xs text-[#8B5CF6]">Connecting to Backend...</h3>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h3 className="font-semibold text-xs text-rose-300">Backend Server Offline</h3>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Please ensure the capture server is running to view and save tools.
                </p>
              </>
            )}
          </div>
        )}

        {loading && isServerConnected && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6] mb-2" />
            <p className="text-xs">Loading AI Tool Memory...</p>
          </div>
        )}

        {!loading && isServerConnected && filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-[#27272A] flex items-center justify-center mb-3 text-zinc-500 shadow-inner">
              <Inbox className="w-6 h-6" />
            </div>
            {tools.length === 0 ? (
              <>
                <h3 className="font-semibold text-sm text-zinc-200">No AI tools saved yet</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
                  Save your first AI tool by sending a URL to Telegram or pasting it in the form above.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-sm text-zinc-200">No matching tools found</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Try adjusting your search query or category filter.
                </p>
              </>
            )}
          </div>
        )}

        {!loading && isServerConnected && filteredTools.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool}
                  categories={categories}
                  onEdit={editTool}
                  onDelete={deleteTool}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="px-4 py-2 bg-[#0A0A0A] border-t border-[#27272A] flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
          <span>Gemini AI Tool Memory</span>
        </div>
        <span>ChatGPT & Gemini Injector Active</span>
      </footer>
    </div>
  );
};
