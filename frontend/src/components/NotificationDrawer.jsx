import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Alert': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'Success': return <CheckCircle className="text-green-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[400px] glass z-[60] shadow-2xl flex flex-col border-l border-white/10"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 premium-gradient">
              <div className="flex items-center gap-3 text-white">
                <Bell size={24} />
                <h2 className="text-xl font-bold font-outfit">Notifications</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Refreshing Alerts</p>
                </div>
              )}

              {!loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
                    <Bell size={40} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-300">Quiet for now...</p>
                    <p className="text-sm text-slate-500">We'll alert you when something happens.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative p-5 rounded-3xl border transition-all ${
                      notif.isRead 
                        ? 'bg-white/5 border-white/5 opacity-60' 
                        : 'bg-white/10 border-white/10 shadow-lg shadow-black/20'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.isRead ? 'bg-white/5' : 'bg-brand-500/10'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${notif.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                        
                        <div className="flex gap-3 pt-3">
                          {!notif.isRead && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:text-brand-300 flex items-center gap-1.5"
                            >
                              <Check size={12} /> Mark Read
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-400 flex items-center gap-1.5"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Real-time System Monitoring Active
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
