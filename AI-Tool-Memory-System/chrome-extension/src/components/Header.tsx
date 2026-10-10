import React from 'react';
import { Sparkles, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { ConnectionState } from '../hooks/useTools';

interface HeaderProps {
  toolCount: number;
  connectionState: ConnectionState;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  toolCount,
  connectionState,
  onRefresh,
  isLoading
}) => {
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'online':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400 animate-pulse',
          text: 'Connected'
        };
      case 'connecting':
        return {
          bg: 'bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20',
          dot: 'bg-[#8B5CF6] animate-pulse',
          text: 'Connecting'
        };
      case 'reconnecting':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400 animate-pulse',
          text: 'Reconnecting'
        };
      case 'offline':
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400',
          text: 'Offline'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#27272A] sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.5)]">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white">AI Tool Memory</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
              {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div 
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border font-medium ${statusConfig.bg}`}
          title={`Backend Server ${statusConfig.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span>{statusConfig.text}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#161616] border border-transparent hover:border-[#27272A] transition-all duration-200"
          title="Refresh tools"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
        </button>
      </div>
    </header>
  );
};
