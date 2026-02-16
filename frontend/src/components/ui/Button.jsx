import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'premium-gradient text-white hover:opacity-90 shadow-lg shadow-brand-500/20',
    secondary: 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10',
    outline: 'bg-transparent text-brand-400 border border-brand-400/30 hover:bg-brand-400/10',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg font-medium',
  };

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
