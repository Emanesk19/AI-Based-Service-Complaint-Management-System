import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Input({ className, label, error, icon: Icon, ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-medium text-slate-400 ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          className={twMerge(
            'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all',
            Icon && 'pl-11',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
}
