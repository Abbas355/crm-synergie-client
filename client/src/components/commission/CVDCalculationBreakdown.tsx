import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Calculator, TrendingUp, Award } from "lucide-react";

interface CVDCalculationBreakdownProps {
  points: number;
  commission: number;
  cvdDetails?: {
    tranche: number;
    totalPoints: number;
    totalCommission: number;
    installationsParProduit: Array<{
      produit: string;
      installations: number;
      pointsParInstallation: number;
      pointsTotaux: number;
      tranche: number;
      commissionParInstallation: number;
      commissionTotale: number;
    }>;
    periode: string;
  };
}

export default function CVDCalculationBreakdown({ points, commission, cvdDetails }: CVDCalculationBreakdownProps) {
  // ✅ CALCUL CVD OFFICIEL détaillé étape par étape avec VRAIES DONNÉES
  const getCalculationSteps = () => {
    const steps = [];
    
    // Utiliser les données réelles si disponibles
    const tranche = cvdDetails?.tranche || (
      points >= 101 ? 4 :
      points >= 51 ? 3 :
      points >= 26 ? 2 : 1
    );
    
    const isRealData = !!cvdDetails;

    // Étape 1: Vue d'ensemble
    steps.push({
      type: 'overview',
      title: isRealData ? 'Données officielles CVD' : 'Vue d\'ensemble',
      description: `Vous avez ${points} points CVD ce mois`,
      detail: isRealData 
        ? `Calcul basé sur vos VRAIES installations par produit`
        : `Le système CVD fonctionne par TRANCHES selon les produits`,
      palier: 0,
      points: points,
      commission: 0,
      commissionCumulee: 0,
      color: isRealData ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
    });

    // Étape 2: Identification de la tranche
    steps.push({
      type: 'tranche',
      title: `Tranche ${tranche} active`,
      description: `Points dans la tranche ${tranche}`,
      detail: (() => {
        switch(tranche) {
          case 1: return "0-25 points : Niveau débutant";
          case 2: return "26-50 points : Niveau intermédiaire";
          case 3: return "51-100 points : Niveau avancé";
          case 4: return "101+ points : Niveau expert";
          default: return "";
        }
      })(),
      palier: tranche,
      points: points,
      commission: 0,
      commissionCumulee: 0,
      color: 'bg-purple-50 border-purple-200'
    });

    // Étape 3: Installations réelles ou barème théorique
    if (isRealData && cvdDetails.installationsParProduit.length > 0) {
      // Utiliser les VRAIES données d'installations
      cvdDetails.installationsParProduit.forEach((installation) => {
        steps.push({
          type: 'real-installation',
          title: `${installation.produit}`,
          description: `${installation.installations} installation${installation.installations > 1 ? 's' : ''} réelle${installation.installations > 1 ? 's' : ''}`,
          detail: `${installation.installations} × ${installation.commissionParInstallation}€ = ${installation.commissionTotale}€`,
          palier: tranche,
          points: installation.pointsTotaux,
          commission: installation.commissionTotale,
          commissionCumulee: 0,
          color: 'bg-emerald-50 border-emerald-200'
        });
      });
    } else {
      // Barème théorique - CORRIGÉ 28/08/2025
      const baremeOfficiel = {
        'Freebox Pop': [50, 60, 70, 90], // Tranche 4: 80→90
        'Freebox Essentiel': [50, 70, 90, 100], // Tranche 4: 110→100
        'Freebox Ultra': [50, 80, 100, 120],
        'Forfait 5G': [10, 10, 10, 10]
      };

      Object.entries(baremeOfficiel).forEach(([produit, commissions]) => {
        steps.push({
          type: 'bareme',
          title: `${produit}`,
          description: `Commission par installation en Tranche ${tranche}`,
          detail: `${commissions[tranche - 1]}€ par installation`,
          palier: tranche,
          points: 0,
          commission: commissions[tranche - 1],
          commissionCumulee: 0,
          color: 'bg-gray-50 border-gray-200'
        });
      });
    }

    // Étape 4: Calcul final (réel ou estimé)
    if (!isRealData) {
      const baremeOfficiel = {
        'Freebox Ultra': [50, 80, 100, 120] // Ultra reste 120€ en T4
      };
      const commissionUltra = baremeOfficiel['Freebox Ultra'][tranche - 1];
      const estimationInstallations = Math.floor(points / 6);
      const pointsRestants = points % 6;
      const commissionEstimee = (estimationInstallations * commissionUltra) + (pointsRestants * 10);

      steps.push({
        type: 'estimation',
        title: 'Estimation commission',
        description: `Calcul approximatif basé sur ${estimationInstallations} Freebox Ultra + ${pointsRestants} Forfait 5G`,
        detail: `${estimationInstallations} × ${commissionUltra}€ + ${pointsRestants} × 10€ = ${commissionEstimee}€`,
        palier: 0,
        points: points,
        commission: commissionEstimee,
        commissionCumulee: commissionEstimee,
        color: 'bg-green-50 border-green-200'
      });
    }

    // Total final
    steps.push({
      type: 'total',
      title: 'Commission totale',
      description: isRealData 
        ? `Commission officielle en Tranche ${tranche}`
        : `Estimation en Tranche ${tranche}`,
      detail: isRealData 
        ? `Total officiel : ${commission}€`
        : `Total approximatif : ${commission}€`,
      palier: 0,
      points: points,
      commission: commission,
      commissionCumulee: commission,
      color: 'bg-emerald-50 border-emerald-200'
    });

    return steps;
  };

  const calculationSteps = getCalculationSteps();

  return (
    <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="text-xl flex items-center gap-3">
          <Calculator className="h-6 w-6" />
          Calcul détaillé commission CVD
        </CardTitle>
        <p className="text-blue-100 text-sm mt-2">
          Étapes de calcul pour comprendre votre commission de {commission}€
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {calculationSteps.map((step, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${step.color} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {step.type === 'overview' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                {step.type === 'palier' && <Award className="h-5 w-5 text-green-600" />}
                {step.type === 'restant' && <Calculator className="h-5 w-5 text-yellow-600" />}
                {step.type === 'total' && <Euro className="h-5 w-5 text-emerald-600" />}
                
                <h3 className="font-semibold text-gray-800">
                  Étape {index + 1}: {step.title}
                </h3>
              </div>
              
              {step.commission > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  +{step.commission}€
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-700 mb-2">
              <strong>{step.description}</strong>
            </div>
            
            <div className="text-xs text-gray-600 mb-3">
              {step.detail}
            </div>
            
            {step.type === 'palier' && (
              <div className="flex justify-between text-xs bg-white/50 rounded px-3 py-2">
                <span>Points utilisés: {step.points}</span>
                <span>Commission: {step.commission}€</span>
                <span className="font-semibold">Total cumulé: {step.commissionCumulee}€</span>
              </div>
            )}
            
            {step.type === 'total' && (
              <div className="flex justify-between text-sm bg-emerald-100 rounded px-3 py-2 font-semibold text-emerald-800">
                <span>Commission finale</span>
                <span>{step.commission}€</span>
              </div>
            )}
          </div>
        ))}
        
        {/* Résumé du système CVD OFFICIEL */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Système CVD OFFICIEL - Règles de calcul
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-indigo-700">
            <div>
              <p className="font-semibold mb-1">TRANCHES :</p>
              <ul className="space-y-1">
                <li>• Tranche 1 : 0-25 points</li>
                <li>• Tranche 2 : 26-50 points</li>
                <li>• Tranche 3 : 51-100 points</li>
                <li>• Tranche 4 : 101+ points</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">POINTS PAR PRODUIT :</p>
              <ul className="space-y-1">
                <li>• Freebox Ultra : 6 points</li>
                <li>• Freebox Essentiel : 5 points</li>
                <li>• Freebox Pop : 4 points</li>
                <li>• Forfait 5G : 1 point</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-indigo-200">
            <p className="text-xs text-indigo-600 font-semibold">
              ⚠️ Commission calculée selon le produit ET la tranche active
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}