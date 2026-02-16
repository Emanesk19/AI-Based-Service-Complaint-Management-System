import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, User as UserIcon } from 'lucide-react';
import { Card } from './ui/Card';

const StatusBadge = ({ status }) => {
  const styles = {
    New: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Pending: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
    Closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Reopened: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.New}`}>
      {status}
    </span>
  );
};

export default function TicketTable({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="p-12 text-center glass rounded-2xl">
        <p className="text-slate-500">No active tickets found.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
            <th className="px-6 py-4">Ticket</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Created By</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">#TKT-{ticket.id}</p>
                </div>
              </td>
              <td className="px-6 py-5">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-6 py-5">
                <span className="text-sm text-slate-400">{ticket.category}</span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <UserIcon size={12} className="text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-300">{ticket.user?.name || 'User'}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all inline-block"
                >
                  <Eye size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
