import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getSourcesForSelect } from "@shared/sources";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users, Target, ShoppingCart, BarChart3, FileText, Download } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

// Fonction personnalisée pour le rendu des pourcentages à l'intérieur des parts
const renderPercentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Masquer les pourcentages trop petits
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="16"
      fontWeight="bold"
      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface VentesStats {
  ventes: number;
  installations: number;
  totalPoints: number;
  commission: number;
  palier: number;
  pointsRestants: number;
}

export default function VentesPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Récupération des statistiques de ventes avec CVD
  const { data: ventesStats, isLoading: isLoadingVentes } = useQuery<VentesStats>({
    queryKey: ['/api/ventes/stats'],
    retry: 1,
  });

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

  // Récupération du logo de la société
  const { data: logoData } = useQuery<string>({
    queryKey: ['/api/settings/logo'],
    retry: 1,
  });

  // Récupération de l'historique pour les factures
  const { data: historiqueData } = useQuery<{historiqueParMois: any[]}>({
    queryKey: ["/api/historique/ventes-simple"],
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'factures',
  });

  // Debug de l'historique
  useEffect(() => {
    if (historiqueData) {
      console.log('🎯 DONNÉES HISTORIQUE REÇUES:', historiqueData);
    }
  }, [historiqueData]);

  if (sourcesError || productsError) {
    console.error('Erreur sources:', sourcesError);
    console.error('Erreur produits:', productsError);
  }

  // Fonction simple pour générer les factures HTML
  const handleViewFacture = async (periode: string, data: any) => {
    console.log('🎯 BOUTON VOIR FACTURE CLIQUÉ', { periode, data });
    try {
      // Récupérer l'utilisateur connecté
      const userResponse = await fetch('/api/auth/user', { credentials: 'include' });
      const userResponseData = await userResponse.json();
      const userData = userResponseData.user || userResponseData;
      
      console.log('🔍 DONNÉES UTILISATEUR RÉCUPÉRÉES:', userData);
      
      if (!userData?.id) {
        alert('Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }

      // Formater la période pour l'API (ex: "2024-08" au lieu de "août 2024")
      let formattedPeriode = periode;
      if (periode && !periode.match(/^\d{4}-\d{2}$/)) {
        // Si ce n'est pas déjà au format YYYY-MM, essayer de convertir
        const moisMapping: { [key: string]: string } = {
          'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
          'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
          'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
        };
        
        // Extraire mois et année du format "août 2024"
        const parts = periode.toLowerCase().split(' ');
        if (parts.length === 2) {
          const mois = moisMapping[parts[0]];
          const annee = parts[1];
          if (mois && annee) {
            formattedPeriode = `${annee}-${mois}`;
          }
        }
      }

      // Générer l'URL de la facture avec le système HTML existant
      const factureUrl = `/api/factures/commission/${userData.id}/${formattedPeriode}`;
      
      console.log('🎯 URL FACTURE À OUVRIR:', factureUrl);
      
      // Ouvrir dans un nouvel onglet (approche simple)
      window.open(factureUrl, '_blank');
      
    } catch (error) {
      console.error('Erreur génération facture:', error);
      alert('Erreur lors de la génération de la facture');
    }
  };

  const sourcesColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const productsColors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header moderne avec logo de la société */}
        <div className="text-center py-8">
          <div className="flex flex-col items-center space-y-4 mb-6">
            {/* Logo de la société */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
              {logoData ? (
                <img 
                  src={logoData} 
                  alt="Logo société"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">SMG</div>
                  <div className="text-xs text-slate-600 leading-tight">
                    <div>SYNERGIE</div>
                    <div>MARKETING GROUP</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Analytics Ventes
          </h1>
          <p className="text-slate-600 text-lg">
            Tableau de bord des performances commerciales
          </p>
        </div>

        {/* Onglets de navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg">
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('analytics')}
              className="px-6 py-2 rounded-lg transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === 'factures' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('factures')}
              className="px-6 py-2 rounded-lg transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Factures
            </Button>
          </div>
        </div>

        {/* Contenu conditionnel selon l'onglet actif */}
        {activeTab === 'analytics' && (
          <>
            {/* KPI Cards optimisées mobile */}
            <div className="grid gap-6 grid-cols-2 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Ventes
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoadingVentes ? '...' : ventesStats?.ventes || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Du mois
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Commissions
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoadingVentes ? '...' : `${ventesStats?.commission || 0}€`}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Personnelles
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => window.location.href = '/clients?filter=a_relancer'}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Clients
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoadingVentes ? '...' : ventesStats?.installations || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                A relancer
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Points CVD
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoadingVentes ? '...' : ventesStats?.totalPoints || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isLoadingVentes ? '...' : (() => {
                  const points = ventesStats?.totalPoints || 0;
                  let tranche = 1;
                  
                  if (points >= 101) {
                    tranche = 4;
                    return `Tranche ${tranche} (maximum)`;
                  } else if (points >= 51) {
                    tranche = 3;
                    const pointsRestants = 101 - points;
                    return `Tranche ${tranche} - ${pointsRestants} pts restants`;
                  } else if (points >= 26) {
                    tranche = 2;
                    const pointsRestants = 51 - points;
                    return `Tranche ${tranche} - ${pointsRestants} pts restants`;
                  } else {
                    tranche = 1;
                    const pointsRestants = 26 - points;
                    return `Tranche ${tranche} - ${pointsRestants} pts restants`;
                  }
                })()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Sources des clients avec graphique plein */}
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
                {/* Graphique circulaire plein avec pourcentages intégrés */}
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
                        label={renderPercentageLabel}
                        outerRadius={isMobile ? 120 : 140}
                        innerRadius={0}
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

                {/* Stats résumées */}
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

        {/* Section Ventes par produit avec graphique plein */}
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
                {/* Graphique produits circulaire plein */}
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
                        label={renderPercentageLabel}
                        outerRadius={isMobile ? 120 : 140}
                        innerRadius={0}
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
          </>
        )}

        {/* Contenu onglet Factures */}
        {activeTab === 'factures' && (
          <div className="space-y-6">
            {/* Debug de l'onglet Factures */}
            <div className="text-center p-4 bg-yellow-100 rounded-lg">
              <p className="text-sm">🎯 ONGLET FACTURES ACTIF - {historiqueData ? `${historiqueData.historiqueParMois?.length || 0} factures` : 'Chargement...'}</p>
              <Button 
                onClick={() => handleViewFacture('2024-08', { mois: 'août 2024', total: 1, commission: 60, points: 4 })}
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                🧪 TEST BOUTON FACTURE
              </Button>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <FileText className="h-6 w-6" />
                  </div>
                  Factures de Commission
                </CardTitle>
                <CardDescription className="text-green-100 mt-2">
                  Générez et téléchargez vos factures mensuelles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {historiqueData?.historiqueParMois && historiqueData.historiqueParMois.length > 0 ? (
                  <div className="grid gap-4">
                    {historiqueData.historiqueParMois.map((item: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {item.mois}
                            </h3>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Ventes installées: {item.total}</p>
                              <p>Points générés: {item.points}</p>
                              <p className="font-medium text-green-600">
                                Commission: {item.commission}€
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleViewFacture(item.periode, item)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Voir Facture
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      Aucune facture disponible
                    </h3>
                    <p className="text-slate-500">
                      Les factures apparaîtront ici après vos premières ventes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}