import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import api from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import TicketTable from '../components/TicketTable';
import { Button } from '../components/ui/Button';
import CreateTicketModal from '../components/CreateTicketModal';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <Card className="relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}%
        </div>
      )}
    </div>
    <p className="text-slate-400 text-sm font-medium">{title}</p>
    <h3 className="text-3xl font-bold text-slate-100 mt-1 tracking-tight">{value}</h3>
    <div className="absolute right-0 bottom-0 top-0 w-1 premium-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
  </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes, trendsRes] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/analytics/dashboard'),
        api.get('/analytics/trends?period=weekly')
      ]);
      setStats(statsRes.data);
      setAnalytics({ ...analyticsRes.data, weeklyTrends: trendsRes.data?.data || [] });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">Platform Overview</h1>
          <p className="text-slate-400 mt-1">Real-time performance metrics and system health</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2 px-6" onClick={() => setIsModalOpen(true)}>
            <AlertCircle size={18} />
            Create Ticket
          </Button>
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            Live Sync
          </div>
        </div>
      </div>

      {/* Stats Grid ... */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Tickets" 
          value={stats?.totalTickets || 0} 
          change="12.5" 
          trend="up"
          icon={TicketIcon} 
        />
        <StatCard 
          title="Resolved" 
          value={stats?.resolvedTickets || 0} 
          change="8.2" 
          trend="up"
          icon={CheckCircle2} 
        />
        <StatCard 
          title="Avg. Resolution" 
          value={`${stats?.avgResolutionHours || 0}h`} 
          change="2.4" 
          trend="down"
          icon={Clock} 
        />
        <StatCard 
          title="At Risk" 
          value={stats?.overdueTickets || 0} 
          change="1.2" 
          trend="down"
          icon={AlertTriangle} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Activity Trends" subtitle="Volume of service requests over time" icon={TrendingUp} />
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.weeklyTrends || []}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b840" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b840" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <Area type="monotone" dataKey="created" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader title="Priority Distribution" subtitle="System urgency breakdown" icon={AlertTriangle} />
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(stats?.priorityBreakdown || {}).map(([name, value]) => ({ name, value }))}>
                <XAxis dataKey="name" stroke="#94a3b840" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {Object.entries(stats?.priorityBreakdown || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry[0] === 'High' ? '#f43f5e' : entry[0] === 'Medium' ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Recent Activity</h2>
          <Button variant="secondary" size="sm">View All Tickets</Button>
        </div>
        <TicketTable tickets={analytics?.recentTickets || []} />
      </div>

      <CreateTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData}
      />
    </div>
  );
}
