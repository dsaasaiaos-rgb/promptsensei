import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Star, Calendar } from 'lucide-react';

export default function TemplateAnalytics({ templates }) {
  const totalUsage = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);
  const topTemplates = [...templates].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5);
  const categoryStats = templates.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#E11D48]" />
        Usage Analytics
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#FECDD3] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#E11D48]">{templates.length}</div>
          <div className="text-xs text-gray-500">Total Templates</div>
        </div>
        <div className="bg-white border border-[#FECDD3] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#E11D48]">{totalUsage}</div>
          <div className="text-xs text-gray-500">Total Uses</div>
        </div>
        <div className="bg-white border border-[#FECDD3] rounded-xl p-4">
          <div className="text-2xl font-bold text-[#E11D48]">{Math.round(totalUsage / templates.length) || 0}</div>
          <div className="text-xs text-gray-500">Avg Uses</div>
        </div>
      </div>

      {/* Top Templates */}
      <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
        <h4 className="font-bold text-sm text-gray-600 mb-4 uppercase tracking-wide">Most Popular Templates</h4>
        <div className="space-y-3">
          {topTemplates.map((template, idx) => (
            <div key={template.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#FFF1F2] flex items-center justify-center text-xs font-bold text-[#E11D48]">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-medium text-sm text-gray-800">{template.title}</div>
                  <div className="text-xs text-gray-500">{template.category.replace(/_/g, ' ')}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {template.usage_count || 0} uses
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
        <h4 className="font-bold text-sm text-gray-600 mb-4 uppercase tracking-wide">Templates by Category</h4>
        <div className="space-y-2">
          {Object.entries(categoryStats).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 capitalize">{cat.replace(/_/g, ' ')}</span>
              <span className="font-bold text-[#E11D48]">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}