import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  type?: 'qualification' | 'property' | 'sentiment' | 'urgency';
}

const Badge: React.FC<BadgeProps> = ({ status, type = 'qualification' }) => {
  const normalized = status?.toLowerCase().replace(/_/g, ' ') || 'sconosciuto';
  
  let colorClass = 'bg-slate-100 text-slate-600';

  if (type === 'qualification') {
    if (normalized.includes('qualificato') && !normalized.includes('non')) {
      colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    } else if (normalized.includes('non') || normalized.includes('rifiuta')) {
      colorClass = 'bg-red-100 text-red-700 border border-red-200';
    } else if (normalized.includes('callback') || normalized.includes('non risponde')) {
      colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  } else if (type === 'property') {
    if (normalized === 'approved' || normalized === 'approvato') {
      colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    } else if (normalized === 'pending' || normalized === 'in attesa') {
      colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  } else if (type === 'sentiment') {
    if (normalized === 'positivo') {
      colorClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    } else if (normalized === 'negativo' || normalized === 'ostile') {
      colorClass = 'bg-red-50 text-red-600 border border-red-100';
    }
  } else if (type === 'urgency') {
    if (normalized === 'alta') {
      colorClass = 'bg-red-100 text-red-700 font-bold';
    } else if (normalized === 'media') {
      colorClass = 'bg-amber-100 text-amber-700';
    } else if (normalized === 'bassa') {
      colorClass = 'bg-emerald-50 text-emerald-600';
    }
  }

  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass)}>
      {label}
    </span>
  );
};

export default Badge;
