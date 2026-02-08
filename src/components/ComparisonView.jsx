import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComparisonView({ runs, onCopy, onSaveAsTemplate }) {
  if (!runs || runs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#E11D48]" />
        Comparison Results ({runs.length})
      </h3>
      
      <div className="grid gap-4">
        {runs.map((run, idx) => (
          <div key={idx} className="bg-white border-2 border-[#FECDD3] rounded-xl p-5 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#FFF1F2] flex items-center justify-center text-sm font-bold text-[#E11D48]">
                  {idx + 1}
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    Temp: {run.temperature}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Top-P: {run.top_p}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Tokens: {run.max_tokens}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {run.generation_time_ms && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {run.generation_time_ms}ms
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSaveAsTemplate?.(run)}
                  className="h-7 px-2"
                  title="Save as Template"
                >
                  <Save className="w-3 h-3 mr-1" />
                  <span className="text-xs">Template</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(run.output)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Output */}
            <div className="bg-[#FFF1F2]/50 rounded-lg p-4 border border-[#FECDD3]/50">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {run.output}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>Length: {run.output?.length || 0} chars</span>
              <span>Words: ~{Math.round((run.output?.split(' ').length || 0))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}