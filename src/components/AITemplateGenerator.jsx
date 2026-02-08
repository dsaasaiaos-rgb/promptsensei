import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Wand2, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AITemplateGenerator({ onGenerate, onClose }) {
  const [useCase, setUseCase] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!useCase.trim()) return;
    setLoading(true);

    try {
      const systemPrompt = `You are an expert prompt engineer. Generate a comprehensive template for the following use case.

Create a template with:
1. A clear, descriptive title
2. A brief description
3. The appropriate category
4. A well-structured prompt with {{VARIABLE}} placeholders for customizable parts
5. A list of all variable names (just the names, no brackets)
6. Relevant tags for searchability
7. An example usage showing how to use the template

Be specific and create a high-quality, production-ready template.`;

      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          content: { type: "string" },
          variables: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          example_usage: { type: "string" }
        }
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nUse Case: ${useCase}`,
        response_json_schema: schema
      });

      onGenerate(result);
      setUseCase('');
    } catch (error) {
      console.error('Failed to generate template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFF1F2] rounded-lg">
              <Wand2 className="w-6 h-6 text-[#E11D48]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">AI Template Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Describe your use case and let AI create a professional template for you.
        </p>

        <Textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="Example: Generate marketing copy for a new product launch with focus on benefits and call-to-action"
          className="h-40 mb-6 font-mono text-sm"
        />

        <Button
          onClick={handleGenerate}
          disabled={!useCase.trim() || loading}
          className="w-full bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Template...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Template with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
}