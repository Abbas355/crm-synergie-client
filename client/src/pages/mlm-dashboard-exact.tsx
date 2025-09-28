import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Activity, Calculator, TrendingUp, Lightbulb } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Link } from "wouter";
import { AnalyticsDashboard } from "@/components/mlm/analytics-dashboard";
import { apiRequest } from "@/lib/queryClient";

export default function MLMDashboardExact() {
  const { user } = useAuth();
  const { isAdmin } = useRole();

  // Récupérer les statistiques MLM selon le rôle
  const { 
    data: statistics = {}, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ["/api/mlm/statistics", isAdmin() ? "global" : "personal"],
    queryFn: async () => {
      const endpoint = isAdmin() ? "/api/mlm/statistics/global" : "/api/mlm/statistics";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!user
  });

  // Récupérer les données du distributeur
  const { 
    data: distributeur = {}, 
    isLoading: isLoadingDistributeur 
  } = useQuery({
    queryKey: ["/api/mlm/distributeur"],
    enabled: !!user
  });

  // Adapter les noms de champs selon le type de statistiques
  const totalVendeurs = isAdmin() 
    ? (statistics as any)?.totalVendeurs || 0
    : (statistics as any)?.nbEnfantsDirects || 0;
  const totalClients = (statistics as any)?.totalClients || 0;
  const commissionsMoisCourant = (statistics as any)?.commissionsMoisCourant || 0;
  const commissionsTotal = (statistics as any)?.commissionsTotal || 0;
  const performance = (statistics as any)?.performance || 0;

  if (isLoadingStats || isLoadingDistributeur) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord MLM</h1>
            {isAdmin() && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                Vue Administrateur
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {isAdmin() 
              ? "Vue d'ensemble du réseau complet" 
              : "Vue de votre groupe/sous-groupe"
            }
          </p>
        </div>

        {/* Système d'onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Tableau de Bord Analytique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

            {/* Métriques principales */}
            <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Vendeurs */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {totalVendeurs}
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total Vendeurs</div>
                <div>vendeurs actifs</div>
              </div>
            </CardContent>
          </Card>

          {/* Total Clients */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {totalClients}
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total Clients</div>
                <div>clients du réseau</div>
              </div>
            </CardContent>
          </Card>

          {/* Commissions Ce mois */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {commissionsMoisCourant.toFixed(2)} €
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Ce mois</div>
                <div>Commissions en cours</div>
              </div>
            </CardContent>
          </Card>

          {/* Total depuis inscription */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {commissionsTotal.toFixed(2)} €
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total</div>
                <div>Depuis inscription</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons de navigation */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Vue d'ensemble - Actif */}
          <Card className="bg-blue-50 border-2 border-blue-500">
            <CardContent className="p-4 text-center">
              <div className="text-blue-600 mb-2">
                <BarChart3 className="h-8 w-8 mx-auto" />
              </div>
              <div className="font-medium text-blue-900">Vue d'ensemble</div>
              <div className="text-sm text-blue-700">Tableau de bord</div>
            </CardContent>
          </Card>

          {/* Réseau Distributeurs */}
          <Link href="/mlm/network">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Users className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Réseau</div>
                <div className="text-sm text-gray-600">Distributeurs</div>
              </CardContent>
            </Card>
          </Link>

          {/* Commissions MLM */}
          <Link href="/mlm/commissions">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Activity className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Commissions</div>
                <div className="text-sm text-gray-600">MLM</div>
              </CardContent>
            </Card>
          </Link>

          {/* Ma Facturation */}
          <Link href="/mlm/ma-facturation">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Calculator className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Ma Facturation</div>
                <div className="text-sm text-gray-600">Mensuelle</div>
              </CardContent>
            </Card>
          </Link>

          {/* Objectifs (bonus) */}
          <Link href="/mlm/objectifs">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Lightbulb className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Objectifs</div>
                <div className="text-sm text-gray-600">Performance</div>
              </CardContent>
            </Card>
          </Link>

          {/* Performance (bonus) */}
          <Link href="/mlm/performance">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <TrendingUp className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Performance</div>
                <div className="text-sm text-gray-600">Statistiques</div>
              </CardContent>
            </Card>
          </Link>
        </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
}