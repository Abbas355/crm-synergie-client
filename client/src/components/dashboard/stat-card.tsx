import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  linkText: string;
  linkHref: string;
  iconColor: string;
  linkColor: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon,
  linkText,
  linkHref,
  iconColor,
  linkColor,
  onClick,
}: StatCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      console.log("Navigation vers:", linkHref);
      window.location.href = linkHref;
    }
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      console.log("Navigation tactile vers:", linkHref);
      window.location.href = linkHref;
    }
  };

  return (
    <div 
      className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
      onTouchStart={handleTouch}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="px-2 py-3 sm:px-4 sm:py-5 md:p-6 flex-grow">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-1.5 sm:p-2 md:p-3", iconColor)}>
            {icon}
          </div>
          <div className="ml-2 sm:ml-3 md:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-base sm:text-lg md:text-xl font-medium text-gray-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 mt-auto border-t border-gray-100">
        <div className="text-xs sm:text-sm">
          <span className={cn("font-medium flex items-center", linkColor)}>
            <span className="truncate">{linkText}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
