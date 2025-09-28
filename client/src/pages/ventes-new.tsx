import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Euro, 
  Users, 
  TrendingUp, 
  BarChart3, 
  History, 
  Target, 
  Search,
  Zap,
  Calculator
} from "lucide-react";
import CVDCalculationBreakdown from "@/components/commission/CVDCalculationBreakdown";
import CVDRealtimeDisplay from "@/components/commission/CVDRealtimeDisplay";
import TrancheDetailsModal from "@/components/commission/TrancheDetailsModal";
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

interface BaremeData {
  tranche: string;
  pointsMin: number;
  pointsMax: number;
  commission: number;
  description: string;
}

// Types pour les données CVD
interface CVDDetailsData {
  tranche: number;
  totalPoints: number;
  totalCommission: number;
  installationsParProduit: {
    produit: string;
    installations: number;
    pointsParInstallation: number;
    pointsTotaux: number;
    tranche: number;
    commissionParInstallation: number;
    commissionTotale: number;
  }[];
  periode: string;
}

interface ClientStatsData {
  clientsCeMois: number;
  installations: number;
  ptsGeneresCeMois: number;
  clientsARelancer: number;
  nombreDeBox: number;
  nbForfait5G: number;
}

export default function VentesNewPage() {
  const [activeTab, setActiveTab] = useState<'bar' | 'hist' | 'proj' | 'realtime'>('realtime');
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false);
  
  // Récupérer les données CVD temps réel
  const { data: cvdRealtime, isLoading: isLoadingCVD } = useQuery({
    queryKey: ["/api/cvd/realtime"],
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });
  const [showTrancheModal, setShowTrancheModal] = useState(false);
  const [selectedTranche, setSelectedTranche] = useState<number>(1);
  const [useProgressiveSystem, setUseProgressiveSystem] = useState(false);
  
    console.log('🔍 État showDetailedCalculation:', showDetailedCalculation);
  const [, setLocation] = useLocation();

  // Récupération des statistiques de ventes avec CVD
  const { data: ventesStats, isLoading } = useQuery<VentesStats>({
    queryKey: ['/api/ventes/stats'],
    retry: 1,
  });

  // Récupération des statistiques clients (même endpoint que page clients pour "installations en cours")
  const { data: clientStats } = useQuery<ClientStatsData>({
    queryKey: ['/api/stats/detailed'],
    retry: 1,
  });

  // Récupération des données CVD détaillées par produit (VRAIES DONNÉES)
  const { data: cvdDetails, isLoading: cvdLoading } = useQuery<CVDDetailsData>({
    queryKey: ['/api/ventes/stats-detailed'],
    retry: 1,
  });

  // Récupération des données CVD progressives (déclenchement tous les 5 points)
  const { data: cvdProgressive, isLoading: cvdProgressiveLoading } = useQuery<any>({
    queryKey: ['/api/ventes/cvd-progressive'],
    enabled: useProgressiveSystem,
    retry: 1,
  });

  // Query pour récupérer le total des points générés par TOUS les clients
  const { data: totalPointsData, error: totalPointsError, isLoading: totalPointsLoading } = useQuery({
    queryKey: ['/api/total-points-generated', 'v2'], // Version 2 pour forcer refresh
    refetchInterval: 30000, // Refetch toutes les 30 secondes
    staleTime: 0, // Pas de cache pour forcer le refresh
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Debug pour voir les données chargées + Force invalidation cache
  React.useEffect(() => {
    console.log('🔍 DEBUG totalPointsData:', totalPointsData);
    console.log('🔍 DEBUG totalPointsError:', totalPointsError);
    console.log('🔍 DEBUG totalPointsLoading:', totalPointsLoading);
    if (totalPointsData) {
      console.log('✅ DONNÉES REÇUES:', (totalPointsData as any)?.totalPointsGenerated, 'points');
    }
    
    // Force l'invalidation du cache au montage du composant
    if (typeof window !== 'undefined') {
      // Clear localStorage cache si il existe
      Object.keys(localStorage).forEach(key => {
        if (key.includes('total-points') || key.includes('ventes')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [totalPointsData, totalPointsError, totalPointsLoading]);

  // Barème des commissions COMPLET (toutes les tranches)
  const baremeData: BaremeData[] = [
    {
      tranche: "Tranche débutant",
      pointsMin: 0,
      pointsMax: 25,
      commission: 50,
      description: "50€/Box • 10€/5G"
    },
    {
      tranche: "Tranche confirmé",
      pointsMin: 26,
      pointsMax: 50,
      commission: 70,
      description: "60-80€/Box • 10€/5G"
    },
    {
      tranche: "Tranche expert",
      pointsMin: 51,
      pointsMax: 100,
      commission: 90,
      description: "70-100€/Box • 10€/5G"
    },
    {
      tranche: "Tranche excellence",
      pointsMin: 101,
      pointsMax: 999,
      commission: 120,
      description: "90-120€/Box • 10€/5G"
    }
  ];

  const getCurrentTranche = (points: number) => {
    if (points >= 101) return 4;  // Tranche 4: 101+ points
    if (points >= 51) return 3;   // Tranche 3: 51-100 points
    if (points >= 26) return 2;   // Tranche 2: 26-50 points
    return 1;                     // Tranche 1: 0-25 points
  };

  // ✅ DIAGNOSTIC COMPLET - priorité CVD Temps Réel
  const currentTranche = useMemo(() => {
    console.log("🔍 DIAGNOSTIC TRANCHES:");
    console.log("cvdRealtime:", cvdRealtime);
    console.log("cvdDetails:", cvdDetails);
    console.log("clientStats:", clientStats);
    
    // PRIORITÉ 1: CVD Temps Réel (données les plus précises)
    if (cvdRealtime && (cvdRealtime as any).trancheFinale) {
      console.log(`🎯 TRANCHE CVD TEMPS RÉEL: ${(cvdRealtime as any).trancheFinale} (${(cvdRealtime as any).pointsTotal} points, ${(cvdRealtime as any).totalCommission}€)`);
      return (cvdRealtime as any).trancheFinale;
    }
    
    // PRIORITÉ 2: CVD Details
    if (cvdDetails && (cvdDetails as any).tranche) {
      console.log(`🎯 TRANCHE ACTUELLE CVD RÉELLE: ${(cvdDetails as any).tranche} (${(cvdDetails as any).totalPoints} points)`);
      return (cvdDetails as any).tranche;
    }
    
    // PRIORITÉ 3: Fallback avec clientStats
    if (clientStats && clientStats.ptsGeneresCeMois) {
      const calculatedTranche = getCurrentTranche(clientStats.ptsGeneresCeMois);
            return calculatedTranche;
    }
    
    console.log("⚠️ AUCUNE DONNÉE DISPONIBLE - RETOUR TRANCHE 1");
    return 1;
  }, [cvdRealtime, cvdDetails, clientStats]);

  // Fonctions pour gérer les tranches cliquables
  const handleTrancheClick = (trancheNumber: number) => {
        setSelectedTranche(trancheNumber);
    setShowTrancheModal(true);
  };

  // ✅ CALCUL COMMISSION CVD OFFICIEL - priorité CVD Temps Réel
  const commissionReelle = useMemo(() => {
    // PRIORITÉ 1: CVD Temps Réel (données les plus précises)
    if (cvdRealtime && (cvdRealtime as any).totalCommission) {
      return (cvdRealtime as any).totalCommission;
    }
    
    // PRIORITÉ 2: Système progressif
    if (useProgressiveSystem && cvdProgressive) {
      return (cvdProgressive as any).totalCommission;
    }
    
    // PRIORITÉ 3: CVD Details
    if (cvdDetails) {
      return cvdDetails.totalCommission;
    }
    
    // PRIORITÉ 4: Fallback avec clientStats
    if (!clientStats) return 0;
    const points = clientStats.ptsGeneresCeMois || 0;
    
    let tranche = 1;
    if (points >= 101) tranche = 4;
    else if (points >= 51) tranche = 3;
    else if (points >= 26) tranche = 2;
    else tranche = 1;
    
    const estimationCommission = Math.floor(points / 6) * (tranche === 1 ? 50 : tranche === 2 ? 80 : tranche === 3 ? 100 : 120);
    
        return estimationCommission;
  }, [cvdRealtime, cvdDetails, cvdProgressive, clientStats, useProgressiveSystem]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des données de ventes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 pb-24">
        
        {/* Header avec titre moderne */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Ventes
          </h1>
          <p className="text-gray-600">Aperçu de vos performances commerciales</p>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Ventes du mois - CLIQUABLE */}
          <div 
            className="relative bg-white/90 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer active:scale-95 rounded-lg w-full"
            style={{ 
              zIndex: 9999,
              position: 'relative',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🚀 Navigation vers installations du mois optimisée');
              // ✅ NAVIGATION OPTIMISÉE - React Router au lieu de window.location.href
              setLocation('/clients?custom=installations');
            }}
            title="Cliquez pour voir les installations du mois"
          >
            <div className="p-5 text-center pointer-events-none">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {clientStats?.installations || 0}
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                Ventes
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Du mois
              </div>
            </div>
          </div>

          {/* Commissions Personnelles avec détail CVD - CLIQUABLE POUR DÉTAILS */}
          <div
            className="relative bg-white/90 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer active:scale-95 rounded-lg"
            style={{ 
              zIndex: 9999,
              position: 'relative',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🚀 Ouverture détail CVD');
              setShowDetailedCalculation(true);
            }}
            title="Cliquez pour voir le détail complet du calcul CVD"
          >
            <div className="p-5 text-center pointer-events-none">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 group-hover:scale-110 transition-all duration-300">
                <Euro className="h-7 w-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {commissionReelle || 0}€
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                Commissions
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Calculator className="h-3 w-3" />
                {useProgressiveSystem ? 
                  'Progressif • CLIC ICI' :
                  cvdDetails ? 
                    `Tranche ${cvdDetails.tranche} • CLIC ICI` : 
                    'CVD • CLIC ICI'
                }
              </div>
              <div className="text-xs text-green-600 mt-1 font-bold bg-green-100 px-2 py-1 rounded animate-pulse">
                👆 CLIQUEZ POUR VOIR LE DÉTAIL
              </div>
            </div>
          </div>

          {/* Clients à relancer */}
          <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
            <CardContent className="p-5 text-center">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-2xl w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {clientStats?.clientsARelancer || 0}
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                Clients
              </div>
              <div className="text-xs text-gray-500 mt-1">
                À relancer
              </div>
            </CardContent>
          </Card>

          {/* CARTE TOTAL POINTS GÉNÉRÉS - VERSION FORCÉE SANS CACHE */}
          <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group" key="total-points-v3">
            <CardContent className="p-5 text-center">
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-3 rounded-2xl w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-110 transition-all duration-300">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {totalPointsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
                ) : totalPointsError ? (
                  <span className="text-red-500 text-sm">Erreur</span>
                ) : (
                  <span className="text-orange-600 font-extrabold">
                    {(totalPointsData as any)?.totalPointsGenerated || 0}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                🚀 TOTAL POINTS 🚀
              </div>
              <div className="text-xs text-gray-500 mt-1">
                TOUS LES CLIENTS
              </div>
              <div className="text-xs text-orange-600 mt-1 font-bold">
                📊 DONNÉES RÉELLES
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calcul détaillé étape par étape - Affiché selon demande avec VRAIES DONNÉES */}
        {showDetailedCalculation && ((cvdDetails as any)?.totalPoints > 0 || (clientStats?.ptsGeneresCeMois || 0) > 0) && (
          <div className="mb-6">
            <CVDCalculationBreakdown 
              points={(cvdDetails as any)?.totalPoints || clientStats?.ptsGeneresCeMois || 0}
              commission={commissionReelle}
              cvdDetails={cvdDetails as any}
            />
          </div>
        )}

        {/* Section Commission CVD */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Commission CVD
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {useProgressiveSystem ? 'Système Progressif (déclenchement tous les 5 pts)' : 'Système de Commission Variable Progressive'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={!useProgressiveSystem ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseProgressiveSystem(false)}
                    className="text-xs"
                  >
                    Par Tranche
                  </Button>
                  <Button
                    variant={useProgressiveSystem ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseProgressiveSystem(true)}
                    className="text-xs"
                  >
                    Progressif
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-white/80 backdrop-blur-sm border-gray-200/50 focus:bg-white focus:border-blue-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Onglets modernisés */}
          <div className="flex space-x-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50">
            <Button
              variant={activeTab === 'bar' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('bar')}
              className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                activeTab === 'bar' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Générale
            </Button>
            <Button
              variant={activeTab === 'hist' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('hist')}
              className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                activeTab === 'hist' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <History className="h-4 w-4" />
              Hist.
            </Button>
            <Button
              variant={activeTab === 'proj' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('proj')}
              className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                activeTab === 'proj' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <Target className="h-4 w-4" />
              Proj.
            </Button>
            <Button
              variant={activeTab === 'realtime' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('realtime')}
              className={`flex items-center gap-2 rounded-lg transition-all duration-300 ${
                activeTab === 'realtime' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <Zap className="h-4 w-4" />
              Temps Réel
            </Button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'realtime' && (
            <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  CVD Temps Réel - Calcul par Paliers
                </CardTitle>
                <p className="text-emerald-100 text-sm mt-2">
                  Commission calculée chronologiquement avec déclenchement exact aux paliers de 5 points
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingCVD ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Calcul CVD temps réel en cours...</p>
                  </div>
                ) : cvdRealtime ? (
                  <CVDRealtimeDisplay data={cvdRealtime as any} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Données CVD temps réel indisponibles</p>
                    <p className="text-sm mt-2">Vérification des données en cours...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'bar' && (
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Barème de Commission CVD
                </CardTitle>
                <p className="text-slate-300 text-sm mt-2">
                  Commission Variable Progressive par tranche de performance
                </p>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                {baremeData.map((tranche, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                      currentTranche === index + 1
                        ? 'border-blue-400 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-102'
                        : 'border-slate-600/50 bg-slate-700/20 cursor-not-allowed opacity-70'
                    }`}
                    onClick={() => currentTranche === index + 1 && handleTrancheClick(index + 1)}
                    title={currentTranche === index + 1 ? `Cliquez pour voir les détails de la ${tranche.tranche}` : 'Seule votre tranche actuelle est consultable'}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        {currentTranche === index + 1 && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                        {tranche.tranche}
                      </h3>
                      <Badge
                        variant={currentTranche === index + 1 ? 'default' : 'secondary'}
                        className={`px-3 py-1 text-sm font-bold ${
                          currentTranche === index + 1 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-600 text-slate-200'
                        }`}
                      >
                        {tranche.commission}€
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-200 mb-3 font-medium">
                      {tranche.pointsMin} - {tranche.pointsMax === 999 ? '∞' : tranche.pointsMax} points
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tranche.description}
                    </p>
                    {currentTranche === index + 1 ? (
                      <div className="mt-3 text-xs text-blue-300 font-bold bg-blue-500/20 px-3 py-1 rounded-full text-center animate-pulse">
                        👆 VOTRE TRANCHE ACTUELLE • CLIQUEZ POUR DÉTAILS
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-slate-500 font-medium bg-slate-700/30 px-3 py-1 rounded-full text-center">
                        🔒 Tranche non accessible
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'hist' && (
            <div className="space-y-6">
              <HistoriqueCommissions />
            </div>
          )}

          {activeTab === 'proj' && (
            <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-gray-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  Projections d'Objectifs
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Progression vers la tranche de commission supérieure
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Objectif Tranche Suivante
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{clientStats?.ptsGeneresCeMois || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">Points actuels</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{Math.max(0, Math.ceil(((clientStats?.ptsGeneresCeMois || 0) + 5) / 5) * 5 - (clientStats?.ptsGeneresCeMois || 0))}</p>
                        <p className="text-sm text-gray-600 font-medium">Points restants</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progression</span>
                        <span>
                          {Math.round(((clientStats?.ptsGeneresCeMois || 0) / Math.max(1, Math.ceil(((clientStats?.ptsGeneresCeMois || 0) + 5) / 5) * 5)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                          style={{ 
                            width: `${Math.min(((clientStats?.ptsGeneresCeMois || 0) / Math.max(1, Math.ceil(((clientStats?.ptsGeneresCeMois || 0) + 5) / 5) * 5)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <h4 className="font-semibold text-green-800 mb-2">Commission Actuelle</h4>
                      <p className="text-2xl font-bold text-green-600">{commissionReelle || 0}€</p>
                      <p className="text-xs text-green-700 mt-1">Tranche {currentTranche}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <h4 className="font-semibold text-orange-800 mb-2">Prochaine Commission</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {currentTranche < 4 ? `${baremeData[currentTranche]?.commission || 0}€` : '125€'}
                      </p>
                      <p className="text-xs text-orange-700 mt-1">Tranche {Math.min(currentTranche + 1, 4)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Modal détails tranche */}
      <TrancheDetailsModal 
        isOpen={showTrancheModal}
        onClose={() => setShowTrancheModal(false)}
        trancheNumber={selectedTranche}
      />
    </AppLayout>
  );
}