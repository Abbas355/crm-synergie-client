import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, TrendingUp, Target, Users, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';

interface ProjectionData {
  // Période
  joursEcoules: number;
  joursRestants: number;
  totalJoursMois: number;
  progressionMois: number;
  
  // Données actuelles
  ventesActuelles: number;
  pointsActuels: number;
  commissionActuelle: number;
  trancheActuelle: number;
  
  // Moyennes journalières
  moyenneVentesJour: number;
  moyennePointsJour: number;
  moyenneCommissionJour: number;
  
  // Projections
  ventesProjectees: number;
  pointsProjectes: number;
  commissionProjectee: number;
  
  // Totaux fin de mois
  totalVentesFinMois: number;
  totalPointsFinMois: number;
  totalCommissionFinMois: number;
  trancheProjetee: number;
  commissionPreciseProjetee: number;
  
  // Analyses
  ameliorationTranche: boolean;
  gainCommissionSupplement: number;
  
  // Détails produits
  freeboxCount: number;
  forfait5gCount: number;
}

export default function ProjectionsFinMoisPage() {
  const [, setLocation] = useLocation();

  const { data: projections, isLoading, error } = useQuery<ProjectionData>({
    queryKey: ['/api/ventes/projections-fin-mois'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  console.log('🔍 Projections Debug:', { projections, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !projections) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-600">Impossible de charger les projections fin de mois.</p>
          </div>
        </div>
      </div>
    );
  }

  // Définir les couleurs de tranche
  const getTrancheColor = (tranche: number) => {
    switch (tranche) {
      case 1: return 'text-gray-600 bg-gray-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-green-600 bg-green-100';
      case 4: return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/admin/facturation')}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-800 group-hover:-translate-x-0.5 transition-all duration-300" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Retour</span>
            </button>
            
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Projections Fin de Mois
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Analyse des performances et estimations de fin de période
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Section progression du mois */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Progression du Mois</h2>
              <p className="text-sm text-gray-600">Juillet 2025 - Analyse temporelle</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projections.joursEcoules}</div>
              <div className="text-sm text-gray-600">Jours écoulés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{projections.joursRestants}</div>
              <div className="text-sm text-gray-600">Jours restants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{projections.progressionMois}%</div>
              <div className="text-sm text-gray-600">Progression</div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${projections.progressionMois}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Moyennes journalières basées sur la capture d'écran utilisateur */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Moyennes Actuelles</h2>
              <p className="text-sm text-gray-600">Performance quotidienne mesurée</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">{projections.moyenneVentesJour}</div>
                  <div className="text-sm text-blue-600">vente/jour</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">{projections.moyennePointsJour}</div>
                  <div className="text-sm text-green-600">pts/jour</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">{projections.moyenneCommissionJour}€</div>
                  <div className="text-sm text-orange-600">/jour</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Données actuelles vs Projections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Situation actuelle */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Situation Actuelle</h3>
                <p className="text-sm text-gray-600">Performance à ce jour</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ventes installées</span>
                <span className="font-bold text-gray-900">{projections.ventesActuelles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Points CVD</span>
                <span className="font-bold text-gray-900">{projections.pointsActuels}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Commission</span>
                <span className="font-bold text-gray-900">{projections.commissionActuelle}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tranche</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrancheColor(projections.trancheActuelle)}`}>
                  Tranche {projections.trancheActuelle}
                </span>
              </div>
            </div>
          </div>

          {/* Projections fin de mois */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Projections Fin de Mois</h3>
                <p className="text-sm text-gray-600">Estimation basée sur les moyennes</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total ventes projetées</span>
                <span className="font-bold text-purple-600">{projections.totalVentesFinMois}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total points CVD</span>
                <span className="font-bold text-purple-600">{projections.totalPointsFinMois}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Commission projetée</span>
                <span className="font-bold text-purple-600">{projections.totalCommissionFinMois}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tranche projetée</span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrancheColor(projections.trancheProjetee)}`}>
                    Tranche {projections.trancheProjetee}
                  </span>
                  {projections.ameliorationTranche && (
                    <span className="text-green-600 text-sm font-medium">↑ Amélioration</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gain supplémentaire */}
        {projections.gainCommissionSupplement > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Gain Supplémentaire Potentiel</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{projections.gainCommissionSupplement}€
              </div>
              <p className="text-sm text-green-700">
                Grâce au changement de tranche projeté
              </p>
            </div>
          </div>
        )}

        {/* Détails des ventes par produit */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition des Ventes Actuelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{projections.freeboxCount}</div>
                <div className="text-sm text-blue-700">Freebox installées</div>
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{projections.forfait5gCount}</div>
                <div className="text-sm text-indigo-700">Forfaits 5G installés</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}