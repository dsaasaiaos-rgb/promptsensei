import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Share2, UserPlus, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ShareWorkspaceModal({ item, onShare, onClose }) {
  const [email, setEmail] = useState('');
  const [sharedWith, setSharedWith] = useState(item.shared_with || []);

  const handleAdd = () => {
    if (email && !sharedWith.includes(email)) {
      const updated = [...sharedWith, email];
      setSharedWith(updated);
      setEmail('');
    }
  };

  const handleRemove = (emailToRemove) => {
    setSharedWith(sharedWith.filter(e => e !== emailToRemove));
  };

  const handleSave = () => {
    onShare(sharedWith);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#E11D48]" />
            <h3 className="text-lg font-bold text-gray-800">Share Workspace</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Share "{item.title}" with team members for collaborative editing.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} size="sm">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {sharedWith.length > 0 && (
          <div className="space-y-2 mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase">Shared With</span>
            {sharedWith.map((email) => (
              <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {email}
                </span>
                <button onClick={() => handleRemove(email)} className="text-xs text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSave} className="w-full bg-[#E11D48] hover:bg-[#BE123C]">
          Save & Share
        </Button>
      </div>
    </div>
  );
}