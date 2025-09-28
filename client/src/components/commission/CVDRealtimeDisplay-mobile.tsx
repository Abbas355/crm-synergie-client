import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award, Clock, Zap, ChevronRight } from "lucide-react";

interface CVDRealtimeDisplayProps {
  data: {
    commissionsParTranche: { [tranche: number]: number };
    commissionsDetaillees: Array<{
      palier: number;
      pointsCumules: number;
      tranche: number;
      produit: string;
      commission: number;
      client: string;
    }>;
    totalCommission: number;
    pointsTotal: number;
    trancheFinale: number;
    paliersAtteints: number[];
  } | null;
}

const CVDRealtimeDisplayMobile: React.FC<CVDRealtimeDisplayProps> = ({ data }) => {
  if (!data) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-32 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrancheCouleur = (tranche: number) => {
    const couleurs = {
      1: 'from-blue-500 to-blue-600',
      2: 'from-emerald-500 to-emerald-600', 
      3: 'from-purple-500 to-purple-600',
      4: 'from-orange-500 to-orange-600'
    };
    return couleurs[tranche as keyof typeof couleurs] || 'from-gray-500 to-gray-600';
  };

  const getTrancheNom = (tranche: number) => {
    const noms = {
      1: 'Débutant',
      2: 'Confirmé',
      3: 'Expert', 
      4: 'Elite'
    };
    return noms[tranche as keyof typeof noms] || `Tranche ${tranche}`;
  };

  return (
    <div className="space-y-4">
      {/* Résumé principal optimisé mobile */}
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-0 shadow-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">CVD Temps Réel</h3>
              <p className="text-sm text-gray-600">Commission progressive instantanée</p>
            </div>
          </div>

          {/* Métriques principales - grille 2x2 mobile */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-white/80 rounded-xl border border-blue-100/50 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">{data.totalCommission}€</div>
              <div className="text-xs text-gray-600">Commission</div>
            </div>
            <div className="text-center p-4 bg-white/80 rounded-xl border border-emerald-100/50 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{data.pointsTotal}</div>
              <div className="text-xs text-gray-600">Points</div>
            </div>
            <div className="text-center p-4 bg-white/80 rounded-xl border border-purple-100/50 shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-1">T{data.trancheFinale}</div>
              <div className="text-xs text-gray-600">Tranche</div>
            </div>
            <div className="text-center p-4 bg-white/80 rounded-xl border border-orange-100/50 shadow-sm">
              <div className="text-2xl font-bold text-orange-600 mb-1">{data.paliersAtteints.length}</div>
              <div className="text-xs text-gray-600">Paliers</div>
            </div>
          </div>

          {/* Badge de tranche actuelle */}
          <div className="flex justify-center mb-6">
            <div className={`px-4 py-2 bg-gradient-to-r ${getTrancheCouleur(data.trancheFinale)} rounded-full shadow-lg`}>
              <span className="text-white font-semibold text-sm">
                🏆 {getTrancheNom(data.trancheFinale)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail des paliers - Version mobile compacte */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Paliers Atteints</h4>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {data.paliersAtteints.length} paliers
            </Badge>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.commissionsDetaillees.map((commission, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg border border-gray-100/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 bg-gradient-to-r ${getTrancheCouleur(commission.tranche)} text-white border-0`}
                    >
                      {commission.palier}pts
                    </Badge>
                    <span className="text-sm font-medium text-gray-800">
                      {commission.client}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {commission.produit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">
                    {commission.commission}€
                  </div>
                  <div className="text-xs text-gray-500">
                    T{commission.tranche}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Répartition par tranche */}
      {Object.keys(data.commissionsParTranche).length > 1 && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-800 mb-4">Répartition par Tranche</h4>
            <div className="space-y-3">
              {Object.entries(data.commissionsParTranche).map(([tranche, montant]) => (
                <div key={tranche} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getTrancheCouleur(parseInt(tranche))}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      Tranche {tranche}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {montant}€
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVDRealtimeDisplayMobile;