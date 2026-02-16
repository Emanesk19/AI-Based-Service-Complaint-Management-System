import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import api from '../services/api';

export default function CreateTicketModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/tickets', formData);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
        setFormData({ title: '', description: '', category: 'General', priority: 'Medium' });
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.message || 
                       err.response?.data?.message || 
                       'Failed to create ticket. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl relative"
          >
            <Card className="p-0 overflow-hidden border-white/10 shadow-2xl shadow-brand-500/10">
              {submitted ? (
                <div className="p-12 text-center space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h2 className="text-2xl font-bold font-outfit">Ticket Created!</h2>
                  <p className="text-slate-400">Your request has been filed successfully. Our team will review it shortly.</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between premium-gradient">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <AlertCircle className="text-white" size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-white font-outfit tracking-tight">New Service Request</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <Input 
                      label="Title"
                      placeholder="Brief summary of the issue"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-400 ml-1">Description</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all h-32 resize-none"
                        placeholder="Provide detailed information about your request..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400 ml-1">Category</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option className="bg-slate-900">General</option>
                          <option className="bg-slate-900">Software</option>
                          <option className="bg-slate-900">Hardware</option>
                          <option className="bg-slate-900">Access</option>
                          <option className="bg-slate-900">Billing</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400 ml-1">Priority</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        >
                          <option className="bg-slate-900">Low</option>
                          <option className="bg-slate-900">Medium</option>
                          <option className="bg-slate-900">High</option>
                        </select>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{error}</p>}

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="secondary" className="flex-1 py-4" onClick={onClose}>Cancel</Button>
                      <Button type="submit" className="flex-[2] py-4 gap-2" disabled={loading}>
                        <Send size={18} />
                        {loading ? 'Submitting...' : 'Submit Ticket'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
