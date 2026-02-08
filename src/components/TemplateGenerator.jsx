import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, X } from 'lucide-react';

export default function TemplateGenerator({ onGenerate, onClose, isGenerating }) {
  const [useCase, setUseCase] = useState('');
  const [category, setCategory] = useState('other');

  const handleGenerate = () => {
    if (useCase.trim()) {
      onGenerate(useCase, category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFF1F2] rounded-lg">
              <Sparkles className="w-6 h-6 text-[#E11D48]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">AI Template Generator</h2>
              <p className="text-sm text-gray-500">Describe your use case and AI will create a template</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Describe Your Use Case
            </label>
            <Textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="e.g., Generate marketing copy for a new product launch with focus on benefits, target audience, and call-to-action..."
              className="h-40 font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content_generation">Content Generation</SelectItem>
                <SelectItem value="code_explanation">Code Explanation</SelectItem>
                <SelectItem value="data_analysis">Data Analysis</SelectItem>
                <SelectItem value="debugging">Debugging</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="refactoring">Refactoring</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!useCase.trim() || isGenerating}
            className="w-full bg-[#E11D48] hover:bg-[#BE123C] text-white py-6"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Template...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}