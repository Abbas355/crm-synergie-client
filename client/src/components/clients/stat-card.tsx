import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  count: number;
  percentage?: number;
  growth?: boolean;
  icon: ReactNode;
  subtitle?: string;
  description?: string;
  variant?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  count,
  percentage,
  growth = true,
  icon,
  subtitle,
  description,
  variant = 'default',
  onClick,
}: StatCardProps) {
  // Définir les couleurs selon le variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return {
          card: 'bg-blue-50 border-2 border-blue-200',
          title: 'text-blue-600',
          count: 'text-blue-700',
          icon: 'bg-blue-100 text-blue-600',
          description: 'text-blue-500'
        };
      case 'warning':
        return {
          card: 'bg-orange-50 border-2 border-orange-200',
          title: 'text-orange-600',
          count: 'text-orange-700',
          icon: 'bg-orange-100 text-orange-600',
          description: 'text-orange-500'
        };
      case 'success':
        return {
          card: 'bg-green-50 border-2 border-green-200',
          title: 'text-green-600',
          count: 'text-green-700',
          icon: 'bg-green-100 text-green-600',
          description: 'text-green-500'
        };
      case 'info':
        return {
          card: 'bg-indigo-50 border-2 border-indigo-200',
          title: 'text-indigo-600',
          count: 'text-indigo-700',
          icon: 'bg-indigo-100 text-indigo-600',
          description: 'text-indigo-500'
        };
      case 'secondary':
        return {
          card: 'bg-purple-50 border-2 border-purple-200',
          title: 'text-purple-600',
          count: 'text-purple-700',
          icon: 'bg-purple-100 text-purple-600',
          description: 'text-purple-500'
        };
      case 'accent':
        return {
          card: 'bg-pink-50 border-2 border-pink-200',
          title: 'text-pink-600',
          count: 'text-pink-700',
          icon: 'bg-pink-100 text-pink-600',
          description: 'text-pink-500'
        };
      default:
        return {
          card: 'bg-white border-2 border-gray-200',
          title: 'text-gray-600',
          count: 'text-gray-700',
          icon: 'bg-gray-100 text-gray-600',
          description: 'text-gray-500'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div 
      className={`${variantClasses.card} rounded-xl shadow-sm p-4 flex flex-col ${onClick ? 'cursor-pointer hover:shadow-md transform hover:scale-105 transition-all duration-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-sm font-medium ${variantClasses.title}`}>{title}</h3>
          <p className={`text-3xl font-bold mt-1 ${variantClasses.count}`}>{count}</p>
        </div>
        <div className={`p-2 ${variantClasses.icon} rounded-full`}>{icon}</div>
      </div>
      
      {percentage !== undefined && (
        <div className="mt-2 flex items-center text-xs">
          <span
            className={growth ? "text-green-600" : "text-red-600"}
          >
            {growth ? "↑" : "↓"} {percentage}%
          </span>
          {subtitle && (
            <span className="ml-2 text-gray-500">{subtitle}</span>
          )}
        </div>
      )}
      
      {!percentage && (subtitle || description) && (
        <div className={`mt-2 text-xs ${variantClasses.description} font-medium`}>
          {onClick && '👆 '}{subtitle || description}
        </div>
      )}
    </div>
  );
}