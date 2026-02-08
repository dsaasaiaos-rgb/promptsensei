import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentSection({ comments, onAddComment, generationId, versionNumber, currentUser }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment({
        generation_id: generationId,
        version_number: versionNumber,
        comment_text: newComment,
        author_email: currentUser.email,
        author_name: currentUser.full_name
      });
      setNewComment('');
    }
  };

  return (
    <div className="bg-white border border-[#FECDD3] rounded-xl p-6 space-y-4">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#E11D48]" />
        Comments & Feedback ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-[#FFF1F2]/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E11D48] flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{comment.author_name}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_date), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.comment_text}</p>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No comments yet. Be the first to share feedback!</p>
        )}
      </div>

      {/* Add Comment */}
      <div className="pt-3 border-t border-[#FECDD3]">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts or feedback..."
          className="mb-2"
          rows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="bg-[#E11D48] hover:bg-[#BE123C] text-white"
          size="sm"
        >
          <Send className="w-3 h-3 mr-2" />
          Post Comment
        </Button>
      </div>
    </div>
  );
}