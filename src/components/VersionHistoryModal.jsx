import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Clock, GitBranch, ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function VersionHistoryModal({ generation, onClose, onRevert }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState([null, null]);

  useEffect(() => {
    loadVersions();
  }, [generation]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PromptVersion.filter(
        { generation_id: generation.id },
        '-version_number'
      );
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSelect = (version) => {
    if (!compareVersions[0]) {
      setCompareVersions([version, null]);
    } else if (!compareVersions[1]) {
      setCompareVersions([compareVersions[0], version]);
    } else {
      setCompareVersions([version, null]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#FECDD3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFF1F2] rounded-lg">
              <GitBranch className="w-5 h-5 text-[#E11D48]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Version History</h2>
              <p className="text-sm text-gray-500">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? 'bg-[#FFF1F2] border-[#E11D48] text-[#E11D48]' : ''}
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E11D48]"></div>
            </div>
          ) : compareMode && compareVersions[0] && compareVersions[1] ? (
            <div className="space-y-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareVersions([null, null])}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Select Different Versions
              </Button>
              
              <div className="grid md:grid-cols-2 gap-6">
                {compareVersions.map((version, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="bg-[#FFF1F2] p-4 rounded-xl border border-[#FECDD3]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#E11D48]">
                          VERSION {version.version_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(version.created_date), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{version.change_description}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Prompt</span>
                      <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                        {version.prompt_content}
                      </p>
                    </div>

                    {version.command_content && (
                      <div className="bg-gray-900 rounded-xl p-4">
                        <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">Command</span>
                        <p className="text-sm text-cyan-300 font-mono">
                          {version.command_content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-5 rounded-xl border transition-all ${
                    compareMode
                      ? compareVersions.includes(version)
                        ? 'bg-[#FFF1F2] border-[#E11D48]'
                        : 'bg-white border-[#FECDD3] hover:border-[#E11D48] cursor-pointer'
                      : 'bg-white border-[#FECDD3]'
                  }`}
                  onClick={() => compareMode && handleCompareSelect(version)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFF1F2] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#E11D48]">v{version.version_number}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(version.created_date), 'MMM d, yyyy HH:mm')}
                          </span>
                          {version.version_number === generation.current_version && (
                            <span className="bg-[#E11D48] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 font-medium">
                          {version.change_description || 'Initial version'}
                        </p>
                      </div>
                    </div>
                    
                    {!compareMode && version.version_number !== generation.current_version && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRevert(version)}
                        className="text-xs"
                      >
                        Revert
                      </Button>
                    )}
                  </div>

                  <div className="ml-13 space-y-2">
                    <details className="group">
                      <summary className="text-xs text-[#E11D48] font-medium cursor-pointer hover:underline list-none">
                        View Full Content
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prompt</span>
                          <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                            {version.prompt_content}
                          </p>
                        </div>
                        {version.command_content && (
                          <div className="bg-gray-900 p-3 rounded-lg">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Command</span>
                            <p className="text-xs text-cyan-300 font-mono">
                              {version.command_content}
                            </p>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}