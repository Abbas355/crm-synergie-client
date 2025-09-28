import { useQuery } from "@tanstack/react-query";
import { getSourcesForSelect } from "@shared/sources";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Package } from "lucide-react";

interface VendorChartsProps {
  isAdmin?: boolean;
}

interface ClientSourceData {
  source: string;
  count: number;
  percentage: number;
}

interface ProductSalesData {
  produit: string;
  count: number;
  percentage: number;
  points: number;
}

const COLORS = {
  sources: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'],
  products: ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B']
};

const SOURCE_LABELS: Record<string, string> = {
  'stand_salon': 'Stand & Salons',
  'salon': 'Stand & Salons',
  'recommandation': 'Recommandation',
  'site_web': 'Site web',
  'reseaux_sociaux': 'Réseaux sociaux',
  'bouche_oreille': 'Bouche à oreille',
  'publicite': 'Publicité',
  'autre': 'Autre'
};

const PRODUCT_LABELS: Record<string, string> = {
  'Freebox Ultra': 'Freebox Ultra',
  'Freebox Pop': 'Freebox Pop',
  'Freebox Essentiel': 'Freebox Essentiel',
  'Forfait 5G': 'Forfait 5G'
};

export function VendorCharts({ isAdmin = false }: VendorChartsProps) {
  // Récupérer les données des sources clients
  const { data: sourcesData, isLoading: sourcesLoading } = useQuery<ClientSourceData[]>({
    queryKey: ["/api/analytics/client-sources", { isAdmin }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupérer les données des ventes par produit
  const { data: productsData, isLoading: productsLoading } = useQuery<ProductSalesData[]>({
    queryKey: ["/api/analytics/product-sales", { isAdmin }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculer le total des ventes pour affichage
  const totalSales = productsData?.reduce((sum, item) => sum + item.count, 0) || 0;

  // Fusionner les sources doublons
  const mergedSourcesData = sourcesData ? (() => {
    const merged: Record<string, ClientSourceData> = {};
    
    sourcesData.forEach(item => {
      // Fusionner stand_salon et salon
      // Fusionner prospection et prospection_direct
      const key = (consolidateSourceForChart(item.source)) ? 'stand_salon' : 
                  (consolidateSourceForChart(item.source)) ? 'prospection' : 
                  item.source;
      
      if (merged[key]) {
        merged[key].count += item.count;
        merged[key].percentage += item.percentage;
      } else {
        merged[key] = { ...item, source: key };
      }
    });
    
    return Object.values(merged);
  })() : [];

  // Formater les données pour les graphiques
  const formattedSourcesData = mergedSourcesData?.map((item, index) => ({
    name: SOURCE_LABELS[item.source] || item.source,
    value: item.count,
    percentage: item.percentage,
    fill: COLORS.sources[index % COLORS.sources.length]
  })) || [];

  const formattedProductsData = productsData?.map((item, index) => ({
    name: PRODUCT_LABELS[item.produit] || item.produit,
    value: item.count,
    percentage: item.percentage,
    points: item.points,
    fill: COLORS.products[index % COLORS.products.length]
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Clients: <span className="font-medium text-blue-600">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Pourcentage: <span className="font-medium text-blue-600">{data.percentage.toFixed(1)}%</span>
          </p>
          {data.points && (
            <p className="text-sm text-gray-600">
              Points: <span className="font-medium text-green-600">{data.points}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Ne pas afficher les labels pour les petites sections
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  if (sourcesLoading || productsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique des sources clients */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Users className="h-5 w-5 text-blue-600" />
            Sources des clients
          </CardTitle>
          <p className="text-sm text-gray-600">Répartition par canal d'acquisition</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedSourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {formattedSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Statistiques supplémentaires */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {formattedSourcesData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-xs text-gray-600">Total clients</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {formattedSourcesData.length}
              </div>
              <div className="text-xs text-gray-600">Sources actives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique des ventes par produit */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Package className="h-5 w-5 text-green-600" />
            Ventes par produit ({totalSales} total)
          </CardTitle>
          <p className="text-sm text-gray-600">Performance des produits Freebox</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedProductsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {formattedProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Statistiques supplémentaires */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {formattedProductsData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-xs text-gray-600">Total ventes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {formattedProductsData.reduce((sum, item) => sum + (item.points || 0), 0)}
              </div>
              <div className="text-xs text-gray-600">Points totaux</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}