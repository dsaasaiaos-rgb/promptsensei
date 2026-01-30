import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Terminal, 
  Cpu, 
  Code2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ShieldAlert, 
  Layers, 
  ChevronRight,
  RefreshCw,
  Copy,
  Maximize2,
  Minimize2,
  Database,
  History,
  Calendar,
  FileCode,
  Search,
  Zap,
  Wand2,
  Settings,
  HelpCircle,
  FolderOpen,
  Menu,
  X,
  ClipboardCheck,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Gauge,
  Plus,
  Filter,
  Grid3x3,
  List,
  GitBranch,
  Clock,
  Bookmark
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

// Custom Styles for Dotted Background
const bgStyle = {
  backgroundColor: '#FDF2F8',
  backgroundImage: 'radial-gradient(#FBCFE8 1.5px, transparent 1.5px)',
  backgroundSize: '24px 24px',
};

export default function PromptMaster() {
  const queryClient = useQueryClient();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('builder');
  const [showNavOrbs, setShowNavOrbs] = useState(false);

  // Builder State
  const [step, setStep] = useState('input');
  const [userIdea, setUserIdea] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [savedGenerationId, setSavedGenerationId] = useState(null);

  // Reverse Engineering State
  const [revCodeInput, setRevCodeInput] = useState('');
  const [revResult, setRevResult] = useState(null);

  // Audit State
  const [auditInput, setAuditInput] = useState('');
  const [auditResult, setAuditResult] = useState(null);

  // Templates State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    category: 'other',
    content: '',
    tags: []
  });

  // Version History State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Fetch History
  const { data: historyItems = [], isLoading: historyLoading } = useQuery({
    queryKey: ['generations'],
    queryFn: () => base44.entities.Generation.list('-created_date', 50)
  });

  // Fetch Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-usage_count', 100)
  });

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowCreateTemplate(false);
      setNewTemplate({ title: '', description: '', category: 'other', content: '', tags: [] });
      setCopyFeedback('Template created successfully!');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  });

  // --- Helper Functions ---
  const callLLM = async (prompt, jsonSchema = null) => {
    try {
      const params = {
        prompt,
        add_context_from_internet: false,
        ...(jsonSchema && { response_json_schema: jsonSchema })
      };
      
      const result = await base44.integrations.Core.InvokeLLM(params);
      return result;
    } catch (err) {
      console.error(err);
      throw new Error("Failed to generate content. Please try again.");
    }
  };

  const saveVersion = async (generationId, versionNumber, promptContent, commandContent, changeDescription, resultData) => {
    try {
      await base44.entities.PromptVersion.create({
        generation_id: generationId,
        version_number: versionNumber,
        prompt_content: promptContent,
        command_content: commandContent || '',
        change_description: changeDescription,
        result_data: resultData
      });
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) {
      setCopyFeedback("No text to copy!");
      setTimeout(() => setCopyFeedback(null), 2000);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      setCopyFeedback("Copy Failed");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  // --- Builder Flow Handlers ---
  const handleGeneratePrompts = async () => {
    if (!userIdea.trim()) return;
    setLoading(true);
    setError(null);
    
    const systemPrompt = `You are an expert AI Programming Instructor. Analyze the user's request and generate 3 distinct "Guess Prompts" that upgrade their idea. Each prompt should be specific, technical, and actionable.`;
    
    const schema = {
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
    };
    
    try {
      const result = await callLLM(`${systemPrompt}\n\nUser Idea: "${userIdea}"`, schema);
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
    
    const systemPrompt = `You are a Senior DevOps & Linux Engineer. Provide 3 distinct "Technical Anchors" (Linux/Terminal Commands) for the selected prompt.`;
    
    const schema = {
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
    };
    
    try {
      const result = await callLLM(`${systemPrompt}\n\nSelected Prompt: "${promptData.content}"`, schema);
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
    
    const systemPrompt = `You are a Prompt Engineering Mentor. Break down the combination of prompt and technical command.`;
    
    const schema = {
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
    };
    
    try {
      const result = await callLLM(
        `${systemPrompt}\n\nPrompt: "${selectedPrompt.content}"\n\nTechnical Command: "${codeData.command}"`,
        schema
      );
      
      setFinalAnalysis(result.breakdown);
      
      // Save to database with version
      const generation = await base44.entities.Generation.create({
        type: 'builder',
        idea: userIdea,
        prompt: selectedPrompt,
        code: codeData,
        result: result.breakdown,
        current_version: 1
      });
      
      setSavedGenerationId(generation.id);
      
      // Save first version
      await saveVersion(
        generation.id,
        1,
        result.breakdown.finalPrompt,
        result.breakdown.finalCommand,
        'Initial version',
        result.breakdown
      );
      
      setStep('result');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Reverse Engineering Handler ---
  const handleReverseEngineer = async () => {
    if (!revCodeInput.trim()) return;
    setLoading(true);
    setError(null);
    setRevResult(null);
    
    const systemPrompt = `You are an expert Reverse Engineering & Prompt Specialist. Generate the *Prompt* that would have created this code.`;
    
    const schema = {
      type: "object",
      properties: {
        analysis: { type: "string" },
        masterPrompt: { type: "string" },
        technicalContext: { type: "string" }
      }
    };
    
    try {
      const result = await callLLM(`${systemPrompt}\n\nCode:\n\n${revCodeInput}`, schema);
      setRevResult(result);
      
      // Save to database
      const generation = await base44.entities.Generation.create({
        type: 'reverse',
        inputCode: revCodeInput,
        generatedPrompt: result.masterPrompt,
        analysis: result.analysis,
        current_version: 1
      });
      
      // Save version
      await saveVersion(
        generation.id,
        1,
        result.masterPrompt,
        revCodeInput,
        'Reverse engineered from code',
        result
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Audit Handler ---
  const handleAuditPrompt = async () => {
    if (!auditInput.trim()) return;
    setLoading(true);
    setError(null);
    setAuditResult(null);

    const systemPrompt = `You are a Strict Prompt Engineering Auditor. Analyze based on: Specificity, Technical Context, Constraints, Verification.`;
    
    const schema = {
      type: "object",
      properties: {
        score: { type: "number" },
        critique: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        optimizedPrompt: { type: "string" }
      }
    };

    try {
      const result = await callLLM(`${systemPrompt}\n\nAudit this prompt:\n\n${auditInput}`, schema);
      setAuditResult(result);
      
      // Save to database
      const generation = await base44.entities.Generation.create({
        type: 'audit',
        idea: auditInput,
        result: result,
        current_version: 1
      });
      
      // Save version
      await saveVersion(
        generation.id,
        1,
        result.optimizedPrompt,
        '',
        'Audited and optimized',
        result
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Template Handlers ---
  const handleUseTemplate = async (template) => {
    // Increment usage count
    await base44.entities.Template.update(template.id, {
      usage_count: (template.usage_count || 0) + 1
    });
    queryClient.invalidateQueries(['templates']);
    
    // Set it as the user idea
    setUserIdea(template.content);
    setActiveTab('builder');
    setStep('input');
    setShowTemplateModal(false);
    setCopyFeedback('Template loaded!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) {
      setError('Please fill in title and content');
      return;
    }
    
    createTemplateMutation.mutate({
      ...newTemplate,
      is_system: false,
      usage_count: 0
    });
  };

  // --- Version History Handlers ---
  const handleRevertVersion = async (version) => {
    try {
      // Update generation to point to this version
      await base44.entities.Generation.update(selectedGeneration.id, {
        current_version: version.version_number,
        result: version.result_data
      });
      
      queryClient.invalidateQueries(['generations']);
      setShowVersionModal(false);
      setCopyFeedback('Reverted to version ' + version.version_number);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      setError('Failed to revert version');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
    const matchesSearch = !templateSearch || 
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description?.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen text-gray-800 font-sans relative overflow-x-hidden" style={bgStyle}>
      
      {/* Floating Orb Navigation */}
      <div className="fixed left-8 bottom-12 z-50 flex flex-col items-center gap-4">
        <div 
          className={`flex flex-col gap-4 transition-all duration-300 ease-in-out ${
            showNavOrbs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => setActiveTab('templates')}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#FECDD3] text-[#E11D48] hover:scale-110 transition-transform flex items-center justify-center group relative"
          >
            <FolderOpen className="w-5 h-5" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Templates</span>
          </button>
          
          <button 
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#FECDD3] text-[#E11D48] hover:scale-110 transition-transform flex items-center justify-center group relative"
          >
            <BookOpen className="w-5 h-5" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Library</span>
          </button>

          <button 
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#FECDD3] text-[#E11D48] hover:scale-110 transition-transform flex items-center justify-center group relative"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Settings</span>
          </button>

          <button 
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#FECDD3] text-[#E11D48] hover:scale-110 transition-transform flex items-center justify-center group relative"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Help</span>
          </button>
        </div>

        <button 
          onClick={() => setShowNavOrbs(!showNavOrbs)}
          className={`w-14 h-14 rounded-full shadow-xl shadow-[#E11D48]/20 flex items-center justify-center transition-all duration-300 hover:scale-105 z-50 ${
            showNavOrbs ? 'bg-gray-800 text-white rotate-180' : 'bg-[#E11D48] text-white rotate-0'
          }`}
        >
          {showNavOrbs ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col relative">
        
        {/* Header */}
        <header className="w-full h-20 flex items-center justify-between px-8 md:px-12 py-4 bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-[#FECDD3]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-lg shadow-lg shadow-[#E11D48]/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800 tracking-tight">PromptMaster AI</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-500 hover:text-[#E11D48] transition-colors cursor-pointer">Documentation</span>
            <button className="px-5 py-2 rounded-full border border-[#E11D48] text-[#E11D48] text-sm font-medium hover:bg-[#FFF1F2] transition-colors">
              Sign In
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="w-full max-w-4xl mx-auto px-4 pb-20 flex flex-col items-center relative z-10 pt-8">
          
          {/* Dotted Line Behind Content */}
          <div className="absolute top-20 bottom-0 left-1/2 w-px border-l-2 border-dotted border-[#FECDD3] -translate-x-1/2 -z-10 h-[90%] opacity-60"></div>

          {/* Tab Switcher */}
          <div className="mb-12 bg-white rounded-full p-1.5 shadow-sm inline-flex items-center gap-1 border border-[#FECDD3] sticky top-24 z-30">
            {[
              { id: 'builder', label: 'Builder', icon: Wand2 },
              { id: 'reverse', label: 'Reverse', icon: Code2 },
              { id: 'audit', label: 'Audit', icon: ClipboardCheck },
              { id: 'templates', label: 'Templates', icon: Bookmark },
              { id: 'history', label: 'Database', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                  ${activeTab === tab.id 
                    ? 'bg-[#E11D48] text-white shadow-md shadow-[#E11D48]/30' 
                    : 'text-gray-500 hover:bg-[#FFF1F2] hover:text-[#E11D48]'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feedback & Error */}
          {error && (
            <div className="w-full max-w-2xl bg-[#FFF1F2] border border-[#E11D48] text-[#9F1239] p-4 rounded-xl mb-6 flex items-center shadow-sm">
              <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0 text-[#E11D48]" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs font-bold hover:underline">Dismiss</button>
            </div>
          )}
          
          {copyFeedback && (
            <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-[#E11D48] text-white px-4 py-2 rounded-xl shadow-lg shadow-[#E11D48]/30 text-sm flex items-center font-medium">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {copyFeedback}
              </div>
            </div>
          )}

          {loading ? <LoadingScreen /> : (
            <>
              {/* BUILDER TAB */}
              {activeTab === 'builder' && (
                <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {step === 'input' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-[#E11D48] border-2 border-white shadow-sm mb-4 relative z-20"></div>
                      
                      <div className="w-full bg-gradient-to-b from-[#FFF1F2] to-white rounded-2xl p-8 border border-[#FECDD3] shadow-[0_4px_20px_rgba(225,29,72,0.1)] mb-4 relative">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What do you want to build?</h2>
                        <p className="text-gray-600">Describe your idea in plain English. I'll help you craft the perfect prompt.</p>
                      </div>

                      <div className="w-full bg-white relative mb-12 group transition-colors rounded-2xl border-2 border-[#FFE4E6] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] focus-within:border-[#E11D48] focus-within:shadow-[0_4px_20px_-2px_rgba(225,29,72,0.15)]">
                        <textarea
                          value={userIdea}
                          onChange={(e) => setUserIdea(e.target.value)}
                          className="w-full h-48 p-6 pb-16 text-gray-700 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm leading-relaxed placeholder:text-gray-400 outline-none"
                          placeholder="e.g., I want a python script that scrapes amazon prices for latest electronics and saves them to a CSV file every morning..."
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-300">{userIdea.length} chars</span>
                          <button 
                            onClick={handleGeneratePrompts}
                            disabled={!userIdea.trim()}
                            className="w-12 h-12 rounded-full bg-[#E11D48] text-white flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[#E11D48]/30"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-12 w-full items-center mb-16 opacity-50">
                        <div className="relative flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mb-3 z-20 ring-4 ring-gray-100"></div>
                          <span className="text-gray-400 font-medium">2. Select Best Variations</span>
                        </div>
                        <div className="relative flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mb-3 z-20 ring-4 ring-gray-100"></div>
                          <span className="text-gray-400 font-medium">3. Refine Technical Output</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-white rounded-xl p-6 border border-[#FECDD3] shadow-sm flex items-start gap-4 z-20">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FFF1F2] flex items-center justify-center text-[#E11D48]">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm mb-1">Pro Tip for Beginners:</h4>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            Be as descriptive as possible. Include the desired output format, programming language, and any specific constraints for the best results.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 'prompts' && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">Choose a Strategy</h2>
                          <p className="text-gray-500 text-sm">Select the framing that best fits your intent.</p>
                        </div>
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
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">Add Technical Context</h2>
                          <p className="text-gray-500 text-sm">"Give AI info only a programmer would know"</p>
                        </div>
                        <button onClick={() => setStep('prompts')} className="text-sm text-gray-400 hover:text-[#E11D48]">Back</button>
                      </div>
                      <div className="grid gap-4">
                        {generatedCodes.map((code, idx) => (
                          <div key={idx} onClick={() => handleFinalize(code)} className="group p-6 bg-white border border-[#FECDD3] hover:border-[#E11D48] rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-[0_4px_20px_-2px_rgba(225,29,72,0.15)]">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-bold text-gray-800 flex items-center"><Terminal className="w-4 h-4 mr-2 text-[#E11D48]" />{code.title}</h3>
                              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#E11D48] transition-colors" />
                            </div>
                            <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-sm mb-3 overflow-x-auto whitespace-pre border border-gray-800">{`> ${code.command}`}</div>
                            <p className="text-xs text-gray-500 flex items-start"><AlertCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />{code.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 'result' && finalAnalysis && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 space-y-8">
                      <div className="bg-gradient-to-r from-[#E11D48] to-[#BE123C] p-1 rounded-2xl shadow-xl shadow-[#E11D48]/30">
                        <div className="bg-white rounded-xl p-8 text-center">
                          <div className="inline-flex items-center justify-center p-2 bg-[#FFF1F2] rounded-full text-[#E11D48] text-sm font-bold mb-4 tracking-wide border border-[#FECDD3]">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            PROMPT MASTERED
                          </div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Deploy</h2>
                          <p className="text-gray-500">Your assets have been generated and saved to the database.</p>
                        </div>
                      </div>

                      <div className="bg-white border border-[#FECDD3] p-8 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFF1F2] rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center"><BookOpen className="w-4 h-4 mr-2" />Analysis</h3>
                        <p className="text-gray-700 leading-relaxed mb-6">{finalAnalysis.whyItWorks}</p>
                        <div className="bg-[#FFF1F2] border border-[#FECDD3] p-4 rounded-xl flex items-start">
                          <Cpu className="w-5 h-5 text-[#E11D48] mr-3 mt-0.5 flex-shrink-0" />
                          <div><span className="text-[#E11D48] font-bold text-xs uppercase block mb-1">Key Lesson</span><p className="text-gray-600 text-sm">{finalAnalysis.keyLesson}</p></div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="relative group">
                          <div className="absolute -top-3 left-4 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">Final Prompt</div>
                          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 pt-8 font-mono text-sm text-gray-700 whitespace-pre-wrap group-hover:border-gray-200 transition-colors shadow-sm">{finalAnalysis.finalPrompt}</div>
                          <button onClick={() => copyToClipboard(finalAnalysis.finalPrompt)} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#E11D48] transition-colors"><Copy className="w-4 h-4" /></button>
                        </div>
                        <div className="relative group">
                          <div className="absolute -top-3 left-4 bg-[#E11D48] text-white text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">Command</div>
                          <div className="bg-gray-900 border-2 border-gray-800 rounded-2xl p-6 pt-8 font-mono text-sm text-cyan-300 shadow-lg shadow-gray-200">{`> ${finalAnalysis.finalCommand}`}</div>
                          <button onClick={() => copyToClipboard(finalAnalysis.finalCommand)} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setStep('input');
                          setUserIdea('');
                          setGeneratedPrompts([]);
                          setGeneratedCodes([]);
                          setSavedGenerationId(null);
                        }}
                        className="w-full py-4 bg-white border-2 border-[#FECDD3] hover:border-[#E11D48] hover:text-[#E11D48] text-gray-500 rounded-xl font-bold flex items-center justify-center transition-all"
                      >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Start New Prompt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* REVERSE TAB */}
              {activeTab === 'reverse' && (
                <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-full bg-white rounded-2xl p-8 border border-[#FECDD3] shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg text-[#BE123C]"><Code2 className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-bold text-gray-800">Reverse Engineer Code</h2>
                    </div>
                    <p className="text-gray-500 ml-12">Paste code below to generate the "Master Prompt" that created it.</p>
                  </div>

                  {!revResult ? (
                    <div className="w-full relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#E11D48] to-[#FDA4AF] rounded-[20px] blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                      <div className="relative w-full bg-white rounded-2xl p-1">
                        <textarea
                          value={revCodeInput}
                          onChange={(e) => setRevCodeInput(e.target.value)}
                          placeholder="// Paste your code snippet here..."
                          className="w-full h-64 p-6 text-gray-700 bg-white rounded-xl border-none resize-none font-mono text-xs leading-relaxed focus:ring-0"
                        />
                      </div>
                      <button
                        onClick={handleReverseEngineer}
                        disabled={!revCodeInput.trim()}
                        className="mt-6 w-full py-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-[#E11D48]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Reverse Engineer & Log
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-6">
                      <div className="bg-white border-l-4 border-[#E11D48] p-6 rounded-r-xl shadow-sm border-t border-r border-b border-[#FECDD3]/50">
                        <h3 className="text-xs font-bold text-[#E11D48] uppercase tracking-widest mb-2 flex items-center"><Search className="w-3 h-3 mr-2" /> Analysis</h3>
                        <p className="text-gray-700 text-sm mb-4">{revResult.analysis}</p>
                        <div className="bg-[#FFF1F2] p-3 rounded-lg border border-[#FECDD3]">
                          <span className="text-[#BE123C] font-bold text-[10px] uppercase block mb-1">Technical Context</span>
                          <p className="text-gray-600 text-xs font-mono">{revResult.technicalContext}</p>
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="absolute -top-3 left-4 bg-[#E11D48] text-white text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">Master Prompt</div>
                        <div className="bg-gray-900 rounded-2xl p-6 pt-8 font-mono text-sm text-[#FDA4AF] whitespace-pre-wrap shadow-xl">{revResult.masterPrompt}</div>
                        <button onClick={() => copyToClipboard(revResult.masterPrompt)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"><Copy className="w-4 h-4" /></button>
                      </div>
                      
                      <button 
                        onClick={() => { setRevCodeInput(''); setRevResult(null); }}
                        className="w-full py-3 bg-white border border-[#FECDD3] hover:border-[#E11D48] hover:text-[#E11D48] text-gray-600 rounded-xl font-semibold flex items-center justify-center transition-all"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Analyze New Code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIT TAB */}
              {activeTab === 'audit' && (
                <div className="w-full max-w-3xl flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-full bg-white rounded-2xl p-8 border border-[#FECDD3] shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg text-[#BE123C]"><ClipboardCheck className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-bold text-gray-800">Prompt Auditor</h2>
                    </div>
                    <p className="text-gray-500 ml-12">Get a professional grade (0-100) and specific feedback to improve your prompts.</p>
                  </div>

                  {!auditResult ? (
                    <div className="w-full relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-[#E11D48] rounded-[20px] blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                      <div className="relative w-full bg-white rounded-2xl p-1">
                        <textarea
                          value={auditInput}
                          onChange={(e) => setAuditInput(e.target.value)}
                          placeholder="Paste your prompt here to audit..."
                          className="w-full h-64 p-6 text-gray-700 bg-white rounded-xl border-none resize-none font-mono text-sm leading-relaxed focus:ring-0"
                        />
                      </div>
                      <button
                        onClick={handleAuditPrompt}
                        disabled={!auditInput.trim()}
                        className="mt-6 w-full py-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-[#E11D48]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Audit & Optimize
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-8">
                      <div className="bg-white rounded-2xl p-8 border border-[#FECDD3] flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="#FFF1F2" strokeWidth="12" fill="none" />
                            <circle 
                              cx="64" cy="64" r="60" 
                              stroke={auditResult.score > 80 ? "#10B981" : auditResult.score > 50 ? "#F59E0B" : "#EF4444"} 
                              strokeWidth="12" 
                              fill="none" 
                              strokeDasharray="377" 
                              strokeDashoffset={377 - (377 * auditResult.score) / 100} 
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-bold text-gray-800">{auditResult.score}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Score</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">Audit Report</h3>
                          <p className="text-gray-600 mb-4">{auditResult.critique}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="flex items-center text-xs font-bold text-green-600 uppercase mb-2"><ThumbsUp className="w-3 h-3 mr-1" /> Strengths</span>
                              <ul className="text-xs text-gray-500 list-disc list-inside">{auditResult.strengths?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                            </div>
                            <div>
                              <span className="flex items-center text-xs font-bold text-red-500 uppercase mb-2"><ThumbsDown className="w-3 h-3 mr-1" /> Weaknesses</span>
                              <ul className="text-xs text-gray-500 list-disc list-inside">{auditResult.weaknesses?.map((w,i) => <li key={i}>{w}</li>)}</ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative group animate-in slide-in-from-bottom-4 fade-in duration-700">
                        <div className="absolute -top-3 left-4 bg-[#E11D48] text-white text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase flex items-center gap-1">
                          <Wand2 className="w-3 h-3" /> Optimized Version
                        </div>
                        <div className="bg-gray-900 rounded-2xl p-6 pt-8 font-mono text-sm text-[#FDA4AF] whitespace-pre-wrap shadow-xl border border-gray-800">
                          {auditResult.optimizedPrompt}
                        </div>
                        <button onClick={() => copyToClipboard(auditResult.optimizedPrompt)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => { setAuditInput(''); setAuditResult(null); }}
                        className="w-full py-3 bg-white border border-[#FECDD3] hover:border-[#E11D48] hover:text-[#E11D48] text-gray-600 rounded-xl font-semibold flex items-center justify-center transition-all"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Audit Another Prompt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TEMPLATES TAB */}
              {activeTab === 'templates' && (
                <div className="w-full max-w-4xl animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg text-[#E11D48]"><Bookmark className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-bold text-gray-800">Prompt Templates</h2>
                    </div>
                    <Button
                      onClick={() => setShowCreateTemplate(true)}
                      className="bg-[#E11D48] hover:bg-[#BE123C] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <Input
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={templateCategory} onValueChange={setTemplateCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
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

                  {/* Create Template Form */}
                  {showCreateTemplate && (
                    <div className="mb-8 p-6 bg-white border-2 border-[#E11D48] rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Create New Template</h3>
                        <button onClick={() => setShowCreateTemplate(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <Input
                          placeholder="Template Title"
                          value={newTemplate.title}
                          onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                        />
                        <Input
                          placeholder="Brief Description"
                          value={newTemplate.description}
                          onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                        />
                        <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate({...newTemplate, category: v})}>
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
                        <Textarea
                          placeholder="Template Content (use {{variable}} for placeholders)"
                          value={newTemplate.content}
                          onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                          className="h-40 font-mono text-sm"
                        />
                        <Input
                          placeholder="Tags (comma-separated)"
                          value={newTemplate.tags?.join(', ') || ''}
                          onChange={(e) => setNewTemplate({...newTemplate, tags: e.target.value.split(',').map(t => t.trim())})}
                        />
                        <Button onClick={handleCreateTemplate} className="w-full bg-[#E11D48] hover:bg-[#BE123C]">
                          Save Template
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Templates Grid */}
                  {templatesLoading ? (
                    <LoadingScreen />
                  ) : filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                      <Bookmark className="w-16 h-16 mb-4 opacity-50 text-[#FECDD3]" />
                      <p className="text-lg font-medium">No templates found</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {filteredTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => handleUseTemplate(template)}
                          onCopy={copyToClipboard}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="w-full max-w-4xl animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FFF1F2] rounded-lg text-[#E11D48]"><Database className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-bold text-gray-800">Prompt Database</h2>
                    </div>
                    <span className="px-3 py-1 bg-[#FFF1F2] rounded-full text-xs font-bold text-[#E11D48]">{historyItems.length} records</span>
                  </div>

                  {historyLoading ? (
                    <LoadingScreen />
                  ) : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                      <History className="w-16 h-16 mb-4 opacity-50 text-[#FECDD3]" />
                      <p className="text-lg font-medium">No records found yet.</p>
                      <button onClick={() => setActiveTab('builder')} className="mt-4 text-[#E11D48] font-medium hover:underline">Create your first prompt</button>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {historyItems.map((item) => (
                        <div key={item.id} className="bg-white border border-[#FECDD3] rounded-2xl p-6 shadow-sm hover:shadow-[0_4px_15px_-3px_rgba(225,29,72,0.15)] transition-all relative overflow-hidden group">
                          
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded
                                  ${item.type === 'reverse' ? 'bg-[#FFF1F2] text-[#BE123C]' : 
                                    item.type === 'audit' ? 'bg-teal-50 text-teal-600' : 'bg-[#FFF1F2] text-[#E11D48]'}`}>
                                  {item.type === 'reverse' ? 'Reverse Engineer' : item.type === 'audit' ? 'Prompt Audit' : 'Prompt Builder'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(item.created_date).toLocaleDateString()} {new Date(item.created_date).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  v{item.current_version || 1}
                                </Badge>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg line-clamp-1">
                                {item.type === 'audit' ? 'Prompt Optimization Log' : item.type === 'reverse' ? 'Code Analysis Log' : item.idea}
                              </h3>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedGeneration(item);
                                setShowVersionModal(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <GitBranch className="w-3 h-3" />
                              History
                            </Button>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-[#FFF1F2]/50 rounded-xl p-4 border border-[#FECDD3]/50">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                {item.type === 'reverse' ? 'Source Code' : 'Original Input'}
                              </span>
                              <p className="text-sm text-gray-600 font-mono line-clamp-3 leading-relaxed">
                                {item.type === 'reverse' ? item.inputCode : item.idea}
                              </p>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                {item.type === 'reverse' ? 'Generated Prompt' : item.type === 'audit' ? 'Optimized Version' : 'Final Prompt'}
                              </span>
                              <p className="text-sm text-[#FDA4AF] font-mono line-clamp-3 leading-relaxed">
                                {item.type === 'reverse' ? item.generatedPrompt : item.type === 'audit' ? item.result?.optimizedPrompt : item.result?.finalPrompt}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-4 border-t border-[#FFF1F2]">
                            <button 
                              onClick={() => copyToClipboard(
                                item.type === 'reverse' ? item.generatedPrompt : 
                                item.type === 'audit' ? item.result?.optimizedPrompt : 
                                item.result?.finalPrompt
                              )}
                              className="px-4 py-2 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] text-xs font-bold rounded-lg flex items-center transition-colors"
                            >
                              <Copy className="w-3 h-3 mr-2" />
                              Copy Result
                            </button>
                            
                            {item.type === 'builder' && (
                              <button 
                                onClick={() => copyToClipboard(item.result?.finalCommand)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg flex items-center transition-colors"
                              >
                                <Terminal className="w-3 h-3 mr-2" />
                                Copy Command
                              </button>
                            )}

                            <button 
                              onClick={() => copyToClipboard(item.type === 'reverse' ? item.inputCode : item.idea)}
                              className="ml-auto px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold flex items-center transition-colors"
                            >
                              <FileCode className="w-3 h-3 mr-2" />
                              Copy Input
                            </button>
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

        {/* Footer */}
        <footer className="w-full py-10 flex flex-col items-center justify-center gap-4 text-center mt-auto border-t border-[#FECDD3]/30 bg-white/40 backdrop-blur-sm">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">© 2024 PROMPTMASTER AI. BUILT FOR THE FUTURE OF ENGINEERING.</p>
          <div className="flex items-center gap-8">
            <a className="text-[10px] font-bold text-gray-400 hover:text-[#E11D48] tracking-widest uppercase transition-colors cursor-pointer">Twitter</a>
            <a className="text-[10px] font-bold text-gray-400 hover:text-[#E11D48] tracking-widest uppercase transition-colors cursor-pointer">Discord</a>
            <a className="text-[10px] font-bold text-gray-400 hover:text-[#E11D48] tracking-widest uppercase transition-colors cursor-pointer">Github</a>
          </div>
        </footer>
      </div>

      {/* Version History Modal */}
      {showVersionModal && selectedGeneration && (
        <VersionHistoryModal
          generation={selectedGeneration}
          onClose={() => {
            setShowVersionModal(false);
            setSelectedGeneration(null);
          }}
          onRevert={handleRevertVersion}
        />
      )}
    </div>
  );
}