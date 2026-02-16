import React from 'react';
import { Settings, Shield, Bell, User, Globe, Database } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const SettingItem = ({ icon: Icon, title, description, badge }) => (
  <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 group-hover:text-brand-400 transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-semibold text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    {badge ? (
      <span className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
        {badge}
      </span>
    ) : (
      <Button variant="secondary" size="sm">Configure</Button>
    )}
  </div>
);

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white font-outfit">Platform Settings</h1>
        <p className="text-slate-400 mt-1">Configure your environment and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-2">
            <User size={20} className="text-brand-400" /> Personal Settings
          </h2>
          <Card className="p-2">
            <SettingItem icon={User} title="Profile Information" description="Update your name, avatar, and contact details" />
            <SettingItem icon={Bell} title="Notifications" description="Manage email and system alert preferences" />
            <SettingItem icon={Shield} title="Security" description="Change password and 2FA settings" />
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-2">
            <Database size={20} className="text-indigo-400" /> Technical Config
          </h2>
          <Card className="p-2">
            <SettingItem icon={Zap} title="AI Auto-Pilot" description="Fine-tune categorization sensitivity" badge="AI Active" />
            <SettingItem icon={Globe} title="Webhooks" description="Connect external systems via API" />
            <SettingItem icon={Database} title="Data Retention" description="Archive and export cleanup policy" />
          </Card>
        </section>
      </div>
    </div>
  );
}

// Internal Zap icon import fix if needed
import { Zap } from 'lucide-react';
