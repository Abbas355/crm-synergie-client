import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Users, BarChart3, Activity, Award, Lightbulb, TrendingUp, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { NetworkView } from "@/components/mlm/network-view";
import { CommissionsView } from "@/components/mlm/commissions-view";
import { SimpleCommissionsView } from "@/components/mlm/simple-commissions-view";
import { NetworkCommissionsView } from "@/components/mlm/network-commissions-view";
import { RecruitmentTips } from "@/components/mlm/recruitment-tips";

export default function MLMDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Vérifier si l'utilisateur est un distributeur MLM
  const { 
    data: distributeur, 
    isLoading: isLoadingDistributeur,
    error: distributeurError,
    isError: isDistributeurError
  } = useQuery({
    queryKey: ["/api/mlm/profile"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/mlm/profile");
        return await response.json();
      } catch (error) {
        // Si erreur 404, l'utilisateur n'est pas distributeur
        if ((error as any)?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false
  });

  // Récupérer les statistiques du distributeur
  const { 
    data: statistics, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ["/api/mlm/statistics"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/mlm/statistics");
        return await response.json();
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        return {
          nbEnfantsDirects: 0,
          commissionsMoisCourant: 0,
          totalCommissions: 0,
          nbNiveaux: 0,
          totalReseau: 0
        };
      }
    },
    enabled: true // Toujours activer
  });

  // Récupérer les règles de commission
  const { 
    data: rules, 
    isLoading: isLoadingRules 
  } = useQuery({
    queryKey: ["/api/mlm/rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/rules");
      return await response.json();
    }
  });

  // Récupérer les commissions Réseaux
  const { 
    data: networkCommissions, 
    isLoading: isLoadingNetworkCommissions 
  } = useQuery({
    queryKey: ["/api/mlm/commissions-reseaux"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/mlm/commissions-reseaux");
      return await response.json();
    },
    enabled: true
  });

  // Mutation pour s'enregistrer comme distributeur
  const registerMutation = useMutation({
    mutationFn: async (parentCodeVendeur?: string) => {
      const response = await apiRequest("POST", "/api/mlm/register", { parentCodeVendeur });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enregistrement réussi",
        description: "Vous êtes maintenant enregistré comme distributeur MLM.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mlm/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de l'enregistrement",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  // Fonction pour s'enregistrer comme distributeur
  const handleRegister = () => {
    registerMutation.mutate(undefined);
  };

  // Afficher une page de chargement
  if (isLoadingDistributeur) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Chargement de votre profil MLM...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Si l'utilisateur n'est pas encore enregistré comme distributeur MLM
  if (!distributeur) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* En-tête avec design amélioré */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 sm:mb-6 shadow-lg">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Programme MLM
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Rejoignez notre programme de marketing multi-niveau et développez votre réseau de vente
              </p>
            </div>

            {/* Bannière de bienvenue */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50 shadow-lg">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Bienvenue dans notre programme MLM</h2>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                      Transformez votre passion pour la vente en opportunité de revenus durables. 
                      Notre programme vous offre tous les outils nécessaires pour réussir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avantages du programme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Commissions directes</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Gagnez sur chaque vente que vous réalisez personnellement</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Réseau de vente</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Développez votre équipe et bénéficiez de leurs performances</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Suivi avancé</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Tableaux de bord et statistiques détaillées</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Bonus & Récompenses</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Programmes de fidélité et incitations spéciales</p>
                </CardContent>
              </Card>
            </div>

            {/* Détails des commissions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Niveaux de commission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    Gagnez des commissions sur plusieurs niveaux selon votre position dans la structure MLM.
                  </p>
                  {isLoadingRules ? (
                    <div className="flex justify-center py-6 sm:py-8">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {rules?.slice(0, 4).map((rule: any) => (
                        <div key={rule.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                          <span className="font-medium text-gray-800 text-xs sm:text-sm">
                            Niveau {rule.niveau} - {rule.produitType.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-blue-600 text-sm sm:text-lg">{rule.tauxCommission}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Structure réseau</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Développez votre réseau de vendeurs et augmentez vos revenus passifs à mesure que votre équipe se développe.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Recrutement et formation d'équipe</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Suivi des performances en temps réel</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50/50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">Outils de motivation et support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bouton d'inscription */}
            <div className="text-center">
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50 max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Prêt à commencer ?</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Rejoignez des milliers de distributeurs qui ont déjà transformé leur avenir financier
                  </p>
                  <Button 
                    onClick={handleRegister} 
                    disabled={registerMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Rejoindre le programme MLM
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Interface principale pour les distributeurs existants
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* En-tête du tableau de bord */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Tableau de bord MLM
            </h1>
            <p className="text-lg text-gray-600">
              Bienvenue {distributeur?.prenom} {distributeur?.nom}
            </p>
          </div>

          {/* Statistiques rapides */}
          {statistics && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.nbEnfantsDirects || 0}</div>
                  <div className="text-sm text-gray-600">Enfants directs</div>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.commissionsMoisCourant || 0}€</div>
                  <div className="text-sm text-gray-600">Ce mois</div>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.totalCommissions || 0}€</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{statistics.nbNiveaux || 0}</div>
                  <div className="text-sm text-gray-600">Niveaux</div>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-teal-600">{statistics.totalReseau || 0}</div>
                  <div className="text-sm text-gray-600">Réseau total</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Onglets principaux avec design responsive */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <StandardizedTabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" variant="default">
              <StandardizedTabsTrigger value="overview" variant="default" icon={<BarChart3 className="h-4 w-4" />}>
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Vue</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger value="network" variant="default" icon={<Users className="h-4 w-4" />}>
                <span className="hidden sm:inline">Réseau</span>
                <span className="sm:hidden">Réseau</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger value="commissions" variant="default" icon={<Award className="h-4 w-4" />}>
                <span className="hidden sm:inline">Commissions</span>
                <span className="sm:hidden">Com.</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger value="network-commissions" variant="default" icon={<Activity className="h-4 w-4" />}>
                <span className="hidden lg:inline">Réseaux</span>
                <span className="lg:hidden">Net.</span>
              </StandardizedTabsTrigger>
              <StandardizedTabsTrigger value="tips" variant="default" icon={<Lightbulb className="h-4 w-4" />} className="hidden lg:flex">
                Conseils
              </StandardizedTabsTrigger>
            </StandardizedTabsList>

            <div className="mt-4 sm:mt-6">
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <SimpleCommissionsView />
              </TabsContent>

              <TabsContent value="network" className="space-y-4 sm:space-y-6">
                <NetworkView 
                  network={[]}
                  distributeurId={distributeur?.id || 0}
                  distributeurCode={distributeur?.codeVendeur || ""}
                  distributeurNiveau={distributeur?.niveau || 1}
                />
              </TabsContent>

              <TabsContent value="commissions" className="space-y-4 sm:space-y-6">
                <CommissionsView 
                  commissions={[]}
                  isLoading={false}
                  rules={rules || []}
                  isLoadingRules={isLoadingRules}
                  distributeurId={distributeur?.id || 0}
                />
              </TabsContent>

              <TabsContent value="network-commissions" className="space-y-4 sm:space-y-6">
                <NetworkCommissionsView 
                  commissions={networkCommissions || []}
                  isLoading={isLoadingNetworkCommissions}
                />
              </TabsContent>

              <TabsContent value="tips" className="space-y-4 sm:space-y-6 block lg:block">
                <RecruitmentTips 
                  distributeurCode={distributeur?.codeVendeur || ""}
                  nbDirects={statistics?.nbEnfantsDirects || 0}
                  niveau={distributeur?.niveau || 1}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}