import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb, 
  Target, 
  Eye,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function CoachingFeedback({ analysis }) {
  if (!analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return AlertTriangle;
    return AlertCircle;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white border-2 border-[#FECDD3] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="36" stroke="#FFF1F2" strokeWidth="8" fill="none" />
              <circle 
                cx="40" cy="40" r="36" 
                stroke={analysis.overall_score >= 80 ? "#10B981" : analysis.overall_score >= 60 ? "#F59E0B" : "#EF4444"} 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="226" 
                strokeDashoffset={226 - (226 * analysis.overall_score) / 100} 
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-gray-800">{analysis.overall_score}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Prompt Quality Score</h3>
            <p className="text-sm text-gray-600">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Specificity */}
        <div className={`p-4 rounded-xl border ${getScoreColor(analysis.specificity_score)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-bold text-sm">Specificity</span>
            </div>
            <span className="text-xl font-bold">{analysis.specificity_score}</span>
          </div>
          <p className="text-xs">{analysis.specificity_feedback}</p>
        </div>

        {/* Clarity */}
        <div className={`p-4 rounded-xl border ${getScoreColor(analysis.clarity_score)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-bold text-sm">Clarity</span>
            </div>
            <span className="text-xl font-bold">{analysis.clarity_score}</span>
          </div>
          <p className="text-xs">{analysis.clarity_feedback}</p>
        </div>

        {/* Structure */}
        <div className={`p-4 rounded-xl border ${getScoreColor(analysis.structure_score)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold text-sm">Structure</span>
            </div>
            <span className="text-xl font-bold">{analysis.structure_score}</span>
          </div>
          <p className="text-xs">{analysis.structure_feedback}</p>
        </div>

        {/* Bias Detection */}
        <div className={`p-4 rounded-xl border ${getScoreColor(analysis.bias_score)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-bold text-sm">Bias-Free</span>
            </div>
            <span className="text-xl font-bold">{analysis.bias_score}</span>
          </div>
          <p className="text-xs">{analysis.bias_feedback}</p>
        </div>
      </div>

      {/* Detailed Suggestions */}
      <div className="bg-white border border-[#FECDD3] rounded-xl p-6 space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#E11D48]" />
          AI Coaching Insights
        </h4>

        {/* Improvements */}
        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Recommended Improvements</span>
            <ul className="space-y-2">
              {analysis.improvements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#FFF1F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#E11D48]">{idx + 1}</span>
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Biases Detected */}
        {analysis.biases_detected && analysis.biases_detected.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#FECDD3]">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Potential Biases Detected
            </span>
            <ul className="space-y-1">
              {analysis.biases_detected.map((bias, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                  {bias}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Example Rewrite */}
        {analysis.example_rewrite && (
          <div className="space-y-2 pt-3 border-t border-[#FECDD3]">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Example High-Quality Version</span>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-green-300 font-mono whitespace-pre-wrap leading-relaxed">
                {analysis.example_rewrite}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}