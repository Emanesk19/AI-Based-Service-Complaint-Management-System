import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, ...props }) {
  return (
    <div
      className={twMerge(
        'glass rounded-2xl p-6 hover:border-white/20 transition-colors duration-300 shadow-xl shadow-black/20',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
