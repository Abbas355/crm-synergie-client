import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompactCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function CompactCard({
  title,
  value,
  subtitle,
  icon,
  className,
  valueClassName,
  onClick
}: CompactCardProps) {
  return (
    <Card 
      className={cn(
        "bg-white/90 backdrop-blur-sm border border-gray-200/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-lg min-h-[120px] h-[120px]",
        onClick && "hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs text-gray-700 mb-1 leading-tight font-semibold">{title}</div>
            <div className={cn(
              "text-2xl font-bold text-gray-900",
              valueClassName
            )}>
              {value}
            </div>
          </div>
          {icon && (
            <div className="ml-2 p-1.5 bg-gray-50 rounded-lg flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-auto line-clamp-1 flex items-center gap-1">
            {subtitle}
            {onClick && <span className="text-gray-400">→</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}