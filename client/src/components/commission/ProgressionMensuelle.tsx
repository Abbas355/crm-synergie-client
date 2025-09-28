import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ProgressionMensuelleProps {
  installationsDuMois: number;
  pointsCVD: number;
  commissionQuotidienne: number;
}

export function ProgressionMensuelle({ 
  installationsDuMois, 
  pointsCVD, 
  commissionQuotidienne 
}: ProgressionMensuelleProps) {
  
  // Calculs pour la progression mensuelle
  const currentDay = new Date().getDate();
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const progressionPourcentage = Math.round((currentDay / totalDaysInMonth) * 100);
  
  // Moyennes journalières
  const moyenneInstallationsJour = currentDay > 0 ? (installationsDuMois / currentDay).toFixed(1) : "0.0";
  const moyennePointsJour = currentDay > 0 ? (pointsCVD / currentDay).toFixed(1) : "0.0";
  const moyenneCommissionJour = currentDay > 0 ? Math.round(commissionQuotidienne) : 0;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-purple-600" />
          Progression mensuelle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Barre de progression du mois */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression du mois</span>
              <span className="text-sm text-blue-600 font-bold">
                {currentDay}/{totalDaysInMonth} jours
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progressionPourcentage}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {progressionPourcentage}% du mois écoulé
            </div>
          </div>

          {/* Métriques journalières en grille 3 colonnes */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            
            {/* Moyenne installations/jour */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {moyenneInstallationsJour}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Moy./jour
              </div>
            </div>

            {/* Moyenne points/jour */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {moyennePointsJour}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Pts/jour
              </div>
            </div>

            {/* Moyenne commission/jour */}
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {moyenneCommissionJour}€
              </div>
              <div className="text-xs text-gray-600 mt-1">
                €/jour
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}