import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  Settings, 
  BarChart3, 
  LogOut, 
  User,
  Bell,
  Search,
  Zap,
  Shield,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import NotificationDrawer from './NotificationDrawer';
import api from '../services/api';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Ticket, label: 'Tickets', path: '/tickets' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (user?.role === 'admin') {
    navItems.push(
      { icon: Shield, label: 'Users', path: '/users' },
      { icon: History, label: 'Auditing', path: '/audit-logs' }
    );
  }

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications');
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  React.useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 glass flex flex-col fixed h-full z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="text-xl font-bold font-outfit tracking-tight">IntelliHub</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} className={location.pathname === item.path ? 'text-brand-400' : 'group-hover:text-slate-200'} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/5 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
              <User size={20} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 py-3" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen relative">
        {/* Top Header */}
        <header className="glass-header px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="relative w-96 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search tickets, analytics, activity..."
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500/50 transition-all text-slate-200"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNotifOpen(true)}
              className="p-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-brand-400 relative group"
            >
              <Bell size={20} className="group-hover:animate-swing" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-950 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-white/5 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none text-slate-200">System</p>
                <p className="text-[10px] text-green-500 uppercase font-bold mt-1 tracking-widest flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>

        <NotificationDrawer 
          isOpen={isNotifOpen} 
          onClose={() => {
            setIsNotifOpen(false);
            fetchUnread();
          }} 
        />
      </main>
    </div>
  );
}
