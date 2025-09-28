import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  Euro, 
  Calendar, 
  Award, 
  Target, 
  Users,
  Zap,
  ArrowUp,
  ChevronRight,
  Download,
  FileText,
  Eye,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { CompactCard } from "@/components/ui/compact-card";
import BaremeCommissionsModerne from "@/components/BaremeCommissionsModerne";

// Interface pour les données utilisateur
interface UserData {
  id: number;
  [key: string]: any;
}

interface CommissionTier {
  id: number;
  min: number;
  max: number;
  freebox_pop: number;
  freebox_essentiel: number;
  freebox_ultra: number;
  forfait_5g: number;
}

interface HistoriqueVentes {
  historiqueParMois: {
    mois: string;
    nombreVentes: number;
    totalPoints: number;
    commissionTotale: number;
    ventesDetails: any[];
    repartitionProduits: {
      freeboxUltra: number;
      freeboxEssentiel: number;
      freeboxPop: number;
      forfait5G: number;
    };
  }[];
  tendances: {
    ventesEnProgression: boolean;
    commissionEnProgression: boolean;
    meilleurePerformance: any;
    totalVentesCumule: number;
    totalCommissionCumule: number;
  };
  statsGlobales: {
    totalVentes: number;
    totalPointsCumules: number;
    totalCommissions: number;
    moyenneVentesParMois: number;
    produitLePlusVendu: string;
  };
  ventesRecentes: any[];
}

