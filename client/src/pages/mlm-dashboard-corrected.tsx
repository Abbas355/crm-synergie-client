import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Activity, Calculator, TrendingUp, Lightbulb } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Link } from "wouter";

export default function MLMDashboardCorrected() {
  const { user } = useAuth();

  // Récupérer les statistiques MLM
  const { 
    data: statistics = {}, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ["/api/mlm/statistics"],
    enabled: !!user
  });

  // Récupérer les informations du distributeur
  const { 
    data: distributeur, 
    isLoading: isLoadingDistributeur 
  } = useQuery({
    queryKey: ["/api/mlm/distributeur"],
    enabled: !!user
  });

  // Extraire les données
  const totalVendeurs = (statistics as any)?.totalVendeurs || 0;
  const totalClients = (statistics as any)?.totalClients || 0;
  const totalCommissions = (statistics as any)?.totalCommissions || 0;
  const performance = (statistics as any)?.performance || 0;
  const isAdmin = user?.username === "admin@synergie.com" || false;

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
            {isAdmin && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                Vue Administrateur
              </Badge>
            )}
          </div>
          <p className="text-gray-600">Vue d'ensemble du réseau complet</p>
        </div>

        {/* 1ère ligne - Métriques principales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div className="text-2xl font-bold text-green-600 mb-1">
                {totalClients}
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total Clients</div>
                <div>clients actifs</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2ème ligne - Commissions et Performance */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Commissions Totales */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {totalCommissions.toFixed(2)}€
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Commissions</div>
                <div>ce mois</div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {performance}%
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Performance</div>
                <div>évolution</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3ème ligne - Analytique et Réseau */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Tableau de bord analytique */}
          <Link href="/mlm/analytics">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Activity className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Analytique</div>
                <div className="text-sm text-gray-600">Tableau de bord</div>
              </CardContent>
            </Card>
          </Link>

          {/* Réseau distributeur */}
          <Link href="/mlm/network">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Users className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Réseau</div>
                <div className="text-sm text-gray-600">Distributeur</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 4ème ligne - Commissions MLM et Ventes directes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Commissions MLM */}
          <Link href="/mlm/commissions">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <TrendingUp className="h-8 w-8 mx-auto" />
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
        </div>

        {/* 5ème ligne - Recrutement et Objectifs */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recrutement */}
          <Link href="/recruitment">
            <Card className="bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 mb-2">
                  <Users className="h-8 w-8 mx-auto" />
                </div>
                <div className="font-medium text-gray-900">Recrutement</div>
                <div className="text-sm text-gray-600">Équipe</div>
              </CardContent>
            </Card>
          </Link>

          {/* Objectifs */}
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
        </div>
      </div>
    </AppLayout>
  );
}