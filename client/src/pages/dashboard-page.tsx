import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSourcesForSelect } from "@shared/sources";
import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  ListChecks,
  Network,
  UserCircle,
  CircleDot,
  FileCheck2,
  Euro,
  ShoppingCart,
  BarChart3,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivityFeed } from "@/components/dashboard/activity-feed";
import { VendorRankings, DetailedStatsCard } from "@/components/dashboard/vendor-rankings";
import { ActivityDetailDialog } from "@/components/dialogs/activity-detail-dialog";

import { ProgressionCardCompactV2 } from "@/components/dashboard/progression-card-compact-v2";

import { CompactCard } from "@/components/ui/compact-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

import { useAuth } from "@/hooks/use-auth";
import { usePreloadData } from "@/hooks/use-preload-data";
import { CompactStatCard } from "@/components/ui/compact-stat-card";

// Interface pour les données de graphiques
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user && [1, 15].includes(user.id);
  
  // État pour la boîte de dialogue des détails d'activité
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  // Requête pour la mise à jour quotidienne
  const { data: dailyUpdate, isLoading: dailyUpdateLoading } = useQuery({
    queryKey: ['/api/daily-update'],
    enabled: !!user,
  });
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  // Fonction pour ouvrir la boîte de dialogue avec les détails d'une activité
  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setIsActivityDialogOpen(true);
  };

  // Fonction pour fermer la boîte de dialogue d'activité
  const handleCloseActivityDialog = () => {
    setIsActivityDialogOpen(false);
    setSelectedActivity(null);
  };

  // Fonction pour naviguer vers les détails d'une tâche
  const handleTaskClick = (task: any) => {
    setLocation(`/tasks/${task.id}`);
  };
  
  // Précharger les données pour améliorer les performances de navigation
  usePreloadData();

  // Récupération des données pour les graphiques (dupliqués depuis la page Ventes)
  const { data: sourcesData = [], isLoading: isLoadingSources } = useQuery<ChartData[]>({
    queryKey: ['/api/analytics/dashboard/client-sources'],
    retry: 1,
  });

  const { data: productsData = [], isLoading: isLoadingProducts } = useQuery<ChartData[]>({
    queryKey: ['/api/analytics/dashboard/product-sales'],
    retry: 1,
  });

  // Récupération des données de progression 12 mois avec comparaison N-1
  const { data: progression12MoisData, isLoading: isLoadingProgression12Mois } = useQuery<any>({
    queryKey: ['/api/analytics/progression-12-mois'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Couleurs pour les graphiques
  const sourcesColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const productsColors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'];

  // Fonction utilitaire pour naviguer avec scroll automatique
  const navigateWithScroll = (path: string) => {
    setLocation(path);
    setTimeout(() => {
      // Scroll vers le haut de la page pour afficher la liste complète
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
      
      // Optionnel: scroll vers le tableau s'il existe
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        tableElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        console.log('📍 Scroll automatique vers le tableau appliqué depuis dashboard');
      }
    }, 500);
  };

  // Définir le type pour les données du tableau de bord
  interface DashboardData {
    totalClients: number;
    clientsThisMonth: number;
    installationsThisMonth: number;
    pointsCVD: number;
    totalVendeurs?: number;
    totalRecruiters?: number;
  }

  // Statistiques MLM hiérarchiques
  const { data: mlmStats, isLoading: mlmLoading } = useQuery({
    queryKey: ["/api/mlm/stats"],
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Refresh chaque minute
  });

  // Utiliser l'endpoint FIABLE ET DÉFINITIF pour métriques correctes
  const { data: dashboardData, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard-metrics-fixed"],
    staleTime: 5 * 60 * 1000, // 5 minutes pour éviter les requêtes répétées
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ✅ NOUVELLES STATISTIQUES OPTIMISÉES pour remplacer les anciennes
  const { data: newStats } = useQuery({
    queryKey: ['/api/clients/custom-stats'],
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 30 * 1000, // Refetch toutes les 30 secondes
  });

  // 🎯 TOTAL POINTS DEPUIS LE DÉBUT DE L'ACTIVITÉ (Dashboard)
  const { data: totalPointsData, isLoading: totalPointsLoading } = useQuery({
    queryKey: ['/api/dashboard/total-points-lifetime'],
    refetchInterval: 30000, // Refetch toutes les 30 secondes
    staleTime: 0, // Pas de cache pour forcer le refresh
    retry: 2
  });

  // Récupération des activités récentes
  const { data: activitiesData = [], isLoading: isLoadingActivities } = useQuery<any[]>({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });

  // 📊 Query pour les vendeurs à relancer
  const { data: vendeursARelancerData, isLoading: vendeursARelancerLoading } = useQuery({
    queryKey: ["/api/dashboard/vendeurs-a-relancer"],
    staleTime: 60000, // 1 minute
  });

  // Fonction de calcul d'importance des tâches (copiée depuis tasks-unified.tsx)
  const calculateTaskImportance = (task: any): number => {
    let score = 0;
    
    // Points de priorité base
    const priorityPoints = {
      'urgent': 100,
      'high': 75,
      'medium': 50,
      'low': 25
    };
    score += priorityPoints[task.priority as keyof typeof priorityPoints] || 0;
    
    // Bonus client lié (tâche avec client = plus importante)
    if (task.clientId) score += 20;
    
    // Malus si échéance dépassée (critique!)
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
      score += 50; // Les tâches en retard sont prioritaires
    }
    
    // Bonus si échéance dans les 48h
    if (task.dueDate) {
      const hoursUntilDue = (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      if (hoursUntilDue <= 48 && hoursUntilDue > 0) score += 30;
    }
    
    // Malus si tâche ancienne (>7 jours)
    const daysOld = (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld > 7) score += Math.min(20, daysOld - 7); // Plus c'est vieux, plus c'est urgent
    
    return score;
  };

  // Récupération des tâches récentes avec tri intelligent
  const { data: rawTasksData = [], isLoading: isLoadingTasks } = useQuery<any[]>({
    queryKey: ['/api/dashboard/tasks'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });

  // Application du système de tri intelligent depuis tasks-unified.tsx
  const tasksData = rawTasksData
    .filter(task => task.status === 'pending') // Garder uniquement les tâches en attente
    .map(task => ({
      ...task,
      importance: calculateTaskImportance(task)
    }))
    .sort((a, b) => {
      // Tri intelligent : priorité par importance décroissante
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      
      // Si même importance, trier par date d'échéance (plus proche en premier)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Si une seule a une échéance, elle passe en premier
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Sinon, trier par date de création (plus récent en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Récupération des classements
  const { data: simSellersData = [], isLoading: isLoadingSimSellers } = useQuery<any[]>({
    queryKey: ['/api/rankings/sim-sellers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const { data: boxSellersData = [], isLoading: isLoadingBoxSellers } = useQuery<any[]>({
    queryKey: ['/api/rankings/box-sellers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const { data: recruitersData = [], isLoading: isLoadingRecruiters } = useQuery<any[]>({
    queryKey: ['/api/rankings/recruiters'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Gestion d'erreur simplifiée sans logs excessifs
  if (isError) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Erreur lors du chargement des données</p>
        </div>
      </AppLayout>
    );
  }

  // Combiner les anciennes et nouvelles données avec priorité aux nouvelles statistiques
  const stats = {
    totalClients: dashboardData?.totalClients || 0,
    clientsThisMonth: newStats?.clientsCeMois || dashboardData?.clientsThisMonth || 0,
    installationsThisMonth: newStats?.installations || 0, // ✅ NOUVELLES STATISTIQUES PRIORITAIRES
    pointsCVD: newStats?.ptsGeneresCeMois || dashboardData?.pointsCVD || 0,
    totalVendeurs: dashboardData?.totalVendeurs || 0,
    totalRecruiters: dashboardData?.totalRecruiters || 0,
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Section des statistiques principales avec design compact */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <CompactStatCard
                title="Total Clients"
                value={stats.totalClients}
                subtitle="Tous statuts"
                icon={Users}
                iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
                onClick={() => navigateWithScroll('/clients')}
              />

              <CompactStatCard
                title="Clients ce mois"
                value={stats.clientsThisMonth}
                subtitle="Nouveaux clients"
                icon={FileCheck2}
                iconColor="bg-gradient-to-br from-green-500 to-emerald-600"
                onClick={() => navigateWithScroll('/clients?custom=ventes_validees')}
              />

              <CompactStatCard
                title="Total de points"
                value={totalPointsLoading ? "..." : ((totalPointsData as any)?.totalPoints || 0)}
                subtitle={totalPointsLoading ? "Chargement..." : "Depuis le début →"}
                icon={ListChecks}
                iconColor="bg-gradient-to-br from-orange-500 to-red-500"
                onClick={() => navigateWithScroll('/clients')}
              />

              <CompactStatCard
                title="Installations"
                value={newStats?.installations || 0}
                subtitle="Ce mois"
                icon={BarChart3}
                iconColor="bg-gradient-to-br from-purple-500 to-indigo-600"
                onClick={() => navigateWithScroll('/clients?custom=vraies_installations')}
              />
            </div>
          </div>

          {/* Section Recrutement avec design moderne */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <Network className="h-4 w-4 text-white" />
                </div>
                Recrutement
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {mlmLoading ? '...' : (mlmStats?.equipeComplete || mlmStats?.totalVendeurs || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Total Vendeurs</p>
                    </div>
                  </div>
                  <a href="/recruitment/vendors" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Voir tous les vendeurs →
                  </a>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {mlmLoading ? '...' : (mlmStats?.vendeursActifs || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Vendeurs Actifs</p>
                    </div>
                  </div>
                  <a href="/recruitment/vendors" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Voir tous les vendeurs →
                  </a>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {vendeursARelancerLoading ? '...' : (vendeursARelancerData?.vendeursARelancer || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Vendeurs à relancer</p>
                    </div>
                  </div>
                  <a href="/recruitment/prospects?type=vendeur" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                    Voir les prospects →
                  </a>
                </div>

                <Link href="/mlm/fast-start-bonus" className="block">
                  <div className={`bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-white/70 ${(mlmStats?.joursDepuisDemarrage || 0) <= 365 ? 'animate-attention-blink' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">
                          {mlmLoading ? '...' : (mlmStats?.joursDepuisDemarrage || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Jours depuis démarrage</p>
                      </div>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      Votre Plan d'action →
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Section Graphiques Analytics - Dupliqués depuis la page Ventes */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                Analytics Ventes
              </h2>
              
              {/* Graphiques côte à côte avec scroll horizontal VISIBLE */}
              <div className="relative">
                {/* Boutons de navigation sur desktop */}
                <button 
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full items-center justify-center transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    const container = document.querySelector('.analytics-scroll');
                    if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <button 
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full items-center justify-center transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    const container = document.querySelector('.analytics-scroll');
                    if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                  }}
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
                
                <div 
                  className="flex gap-3 overflow-x-auto pb-4 px-4 snap-x snap-mandatory analytics-scroll"
                  style={{ 
                    scrollPaddingLeft: '1rem',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  
                  {/* Premier graphique - Sources des clients - PARTIELLEMENT VISIBLE */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden flex-shrink-0 w-[85vw] sm:w-[75vw] md:w-[320px] snap-start">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <div className="p-1.5 bg-white/20 rounded-full">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        Sources des clients
                      </CardTitle>
                      <CardDescription className="text-blue-100 mt-1 text-xs sm:text-sm">
                        Répartition par canal d'acquisition
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {isLoadingSources ? (
                        <div className="h-48 sm:h-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
                      ) : (
                        <div className="space-y-3">
                          {/* Graphique circulaire compact */}
                          <div className="relative h-48 sm:h-60">
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
                                  outerRadius={75}
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
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                    fontSize: '11px'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={40}
                                  iconType="circle"
                                  wrapperStyle={{ 
                                    fontSize: '9px',
                                    fontWeight: '500',
                                    paddingTop: '4px',
                                    lineHeight: '1.2'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Stats résumées ultra-compactes */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-blue-600">
                                {sourcesData.reduce((sum, source) => sum + source.value, 0)}
                              </div>
                              <div className="text-xs text-blue-700 font-medium leading-tight">Total clients</div>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-green-600">
                                {sourcesData.length}
                              </div>
                              <div className="text-xs text-green-700 font-medium leading-tight">Sources actives</div>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-purple-600">
                                {sourcesData.length > 0 ? Math.round(sourcesData.reduce((max, current) => current.value > max.value ? current : max, sourcesData[0])?.percentage || 0) : 0}%
                              </div>
                              <div className="text-xs text-purple-700 font-medium leading-tight">Source principale</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Deuxième graphique - Ventes par produit - PARTIELLEMENT VISIBLE */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden flex-shrink-0 w-[85vw] sm:w-[75vw] md:w-[320px] snap-start">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <div className="p-1.5 bg-white/20 rounded-full">
                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        Ventes par produit
                      </CardTitle>
                      <CardDescription className="text-green-100 mt-1 text-xs sm:text-sm">
                        Performance des différents produits Freebox
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {isLoadingProducts ? (
                        <div className="h-48 sm:h-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
                      ) : (
                        <div className="space-y-3">
                          {/* Graphique circulaire compact */}
                          <div className="relative h-48 sm:h-60">
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
                                  outerRadius={75}
                                  innerRadius={0}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {productsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={productsColors[index % productsColors.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name) => [`${value} clients`, name]} 
                                  contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                    fontSize: '11px'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={40}
                                  iconType="circle"
                                  wrapperStyle={{ 
                                    fontSize: '9px',
                                    fontWeight: '500',
                                    paddingTop: '4px',
                                    lineHeight: '1.2'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Stats résumées ultra-compactes */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-green-600">
                                {productsData.reduce((sum, product) => sum + product.value, 0)}
                              </div>
                              <div className="text-xs text-green-700 font-medium leading-tight">Total produits</div>
                            </div>
                            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-indigo-600">
                                {productsData.length}
                              </div>
                              <div className="text-xs text-indigo-700 font-medium leading-tight">Gammes</div>
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-md p-1.5 text-center">
                              <div className="text-sm font-bold text-orange-600">
                                {productsData.length > 0 ? Math.round(productsData.reduce((max, current) => current.percentage > max.percentage ? current : max, productsData[0])?.percentage || 0) : 0}%
                              </div>
                              <div className="text-xs text-orange-700 font-medium leading-tight">Top produit</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Troisième carte - Progression 12 mois */}
                  <div className="flex-shrink-0 w-[85vw] sm:w-[420px] snap-start">
                    <ProgressionCardCompactV2 />
                  </div>

                </div>
                
                {/* Indicateur visuel de scroll horizontal */}
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col items-center text-gray-400 pointer-events-none">
                  <div className="text-xs font-medium mb-1">Glissez</div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  <ChevronRight className="h-3 w-3 mt-1 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Mise à Jour Quotidienne */}
          {dailyUpdate && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200/30">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mise à Jour Quotidienne</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Activités d'aujourd'hui - {new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{dailyUpdate.newTasksCount || 0}</div>
                    <div className="text-xs text-gray-600">Nouvelles tâches</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{dailyUpdate.newClientsCount || 0}</div>
                    <div className="text-xs text-gray-600">Nouveaux clients</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{dailyUpdate.todayDueTasksCount || 0}</div>
                    <div className="text-xs text-gray-600">À faire aujourd'hui</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{dailyUpdate.overdueTasksCount || 0}</div>
                    <div className="text-xs text-gray-600">En retard</div>
                  </div>
                </div>

                {(dailyUpdate.newTasks?.length > 0 || dailyUpdate.newClients?.length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {dailyUpdate.newTasks?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <ListChecks className="h-4 w-4" />
                          Nouvelles tâches ({dailyUpdate.newTasks.length})
                        </h3>
                        <div className="space-y-2">
                          {dailyUpdate.newTasks.slice(0, 3).map((task: any) => (
                            <div key={task.id} className="bg-white/60 p-3 rounded-lg text-sm">
                              <div className="font-medium text-gray-900">{task.title}</div>
                              {task.client && (
                                <div className="text-xs text-gray-500">Client: {task.client}</div>
                              )}
                              <div className="text-xs text-blue-600 mt-1">
                                Priorité: {task.priority || 'normale'} | 
                                Échéance: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                              </div>
                            </div>
                          ))}
                          {dailyUpdate.newTasks.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-2">
                              +{dailyUpdate.newTasks.length - 3} autres tâches
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {dailyUpdate.newClients?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Nouveaux clients ({dailyUpdate.newClients.length})
                        </h3>
                        <div className="space-y-2">
                          {dailyUpdate.newClients.slice(0, 3).map((client: any) => (
                            <div key={client.id} className="bg-white/60 p-3 rounded-lg text-sm">
                              <div className="font-medium text-gray-900">{client.nom}</div>
                              <div className="text-xs text-gray-500">
                                {client.produit} | {client.status}
                              </div>
                              {client.telephone && (
                                <div className="text-xs text-blue-600">{client.telephone}</div>
                              )}
                            </div>
                          ))}
                          {dailyUpdate.newClients.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-2">
                              +{dailyUpdate.newClients.length - 3} autres clients
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activités Récentes avec design moderne */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <ListChecks className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Activités Récentes</h2>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Dernières actions effectuées</p>
                </div>
              </div>
              <div className="space-y-3">
                {isLoadingActivities ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : activitiesData.length > 0 ? (
                  activitiesData.slice(0, 5).map((activity: any, index: number) => (
                    <div 
                      key={activity.id || index} 
                      className="flex items-center p-3 bg-white/50 rounded-xl border border-white/20 hover:shadow-md hover:shadow-blue-200 hover:bg-white/70 hover:border-blue-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{activity.title}</h3>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('fr-FR') : 'Récent'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tâches à Venir avec design moderne */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Tâches en Attente</h2>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Priorités intelligentes appliquées</p>
                  </div>
                </div>
                <a 
                  href="/tasks" 
                  className="group flex items-center gap-2 px-3 py-2 sm:px-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-200 hover:shadow-md flex-shrink-0"
                  onClick={(e) => {
                    // Préchargement optimisé pour navigation plus rapide
                    e.preventDefault();
                    window.location.href = "/tasks";
                  }}
                >
                  <span className="text-xs sm:text-sm font-medium text-purple-700 group-hover:text-purple-800 hidden sm:inline">Voir toutes</span>
                  <span className="text-xs font-medium text-purple-700 group-hover:text-purple-800 sm:hidden">Toutes</span>
                  <div className="w-5 h-5 bg-purple-600 group-hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors">
                    <span className="text-white text-xs font-bold">→</span>
                  </div>
                </a>
              </div>
              <div className="space-y-3">
                {isLoadingTasks ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : tasksData.length > 0 ? (
                  tasksData.slice(0, 5).map((task: any, index: number) => {
                    // Calculer le statut d'échéance pour les indicateurs visuels
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                    const isUrgent = task.dueDate && !isOverdue && 
                      (new Date(task.dueDate).getTime() - new Date().getTime()) <= (48 * 60 * 60 * 1000);
                    
                    // Déterminer l'indicateur visuel selon priorité et échéance
                    const getTaskIndicator = () => {
                      if (isOverdue) return { icon: '⚠️', text: 'RETARD', color: 'text-red-600' };
                      if (isUrgent) return { icon: '⏰', text: 'URGENT', color: 'text-orange-600' };
                      if (task.priority === 'urgent') return { icon: '🔥', text: 'URGENT', color: 'text-red-600' };
                      if (task.priority === 'high') return { icon: '📍', text: 'ÉLEVÉ', color: 'text-orange-600' };
                      return { icon: '📅', text: 'Normal', color: 'text-blue-600' };
                    };
                    
                    const indicator = getTaskIndicator();
                    
                    return (
                      <div 
                        key={task.id || index} 
                        className="flex items-center p-3 bg-white/50 rounded-xl border border-white/20 hover:shadow-md hover:shadow-purple-200 hover:bg-white/70 hover:border-purple-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          task.priority === 'urgent' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          task.priority === 'high' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          task.priority === 'medium' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 text-sm truncate flex-1">{task.title}</h3>
                            <span className={`text-xs font-semibold ${indicator.color} flex items-center gap-1 whitespace-nowrap flex-shrink-0`}>
                              <span>{indicator.icon}</span>
                              <span className="hidden sm:inline">{indicator.text}</span>
                              <span className="sm:hidden">{indicator.icon}</span>
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 truncate">{task.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Score: {task.importance} • 
                            {task.dueDate ? ` Échéance: ${new Date(task.dueDate).toLocaleDateString('fr-FR')}` : ' À définir'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucune tâche en attente</p>
                    <p className="text-xs mt-1 text-gray-400">Les tâches terminées ont été masquées pour vous concentrer sur l'essentiel</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Classement des vendeurs avec design moderne */}
          <div className="mb-8">
            <VendorRankings />
          </div>
        </div>
      </div>

      {/* Boîte de dialogue pour les détails des activités */}
      <ActivityDetailDialog
        activity={selectedActivity}
        isOpen={isActivityDialogOpen}
        onClose={handleCloseActivityDialog}
      />

    </AppLayout>
  );
}
