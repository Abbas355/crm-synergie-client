import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface PageHeaderMobileProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  rightContent?: ReactNode;
  className?: string;
}

export function PageHeaderMobile({ 
  title, 
  subtitle, 
  onBack, 
  backUrl = "/", 
  rightContent,
  className = ""
}: PageHeaderMobileProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation(backUrl);
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 sm:p-6 mb-6 ${className}`}>
      {/* Bouton retour mobile en haut */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {rightContent && (
          <div className="sm:hidden">
            {rightContent}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Bouton retour desktop */}
          <div className="hidden sm:flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </Button>
          </div>

          {/* Titre optimisé mobile */}
          <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Contenu à droite pour desktop */}
        {rightContent && (
          <div className="hidden sm:flex ml-4">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}