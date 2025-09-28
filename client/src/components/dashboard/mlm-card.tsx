import { Award } from "lucide-react";
import { useLocation } from "wouter";

export function MLMCard() {
  const [, setLocation] = useLocation();
  
  const navigateToMLM = () => {
    console.log("Navigation vers Commissions CVD détectée");
    setLocation("/commissions");
  };

  return (
    <div 
      className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-500"
      onClick={navigateToMLM}
    >
      <div className="px-2 py-3 sm:px-4 sm:py-5 md:p-6 flex-grow">
        <div className="flex items-center">
          <div className="flex-shrink-0 rounded-md p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-blue-500 to-purple-600">
            <Award className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="ml-2 sm:ml-3 md:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                Commissions MLM
              </dt>
              <dd>
                <div className="text-base sm:text-lg md:text-xl font-medium text-gray-900">
                  Voir détails
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 mt-auto border-t border-gray-100">
        <div className="text-xs sm:text-sm">
          <span className="font-medium flex items-center text-blue-600">
            <span className="truncate">Accéder aux commissions</span>
          </span>
        </div>
      </div>
    </div>
  );
}