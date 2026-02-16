import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User as UserIcon, 
  Shield, 
  MessageSquare, 
  Send, 
  AlertCircle,
  CheckCircle2,
  Tag,
  Brain,
  Zap,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchDetails = async () => {
    try {
      const [ticketRes, commentRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/comments/ticket/${id}`)
      ]);
      setTicket(ticketRes.data);
      setComments(commentRes.data);
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/comments', { ticketId: Number(id), content: commentInput });
      setCommentInput('');
      fetchDetails(); // Refresh to show new comment
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put('/tickets/status', { ticketId: Number(id), status: newStatus });
      fetchDetails();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (!ticket) return (
    <div className="p-12 text-center glass rounded-3xl">
      <AlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
      <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
      <Button variant="secondary" className="mt-6" onClick={() => navigate('/tickets')}>
        Back to Tickets
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/tickets')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Ticket #{ticket.id}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {ticket.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white font-outfit tracking-tight">{ticket.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer pr-10"
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option className="bg-slate-900">New</option>
            <option className="bg-slate-900">In Progress</option>
            <option className="bg-slate-900">Pending</option>
            <option className="bg-slate-900">Resolved</option>
            <option className="bg-slate-900">Reopened</option>
          </select>
          <Button variant="secondary" className="p-2.5"><MoreVertical size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Comments */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 space-y-6">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-brand-400" /> Description
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={16} /> Created: {new Date(ticket.createdAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Tag size={16} /> Category: <span className="text-slate-200 font-medium">{ticket.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Shield size={16} /> Priority: 
                <span className={`font-bold ${
                  ticket.priority === 'High' ? 'text-red-400' : ticket.priority === 'Medium' ? 'text-amber-400' : 'text-green-400'
                }`}>{ticket.priority}</span>
              </div>
            </div>
          </Card>

          {/* Conversation */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-2 text-white">
              <MessageSquare size={20} className="text-brand-400" /> Conversation
            </h2>
            
            <div className="glass rounded-3xl overflow-hidden flex flex-col h-[500px]">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
                {comments.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    No replies yet. Start the conversation below.
                  </div>
                ) : (
                  comments.map((comment, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={comment.id} 
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/5 shrink-0">
                        <UserIcon size={20} />
                      </div>
                      <div className="space-y-1 pb-2 border-b border-white/5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{comment.user?.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleSendComment} className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                <input 
                  type="text"
                  placeholder="Type your message..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-brand-500/50 transition-all text-slate-200"
                />
                <Button type="submit" disabled={sending} className="gap-2">
                  <Send size={18} /> {sending ? '...' : 'Send'}
                </Button>
              </form>
            </div>
          </section>
        </div>

        {/* Right Column: AI Insights & Participants */}
        <div className="space-y-6">
          <Card className="p-6 premium-gradient-alt border-brand-500/20">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Brain size={20} className="text-white" /> AI Context
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">Detected Sentiment</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {ticket.metadata?.sentiment?.includes('Angry') ? '😡' : 
                     ticket.metadata?.sentiment?.includes('Frustrated') ? '😒' : 
                     ticket.metadata?.sentiment?.includes('Neutral') ? '😐' : '😊'}
                  </span>
                  <span className="font-bold text-white">{ticket.metadata?.sentiment || 'Analyzing...'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">SLA Risk Level</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Resolution Probability</span>
                  <span className="text-sm font-bold text-white">84%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-green-500 w-[84%]" />
                </div>
              </div>

              {ticket.metadata?.aiSuggestedReply && (
                <div className="p-4 rounded-2xl bg-brand-500/20 border border-brand-500/30">
                  <div className="flex items-center gap-2 text-brand-300 font-bold text-xs mb-2 uppercase tracking-widest">
                    <Zap size={14} fill="currentColor" /> Smart Suggestion
                  </div>
                  <p className="text-xs text-brand-100 leading-relaxed italic italic">"{ticket.metadata.aiSuggestedReply}"</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Participants</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{ticket.user?.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Requester</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{ticket.agent?.name || 'Waiting for assignment'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Assigned Agent</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-red-500/5 border-red-500/10">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <div className="text-xs">
                <p className="font-bold">Urgent Attention Needed</p>
                <p className="opacity-70 mt-0.5">SLA expires in 4 hours</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
