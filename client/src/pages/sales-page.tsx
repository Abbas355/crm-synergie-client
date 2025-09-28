import { AppLayout } from "@/components/layout/app-layout";
import { VendorCharts } from "@/components/dashboard/vendor-charts";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingUp, Award, Target } from "lucide-react";

interface SalesStats {
  totalSales: number;
  monthlyRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  commission?: {
    totalCommission: number;
    currentTranche: number;
    totalPoints: number;
    pointsToNextTranche: number;
  };
  productBreakdown?: {
    freeboxUltra: number;
    freeboxEssentiel: number;
    freeboxPop: number;
    forfait5G: number;
  };
}

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user && [1, 15].includes(user.id);

  // Récupérer les statistiques de ventes
  const { data: salesStats } = useQuery<SalesStats>({
    queryKey: ['/api/sales/stats'],
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventes</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Suivi de vos performances commerciales et analytics
            </p>
          </div>
          <ShoppingCart className="h-8 w-8 text-primary" />
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats?.totalSales || 0}</div>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comm. CVD</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesStats?.monthlyRevenue ? `${salesStats.monthlyRevenue}€` : '0€'}
              </div>
              <p className="text-xs text-muted-foreground">
                {salesStats?.commission ? `Tranche ${salesStats.commission.currentTranche} - ${salesStats.commission.totalPoints} points` : 'Ce mois'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux conversion</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesStats?.conversionRate ? `${salesStats.conversionRate}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">Prospects convertis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesStats?.averageOrderValue ? `${salesStats.averageOrderValue}€` : '0€'}
              </div>
              <p className="text-xs text-muted-foreground">Par vente</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques analytics */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Analytics des ventes</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
              <VendorCharts isAdmin={isAdmin} />
            </div>
          </div>
        </div>

        {/* Performances détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>Performances par produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Freebox Ultra</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">6 points par vente</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+15%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs mois dernier</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Freebox Essentiel</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">5 points par vente</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+8%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs mois dernier</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Freebox Pop</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4 points par vente</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">+3%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs mois dernier</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Forfait 5G</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1 point par vente</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+25%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs mois dernier</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}