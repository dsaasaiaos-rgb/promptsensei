import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export default function PlaygroundControls({ params, onChange }) {
  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-[#FECDD3]">
      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#E11D48]"></span>
        LLM Parameters
      </h3>

      {/* Temperature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Temperature</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="text-xs">
                Controls randomness. Lower = more focused and deterministic. Higher = more creative and random.
              </HoverCardContent>
            </HoverCard>
          </div>
          <span className="text-sm font-mono font-bold text-[#E11D48]">{params.temperature}</span>
        </div>
        <Slider
          value={[params.temperature]}
          onValueChange={(v) => onChange({ ...params, temperature: v[0] })}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
          <span>Focused (0)</span>
          <span>Balanced (1)</span>
          <span>Creative (2)</span>
        </div>
      </div>

      {/* Top P */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Top P</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="text-xs">
                Nucleus sampling. Consider only tokens with top cumulative probability. Lower = more deterministic.
              </HoverCardContent>
            </HoverCard>
          </div>
          <span className="text-sm font-mono font-bold text-[#E11D48]">{params.top_p}</span>
        </div>
        <Slider
          value={[params.top_p]}
          onValueChange={(v) => onChange({ ...params, top_p: v[0] })}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
          <span>Precise (0)</span>
          <span>Diverse (1)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Max Tokens</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="text-xs">
                Maximum length of generated response. ~4 characters per token.
              </HoverCardContent>
            </HoverCard>
          </div>
          <span className="text-sm font-mono font-bold text-[#E11D48]">{params.max_tokens}</span>
        </div>
        <Slider
          value={[params.max_tokens]}
          onValueChange={(v) => onChange({ ...params, max_tokens: v[0] })}
          min={100}
          max={4000}
          step={100}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
          <span>Short (100)</span>
          <span>Medium (2000)</span>
          <span>Long (4000)</span>
        </div>
      </div>

      {/* Presets */}
      <div className="pt-4 border-t border-[#FECDD3]">
        <Label className="text-xs text-gray-500 mb-2 block">Quick Presets</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ temperature: 0.3, top_p: 0.8, max_tokens: 1000 })}
            className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
          >
            Precise
          </button>
          <button
            onClick={() => onChange({ temperature: 0.7, top_p: 0.9, max_tokens: 2000 })}
            className="px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
          >
            Balanced
          </button>
          <button
            onClick={() => onChange({ temperature: 1.2, top_p: 0.95, max_tokens: 2000 })}
            className="px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
          >
            Creative
          </button>
        </div>
      </div>
    </div>
  );
}