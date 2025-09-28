import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Euro, 
  TrendingUp, 
  Users, 
  Zap, 
  BarChart3, 
  History, 
  Target,
  Clock,
  Award,
  ChevronRight,
  Star,
  Sparkles,
  ShoppingCart
} from "lucide-react";
import CVDRealtimeDisplayMobile from "@/components/commission/CVDRealtimeDisplay-mobile";
import CVDCalculationBreakdown from "@/components/commission/CVDCalculationBreakdown";
import TrancheDetailsModal from "@/components/commission/TrancheDetailsModal";
import TrancheCommissionModal from "@/components/commission/TrancheCommissionModal";
import { ProgressionMensuelle } from "@/components/commission/ProgressionMensuelle";
import HistoriqueCommissions from "@/components/commission/HistoriqueCommissions";

interface VentesStats {
  ventes: number;
  installations: number;
  totalPoints: number;
  commission: number;
  palier: number;
  pointsRestants: number;
  clientsARelancer: number;
}

export default function VentesMobileModern() {
  const [activeTab, setActiveTab] = useState('realtime');
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false);
  const [showTrancheModal, setShowTrancheModal] = useState(false);
  const [selectedTranche, setSelectedTranche] = useState(1);
  const [, setLocation] = useLocation();

  // Récupération des données CVD temps réel
  const { data: cvdRealtime, isLoading: isLoadingCVD } = useQuery({
    queryKey: ["/api/cvd/realtime"],
    refetchInterval: 30000,
  });

  // Récupération des statistiques de ventes
  const { data: ventesStats, isLoading } = useQuery<VentesStats>({
    queryKey: ['/api/ventes/stats'],
    retry: 1,
  });

  // Récupération des statistiques détaillées clients
  const { data: clientStats } = useQuery({
    queryKey: ['/api/stats/detailed'],
    retry: 1,
  });

  console.log('🎯 CVD OFFICIEL RÉEL:', cvdRealtime ? `${(cvdRealtime as any)?.totalCommission || 0}€ (${(cvdRealtime as any)?.pointsTotal || 0} points, Tranche ${(cvdRealtime as any)?.trancheFinale || 1})` : 'Chargement...');

  const handleNavigateToClients = (filterType: string) => {
    if (filterType === 'clientsARelancer') {
      // Navigation vers page clients avec déclenchement automatique du filtre "clients à relancer"
      setLocation('/clients?custom=relancer');
    } else if (filterType === 'installations') {
      // Navigation vers page clients avec déclenchement automatique du filtre "vraies installations" (statut installation + date mois en cours)
      setLocation('/clients?custom=vraies_installations');
    } else if (filterType === 'signatures') {
      setLocation('/clients?custom=signatures');
    } else {
      setLocation('/clients');
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* Header mobile optimisé avec dégradé */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 backdrop-blur-sm border-b border-white/20">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="truncate">Ventes & Commissions</span>
                </h1>
                <p className="text-blue-100 text-xs mt-1 opacity-90">
                  Suivi en temps réel de vos performances
                </p>
              </div>
              
              {/* Badge temps réel compact */}
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1.5 ml-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-medium">Temps réel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartes statistiques principales - optimisées mobile */}
        <div className="p-4 -mt-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Ventes du mois (= Installations du mois en cours) */}
            <Card 
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => handleNavigateToClients('installations')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Ventes</p>
                    <p className="text-xl font-bold text-blue-600 mb-1">
                      {ventesStats?.ventes || 0}
                    </p>
                    <p className="text-xs text-gray-500">du mois</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-gray-400 mt-2 ml-auto" />
              </CardContent>
            </Card>

            {/* Clients à relancer */}
            <Card 
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => handleNavigateToClients('clientsARelancer')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">À relancer</p>
                    <p className="text-xl font-bold text-orange-600 mb-1">
                      {ventesStats?.clientsARelancer || 0}
                    </p>
                    <p className="text-xs text-gray-500">clients</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-gray-400 mt-2 ml-auto" />
              </CardContent>
            </Card>
          </div>

          {/* Onglets modernisés */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 p-1 rounded-xl">
                  <TabsTrigger 
                    value="realtime" 
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-lg transition-all duration-200"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Temps Réel
                  </TabsTrigger>
                  <TabsTrigger 
                    value="generale" 
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-lg transition-all duration-200"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Générale
                  </TabsTrigger>
                  <TabsTrigger 
                    value="historique" 
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-lg transition-all duration-200"
                  >
                    <History className="h-3 w-3 mr-1" />
                    Historique
                  </TabsTrigger>
                  <TabsTrigger 
                    value="projections" 
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-lg transition-all duration-200"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Projections
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenu des onglets */}
              <div className="p-4">
                <TabsContent value="realtime" className="mt-0 space-y-4">
                  {/* Affichage CVD temps réel */}
                  {isLoadingCVD ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CVDRealtimeDisplayMobile data={cvdRealtime as any} />
                      
                      {/* Progression mensuelle de ma-facturation intégrée */}
                      {ventesStats && (
                        <ProgressionMensuelle 
                          installationsDuMois={ventesStats.installations}
                          pointsCVD={ventesStats.totalPoints}
                          commissionQuotidienne={Math.round(ventesStats.commission / new Date().getDate())}
                        />
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="generale" className="mt-0">
                  <BaremeGeneral 
                    cvdData={cvdRealtime}
                    onTrancheClick={(tranche) => {
                      setSelectedTranche(tranche);
                      setShowTrancheModal(true);
                    }} 
                  />
                </TabsContent>

                <TabsContent value="historique" className="mt-0">
                  <HistoriqueCommissions />
                </TabsContent>

                <TabsContent value="projections" className="mt-0">
                  <ProjectionsAvancees 
                    ventesStats={ventesStats}
                    cvdData={cvdRealtime}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Modals */}
        {showDetailedCalculation && (
          <CVDCalculationBreakdown
            points={(cvdRealtime as any)?.pointsTotal || 0}
            commission={(cvdRealtime as any)?.totalCommission || 0}
            cvdDetails={cvdRealtime as any}
          />
        )}

        {showTrancheModal && (
          <TrancheCommissionModal
            isOpen={showTrancheModal}
            tranche={selectedTranche}
            pointsActuels={(cvdRealtime as any)?.pointsTotal || 0}
            onClose={() => setShowTrancheModal(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Composant Barème Général modernisé avec logique progressive
function BaremeGeneral({ onTrancheClick, cvdData }: { 
  onTrancheClick: (tranche: number) => void,
  cvdData?: any 
}) {
  // Déterminer la tranche actuelle basée sur les points CVD - CORRECTION COMPLÈTE
  const pointsActuels = (cvdData as any)?.pointsTotal || 0;
  const trancheActuelle = pointsActuels >= 101 ? 4 : pointsActuels >= 51 ? 3 : pointsActuels >= 26 ? 2 : 1;
  
  const baremeData = [
    {
      tranche: 1,
      pointsRange: "0-25 points",
      commission: "50€/Box • 10€/5G",
      description: "Tranche débutant",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      details: {
        freeboxPop: "50€",
        freeboxEssentiel: "50€", 
        freeboxUltra: "50€",
        forfait5G: "10€"
      }
    },
    {
      tranche: 2,
      pointsRange: "26-50 points",
      commission: "60-80€/Box • 10€/5G",
      description: "Tranche confirmé",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      details: {
        freeboxPop: "60€",
        freeboxEssentiel: "70€",
        freeboxUltra: "80€", 
        forfait5G: "10€"
      }
    },
    {
      tranche: 3,
      pointsRange: "51-100 points",
      commission: "70-100€/Box • 10€/5G",
      description: "Tranche expert",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      details: {
        freeboxPop: "70€",
        freeboxEssentiel: "90€",
        freeboxUltra: "100€",
        forfait5G: "10€"
      }
    },
    {
      tranche: 4,
      pointsRange: "101+ points",
      commission: "90-120€/Box • 10€/5G",
      description: "Tranche excellence",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      details: {
        freeboxPop: "90€",
        freeboxEssentiel: "100€",
        freeboxUltra: "120€",
        forfait5G: "10€"
      }
    }
  ];

  // Afficher seulement les tranches jusqu'à la tranche actuelle
  const tranchesVisibles = baremeData.filter(t => t.tranche <= trancheActuelle);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Barème des Commissions</h3>
      </div>
      
      {tranchesVisibles.map((tranche) => {
        const isCurrentTranche = tranche.tranche === trancheActuelle;
        const isClickable = isCurrentTranche;
        
        return (
          <Card 
            key={tranche.tranche}
            className={`${tranche.bgColor} border-0 shadow-md ${isClickable ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed opacity-75'} transition-all duration-300 group`}
            onClick={() => isClickable && onTrancheClick(tranche.tranche)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-1 bg-gradient-to-r ${tranche.color} rounded-full`}>
                      <span className="text-white text-sm font-bold">T{tranche.tranche}</span>
                    </div>
                    <div>
                      <p className={`font-semibold ${tranche.textColor}`}>
                        {tranche.description}
                        {isCurrentTranche && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Actuelle
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">{tranche.pointsRange}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${tranche.textColor}`}>
                    {tranche.commission}
                  </p>
                </div>
                {isClickable ? (
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                ) : (
                  <div className="h-4 w-4 text-gray-300">🔒</div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Message pour les tranches non accessibles */}
      {trancheActuelle < 4 && (
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">
            🔒 Tranche {trancheActuelle + 1} sera accessible à partir de {
              trancheActuelle === 1 ? '26' : 
              trancheActuelle === 2 ? '51' : 
              trancheActuelle === 3 ? '101' : '101'
            } points
          </p>
        </div>
      )}
    </div>
  );
}

// Composant Projections Avancées avec métriques de progression mensuelle
function ProjectionsAvancees({ ventesStats, cvdData }: { 
  ventesStats?: VentesStats, 
  cvdData?: any 
}) {
  if (!ventesStats) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculs basés sur les données réelles
  const joursEcoules = new Date().getDate();
  const joursRestants = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - joursEcoules;
  const progressionMois = Math.round((joursEcoules / (joursEcoules + joursRestants)) * 100);
  
  // Moyennes journalières basées sur les installations réelles
  const installationsDuMois = ventesStats.installations || 0;
  const pointsCVD = ventesStats.totalPoints || 0;
  const commissionTotale = ventesStats.commission || 0;
  
  const moyVentesJour = installationsDuMois > 0 ? (installationsDuMois / joursEcoules).toFixed(1) : "0.0";
  const moyPointsJour = pointsCVD > 0 ? (pointsCVD / joursEcoules).toFixed(1) : "0.0";
  const moyCommissionJour = commissionTotale > 0 ? Math.round(commissionTotale / joursEcoules) : 0;

  // Projections fin de mois
  const ventesProjetees = Math.round(parseFloat(moyVentesJour) * joursRestants);
  const pointsProjectes = Math.round(parseFloat(moyPointsJour) * joursRestants);
  const commissionProjetee = moyCommissionJour * joursRestants;
  
  const totalVentesFinMois = installationsDuMois + ventesProjetees;
  const totalPointsFinMois = pointsCVD + pointsProjectes;
  const totalCommissionFinMois = commissionTotale + commissionProjetee;
  
  // Déterminer la tranche projetée
  const getTranche = (points: number) => {
    if (points >= 101) return 4;
    if (points >= 51) return 3;  
    if (points >= 26) return 2;
    return 1;
  };
  
  const trancheActuelle = getTranche(pointsCVD);
  const trancheProjetee = getTranche(totalPointsFinMois);
  const ameliorationTranche = trancheProjetee > trancheActuelle;

  // Points pour prochaine tranche
  const getPointsProchaineTranche = (points: number) => {
    if (points < 26) return 26 - points;
    if (points < 51) return 51 - points;
    if (points < 101) return 101 - points;
    return 0;
  };
  
  const pointsProchaineTranche = getPointsProchaineTranche(pointsCVD);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Projections & Objectifs</h3>
      </div>
      
      {/* Progression du mois */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Progression du mois</h4>
            <Badge variant="secondary">{joursEcoules}/{joursEcoules + joursRestants} jours</Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progressionMois}%` }}
            ></div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            {progressionMois}% du mois écoulé
          </div>
        </CardContent>
      </Card>

      {/* Métriques journalières actuelles */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Moyennes journalières</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{moyVentesJour}</div>
              <div className="text-xs text-blue-700">Moy./jour</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{moyPointsJour}</div>
              <div className="text-xs text-green-700">Pts/jour</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{moyCommissionJour}€</div>
              <div className="text-xs text-purple-700">€/jour</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projections fin de mois */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Projections fin de mois</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Ventes totales</span>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{totalVentesFinMois}</div>
                  <div className="text-xs text-gray-500">+{ventesProjetees} restantes</div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Points CVD</span>
                <div className="text-right">
                  <div className="font-bold text-green-600">{totalPointsFinMois}</div>
                  <div className="text-xs text-gray-500">+{pointsProjectes} projetés</div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Commission</span>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{totalCommissionFinMois}€</div>
                  <div className="text-xs text-gray-500">+{commissionProjetee}€ projetés</div>
                </div>
              </div>
            </div>
          </div>
          
          {ameliorationTranche && (
            <div className="mt-3 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Tranche {trancheActuelle} → {trancheProjetee} 🎉
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objectif prochaine tranche */}
      {pointsProchaineTranche > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-indigo-600" />
              <h4 className="font-semibold text-gray-800">Objectif prochaine tranche</h4>
            </div>
            
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {pointsProchaineTranche}
              </div>
              <div className="text-sm text-gray-600 mb-2">points restants</div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div>• {Math.ceil(pointsProchaineTranche / 6)} Freebox Ultra (6 pts)</div>
                <div>• {Math.ceil(pointsProchaineTranche / 5)} Freebox Essentiel (5 pts)</div>
                <div>• {Math.ceil(pointsProchaineTranche / 4)} Freebox Pop (4 pts)</div>
              </div>
              
              <div className="mt-2 text-xs font-medium text-indigo-700">
                Pour atteindre la Tranche {trancheActuelle + 1}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}