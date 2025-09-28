import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Euro, 
  Users, 
  Network, 
  Award, 
  Target,
  BarChart3,
  Crown,
  Star,
  Zap,
  ArrowUp,
  ArrowRight,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CompactCard } from "@/components/ui/compact-card";

export default function CommissionsMLMPage() {
  const [, setLocation] = useLocation();

  // Définir le titre de la page
  useEffect(() => {
    document.title = "Commissions MLM - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Récupérer les données MLM
  const { data: mlmData, isLoading: isLoadingMLM } = useQuery({
    queryKey: ["/api/mlm/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/stats");
      return await response.json();
    }
  });

  // Récupérer les données Fast Start Bonus
  const { data: fastStartData, isLoading: isLoadingFastStart } = useQuery({
    queryKey: ["/api/mlm/fast-start-bonus"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/fast-start-bonus");
      return await response.json();
    }
  });

  // Récupérer les données CCA
  const { data: ccaData, isLoading: isLoadingCCA } = useQuery({
    queryKey: ["/api/mlm/cca-commission"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/cca-commission");
      return await response.json();
    }
  });

  // Récupérer les données CAE
  const { data: caeData, isLoading: isLoadingCAE } = useQuery({
    queryKey: ["/api/mlm/cae-commission"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/cae-commission");
      return await response.json();
    }
  });

  if (isLoadingMLM || isLoadingFastStart || isLoadingCCA || isLoadingCAE) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">Chargement...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // CORRECTION : Progression Fast Start Bonus basée sur les critères réels
  const nextBonus = fastStartData?.prochainPalier;
  const currentPosition = fastStartData?.positionActuelle?.positionActuelle || "Conseiller";
  
  // Calculer la progression selon la position actuelle
  let progressPercentage = 0;
  if (currentPosition === "CQ") {
    progressPercentage = 100; // CQ atteint = progression complète
  } else if (currentPosition === "Conseiller") {
    // Progression vers CQ basée sur les points (65 points / 25 requis)
    const pointsActuels = fastStartData?.totalVentes || 0;
    progressPercentage = Math.min((pointsActuels / 25) * 100, 100);
  } else {
    // Autres positions : progression temporelle
    const joursEcoules = fastStartData?.joursDepuisDemarrage || 0;
    const delaiTotal = nextBonus?.delai || 30;
    progressPercentage = Math.min((joursEcoules / delaiTotal) * 100, 100);
  }

  // Statistiques réseau
  const totalVendeurs = (mlmData?.vendeursNiveau1 || 0) + (mlmData?.vendeursNiveau2 || 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header avec titre et navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            {/* Bouton retour mobile */}
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/mlm')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Retour</span>
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Commissions MLM
                </h1>
                <p className="text-gray-600 mt-2">
                  Commissions générées par le développement de votre réseau
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {((ccaData?.totalCommission || 0) + (caeData?.totalCommission || 0)).toFixed(1)}€
                </div>
                <div className="text-sm text-gray-500">Total des commissions réseau</div>
              </div>
            </div>
          </div>

          {/* Statistiques réseau et types de commissions en grille unifiée 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Dans votre réseau MLM - Niveau 1 */}
            <CompactCard
              title="Niveau 1"
              value={mlmData?.vendeursNiveau1 || 0}
              subtitle="Commission 5%"
              icon={<Users className="h-5 w-5 text-blue-600" />}
              valueClassName="text-blue-600"
            />

            {/* Dans votre réseau MLM - Niveau 2 */}
            <CompactCard
              title="Niveau 2"
              value={mlmData?.vendeursNiveau2 || 0}
              subtitle="Commission 3%"
              icon={<Network className="h-5 w-5 text-green-600" />}
              valueClassName="text-green-600"
            />

            {/* Commission Indirecte (CCA) */}
            <Link href="/mlm/cca-commission" className="block">
              <CompactCard
                title="Commission sur Chiffres d'Affaires"
                value="CCA"
                subtitle="Voir détails →"
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                valueClassName="text-green-600 text-3xl font-black"
                className="hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-green-500"
              />
            </Link>

            {/* Bonus Leadership (CAE) */}
            <Link href="/mlm/cae-commission" className="block">
              <CompactCard
                title="Commission Animation Équipe"
                value="CAE"
                subtitle="Bonus Leadership →"
                icon={<Crown className="h-5 w-5 text-orange-600" />}
                valueClassName="text-orange-600 text-3xl font-black"
                className="hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-orange-500"
              />
            </Link>

            {/* Bonus Performance (Fast Start) */}
            <Link href="/mlm/fast-start-bonus" className="block">
              <CompactCard
                title="Fast Start Bonus"
                value="FSB"
                subtitle="Bonus Performance →"
                icon={<Zap className="h-5 w-5 text-yellow-600" />}
                valueClassName="text-yellow-600 text-3xl font-black"
                className="hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-yellow-500"
              />
            </Link>

            {/* Objectifs MLM */}
            <Link href="/objectifs" className="block">
              <CompactCard
                title="Objectifs MLM"
                value="CQ"
                subtitle="Progression niveaux →"
                icon={<Target className="h-5 w-5 text-purple-600" />}
                valueClassName="text-purple-600 text-3xl font-black"
                className="hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-purple-500"
              />
            </Link>

          </div>

          {/* Section Fast Start Bonus Progress si éligible */}
          {nextBonus && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Progression Fast Start Bonus</h3>
                    <p className="text-gray-600">Prochain palier : {nextBonus.level} - {nextBonus.amount}€</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {nextBonus.daysRemaining} jours restants
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progression temporelle</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  {nextBonus.daysElapsed} jours écoulés sur {nextBonus.timeLimit} jours
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}