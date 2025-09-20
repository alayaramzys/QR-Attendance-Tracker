import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: typeof LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color,
}) => {
  const colorClasses = {
    blue: {
      icon: 'bg-primary-100 text-primary-600',
      text: 'text-primary-600',
    },
    green: {
      icon: 'bg-success-100 text-success-600',
      text: 'text-success-600',
    },
    red: {
      icon: 'bg-error-100 text-error-600',
      text: 'text-error-600',
    },
    yellow: {
      icon: 'bg-warning-100 text-warning-600',
      text: 'text-warning-600',
    },
  };

  const changeColors = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color].icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};