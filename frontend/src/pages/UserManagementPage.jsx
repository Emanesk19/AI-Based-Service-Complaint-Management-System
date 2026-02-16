import React, { useState, useEffect } from 'react';
import { User, Shield, ShieldCheck, Mail, Calendar, Search, MoreVertical, Ban, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleUpdate = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      console.error('Role update failed:', err);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">User Management</h1>
        <p className="text-slate-400 mt-1">Manage platform access, roles, and permissions</p>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500/50 transition-all text-slate-200"
          />
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i}><td colSpan="5" className="px-6 py-4 h-16 animate-pulse bg-white/5" /></tr>
              ))
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <ShieldCheck size={16} className="text-brand-400" />
                    ) : user.role === 'agent' ? (
                      <Shield size={16} className="text-blue-400" />
                    ) : (
                      <User size={16} className="text-slate-500" />
                    )}
                    <select 
                      className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer capitalize"
                      value={user.role}
                      onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                    >
                      <option value="user" className="bg-slate-900">User</option>
                      <option value="agent" className="bg-slate-900">Agent</option>
                      <option value="admin" className="bg-slate-900">Admin</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleStatusToggle(user.id, user.status || 'active')}
                      className={`p-2 rounded-lg transition-all ${
                        user.status === 'inactive' 
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                      title={user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                    >
                      {user.status === 'inactive' ? <CheckCircle size={18} /> : <Ban size={18} />}
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
