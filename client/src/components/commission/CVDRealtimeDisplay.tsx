import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award, Clock } from "lucide-react";

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
  };
}

const CVDRealtimeDisplay: React.FC<CVDRealtimeDisplayProps> = ({ data }) => {
  const getTrancheCouleur = (tranche: number) => {
    const couleurs = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200', 
      3: 'bg-purple-100 text-purple-800 border-purple-200',
      4: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return couleurs[tranche as keyof typeof couleurs] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Résumé principal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{data.totalCommission}€</div>
            <div className="text-sm text-emerald-600">Commission Totale</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{data.pointsTotal}</div>
            <div className="text-sm text-blue-600">Points Total</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{data.trancheFinale}</div>
            <div className="text-sm text-purple-600">Tranche Actuelle</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{data.paliersAtteints.length}</div>
            <div className="text-sm text-amber-600">Paliers Atteints</div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions par tranche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Commissions par Tranche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(data.commissionsParTranche).map(([tranche, montant]) => (
              <div key={tranche} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge className={getTrancheCouleur(parseInt(tranche))}>
                    Tranche {tranche}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {tranche === '1' ? '0-25 points' : 
                     tranche === '2' ? '26-50 points' :
                     tranche === '3' ? '51-75 points' : '76+ points'}
                  </span>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {montant}€
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chronologie des commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chronologie des Commissions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Déclenchement aux paliers : {data.paliersAtteints.map(p => `${p}pts`).join(', ')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.commissionsDetaillees.map((detail, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white">
                    Palier {detail.palier}pts
                  </Badge>
                  <Badge className={getTrancheCouleur(detail.tranche)}>
                    T{detail.tranche}
                  </Badge>
                  <div className="text-sm">
                    <div className="font-medium">{detail.client}</div>
                    <div className="text-gray-600">{detail.produit}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    +{detail.commission}€
                  </div>
                  <div className="text-xs text-gray-500">
                    {detail.pointsCumules} pts cumulés
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explication du système */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-700">Système CVD Temps Réel</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>✅ <strong>Déclenchement par paliers :</strong> Commissions générées aux paliers de 5pts (5, 10, 15, 20...)</p>
          <p>✅ <strong>Progression de tranche :</strong> Changement automatique selon points cumulés (T1: 0-25, T2: 26-50, T3: 51-75, T4: 76+)</p>
          <p>✅ <strong>Commission variable :</strong> Montant selon tranche actuelle au moment du palier franchi</p>
          <p>✅ <strong>Total par addition :</strong> Résultat final = somme de toutes les tranches</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVDRealtimeDisplay;