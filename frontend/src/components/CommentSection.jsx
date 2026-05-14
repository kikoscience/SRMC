import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../config';

const CommentSection = ({ requestId, userName, userRole }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    fetchComments();
    const interval = setInterval(fetchComments, 5000); // Polling for new comments
    return () => clearInterval(interval);
  }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: userName,
          user_role: userRole,
          comment: newComment
        })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      } else {
        const errorData = await res.json();
        console.error('Failed to save comment:', errorData);
      }
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]/50 rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-5 h-5 text-it-cyan" />
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Operational Discussion</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={c.id}
              className={`flex flex-col gap-1 ${c.user_name === userName ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">{c.user_name}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/20 uppercase font-bold">{c.user_role}</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-xs ${
                c.user_name === userName 
                ? 'bg-it-cyan text-black font-medium rounded-tr-none' 
                : 'bg-white/10 text-white/80 rounded-tl-none'
              }`}>
                {c.comment}
              </div>
              <span className="text-[8px] text-white/10 mt-1">{new Date(c.created_at).toLocaleTimeString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-12">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2" />
            <p className="text-[10px] uppercase tracking-widest font-black">No messages yet</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-white/5">
        <div className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-it-cyan/50 transition-all pr-12"
          />
          <button
            type="submit"
            disabled={isLoading || !newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-it-cyan hover:bg-it-cyan/10 rounded-lg transition-all disabled:opacity-20"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
