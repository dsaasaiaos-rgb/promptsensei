import React from 'react';
import { TrendingUp, Users, Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function UsageAnalytics({ templates }) {
  const sortedByUsage = [...templates].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
  const topTemplates = sortedByUsage.slice(0, 5);
  const totalUsage = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);
  const avgUsage = templates.length > 0 ? Math.round(totalUsage / templates.length) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Total Templates</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{templates.length}</p>
        </div>

        <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Total Usage</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalUsage}</p>
        </div>

        <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Avg Usage</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{avgUsage}</p>
        </div>
      </div>

      {/* Top Templates */}
      <div className="bg-white border border-[#FECDD3] rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#E11D48]" />
          Most Used Templates
        </h3>
        <div className="space-y-3">
          {topTemplates.map((template, idx) => (
            <div key={template.id} className="flex items-center justify-between p-3 bg-[#FFF1F2]/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-800">{template.title}</p>
                  <p className="text-xs text-gray-500">{template.category.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <Badge className="bg-[#E11D48] text-white">
                {template.usage_count || 0} uses
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}