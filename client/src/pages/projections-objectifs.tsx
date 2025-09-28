import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Target, Calculator, BarChart3, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface VentesStats {
  ventes: number;
  installations: number;
  totalPoints: number;
  commission: number;
  palier: number;
  pointsRestants: number;
  ventesEnAttente: number;
  freeboxCount: number;
  forfait5gCount: number;
}

interface ProjectionData {
  pointsActuels: number;
  commissionActuelle: number;
  trancheActuelle: number;
  pointsRestants: number;
  prochainPalier: number;
  projectionFinMois: {
    points: number;
    commission: number;
  };
  objectifProchainPalier: {
    pointsRequis: number;
    optionsProduits: string[];
  };
}

export default function ProjectionsObjectifsPage() {
  const [, setLocation] = useLocation();

  // Utiliser uniquement l'endpoint /api/ventes/stats qui contient les vraies données
  const { data: ventesStats, isLoading } = useQuery<VentesStats>({
    queryKey: ['/api/ventes/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug des données reçues
  console.log('🔍 Projections Debug:');
  console.log('ventesStats:', ventesStats);
  console.log('isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ventesStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto text-center py-20">
          <p className="text-gray-500">Données non disponibles</p>
        </div>
      </div>
    );
  }

  // Calculer les données de projection à partir des ventesStats
  const currentPoints = ventesStats.totalPoints;
  const currentCommission = ventesStats.commission;
  
  // Déterminer la tranche actuelle basée sur les points
  const getCurrentTranche = (points: number) => {
    if (points >= 101) return 4;
    if (points >= 51) return 3;
    if (points >= 26) return 2;
    return 1;
  };
  
  const currentTranche = getCurrentTranche(currentPoints);
  
  // Calculer les points restants pour la tranche suivante
  const getPointsToNextTranche = (points: number) => {
    if (points < 26) return 26 - points;
    if (points < 51) return 51 - points;
    if (points < 101) return 101 - points;
    return 0; // Déjà au maximum
  };
  
  const pointsToNext = getPointsToNextTranche(currentPoints);
  const nextTranche = currentTranche < 4 ? currentTranche + 1 : 4;
  
  // Options produits pour atteindre la prochaine tranche
  const getProductOptions = (pointsNeeded: number) => {
    if (pointsNeeded === 0) return ["Vous êtes déjà à la tranche maximale"];
    return [
      `• Freebox Ultra (6 points) - ${Math.ceil(pointsNeeded / 6)} vente${Math.ceil(pointsNeeded / 6) > 1 ? 's' : ''}`,
      `• Freebox Essentiel (5 points) - ${Math.ceil(pointsNeeded / 5)} vente${Math.ceil(pointsNeeded / 5) > 1 ? 's' : ''}`,
      `• Freebox Pop (4 points) - ${Math.ceil(pointsNeeded / 4)} vente${Math.ceil(pointsNeeded / 4) > 1 ? 's' : ''}`,
      `• Forfait 5G (1 point) - ${pointsNeeded} vente${pointsNeeded > 1 ? 's' : ''}`
    ];
  };
  
  // Projection fin de mois (estimation simplifiée)
  const projectedPoints = Math.round(currentPoints * 1.1); // +10%
  const projectedCommission = Math.round(currentCommission * 1.1); // +10%

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setLocation('/ventes')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Retour aux Ventes</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Projections et Objectifs
              </h1>
              <p className="text-gray-600">Analysez vos performances et objectifs CVD</p>
            </div>
          </div>
        </div>

        {/* Grille des cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-4">
          {/* Situation actuelle */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl p-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Situation Actuelle</h3>
                <p className="text-sm text-gray-600">Vos performances en cours</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Points CVD cumulés</span>
                <span className="font-bold text-2xl text-blue-600">{ventesStats?.totalPoints || 0}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Commission actuelle</span>
                <span className="font-bold text-2xl text-green-600">{ventesStats?.commission || 0}€</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tranche CVD</span>
                <span className="font-bold text-2xl text-purple-600">Tranche {currentTranche}</span>
              </div>
            </div>
          </div>

          {/* Objectif prochain palier */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl p-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Objectif Prochain Palier</h3>
                <p className="text-sm text-gray-600">{pointsToNext} points pour atteindre la tranche {nextTranche}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Options produits</h4>
                <div className="space-y-1">
                  {getProductOptions(pointsToNext).map((option, index) => (
                    <div key={index} className="text-sm text-green-700">
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projection fin de mois */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl p-3 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Projection Fin de Mois</h3>
                <p className="text-sm text-gray-600">Estimations basées sur votre rythme actuel</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-purple-600 mb-2">Points estimés fin de mois</p>
                <p className="text-2xl font-bold text-purple-800">{projectedPoints} points</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-purple-600 mb-2">Commission estimée fin de mois</p>
                <p className="text-2xl font-bold text-purple-800">{projectedCommission}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}