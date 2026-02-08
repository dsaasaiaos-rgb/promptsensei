import React, { useState } from 'react';
import { Copy, ArrowRight, Tag, Users, Star, Maximize2, Minimize2, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const categoryColors = {
  content_generation: "bg-purple-100 text-purple-800 border-purple-200",
  code_explanation: "bg-blue-100 text-blue-800 border-blue-200",
  data_analysis: "bg-green-100 text-green-800 border-green-200",
  debugging: "bg-red-100 text-red-800 border-red-200",
  documentation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  learning: "bg-indigo-100 text-indigo-800 border-indigo-200",
  refactoring: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function TemplateCard({ template, onSelect, onCopy, isFavorite, onToggleFavorite, onShare }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      onClick={onSelect}
      className="group relative p-6 bg-white border border-[#FECDD3] rounded-2xl cursor-pointer transition-all hover:shadow-[0_4px_20px_-2px_rgba(225,29,72,0.25)] hover:border-[#E11D48]/30 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${categoryColors[template.category]} border text-[10px] font-bold`}>
              {template.category.replace(/_/g, ' ').toUpperCase()}
            </Badge>
            {template.is_system && (
              <Badge className="bg-[#E11D48] text-white border-[#E11D48] text-[10px]">
                <Star className="w-2 h-2 mr-1" />
                OFFICIAL
              </Badge>
            )}
          </div>
          <h3 className="font-bold text-gray-800 mb-1">{template.title}</h3>
          <p className="text-xs text-gray-500">{template.description}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(template.content);
          }}
          className="p-2 text-gray-400 hover:text-[#E11D48] hover:bg-[#FFF1F2] rounded-lg transition-all flex-shrink-0"
          title="Copy Template"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      
      <div 
        className="bg-[#FFF1F2]/50 p-4 rounded-xl border border-[#FECDD3]/50 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`text-gray-600 text-sm font-mono whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          {template.content}
        </p>
        {template.content.length > 150 && (
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
              <> <Maximize2 className="w-3 h-3 mr-1" /> Read Full Template </>
            )}
          </button>
        )}
      </div>

      {template.tags && template.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center">
              <Tag className="w-2 h-2 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#FECDD3]/50">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="p-1 hover:bg-[#FFF1F2] rounded transition-colors"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </button>
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-1 hover:bg-[#FFF1F2] rounded transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <span className="flex items-center font-medium text-xs text-gray-500">
            <Users className="w-3 h-3 mr-1" />
            {template.usage_count || 0}
          </span>
        </div>
        <div className="flex items-center text-[#E11D48] font-semibold text-sm group-hover:translate-x-1 transition-transform">
          Use <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </div>
  );
}