export default function CommissionsPage() {
  const [isTrancheModalOpen, setIsTrancheModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Requête pour l'historique des ventes
  const { data: historiqueVentes, isLoading: isLoadingHistorique } = useQuery<HistoriqueVentes>({
    queryKey: ['/api/historique/ventes-simple'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Définir le titre de la page
  useEffect(() => {
    document.title = "Commissions CVD - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Récupérer les statistiques CVD
  const { data: statsVentes = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/ventes/stats"],
    staleTime: 30 * 1000, // 30 secondes pour synchronisation
    gcTime: 2 * 60 * 1000
  });

  // Les vraies données CVD sont dans statsVentes selon les logs du serveur

  // Récupérer les données clients pour les commissions
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
    staleTime: 30 * 1000, // 30 secondes pour synchronisation
    gcTime: 2 * 60 * 1000
  });

  // Récupérer les données utilisateur
  const { data: user } = useQuery<UserData>({
    queryKey: ['/api/auth/user'],
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Récupérer la configuration des tranches de commission
  const { data: tiers, isLoading: isLoadingTiers } = useQuery<CommissionTier[]>({
    queryKey: ["/api/mlm/commission-tiers"]
  });

  if (isLoadingStats || isLoadingClients || isLoadingTiers) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Utiliser les vraies données CVD depuis statsVentes (logs serveur confirment: 85 points, 1220€)
  const pointsCVD = (statsVentes as any)?.totalPoints || 0;
  const commissionTotale = (statsVentes as any)?.commission || 0;
  
  // Calcul correct de la tranche basé sur les points
  const tranche = pointsCVD >= 101 ? 4 : 
                  pointsCVD >= 51 ? 3 : 
                  pointsCVD >= 26 ? 2 : 1;
  
  // Calcul des points restants pour la prochaine tranche (pas palier)
  let pointsProchaineTranche = 0;
  let prochaineTranche = tranche;
  
  if (pointsCVD < 25) {
    pointsProchaineTranche = 25 - pointsCVD;
    prochaineTranche = 2;
  } else if (pointsCVD < 50) {
    pointsProchaineTranche = 50 - pointsCVD;
    prochaineTranche = 2;
  } else if (pointsCVD < 100) {
    pointsProchaineTranche = 100 - pointsCVD;
    prochaineTranche = 4;
  } else {
    pointsProchaineTranche = 0;
    prochaineTranche = 4;
  }

  // Calcul progression vers prochain palier
  const progressionPalier = ((pointsCVD % 5) / 5) * 100;



  // Données des installations du mois
  const installationsDuMois = Array.isArray(clients) ? clients.filter((client: any) => {
    if (client.status !== 'installation') return false;
    const dateInstall = new Date(client.dateInstallation);
    const maintenant = new Date();
    return dateInstall.getMonth() === maintenant.getMonth() && 
           dateInstall.getFullYear() === maintenant.getFullYear();
  }) : [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header avec bouton retour et titre optimisé mobile */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4 sm:p-6">
            {/* Bouton retour mobile en haut */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Bouton retour desktop */}
                <div className="hidden sm:flex items-center gap-3 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/")}
                    className="p-2"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Retour
                  </Button>
                </div>

                {/* Titre optimisé mobile */}
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Commissions CVD
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  Commissions {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{commissionTotale}€</div>
                <div className="text-xs sm:text-sm text-gray-500">Total des commissions</div>
              </div>
            </div>
          </div>

          {/* Statistiques principales - 2 colonnes */}
          <div className="grid grid-cols-2 gap-4 w-full">
            
            {/* Points CVD */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Points CVD</p>
                    <p className="text-3xl font-bold text-blue-600">{pointsCVD}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span>Prochaine tranche</span>
                    <span>
                      {(() => {
                        if (pointsCVD >= 101) {
                          return "Tranche 4 atteinte";
                        } else if (pointsCVD >= 51) {
                          return `${101 - pointsCVD} points restants`;
                        } else if (pointsCVD >= 26) {
                          return `${51 - pointsCVD} points restants`;
                        } else {
                          return `${26 - pointsCVD} points restants`;
                        }
                      })()}
                    </span>
                  </div>
                  <Progress value={progressionPalier} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Commission totale */}
            <Card 
              className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
              onClick={() => {
                console.log("Clic détecté sur carte Commission");
                setIsTrancheModalOpen(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Commission</p>
                    <p className="text-3xl font-bold text-green-600">{commissionTotale}€</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Euro className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>Tranche {tranche} active</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            {/* Installations du mois */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Installations</p>
                    <p className="text-3xl font-bold text-purple-600">{installationsDuMois.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Ce mois-ci
                </div>
              </CardContent>
            </Card>

            {/* Palier actuel */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tranche actuelle</p>
                    <p className="text-3xl font-bold text-orange-600">{tranche}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Paliers franchis
                </div>
              </CardContent>
            </Card>
            
          </div>

          {/* Tabs avec détails - Optimisation mobile */}
          <Tabs defaultValue="historique" className="space-y-6">
            <StandardizedTabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2" variant="blue">
              <StandardizedTabsTrigger 
                value="historique" 
                variant="blue" 
                icon={<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />}
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-3 min-h-[2.5rem] sm:min-h-[3rem]"
              >
                <span className="hidden sm:inline">Historique</span>
                <span className="sm:hidden leading-tight">Hist.</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger 
                value="projections" 
                variant="blue" 
                icon={<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-3 min-h-[2.5rem] sm:min-h-[3rem]"
              >
                <span className="hidden sm:inline">Projections</span>
                <span className="sm:hidden leading-tight">Proj.</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger 
                value="factures" 
                variant="blue" 
                icon={<Euro className="h-3 w-3 sm:h-4 sm:w-4" />}
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-3 min-h-[2.5rem] sm:min-h-[3rem]"
              >
                <span className="hidden sm:inline">Factures</span>
                <span className="sm:hidden leading-tight">Fact.</span>
              </StandardizedTabsTrigger>
            </StandardizedTabsList>



            {/* Onglet Historique */}
            <TabsContent value="historique">
              {isLoadingHistorique ? (
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Statistiques globales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-700">
                            {historiqueVentes?.statsGlobales?.totalVentes || 0}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Ventes totales</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-700">
                            {historiqueVentes?.statsGlobales?.totalCommissions || 0}€
                          </p>
                          <p className="text-xs text-green-600 mt-1">Commissions</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-700">
                            {historiqueVentes?.statsGlobales?.totalPointsCumules || 0}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">Points CVD</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-700">
                            {historiqueVentes?.statsGlobales?.moyenneVentesParMois || 0}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">Moy./mois</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tendances */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Tendances et performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className={`p-2 rounded-full ${historiqueVentes?.tendances?.ventesEnProgression ? 'bg-green-500' : 'bg-red-500'}`}>
                            <ArrowUp className={`h-4 w-4 ${historiqueVentes?.tendances?.ventesEnProgression ? 'text-white' : 'text-white rotate-180'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ventes en progression</p>
                            <p className="text-xs text-gray-600">
                              {historiqueVentes?.tendances?.ventesEnProgression ? 'En hausse' : 'En baisse'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <div className={`p-2 rounded-full ${historiqueVentes?.tendances?.commissionEnProgression ? 'bg-blue-500' : 'bg-red-500'}`}>
                            <Euro className={`h-4 w-4 text-white`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Commissions en progression</p>
                            <p className="text-xs text-gray-600">
                              {historiqueVentes?.tendances?.commissionEnProgression ? 'En hausse' : 'En baisse'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {historiqueVentes?.tendances?.meilleurePerformance && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Meilleure performance</span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            {new Date(historiqueVentes.tendances.meilleurePerformance.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - 
                            {' '}{historiqueVentes.tendances.meilleurePerformance.nombreVentes} ventes pour {historiqueVentes.tendances.meilleurePerformance.commissionTotale}€
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Historique par mois */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Historique détaillé par mois
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {historiqueVentes?.historiqueParMois && historiqueVentes.historiqueParMois.length > 0 ? (
                          historiqueVentes.historiqueParMois.slice(0, 6).map((mois: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {new Date(mois.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {mois.nombreVentes} ventes • {mois.totalPoints} points • {mois.commissionTotale}€
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {mois.totalPoints} pts
                                  </Badge>
                                </div>
                              </div>

                              {/* Répartition produits */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {mois.repartitionProduits.freeboxUltra > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Ultra: {mois.repartitionProduits.freeboxUltra}</span>
                                  </div>
                                )}
                                {mois.repartitionProduits.freeboxEssentiel > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Essentiel: {mois.repartitionProduits.freeboxEssentiel}</span>
                                  </div>
                                )}
                                {mois.repartitionProduits.freeboxPop > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Pop: {mois.repartitionProduits.freeboxPop}</span>
                                  </div>
                                )}
                                {mois.repartitionProduits.forfait5G > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span>5G: {mois.repartitionProduits.forfait5G}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune donnée historique disponible</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ventes récentes */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Dernières ventes installées
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {historiqueVentes?.ventesRecentes && historiqueVentes.ventesRecentes.length > 0 ? (
                          historiqueVentes.ventesRecentes.slice(0, 10).map((vente: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                              <div>
                                <p className="font-medium text-gray-900">{vente.prenom} {vente.nom}</p>
                                <p className="text-sm text-gray-600">{vente.produit}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">
                                  {vente.produit?.includes('Ultra') ? '6 pts' : 
                                   vente.produit?.includes('Essentiel') ? '5 pts' :
                                   vente.produit?.includes('Pop') ? '4 pts' : '1 pt'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(vente.dateInstallation).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Aucune vente récente</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Onglet Projections - Nouveau barème moderne */}
            <TabsContent value="projections" className="space-y-6">
              {/* Section projections classique compacte */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Projections et objectifs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <h3 className="font-semibold mb-2 text-blue-800">Objectif prochaine tranche</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Il vous reste <span className="font-bold text-blue-600">{pointsProchaineTranche}</span> points 
                        pour atteindre la <span className="font-medium">tranche {prochaineTranche}</span>
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>• {Math.ceil(pointsProchaineTranche / 6)} Freebox Ultra</span>
                          <span className="text-gray-500">ou</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {Math.ceil(pointsProchaineTranche / 5)} Freebox Essentiel</span>
                          <span className="text-gray-500">ou</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {Math.ceil(pointsProchaineTranche / 4)} Freebox Pop</span>
                          <span className="text-gray-500">ou</span>
                        </div>
                        <div>• {pointsProchaineTranche} Forfait 5G</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <h3 className="font-semibold mb-2 text-green-800">Projection fin de mois</h3>
                      <p className="text-sm text-gray-600">
                        À ce rythme, vous pourriez atteindre <span className="font-medium text-gray-900">{pointsCVD + 10}</span> points 
                        et <span className="font-medium text-green-600">{Math.round(commissionTotale * 1.1)}€</span> de commission.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Basé sur votre performance actuelle
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nouveau barème de commissions moderne */}
              {tiers && (
                <BaremeCommissionsModerne 
                  commissionTiers={tiers}
                  currentTranche={tranche}
                  onTrancheClick={(trancheClicked) => {
                    if (trancheClicked === 3) {
                      setIsTrancheModalOpen(true);
                    }
                  }}
                />
              )}
            </TabsContent>

            {/* Onglet Factures */}
            <TabsContent value="factures" className="space-y-6">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Factures de Commission
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez vos factures de commission mensuelles au format PDF
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Composant Factures optimisé mobile */}
                  <div className="p-6 space-y-6">
                    {/* Carte facture principale */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 shadow-lg">
                      {/* Effet de brillance en arrière-plan */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
                      
                      <div className="relative p-6">
                        {/* Header avec icône et badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Juin 2025</h3>
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Disponible
                              </div>
                            </div>
                          </div>
                          
                          {/* Montant de commission */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{commissionTotale}€</div>
                            <div className="text-sm text-gray-600">Commission</div>
                          </div>
                        </div>

                        {/* Détails de la facture */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                            <div className="text-sm text-gray-600">Installations</div>
                            <div className="text-lg font-semibold text-gray-900">{installationsDuMois.length}</div>
                          </div>
                          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                            <div className="text-sm text-gray-600">Points CVD</div>
                            <div className="text-lg font-semibold text-gray-900">{pointsCVD}</div>
                          </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex flex-col gap-3">
                          <Button
                            onClick={() => {
                              if (user?.id) {
                                window.open(`/api/factures/test-pdf/${user.id}/2025-06`, '_blank');
                              }
                            }}
                            variant="outline"
                            className="w-full bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </Button>
                          <Button
                            onClick={async () => {
                              if (!user?.id) return;
                              
                              try {
                                const response = await fetch(`/api/factures/test-pdf/${user.id}/2025-06`, {
                                  method: 'GET',
                                  credentials: 'include',
                                });

                                if (!response.ok) {
                                  throw new Error('Erreur lors du téléchargement');
                                }

                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `facture-commission-juin-2025.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Erreur téléchargement facture:', error);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Message informatif */}
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">
                        Facture générée automatiquement avec vos commissions CVD
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Basée sur {installationsDuMois.length} installations validées en juin 2025
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Modal des montants de commission par produit */}
      <Dialog open={isTrancheModalOpen} onOpenChange={setIsTrancheModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Tranche {tranche} - Montants de Commission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Produits Freebox</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Freebox Ultra (6 pts)</span>
                  <span className="font-bold text-blue-600">
                    {tiers && tiers[tranche - 1] ? `${tiers[tranche - 1].freebox_ultra}€` : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Freebox Essentiel (5 pts)</span>
                  <span className="font-bold text-blue-600">
                    {tiers && tiers[tranche - 1] ? `${tiers[tranche - 1].freebox_essentiel}€` : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Freebox Pop (4 pts)</span>
                  <span className="font-bold text-blue-600">
                    {tiers && tiers[tranche - 1] ? `${tiers[tranche - 1].freebox_pop}€` : '...'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">Forfait Mobile</h3>
              <div className="flex justify-between">
                <span className="text-sm">Forfait 5G (1 pt)</span>
                <span className="font-bold text-green-600">
                  {tiers && tiers[tranche - 1] ? `${tiers[tranche - 1].forfait_5g}€` : '...'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                Tranche {tranche}: {tranche === 1 ? '0-25' : tranche === 2 ? '26-50' : tranche === 3 ? '51-100' : '101+'} points
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Interface pour les factures disponibles
interface FactureDisponible {
  mois: string;
  libelle: string;
  installations: number;
}



// Composant pour l'onglet Factures (version originale)
function FacturesTab() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: facturesDisponibles = [], isLoading: isLoadingFactures } = useQuery({
    queryKey: ['/api/factures/disponibles', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Type guard pour s'assurer que user existe
  if (!user?.id) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures de Commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Connexion requise pour accéder aux factures</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const telechargerFacture = async (mois: string) => {
    try {
      const response = await fetch(`/api/factures/commission/${user.id}/${mois}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `facture-commission-${mois}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement facture:', error);
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Factures de Commission
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Téléchargez vos factures de commission mensuelles au format PDF
        </p>
      </CardHeader>
      <CardContent>
        {isLoadingFactures ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des factures...</p>
            </div>
          </div>
        ) : !Array.isArray(facturesDisponibles) || facturesDisponibles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune facture disponible</p>
            <p className="text-sm mt-2">Les factures sont générées après vos installations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(facturesDisponibles as FactureDisponible[]).map((facture: FactureDisponible) => (
              <div key={facture.mois} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{facture.libelle}</h3>
                    <p className="text-sm text-gray-600">
                      {facture.installations} installation{facture.installations > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => telechargerFacture(facture.mois)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}