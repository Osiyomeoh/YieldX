import React from 'react';
import { StatsCardProps } from '@/types/ui';

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'emerald' 
}: StatsCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-600 text-emerald-200',
    blue: 'from-blue-500 to-blue-600 text-blue-200',
    purple: 'from-purple-500 to-purple-600 text-purple-200',
    red: 'from-red-500 to-red-600 text-red-200',
  };

  const isGradient = color === 'emerald';

  return (
    <div className={`rounded-2xl p-6 ${
      isGradient 
        ? `bg-gradient-to-br ${colorClasses[color]} text-white`
        : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm mb-1 ${
            isGradient ? 'text-emerald-100' : 'text-slate-600'
          }`}>
            {title}
          </div>
          <div className={`text-3xl font-bold ${
            isGradient ? 'text-white' : 'text-slate-900'
          }`}>
            {value}
          </div>
          {trendValue && (
            <div className={`text-xs mt-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-slate-500'
            }`}>
              {trendValue}
            </div>
          )}
        </div>
        <Icon size={32} className={isGradient ? colorClasses[color] : `text-${color}-500`} />
      </div>
    </div>
  );
}