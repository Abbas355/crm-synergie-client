import { LucideIcon } from "lucide-react";

interface CompactStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  color?: string;
  textColor?: string;
  onClick?: () => void;
  className?: string;
}

export function CompactStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  color = "bg-white/90",
  textColor = "text-gray-900",
  onClick,
  className = ""
}: CompactStatCardProps) {
  return (
    <div 
      className={`${color} backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/20 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${iconColor || color} rounded-md flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${textColor}`} />
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${textColor}`}>{value}</p>
        </div>
      </div>
      <div>
        <p className={`text-xs font-medium ${textColor} leading-tight`}>{title}</p>
        {subtitle && <p className={`text-xs ${textColor} opacity-75 leading-tight`}>{subtitle}</p>}
      </div>
    </div>
  );
}