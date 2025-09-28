import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users, Target, ShoppingCart, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

// Fonction personnalisée pour le rendu des labels avec pourcentages
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
      fontSize="14"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function VentesOptimizedPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Récupération des données sources des clients
  const { data: sourcesData = [], isLoading: isLoadingSources, error: sourcesError } = useQuery<ChartData[]>({
    queryKey: ['/api/analytics/client-sources'],
    retry: 1,
  });

  // Récupération des données ventes par produit
  const { data: productsData = [], isLoading: isLoadingProducts, error: productsError } = useQuery<ChartData[]>({
    queryKey: ['/api/analytics/product-sales'],
    retry: 1,
  });

  if (sourcesError || productsError) {
    console.error('Erreur sources:', sourcesError);
    console.error('Erreur produits:', productsError);
  }

  const sourcesColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const productsColors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header moderne */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Analytics Ventes
          </h1>
          <p className="text-slate-600 text-lg">
            Tableau de bord des performances commerciales
          </p>
        </div>

        {/* KPI Cards - Design moderne - 2 par ligne */}
        <div className="grid gap-6 grid-cols-2 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Ventes totales
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">
                Ce mois
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Comm. CVD
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0€</div>
              <p className="text-xs text-slate-500 mt-1">
                Ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Taux conversion
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0%</div>
              <p className="text-xs text-slate-500 mt-1">
                Prospects convertis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Panier moyen
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0€</div>
              <p className="text-xs text-slate-500 mt-1">
                Par vente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Sources des clients - Optimisé mobile */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              Sources des clients
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Répartition par canal d'acquisition
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {isLoadingSources ? (
              <div className="h-80 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
            ) : (
              <div className="space-y-6">
                {/* Graphique optimisé mobile avec pourcentages intégrés */}
                <div className={`relative ${isMobile ? 'h-80' : 'h-96'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourcesData.map((item, index) => ({
                          name: item.name || 'Non défini',
                          value: item.value || 0,
                          percentage: item.percentage || 0,
                          fill: sourcesColors[index % sourcesColors.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={isMobile ? 100 : 120}
                        innerRadius={isMobile ? 30 : 40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourcesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={sourcesColors[index % sourcesColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} clients`, name]} 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={isMobile ? 80 : 60}
                        iconType="circle"
                        wrapperStyle={{ 
                          fontSize: isMobile ? '11px' : '14px',
                          fontWeight: '500',
                          paddingTop: '15px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats résumées avec design moderne */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sourcesData.reduce((sum, source) => sum + source.value, 0)}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Total clients</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sourcesData.length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Sources actives</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {sourcesData.length > 0 ? Math.round(sourcesData[0]?.percentage || 0) : 0}%
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Source principale</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Ventes par produit - Optimisé mobile */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-full">
                <ShoppingCart className="h-6 w-6" />
              </div>
              Ventes par produit
            </CardTitle>
            <CardDescription className="text-green-100 mt-2">
              Performance des différents produits Freebox
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {isLoadingProducts ? (
              <div className="h-80 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
            ) : (
              <div className="space-y-6">
                {/* Graphique produits optimisé mobile */}
                <div className={`relative ${isMobile ? 'h-80' : 'h-96'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productsData.map((item, index) => ({
                          name: item.name || 'Non défini',
                          value: item.value || 0,
                          percentage: item.percentage || 0,
                          fill: productsColors[index % productsColors.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={isMobile ? 100 : 120}
                        innerRadius={isMobile ? 30 : 40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={productsColors[index % productsColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} ventes`, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={isMobile ? 80 : 60}
                        iconType="circle"
                        wrapperStyle={{ 
                          fontSize: isMobile ? '11px' : '14px',
                          fontWeight: '500',
                          paddingTop: '15px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats résumées produits */}
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {productsData.map((product, index) => (
                    <div key={product.name} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-200">
                      <div className="text-lg font-bold text-slate-800">
                        {product.value}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mb-1">
                        {product.name}
                      </div>
                      <div className="text-xs text-blue-600 font-semibold">
                        {product.percentage}%
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
  );
}