import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, X, Users, Mail, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ShareModal({ generation, onShare, onClose }) {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [shareType, setShareType] = useState('view');
  const [workspaceName, setWorkspaceName] = useState('');

  const addEmail = () => {
    if (currentEmail.trim() && currentEmail.includes('@')) {
      setEmails([...emails, currentEmail.trim()]);
      setCurrentEmail('');
    }
  };

  const removeEmail = (email) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleShare = () => {
    onShare({
      generation_id: generation.id,
      shared_with: emails,
      share_type: shareType,
      workspace_name: workspaceName
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFF1F2] rounded-lg">
              <Share2 className="w-6 h-6 text-[#E11D48]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Share Prompt</h2>
              <p className="text-sm text-gray-500">Collaborate with your team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Workspace Name (Optional)
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., Marketing Team, Dev Squad"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Share With
            </label>
            <div className="flex gap-2">
              <Input
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                placeholder="teammate@company.com"
                type="email"
              />
              <Button onClick={addEmail} size="icon" className="bg-[#E11D48] hover:bg-[#BE123C]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                  <Mail className="w-3 h-3 mr-1" />
                  {email}
                  <button onClick={() => removeEmail(email)} className="ml-2 hover:bg-gray-200 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Permission Level
            </label>
            <Select value={shareType} onValueChange={setShareType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="comment">Can Comment</SelectItem>
                <SelectItem value="edit">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleShare}
            disabled={emails.length === 0}
            className="w-full bg-[#E11D48] hover:bg-[#BE123C] text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Share with {emails.length} {emails.length === 1 ? 'person' : 'people'}
          </Button>
        </div>
      </div>
    </div>
  );
}