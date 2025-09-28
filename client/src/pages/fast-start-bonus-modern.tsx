import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ActionPlanDialog } from "@/components/fast-start-bonus/ActionPlanDialog";
import { 
  ArrowLeft,
  Zap, 
  Calendar,
  Euro,
  Trophy,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  Users,
  Crown,
  X
} from "lucide-react";

export default function FastStartBonusModernPage() {
  const [showPlanActionDialog, setShowPlanActionDialog] = useState(false);
  
  useEffect(() => {
    document.title = "Fast Start Bonus - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Fonction pour ouvrir la pop-up du plan d'action
  const openPlanActionDialog = () => {
    console.log('🎯 Clic détecté - Ouverture pop-up plan d\'action');
    setShowPlanActionDialog(true);
  };

  // Récupérer les données utilisateur et de progression
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/mlm/fast-start-bonus"],
    queryFn: async () => {
      // Utiliser données réelles basées sur l'utilisateur connecté
      const response = await fetch("/api/mlm/fast-start-bonus", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        // Fallback avec données réelles calculées
        const userData = await fetch("/api/auth/user", { credentials: 'include' });
        const user = await userData.json();
        
        // SUPPRIMÉ : Plus de calcul frontend hardcodé, utiliser UNIQUEMENT les données API réelles
        return null; // Force l'utilisation des vraies données API
      }
      return await response.json();
    }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // VRAIE Configuration Fast Start Bonus selon spécifications
  const fastStartBonuses = [
    {
      position: "ETT",
      delai: 30,
      montant: 500,
      description: "Executive Team Trainer en 30 jours",
      color: "from-blue-500 to-blue-600",
      icon: Users,
      eligible: userData?.joursDepuisDemarrage <= 30,
      atteint: userData?.positionActuelle?.positionActuelle === "ETT"
    },
    {
      position: "ETL", 
      delai: 90,
      montant: 1000,
      description: "Executive Team Leader en 90 jours",
      color: "from-emerald-500 to-emerald-600",
      icon: Trophy,
      eligible: userData?.joursDepuisDemarrage <= 90,
      atteint: userData?.positionActuelle?.positionActuelle === "ETL"
    },
    {
      position: "Manager",
      delai: 120,
      montant: 5000,
      description: "Manager en 120 jours",
      color: "from-amber-500 to-amber-600",
      icon: Star,
      eligible: userData?.joursDepuisDemarrage <= 120,
      atteint: userData?.positionActuelle?.positionActuelle === "Manager"
    },
    {
      position: "RC",
      delai: 360,
      montant: 25000,
      description: "Regional Coordinator en 360 jours",
      color: "from-purple-500 to-purple-600",
      icon: Crown,
      eligible: userData?.joursDepuisDemarrage <= 360,
      atteint: userData?.positionActuelle?.positionActuelle === "RC"
    }
  ];

  const totalBonusEligible = fastStartBonuses
    .filter(bonus => bonus.eligible)
    .reduce((total, bonus) => total + bonus.montant, 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Header moderne avec navigation retour */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <Link href="/mlm/commissions">
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-blue-50 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Retour aux Commissions</span>
                  <span className="sm:hidden">Retour</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Fast Start Bonus
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">
                      En plus des autres commissions vous êtes éligible à ce bonus exceptionnel.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{userData?.bonusObtenus || 0}€</div>
                <p className="text-gray-600 text-sm">Bonus obtenus</p>
              </div>
            </div>
          </div>

          {/* Cartes d'informations - Layout optimisé mobile */}
          <div className="space-y-4">
            {/* Position actuelle - CLIQUABLE pour scroller vers le plan d'action */}
            <Card className={`bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] cursor-pointer ${(userData?.joursDepuisDemarrage || 0) <= 365 ? 'animate-attention-blink' : ''}`} onClick={openPlanActionDialog}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg text-gray-700">Position Actuelle</CardTitle>
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {(() => {
                        const position = userData?.positionActuelle || "Conseiller";
                        // Traduire les codes en noms complets
                        switch(position) {
                          case "CQ": return "Conseiller Qualifié";
                          case "ETT": return "Executive Team Trainer";
                          case "ETL": return "Executive Team Leader";
                          case "Manager": return "Manager";
                          case "RC": return "Regional Coordinator";
                          default: return "Conseiller";
                        }
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cliquez pour voir le plan d'action détaillé</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Jours depuis démarrage ET Bonus Éligibles - SUR LA MÊME LIGNE */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]">
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                        Jours d'activités
                      </div>
                      <div className="text-lg md:text-xl font-bold text-blue-600">
                        {typeof userData?.joursDepuisDemarrage === 'string' 
                          ? parseInt(userData.joursDepuisDemarrage.replace(' jours', ''))
                          : userData?.joursDepuisDemarrage || 3}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]">
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-lg">
                      <Euro className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xs md:text-sm text-gray-700 leading-tight">Bonus Éligibles</CardTitle>
                      <div className="text-lg md:text-xl font-bold text-emerald-600">
                        {typeof userData?.bonusEligibles === 'number' ? userData.bonusEligibles : 0}€
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Liste des bonus Fast Start - Design moderne */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 px-1">Paliers de Bonus</h2>
            
            {fastStartBonuses.map((bonus, index) => {
              const IconComponent = bonus.icon;
              
              // CORRECTION DÉFINITIVE : Calcul unifié basé sur l'état actuel
              const positionActuelle = userData?.positionActuelle || "Nouveau";
              const joursEcoules = typeof userData?.joursDepuisDemarrage === 'string' 
                ? parseInt(userData.joursDepuisDemarrage.replace(' jours', ''))
                : userData?.joursDepuisDemarrage || 0;
              
              let joursRestants = 0;
              let progressPercentage = 0;
              
              // Déterminer si c'est le prochain objectif à atteindre
              const prochainObjectif = userData?.prochainPalier?.position || "ETT";
              const isNextTarget = bonus.position === prochainObjectif && bonus.eligible && !bonus.atteint;
              
              if (bonus.position === "CQ") {
                // CQ: 30 jours de délai total
                joursRestants = Math.max(0, 30 - joursEcoules);
                
                if (positionActuelle === "CQ") {
                  // CQ atteint - progression 100%
                  progressPercentage = 100;
                } else {
                  // Progression basée sur les points (65 ventes / 25 requis = 260% bridé à 100%)
                  const totalVentes = userData?.totalVentes || 0;
                  progressPercentage = Math.min((totalVentes / 25) * 100, 100);
                }
              } else if (bonus.position === "ETT") {
                // ETT: 30 jours de délai total  
                joursRestants = Math.max(0, 30 - joursEcoules);
                
                if (positionActuelle === "ETT") {
                  // ETT atteint - progression 100%
                  progressPercentage = 100;
                } else {
                  // Progression basée sur les critères satisfaits
                  const criteresManquants = userData?.positionActuelle?.criteresManquants || [];
                  // ETT a 3 critères : 50 points + 2 vendeurs + 150 points groupe
                  const totalCriteres = 3;
                  const criteresSatisfaits = Math.max(0, totalCriteres - criteresManquants.length);
                  progressPercentage = (criteresSatisfaits / totalCriteres) * 100;
                }
              } else {
                // Autres positions: délai standard
                joursRestants = Math.max(0, bonus.delai - joursEcoules);
                progressPercentage = Math.min((joursEcoules / bonus.delai) * 100, 100);
              }
              
              return (
                <Card key={index} className={`bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] ${
                  bonus.atteint ? 'ring-2 ring-emerald-400 bg-emerald-50/30' : 
                  bonus.eligible ? 'ring-2 ring-blue-400 bg-blue-50/30' : 'opacity-75 grayscale'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-3 bg-gradient-to-r ${bonus.color} rounded-xl shadow-lg`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg text-gray-800">{bonus.position}</CardTitle>
                          <p className="text-xs md:text-sm text-gray-600">{bonus.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2 flex-shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {bonus.montant.toLocaleString()}€
                        </div>
                        {bonus.atteint && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                        {!bonus.eligible && <XCircle className="h-5 w-5 text-red-400" />}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs md:text-sm text-gray-600">
                        <span>Progression temporelle</span>
                        <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2 bg-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm text-gray-500">
                          {bonus.eligible ? 
                            `${Math.max(0, joursRestants)} jours restants` : 
                            "Délai expiré"}
                        </span>
                        <Badge 
                          variant={bonus.atteint ? "default" : bonus.eligible ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {bonus.atteint ? "✓ Obtenu" : bonus.eligible ? "Éligible" : "Expiré"}
                        </Badge>
                      </div>
                      
                      {/* Bouton Plan d'Action dans la carte du prochain objectif */}
                      {isNextTarget && (
                        <div className="pt-3 border-t border-gray-200">
                          <Button 
                            onClick={openPlanActionDialog}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] rounded-xl"
                            size="sm"
                          >
                            <Target className="mr-2 h-4 w-4" />
                            Voir mon plan d'action personnalisé
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Le bouton plan d'action est maintenant intégré dans la carte du prochain bonus */}

          {/* Pop-up du plan d'action */}
          <ActionPlanDialog 
            isOpen={showPlanActionDialog} 
            onOpenChange={setShowPlanActionDialog} 
          />


        </div>
      </div>
    </AppLayout>
  );
}