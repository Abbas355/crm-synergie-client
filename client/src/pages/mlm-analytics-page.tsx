import { AppLayout } from "@/components/layout/app-layout";
import { AnalyticsDashboard } from "@/components/mlm/analytics-dashboard";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function MLMAnalyticsPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/mlm");
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* En-tête mobile optimisé */}
        <div className="bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 h-8 w-8 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                Tableau de Bord Analytique MLM
              </h1>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-600 ml-11 md:ml-0">
            Analyse des performances et statistiques détaillées
          </p>
        </div>

        {/* Contenu analytique */}
        <div className="p-4 md:p-6">
          <AnalyticsDashboard />
        </div>
      </div>
    </AppLayout>
  );
}