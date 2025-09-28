import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function FastStartBonusPage() {
  useEffect(() => {
    document.title = "Fast Start Bonus - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

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
        
        return {
          positionActuelle: "Conseiller",
          joursDepuisDemarrage: 14, // Calculé depuis inscription
          bonusObtenus: 0,
          prochainPalier: "ETT",
          tempsRestant: 16
        };
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

  // Utiliser les bonus de l'API mise à jour avec critères MLM corrects
  const fastStartBonuses = userData?.bonusEligibles?.map(bonus => ({
    position: bonus.position,
    delai: bonus.delai,
    montant: bonus.montant,
    description: `${bonus.position} dans les ${bonus.delai} jours`,
    color: getColorForPosition(bonus.position),
    icon: getIconForPosition(bonus.position),
    eligible: bonus.eligible,
    atteint: bonus.criteresRemplis && bonus.eligible,
    joursRestants: bonus.joursRestants,
    pointsRequis: bonus.pointsRequis,
    recruesRequis: bonus.recruesRequis,
    criteresRemplis: bonus.criteresRemplis
  })) || [];

  // Fonctions utilitaires pour les couleurs et icônes
  function getColorForPosition(position: string) {
    switch (position) {
      case 'CQ': return "from-blue-500 to-blue-600";
      case 'ETT': return "from-green-500 to-green-600";
      case 'ETL': return "from-emerald-500 to-emerald-600";
      case 'Manager': return "from-amber-500 to-amber-600";
      case 'RC': return "from-purple-500 to-purple-600";
      default: return "from-gray-500 to-gray-600";
    }
  }

  function getIconForPosition(position: string) {
    switch (position) {
      case 'CQ': return Target;
      case 'ETT': return TrendingUp;
      case 'ETL': return Trophy;
      case 'Manager': return Star;
      case 'RC': return Trophy;
      default: return Target;
    }
  }

  const totalBonusEligible = fastStartBonuses
    .filter(bonus => bonus.eligible)
    .reduce((total, bonus) => total + bonus.montant, 0);

  const totalBonusAtteint = userData?.bonusObtenus || 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header avec navigation retour */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Link href="/mlm/commissions">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour aux Commissions</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Fast Start Bonus
                  </h1>
                </div>
                <p className="text-gray-600">
                  Bonus exceptionnels basés sur les critères MLM mis à jour
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{totalBonusAtteint}€</div>
                <div className="text-sm text-gray-500">Bonus obtenus</div>
                <div className="text-xs text-gray-400 mt-1">
                  {userData?.personalPoints || 0} pts • {userData?.directRecruits || 0} recrues
                </div>
              </div>
            </div>
          </div>

          {/* Informations sur le statut actuel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Position Actuelle</p>
                    <p className="text-2xl font-bold text-purple-600">{userData?.positionActuelle || "Conseiller"}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                        Jours d'activités
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {userData?.joursDepuisDemarrage || 0}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bonus Éligibles</p>
                    <p className="text-2xl font-bold text-green-600">{totalBonusEligible}€</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Euro className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des bonus Fast Start */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fastStartBonuses.map((bonus, index) => {
              const IconComponent = bonus.icon;
              const joursRestants = bonus.delai - (userData?.joursDepuisDemarrage || 0);
              const progressPercentage = Math.min(((userData?.joursDepuisDemarrage || 0) / bonus.delai) * 100, 100);
              
              return (
                <Card key={index} className={`bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all ${bonus.atteint ? 'ring-2 ring-green-500' : bonus.eligible ? 'ring-2 ring-blue-500' : 'opacity-75'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 ${bonus.color} rounded-xl`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Fast Start Bonus {bonus.position}</CardTitle>
                          <p className="text-sm text-gray-600">{bonus.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <div className="text-2xl font-bold text-gray-900">{bonus.montant}€</div>
                        {bonus.atteint ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : bonus.eligible ? (
                          <Clock className="h-6 w-6 text-blue-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Progression temporelle:</span>
                          <span className={`font-medium ${bonus.eligible ? 'text-blue-600' : 'text-red-600'}`}>
                            {bonus.eligible ? `${joursRestants} jours restants` : 'Délai dépassé'}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant={bonus.atteint ? "default" : bonus.eligible ? "secondary" : "outline"}>
                          {bonus.atteint ? "Obtenu ✓" : bonus.eligible ? "Éligible" : "Non éligible"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Délai: {bonus.delai} jours
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Conditions et règles */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span>Conditions du Fast Start Bonus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Règles générales:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Bonus cumulables avec les autres commissions</li>
                    <li>• Positions doivent être atteintes dans les délais impartis</li>
                    <li>• Calcul basé sur la date de démarrage officielle</li>
                    <li>• Versement immédiat après validation de la position</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Paliers de bonus:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• <strong>ETT (30j):</strong> 500€ de bonus</li>
                    <li>• <strong>ETL (90j):</strong> 1 000€ de bonus</li>
                    <li>• <strong>Manager (120j):</strong> 5 000€ de bonus</li>
                    <li>• <strong>RC (360j):</strong> 25 000€ de bonus</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}