import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Clock, User, FileText, Zap, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (action.includes('DELETE')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-slate-400 bg-white/5 border-white/5';
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">Audit Trail</h1>
        <p className="text-slate-400 mt-1">Full immutable history of system actions and data mutations</p>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search logs by action, user, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500/50 transition-all text-slate-200"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center glass rounded-3xl opacity-50">
            <History size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-medium">No activity logs found matching your criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.id} 
              className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-400 transition-colors shrink-0">
                    {log.action.includes('TICKET') ? <FileText size={24} /> : 
                     log.action.includes('USER') ? <User size={24} /> : <Zap size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-bold text-slate-200">{log.user?.name}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{log.details}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-right">
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Timestamp</p>
                    <p className="text-sm text-slate-300 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertCircle size={18} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
