import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Terminal, Cpu, Code2, ArrowRight, CheckCircle2, AlertCircle, BookOpen, ShieldAlert, 
  Layers, ChevronRight, RefreshCw, Copy, Database, History, Calendar, FileCode, Search, 
  Zap, Wand2, Settings, HelpCircle, FolderOpen, Menu, X, ClipboardCheck, Sparkles, 
  Gauge, Plus, GitBranch, Bookmark, Star, MessageSquare, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LoadingScreen from '../components/LoadingScreen';
import PromptCard from '../components/PromptCard';
import TemplateCard from '../components/TemplateCard';
import VersionHistoryModal from '../components/VersionHistoryModal';
import PlaygroundControls from '../components/PlaygroundControls';
import ComparisonView from '../components/ComparisonView';
import CoachingFeedback from '../components/CoachingFeedback';
import AITemplateGenerator from '../components/AITemplateGenerator';
import TemplateAnalytics from '../components/TemplateAnalytics';
import ShareWorkspaceModal from '../components/ShareWorkspaceModal';

const bgStyle = {
  backgroundColor: '#FDF2F8',
  backgroundImage: 'radial-gradient(#FBCFE8 1.5px, transparent 1.5px)',
  backgroundSize: '24px 24px',
};

export default function PromptMaster() {
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [showNavOrbs, setShowNavOrbs] = useState(false);
  const [step, setStep] = useState('input');
  const [userIdea, setUserIdea] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [revCodeInput, setRevCodeInput] = useState('');
  const [revResult, setRevResult] = useState(null);
  const [auditInput, setAuditInput] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [playgroundPrompt, setPlaygroundPrompt] = useState('');
  const [playgroundParams, setPlaygroundParams] = useState({ temperature: 0.7, top_p: 0.9, max_tokens: 2000 });
  const [playgroundRuns, setPlaygroundRuns] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItemToShare, setSelectedItemToShare] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ title: '', description: '', category: 'other', content: '', tags: [], example_usage: '' });
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  const { data: historyItems = [], isLoading: historyLoading } = useQuery({
    queryKey: ['generations'],
    queryFn: () => base44.entities.Generation.list('-created_date', 50)
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-usage_count', 100)
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.TemplateFavorite.list()
  });

  const { data: presets = [] } = useQuery({
    queryKey: ['presets'],
    queryFn: () => base44.entities.PlaygroundPreset.list()
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowCreateTemplate(false);
      setShowAIGenerator(false);
      setNewTemplate({ title: '', description: '', category: 'other', content: '', tags: [], example_usage: '' });
      setCopyFeedback('Template created!');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (templateId) => {
      const existing = favorites.find(f => f.template_id === templateId);
      if (existing) {
        await base44.entities.TemplateFavorite.delete(existing.id);
      } else {
        await base44.entities.TemplateFavorite.create({ template_id: templateId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['favorites'])
  });

  const callLLM = async (prompt, jsonSchema = null) => {
    const params = { prompt, add_context_from_internet: false, ...(jsonSchema && { response_json_schema: jsonSchema }) };
    return await base44.integrations.Core.InvokeLLM(params);
  };

  const saveVersion = async (generationId, versionNumber, promptContent, commandContent, changeDescription, resultData) => {
    await base44.entities.PromptVersion.create({
      generation_id: generationId,
      version_number: versionNumber,
      prompt_content: promptContent,
      command_content: commandContent || '',
      change_description: changeDescription,
      result_data: resultData
    });
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const handleGeneratePrompts = async () => {
    if (!userIdea.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await callLLM(
        `You are an expert AI Programming Instructor. Analyze the user's request and generate 3 distinct "Guess Prompts" that upgrade their idea. Each prompt should be specific, technical, and actionable.\n\nUser Idea: "${userIdea}"`,
        {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  style: { type: "string" },
                  tip: { type: "string" }
                }
              }
            }
          }
        }
      );
      setGeneratedPrompts(result.prompts || []);
      setStep('prompts');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async (promptData) => {
    setSelectedPrompt(promptData);
    setLoading(true);
    setError(null);
    
    try {
      const result = await callLLM(
        `You are a Senior DevOps & Linux Engineer. Provide 3 distinct "Technical Anchors" (Linux/Terminal Commands) for the selected prompt.\n\nSelected Prompt: "${promptData.content}"`,
        {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  command: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      );
      setGeneratedCodes(result.codes || []);
      setStep('codes');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (codeData) => {
    setSelectedCode(codeData);
    setLoading(true);
    setError(null);
    
    try {
      const result = await callLLM(
        `You are a Prompt Engineering Mentor. Break down the combination of prompt and technical command.\n\nPrompt: "${selectedPrompt.content}"\n\nTechnical Command: "${codeData.command}"`,
        {
          type: "object",
          properties: {
            breakdown: {
              type: "object",
              properties: {
                whyItWorks: { type: "string" },
                keyLesson: { type: "string" },
                finalCommand: { type: "string" },
                finalPrompt: { type: "string" }
              }
            }
          }
        }
      );
      
      setFinalAnalysis(result.breakdown);
      
      const generation = await base44.entities.Generation.create({
        type: 'builder',
        idea: userIdea,
        prompt: selectedPrompt,
        code: codeData,
        result: result.breakdown,
        current_version: 1
      });
      
      await saveVersion(generation.id, 1, result.breakdown.finalPrompt, result.breakdown.finalCommand, 'Initial version', result.breakdown);
      setStep('result');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseEngineer = async () => {
    if (!revCodeInput.trim()) return;
    setLoading(true);
    setError(null);
    setRevResult(null);
    
    try {
      const result = await callLLM(
        `You are an expert Reverse Engineering & Prompt Specialist. Generate the Prompt that would have created this code.\n\nCode:\n\n${revCodeInput}`,
        {
          type: "object",
          properties: {
            analysis: { type: "string" },
            masterPrompt: { type: "string" },
            technicalContext: { type: "string" }
          }
        }
      );
      setRevResult(result);
      
      const generation = await base44.entities.Generation.create({
        type: 'reverse',
        inputCode: revCodeInput,
        generatedPrompt: result.masterPrompt,
        analysis: result.analysis,
        current_version: 1
      });
      
      await saveVersion(generation.id, 1, result.masterPrompt, revCodeInput, 'Reverse engineered from code', result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditPrompt = async () => {
    if (!auditInput.trim()) return;
    setLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const result = await callLLM(
        `You are an Expert Prompt Engineering Coach. Analyze this prompt across: SPECIFICITY (0-100), CLARITY (0-100), STRUCTURE (0-100), BIAS DETECTION (0-100, where 100=bias-free). Provide feedback, improvements, detect biases, and create an optimized version.\n\nPrompt:\n\n${auditInput}`,
        {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            specificity_score: { type: "number" },
            specificity_feedback: { type: "string" },
            clarity_score: { type: "number" },
            clarity_feedback: { type: "string" },
            structure_score: { type: "number" },
            structure_feedback: { type: "string" },
            bias_score: { type: "number" },
            bias_feedback: { type: "string" },
            improvements: { type: "array", items: { type: "string" } },
            biases_detected: { type: "array", items: { type: "string" } },
            example_rewrite: { type: "string" },
            optimizedPrompt: { type: "string" }
          }
        }
      );
      setAuditResult(result);
      
      const generation = await base44.entities.Generation.create({
        type: 'audit',
        idea: auditInput,
        result: result,
        current_version: 1
      });
      
      await saveVersion(generation.id, 1, result.optimizedPrompt, '', 'Audited and optimized', result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    await base44.entities.Template.update(template.id, { usage_count: (template.usage_count || 0) + 1 });
    queryClient.invalidateQueries(['templates']);
    setUserIdea(template.content);
    setActiveTab('builder');
    setStep('input');
    setCopyFeedback('Template loaded!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) {
      setError('Please fill in title and content');
      return;
    }
    createTemplateMutation.mutate({ ...newTemplate, is_system: false, usage_count: 0 });
  };

  const handleAIGenerateTemplate = (generatedTemplate) => {
    createTemplateMutation.mutate({ ...generatedTemplate, is_system: false, usage_count: 0 });
  };

  const handleShareWorkspace = async (sharedWith) => {
    if (!selectedItemToShare) return;
    try {
      await base44.entities.Template.update(selectedItemToShare.id, { is_shared: true, shared_with: sharedWith });
      queryClient.invalidateQueries(['templates']);
      setShowShareModal(false);
      setSelectedItemToShare(null);
      setCopyFeedback('Shared!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      setError('Failed to share');
    }
  };

  const handleRevertVersion = async (version) => {
    try {
      await base44.entities.Generation.update(selectedGeneration.id, {
        current_version: version.version_number,
        result: version.result_data
      });
      queryClient.invalidateQueries(['generations']);
      setShowVersionModal(false);
      setCopyFeedback('Reverted to v' + version.version_number);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      setError('Failed to revert');
    }
  };

  const handlePlaygroundRun = async () => {
    if (!playgroundPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const result = await callLLM(playgroundPrompt);
      const endTime = Date.now();
      const run = {
        prompt_content: playgroundPrompt,
        temperature: playgroundParams.temperature,
        top_p: playgroundParams.top_p,
        max_tokens: playgroundParams.max_tokens,
        output: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        generation_time_ms: endTime - startTime
      };
      await base44.entities.PlaygroundRun.create(run);
      setPlaygroundRuns([run, ...playgroundRuns]);
      setCopyFeedback('Generated!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await base44.entities.PlaygroundPreset.create({ name: presetName, ...playgroundParams });
      queryClient.invalidateQueries(['presets']);
      setShowSavePreset(false);
      setPresetName('');
      setCopyFeedback('Preset saved!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      setError('Failed to save preset');
    }
  };

  const handleLoadPreset = (preset) => {
    setPlaygroundParams({ temperature: preset.temperature, top_p: preset.top_p, max_tokens: preset.max_tokens });
    setCopyFeedback(`Loaded: ${preset.name}`);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleSaveRunAsTemplate = (run) => {
    setNewTemplate({
      title: `Playground Template - ${new Date().toLocaleDateString()}`,
      description: 'From playground run',
      category: 'other',
      content: run.prompt_content,
      tags: ['playground'],
      example_usage: `Temp=${run.temperature}, Top-P=${run.top_p}, Tokens=${run.max_tokens}`
    });
    setShowCreateTemplate(true);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
    const matchesSearch = !templateSearch || 
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description?.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isFavorite = (templateId) => favorites.some(f => f.template_id === templateId);

  return (
    <div className="flex min-h-screen text-gray-800 font-sans relative overflow-x-hidden" style={bgStyle}>
      
      {/* Floating Orb Navigation */}
      <div className="fixed left-8 bottom-12 z-50 flex flex-col items-center gap-4">
        <div className={`flex flex-col gap-4 transition-all duration-300 ${showNavOrbs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <button onClick={() => setActiveTab('templates')} className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#FECDD3] text-[#E11D48] hover:scale-110 transition-transform flex items-center justify-center group relative">
            <FolderOpen className="w-5 h-5" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Templates</span>
          </button>
        </div>
        <button onClick={() => setShowNavOrbs(!showNavOrbs)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${showNavOrbs ? 'bg-gray-800 text-white rotate-180' : 'bg-[#E11D48] text-white'}`}>
          {showNavOrbs ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col relative">
        <header className="w-full h-20 flex items-center justify-between px-8 md:px-12 py-4 bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-[#FECDD3]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-lg shadow-lg">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">PromptMaster AI</span>
          </div>
        </header>

        <main className="w-full max-w-4xl mx-auto px-4 pb-20 flex flex-col items-center relative z-10 pt-8">
          <div className="absolute top-20 bottom-0 left-1/2 w-px border-l-2 border-dotted border-[#FECDD3] -translate-x-1/2 -z-10 h-[90%] opacity-60"></div>

          <div className="mb-12 bg-white rounded-full p-1.5 shadow-sm inline-flex items-center gap-1 border border-[#FECDD3] sticky top-24 z-30">
            {[
              { id: 'builder', label: 'Builder', icon: Wand2 },
              { id: 'reverse', label: 'Reverse', icon: Code2 },
              { id: 'audit', label: 'Coach', icon: ClipboardCheck },
              { id: 'playground', label: 'Playground', icon: Zap },
              { id: 'templates', label: 'Templates', icon: Bookmark },
              { id: 'history', label: 'Database', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#E11D48] text-white shadow-md' : 'text-gray-500 hover:bg-[#FFF1F2] hover:text-[#E11D48]'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="w-full max-w-2xl bg-[#FFF1F2] border border-[#E11D48] text-[#9F1239] p-4 rounded-xl mb-6 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}
          
          {copyFeedback && (
            <div className="fixed top-24 right-8 z-50">
              <div className="bg-[#E11D48] text-white px-4 py-2 rounded-xl shadow-lg text-sm flex items-center font-medium">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {copyFeedback}
              </div>
            </div>
          )}

          {loading ? <LoadingScreen /> : (
            <>
              {activeTab === 'builder' && (
                <div className="w-full max-w-3xl">
                  {step === 'input' && (
                    <>
                      <div className="w-full bg-gradient-to-b from-[#FFF1F2] to-white rounded-2xl p-8 border border-[#FECDD3] mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What do you want to build?</h2>
                        <p className="text-gray-600">Describe your idea in plain English.</p>
                      </div>
                      <div className="w-full bg-white rounded-2xl border-2 border-[#FFE4E6] mb-12">
                        <textarea value={userIdea} onChange={(e) => setUserIdea(e.target.value)} className="w-full h-48 p-6 pb-16 text-gray-700 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm outline-none" placeholder="e.g., I want a python script that scrapes amazon prices..." />
                        <div className="absolute bottom-4 right-4">
                          <button onClick={handleGeneratePrompts} disabled={!userIdea.trim()} className="w-12 h-12 rounded-full bg-[#E11D48] text-white flex items-center justify-center hover:scale-105 disabled:opacity-50 shadow-lg">
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {step === 'prompts' && (
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold">Choose a Strategy</h2>
                        <button onClick={() => setStep('input')} className="text-sm text-gray-400 hover:text-[#E11D48]">Back</button>
                      </div>
                      <div className="grid gap-6">
                        {generatedPrompts.map((p, idx) => (
                          <PromptCard key={idx} prompt={p} index={idx} onSelect={() => handleGenerateCodes(p)} onCopy={copyToClipboard} />
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 'codes' && (
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold">Add Technical Context</h2>
                        <button onClick={() => setStep('prompts')} className="text-sm text-gray-400 hover:text-[#E11D48]">Back</button>
                      </div>
                      <div className="grid gap-4">
                        {generatedCodes.map((code, idx) => (
                          <div key={idx} onClick={() => handleFinalize(code)} className="group p-6 bg-white border border-[#FECDD3] hover:border-[#E11D48] rounded-2xl cursor-pointer">
                            <h3 className="font-bold text-gray-800 flex items-center"><Terminal className="w-4 h-4 mr-2 text-[#E11D48]" />{code.title}</h3>
                            <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-sm my-3">{`> ${code.command}`}</div>
                            <p className="text-xs text-gray-500">{code.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 'result' && finalAnalysis && (
                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-[#E11D48] to-[#BE123C] p-1 rounded-2xl">
                        <div className="bg-white rounded-xl p-8 text-center">
                          <CheckCircle2 className="w-12 h-12 text-[#E11D48] mx-auto mb-4" />
                          <h2 className="text-3xl font-bold mb-2">Ready to Deploy</h2>
                        </div>
                      </div>
                      <div className="bg-white border border-[#FECDD3] p-8 rounded-2xl">
                        <p className="text-gray-700 mb-6">{finalAnalysis.whyItWorks}</p>
                        <div className="bg-[#FFF1F2] p-4 rounded-xl"><span className="text-[#E11D48] font-bold text-xs uppercase block mb-1">Key Lesson</span><p className="text-gray-600 text-sm">{finalAnalysis.keyLesson}</p></div>
                      </div>
                      <div className="relative">
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 font-mono text-sm">{finalAnalysis.finalPrompt}</div>
                        <button onClick={() => copyToClipboard(finalAnalysis.finalPrompt)} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><Copy className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => { setStep('input'); setUserIdea(''); setGeneratedPrompts([]); setGeneratedCodes([]); }} className="w-full py-4 bg-white border-2 border-[#FECDD3] hover:border-[#E11D48] text-gray-500 rounded-xl font-bold flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 mr-2" />Start New
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reverse' && (
                <div className="w-full max-w-3xl">
                  <div className="w-full bg-white rounded-2xl p-8 border border-[#FECDD3] mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg"><Code2 className="w-6 h-6 text-[#BE123C]" /></div>
                      <div><h2 className="text-2xl font-bold">Reverse Engineer</h2><p className="text-gray-500 text-sm">Generate the master prompt from code</p></div>
                    </div>
                  </div>
                  {!revResult ? (
                    <div className="w-full">
                      <div className="w-full bg-white rounded-2xl p-1 border-2 border-[#FECDD3]">
                        <textarea value={revCodeInput} onChange={(e) => setRevCodeInput(e.target.value)} placeholder="// Paste code here..." className="w-full h-64 p-6 text-gray-700 bg-white rounded-xl border-none resize-none font-mono text-xs focus:ring-0" />
                      </div>
                      <button onClick={handleReverseEngineer} disabled={!revCodeInput.trim()} className="mt-6 w-full py-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white rounded-xl font-bold flex items-center justify-center shadow-lg disabled:opacity-50">
                        <Zap className="w-5 h-5 mr-2" />Reverse Engineer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white border-l-4 border-[#E11D48] p-6 rounded-r-xl">
                        <h3 className="text-xs font-bold text-[#E11D48] uppercase mb-2">Analysis</h3>
                        <p className="text-sm mb-4">{revResult.analysis}</p>
                        <div className="bg-[#FFF1F2] p-3 rounded-lg"><span className="text-[#BE123C] font-bold text-[10px] uppercase">Context</span><p className="text-xs text-gray-600 font-mono">{revResult.technicalContext}</p></div>
                      </div>
                      <div className="relative">
                        <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm text-[#FDA4AF] whitespace-pre-wrap">{revResult.masterPrompt}</div>
                        <button onClick={() => copyToClipboard(revResult.masterPrompt)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"><Copy className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => { setRevCodeInput(''); setRevResult(null); }} className="w-full py-3 bg-white border border-[#FECDD3] hover:border-[#E11D48] text-gray-600 rounded-xl font-semibold flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 mr-2" />New Code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="w-full max-w-4xl">
                  <div className="w-full bg-white rounded-2xl p-8 border border-[#FECDD3] mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg"><ClipboardCheck className="w-6 h-6 text-[#BE123C]" /></div>
                      <div><h2 className="text-2xl font-bold">AI Prompt Coach</h2><p className="text-gray-500 text-sm">Real-time analysis with bias detection</p></div>
                    </div>
                  </div>
                  {!auditResult ? (
                    <div className="w-full">
                      <div className="w-full bg-white rounded-2xl p-1 border-2 border-[#FECDD3]">
                        <textarea value={auditInput} onChange={(e) => setAuditInput(e.target.value)} placeholder="Paste your prompt for coaching..." className="w-full h-64 p-6 text-gray-700 bg-white rounded-xl border-none resize-none font-mono text-sm focus:ring-0" />
                      </div>
                      <button onClick={handleAuditPrompt} disabled={!auditInput.trim()} className="mt-6 w-full py-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white rounded-xl font-bold flex items-center justify-center shadow-lg disabled:opacity-50">
                        <Sparkles className="w-5 h-5 mr-2" />Analyze with AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <CoachingFeedback analysis={auditResult} />
                      <div className="relative">
                        <div className="bg-gray-900 rounded-2xl p-6 pt-8 font-mono text-sm text-[#FDA4AF] whitespace-pre-wrap">{auditResult.optimizedPrompt}</div>
                        <button onClick={() => copyToClipboard(auditResult.optimizedPrompt)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"><Copy className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => { setAuditInput(''); setAuditResult(null); }} className="w-full py-3 bg-white border border-[#FECDD3] hover:border-[#E11D48] text-gray-600 rounded-xl font-semibold flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 mr-2" />New Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'playground' && (
                <div className="w-full max-w-6xl">
                  <div className="w-full bg-white rounded-2xl p-8 border border-[#FECDD3] mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg"><Zap className="w-6 h-6 text-[#BE123C]" /></div>
                      <div><h2 className="text-2xl font-bold">AI Playground</h2><p className="text-gray-500 text-sm">Experiment with LLM parameters</p></div>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white border-2 border-[#FECDD3] rounded-2xl p-1">
                        <textarea value={playgroundPrompt} onChange={(e) => setPlaygroundPrompt(e.target.value)} placeholder="Enter prompt..." className="w-full h-64 p-6 text-gray-700 bg-transparent rounded-xl border-none resize-none font-mono text-sm focus:ring-0" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handlePlaygroundRun} disabled={!playgroundPrompt.trim() || isGenerating} className="flex-1 py-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white rounded-xl font-bold flex items-center justify-center shadow-lg disabled:opacity-50">
                          {isGenerating ? <><Cpu className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Zap className="w-5 h-5 mr-2" />Generate</>}
                        </button>
                        {playgroundRuns.length > 0 && <button onClick={() => setPlaygroundRuns([])} className="px-6 py-4 bg-white border border-[#FECDD3] text-gray-600 rounded-xl font-semibold">Clear</button>}
                      </div>
                      {playgroundRuns.length > 0 && (
                        <>
                          <ComparisonView runs={playgroundRuns} onCopy={copyToClipboard} onSaveAsTemplate={handleSaveRunAsTemplate} />
                        </>
                      )}
                    </div>
                    <div className="space-y-6">
                      <PlaygroundControls params={playgroundParams} onChange={setPlaygroundParams} />
                      <div className="bg-white border border-[#FECDD3] rounded-xl p-4">
                        <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Presets</h3>
                        {presets.map((preset) => (
                          <button key={preset.id} onClick={() => handleLoadPreset(preset)} className="w-full mb-2 px-3 py-2 text-xs bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] rounded-lg font-medium border border-[#FECDD3] text-left">
                            {preset.name}
                          </button>
                        ))}
                        {!showSavePreset ? (
                          <Button size="sm" variant="outline" onClick={() => setShowSavePreset(true)} className="w-full"><Plus className="w-3 h-3 mr-2" />Save Preset</Button>
                        ) : (
                          <div className="space-y-2">
                            <Input placeholder="Name..." value={presetName} onChange={(e) => setPresetName(e.target.value)} className="text-xs" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSavePreset} className="flex-1">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setShowSavePreset(false)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="w-full max-w-4xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg"><Bookmark className="w-6 h-6 text-[#E11D48]" /></div>
                      <h2 className="text-2xl font-bold">Templates</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowAnalytics(!showAnalytics)} variant="outline"><Gauge className="w-4 h-4 mr-2" />Analytics</Button>
                      <Button onClick={() => setShowAIGenerator(true)} variant="outline" className="border-purple-200 text-purple-600"><Sparkles className="w-4 h-4 mr-2" />AI Generate</Button>
                      <Button onClick={() => setShowCreateTemplate(true)} className="bg-[#E11D48]"><Plus className="w-4 h-4 mr-2" />Create</Button>
                    </div>
                  </div>

                  {showCreateTemplate && (
                    <div className="mb-8 p-6 bg-white border-2 border-[#E11D48] rounded-2xl">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold">New Template</h3>
                        <button onClick={() => setShowCreateTemplate(false)}><X className="w-5 h-5" /></button>
                      </div>
                      <div className="space-y-4">
                        <Input placeholder="Title" value={newTemplate.title} onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})} />
                        <Input placeholder="Description" value={newTemplate.description} onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} />
                        <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate({...newTemplate, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="content_generation">Content</SelectItem>
                            <SelectItem value="code_explanation">Code</SelectItem>
                            <SelectItem value="data_analysis">Data</SelectItem>
                            <SelectItem value="debugging">Debug</SelectItem>
                            <SelectItem value="documentation">Docs</SelectItem>
                            <SelectItem value="learning">Learn</SelectItem>
                            <SelectItem value="refactoring">Refactor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea placeholder="Content (use {{variable}})" value={newTemplate.content} onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})} className="h-40 font-mono text-sm" />
                        <Input placeholder="Tags (comma-separated)" value={newTemplate.tags?.join(', ') || ''} onChange={(e) => setNewTemplate({...newTemplate, tags: e.target.value.split(',').map(t => t.trim())})} />
                        <Button onClick={handleCreateTemplate} className="w-full bg-[#E11D48]">Save</Button>
                      </div>
                    </div>
                  )}

                  {showAnalytics ? (
                    <TemplateAnalytics templates={templates} />
                  ) : (
                    <>
                      {isFavorite && favorites.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" />Favorites</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {templates.filter(t => isFavorite(t.id)).slice(0, 4).map((t) => (
                              <TemplateCard key={t.id} template={t} onSelect={() => handleUseTemplate(t)} onCopy={copyToClipboard} isFavorite={true} onToggleFavorite={() => toggleFavoriteMutation.mutate(t.id)} onShare={() => { setSelectedItemToShare(t); setShowShareModal(true); }} />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4 mb-8">
                        <Input placeholder="Search..." value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} className="flex-1" />
                        <Select value={templateCategory} onValueChange={setTemplateCategory}>
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="content_generation">Content</SelectItem>
                            <SelectItem value="code_explanation">Code</SelectItem>
                            <SelectItem value="data_analysis">Data</SelectItem>
                            <SelectItem value="debugging">Debug</SelectItem>
                            <SelectItem value="documentation">Docs</SelectItem>
                            <SelectItem value="learning">Learn</SelectItem>
                            <SelectItem value="refactoring">Refactor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {templatesLoading ? <LoadingScreen /> : (
                        <div className="grid md:grid-cols-2 gap-6">
                          {filteredTemplates.map((t) => (
                            <TemplateCard key={t.id} template={t} onSelect={() => handleUseTemplate(t)} onCopy={copyToClipboard} isFavorite={isFavorite(t.id)} onToggleFavorite={() => toggleFavoriteMutation.mutate(t.id)} onShare={() => { setSelectedItemToShare(t); setShowShareModal(true); }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="w-full max-w-4xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg"><Database className="w-6 h-6 text-[#E11D48]" /></div>
                      <h2 className="text-2xl font-bold">Database</h2>
                    </div>
                    <Badge className="bg-[#FFF1F2] text-[#E11D48]">{historyItems.length} records</Badge>
                  </div>
                  {historyLoading ? <LoadingScreen /> : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32">
                      <History className="w-16 h-16 mb-4 opacity-50 text-[#FECDD3]" />
                      <p className="text-lg font-medium text-gray-300">No records yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {historyItems.map((item) => (
                        <div key={item.id} className="bg-white border border-[#FECDD3] rounded-2xl p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <Badge className="mb-2">{item.type}</Badge>
                              <h3 className="font-bold text-lg">{item.type === 'audit' ? 'Optimization' : item.type === 'reverse' ? 'Analysis' : item.idea}</h3>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedGeneration(item); setShowVersionModal(true); }}>
                              <GitBranch className="w-3 h-3 mr-2" />History
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-[#FFF1F2]/50 rounded-xl p-4"><p className="text-sm font-mono line-clamp-3">{item.type === 'reverse' ? item.inputCode : item.idea}</p></div>
                            <div className="bg-gray-900 rounded-xl p-4"><p className="text-sm text-[#FDA4AF] font-mono line-clamp-3">{item.type === 'reverse' ? item.generatedPrompt : item.type === 'audit' ? item.result?.optimizedPrompt : item.result?.finalPrompt}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showVersionModal && selectedGeneration && <VersionHistoryModal generation={selectedGeneration} onClose={() => { setShowVersionModal(false); setSelectedGeneration(null); }} onRevert={handleRevertVersion} />}
      {showAIGenerator && <AITemplateGenerator onGenerate={handleAIGenerateTemplate} onClose={() => setShowAIGenerator(false)} />}
      {showShareModal && selectedItemToShare && <ShareWorkspaceModal item={selectedItemToShare} onShare={handleShareWorkspace} onClose={() => { setShowShareModal(false); setSelectedItemToShare(null); }} />}
    </div>
  );
}