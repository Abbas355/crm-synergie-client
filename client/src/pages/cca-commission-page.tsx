import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Euro, 
  Calendar,
  Target,
  Users,
  Network,
  Calculator,
  ArrowLeft,
  Info,
  Clock,
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CCACommissionPage() {
  useEffect(() => {
    document.title = "Commission sur Chiffres d'Affaires (CCA) - SMG";
    return () => {
      document.title = "SMG";
    };
  }, []);

  // Récupérer les données CCA
  const { data: ccaData, isLoading: isLoadingCCA } = useQuery({
    queryKey: ["/api/mlm/cca-commission"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/cca-commission");
      return await response.json();
    }
  });

  // Récupérer le niveau MLM actuel
  const { data: mlmStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/mlm/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/stats");
      return await response.json();
    }
  });

  // Récupérer les échéances automatisées de paiement
  const { data: paymentSchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/commissions/payment-schedule"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/commissions/payment-schedule");
      return await response.json();
    }
  });

  const isEligible = mlmStats?.currentLevel && ['ett', 'etl', 'manager', 'rc', 'rd', 'rvp', 'svp'].includes(mlmStats.currentLevel);
  const currentYear = new Date().getFullYear();
  const yearsRemaining = ccaData?.yearsRemaining || 3;

  // Barème des commissions CCA
  const ccaTariffs = [
    { product: "Freebox POP", baseAmount: 20, commission: 1.00, icon: "📦" },
    { product: "Freebox Essentiel", baseAmount: 25, commission: 1.25, icon: "📡" },
    { product: "Freebox Ultra", baseAmount: 30, commission: 1.50, icon: "🚀" },
    { product: "Forfait 5G", baseAmount: 3, commission: 0.15, icon: "📱" }
  ];

  const totalMonthlyCommission = ccaData?.monthlyCommission || 0;
  const totalYearlyCommission = ccaData?.yearlyCommission || 0;
  const level7Sales = ccaData?.level7Sales || 0;

  if (isLoadingCCA || isLoadingStats || isLoadingSchedule) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Header avec navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <Link href="/mlm/commissions">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux commissions
                </Button>
              </Link>
              <Badge variant={isEligible ? "default" : "secondary"} className="text-sm whitespace-nowrap">
                {isEligible ? "Éligible" : "Non éligible"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Commission sur Chiffres d'Affaires
                </h1>
                <p className="text-gray-600 mt-1 text-xs">
                  5% sur le 7ème niveau de votre réseau pendant 3 ans dès la position ETT
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">{totalMonthlyCommission.toFixed(2)}€</div>
                <div className="text-xs text-gray-500">Ce mois-ci</div>
              </div>
            </div>
          </div>

          {/* Statut d'éligibilité - Version compacte */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Statut d'éligibilité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isEligible ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium text-sm">Vous êtes éligible à la CCA</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <div className="font-medium text-green-900">Position actuelle</div>
                      <div className="text-green-700 uppercase">{mlmStats?.currentLevel || "ETT"}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="font-medium text-blue-900">Durée restante</div>
                      <div className="text-blue-700">{yearsRemaining} année{yearsRemaining > 1 ? 's' : ''}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <div className="font-medium text-purple-900">Paiement</div>
                      <div className="text-purple-700">Le 22 du mois suivant</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-700 font-medium text-sm">Position ETT requise pour être éligible</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Vous devez atteindre la position ETT (Équipe Team Trainer) pour bénéficier de la Commission sur Chiffres d'Affaires.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques principales - Version compacte */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* Commission mensuelle et annuelle sur la même ligne */}
            <div className="grid grid-cols-2 gap-3">
              {/* Commission mensuelle */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Commission mensuelle</p>
                      <p className="text-xl font-bold text-green-600">{totalMonthlyCommission.toFixed(2)}€</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <Euro className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Basé sur {level7Sales} vente{level7Sales > 1 ? 's' : ''} niveau 7
                  </div>
                </CardContent>
              </Card>

              {/* Commission annuelle */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Commission annuelle</p>
                      <p className="text-xl font-bold text-blue-600">{totalYearlyCommission.toFixed(2)}€</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Projection {currentYear}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Niveau 7 */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Vendeurs Niveau 7</p>
                    <p className="text-xl font-bold text-purple-600">{ccaData?.level7Vendors || 0}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Network className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Dans votre réseau
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barème des commissions - Version compacte */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span>Barème des commissions CCA</span>
              </CardTitle>
              <p className="text-xs text-gray-600">5% de la base de calcul pour chaque produit vendu sur le 7ème niveau</p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {ccaTariffs.map((tariff, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{tariff.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{tariff.product}</div>
                        <div className="text-xs text-gray-600">Base de calcul: {tariff.baseAmount}€</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{tariff.commission.toFixed(2)}€</div>
                      <div className="text-xs text-gray-500">5% de {tariff.baseAmount}€</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conditions de paiement - Version compacte */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Conditions de paiement automatisées</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 text-sm">Commission CCA (Niveau 7)</h3>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Paiement le 22 du mois suivant l'acquisition client</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Commission sur 3 ans à partir de la position ETT</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Calcul basé sur le 7ème niveau uniquement</span>
                  </li>
                </ul>
              </div>
              
              {/* Section d'automatisation des paiements */}
              <div className="mt-4 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center text-sm">
                  <Calculator className="h-3 w-3 mr-2" />
                  Automatisation des échéances de paiement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-blue-800">Prochains paiements CVD :</div>
                    <div className="text-blue-700">15 {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                    <div className="text-xs text-blue-600">Installations de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-blue-800">Prochains paiements CCA :</div>
                    <div className="text-blue-700">22 {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                    <div className="text-xs text-blue-600">Acquisitions de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planning automatisé des paiements - Version compacte */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span>Planning automatisé des paiements</span>
              </CardTitle>
              <p className="text-xs text-gray-600 mt-1">
                Échéances calculées automatiquement selon les conditions spécifiques de chaque commission
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              {/* Prochains paiements CCA uniquement */}
              <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2 flex items-center text-sm">
                  <Network className="h-3 w-3 mr-2" />
                  Commission CCA (Niveau 7)
                </h3>
                {paymentSchedule?.summary?.nextCcaPayment ? (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-green-700">
                      {paymentSchedule.summary.nextCcaPayment.date}
                    </div>
                    <div className="text-green-600">
                      {paymentSchedule.summary.nextCcaPayment.amount.toFixed(2)}€
                    </div>
                    <div className="text-xs text-green-500">
                      Dans {paymentSchedule.summary.nextCcaPayment.daysUntil} jour{paymentSchedule.summary.nextCcaPayment.daysUntil > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-600 mt-2 italic">
                      Condition: Le 22 N+1 après acquisition client
                    </div>
                  </div>
                ) : (
                  <div className="text-green-600 text-sm">Aucun paiement CCA programmé</div>
                )}
              </div>



              {/* Liste des prochaines échéances */}
              {paymentSchedule?.paymentSchedules?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Prochaines échéances</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {paymentSchedule.paymentSchedules.slice(0, 8).map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.type === 'CVD' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {payment.type}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{payment.clientNom}</div>
                            <div className="text-xs text-gray-600">{payment.produit}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{payment.commission.toFixed(2)}€</div>
                          <div className="text-xs text-gray-600">{payment.formattedDate}</div>
                          <div className={`text-xs ${payment.status === 'due' ? 'text-red-600' : 'text-gray-500'}`}>
                            {payment.daysUntil === 0 ? 'Aujourd\'hui' : 
                             payment.daysUntil > 0 ? `Dans ${payment.daysUntil} j` : 
                             `En retard de ${Math.abs(payment.daysUntil)} j`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}