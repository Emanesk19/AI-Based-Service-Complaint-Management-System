import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import api from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: null,
    breakdown: [],
    performance: [],
    trends: [],
    loading: true
  });

  const [exporting, setExporting] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const [resSummary, resBreakdown, resTrends] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/analytics/category-breakdown'),
        api.get('/analytics/trends?period=daily')
      ]);

      setData({
        summary: resSummary.data,
        breakdown: (resBreakdown.data?.categories || []).map(c => ({ 
          name: c.category, 
          value: c.totalTickets 
        })),
        trends: resTrends.data?.data || [],
        loading: false
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const response = await api.get(`/reports/export/${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `intel-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export failed:`, err);
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (data.loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-2xl" />
        <div className="h-80 bg-white/5 rounded-2xl" />
      </div>
      <div className="h-96 bg-white/5 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">Performance Analytics</h1>
          <p className="text-slate-400 mt-1">Deep dive into system metrics and AI productivity</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-brand-400 hover:bg-white/5 transition-all border border-white/5 disabled:opacity-50"
              >
                <FileText size={16} />
                {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="premium-gradient px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:shadow-lg hover:shadow-brand-500/20 transition-all disabled:opacity-50"
              >
                <Download size={16} />
                {exporting === 'pdf' ? 'Generating...' : 'Download PDF'}
              </button>
            </>
          )}
          <div className="glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 border border-white/5">
            <Clock size={16} className="text-brand-400" />
            <span>Last 30 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-center py-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Resolution</p>
          <p className="text-2xl font-bold text-white">{data.summary?.avgResolutionHours || 0}h</p>
        </Card>
        <Card className="flex flex-col justify-center py-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">SLA Compliance</p>
          <p className="text-2xl font-bold text-green-400">94.2%</p>
        </Card>
        <Card className="flex flex-col justify-center py-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">AI Accuracy</p>
          <p className="text-2xl font-bold text-brand-400">98.5%</p>
        </Card>
        <Card className="flex flex-col justify-center py-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Resolution Rate</p>
          <p className="text-2xl font-bold text-indigo-400">88.7%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Load Distribution" subtitle="Ticket volume by category" icon={PieChartIcon} />
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.breakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="SLA Performance" subtitle="Resolution time trends" icon={Activity} />
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b840" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b840" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="created" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Predictive Scaling" subtitle="Projected ticket volume based on AI analysis" icon={Zap} />
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b840" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b840" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
              />
              <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#colorWave)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
