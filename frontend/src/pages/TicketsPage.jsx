import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import TicketTable from '../components/TicketTable';
import { Button } from '../components/ui/Button';
import CreateTicketModal from '../components/CreateTicketModal';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Fetching all tickets (or filtered if backend supports)
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.id.toString().includes(search);
    const matchesStatus = status === 'All' || t.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">Service Tickets</h1>
          <p className="text-slate-400 mt-1">Manage, track, and resolve system issues</p>
        </div>
        <Button className="gap-2 px-6" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create Ticket
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-xl">
            <Filter size={16} className="text-slate-500" />
            <select 
              className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <TicketTable tickets={filteredTickets} />
          
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-slate-500">
              Showing <span className="text-slate-300 font-medium">{filteredTickets.length}</span> of <span className="text-slate-300 font-medium">{tickets.length}</span> tickets
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="w-10 p-0" disabled><ChevronLeft size={18} /></Button>
              <Button variant="secondary" size="sm" className="w-10 p-0" disabled><ChevronRight size={18} /></Button>
            </div>
          </div>
        </div>
      )}

      <CreateTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTickets}
      />
    </div>
  );
}
