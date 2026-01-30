import React, { useState } from 'react';
import { Copy, Maximize2, Minimize2, ArrowRight, Layers } from 'lucide-react';

export default function PromptCard({ prompt, index, onSelect, onCopy }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      onClick={onSelect}
      className="group relative p-6 bg-white border border-[#FECDD3] rounded-2xl cursor-pointer transition-all hover:shadow-[0_4px_20px_-2px_rgba(225,29,72,0.25)] hover:border-[#E11D48]/30 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="bg-[#FFF1F2] text-[#E11D48] text-xs px-2 py-0.5 rounded border border-[#FECDD3] font-mono font-medium">
            Strategy {index + 1}
          </span>
          <h3 className="font-bold text-gray-800">{prompt.title}</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(prompt.content);
          }}
          className="p-2 text-gray-400 hover:text-[#E11D48] hover:bg-[#FFF1F2] rounded-lg transition-all"
          title="Copy Prompt"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      
      <div 
        className="bg-[#FFF1F2]/50 p-4 rounded-xl border border-[#FECDD3]/50 mb-4 relative group/text"
        onClick={(e) => e.stopPropagation()} 
      >
        <p className={`text-gray-600 text-sm font-mono whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          {prompt.content}
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-3 flex items-center text-xs text-[#E11D48] hover:text-[#BE123C] font-medium transition-colors"
        >
          {isExpanded ? (
            <> <Minimize2 className="w-3 h-3 mr-1" /> Show Less </>
          ) : (
            <> <Maximize2 className="w-3 h-3 mr-1" /> Read Full Prompt </>
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center text-xs text-gray-500 gap-4">
          <span className="flex items-center font-medium">
            <Layers className="w-3 h-3 mr-1" />
            {prompt.style}
          </span>
        </div>
        <div className="flex items-center text-[#E11D48] font-semibold text-sm group-hover:translate-x-1 transition-transform">
          Select <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </div>
  );
}