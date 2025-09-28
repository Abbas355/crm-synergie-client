import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Package, Smartphone, Users, ChevronLeft, ChevronRight, TrendingUp, Target, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RankingData {
  userId: number;
  username: string;
  prenom: string;
  nom: string;
  codeVendeur: string;
  ventesBox?: number;
  ventesSim?: number;
  recrutementsTotal?: number;
}

interface DetailedStats {
  ventesValidees: number;
  clientsARelancer: number;
  ptsGeneres: number;
  installations: number;
  nombreBox: number;
  nbForfait5G: number;
}

interface RankingTableProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: RankingData[];
  isLoading: boolean;
  type: 'box' | 'sim' | 'recruiters';
}

function DetailedStatsCard() {
  const [, setLocation] = useLocation();
  
  // Récupérer les statistiques détaillées
  const { data: stats, isLoading } = useQuery<DetailedStats>({
    queryKey: ["/api/clients/custom-stats"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fonction pour naviguer vers la page clients avec filtre et scroll automatique
  const navigateWithScroll = (filter: string) => {
    setLocation(`/clients?${filter}`);
    
    // Fonction pour essayer le scroll avec plusieurs tentatives
    const attemptScroll = (attempts = 0) => {
      const maxAttempts = 20; // Maximum 20 tentatives (2 secondes)
      
      if (attempts >= maxAttempts) {
        console.log('Scroll automatique: Maximum de tentatives atteint');
        return;
      }
      
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        console.log('Scroll automatique: Élément trouvé, défilement...');
        tableElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      } else {
        console.log(`Scroll automatique: Élément non trouvé (tentative ${attempts + 1}/${maxAttempts})`);
        setTimeout(() => attemptScroll(attempts + 1), 100);
      }
    };
    
    // Démarrer les tentatives après un délai initial
    setTimeout(() => attemptScroll(), 200);
  };

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Ventes validées",
      value: stats.ventesValidees,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      filter: "status=valide",
      description: "Clients avec statut validé"
    },
    {
      title: "Clients à relancer",
      value: stats.clientsARelancer,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      filter: "custom=relancer",
      description: "Clients nécessitant un suivi"
    },
    {
      title: "Points générés",
      value: stats.ptsGeneres,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      filter: "custom=points",
      description: "Points CVD du mois"
    },
    {
      title: "Installations",
      value: stats.installations,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      filter: "custom=installations",
      description: "Installations du mois"
    },
    {
      title: "Nombre de Box",
      value: stats.nombreBox,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      filter: "custom=box",
      description: "Clients avec Freebox"
    },
    {
      title: "Forfait 5G",
      value: stats.nbForfait5G,
      icon: Smartphone,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      filter: "custom=5g",
      description: "Clients avec forfait 5G"
    }
  ];

  return (
    <Card className="col-span-1 md:col-span-3 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span>Statistiques détaillées - Juillet 2025</span>
        </CardTitle>
        <CardDescription>
          Performances et métriques du mois en cours - Cliquez sur une carte pour voir les détails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => navigateWithScroll(stat.filter)}
              className={`
                p-4 rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer
                ${stat.bgColor} ${stat.borderColor} hover:shadow-xl
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigateWithScroll(stat.filter);
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <div className="text-sm text-gray-700 font-medium mb-1">
                {stat.title}
              </div>
              <div className="text-xs text-gray-500">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RankingTable({ title, icon: Icon, data, isLoading, type }: RankingTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getValueForType = (item: RankingData) => {
    switch (type) {
      case 'box':
        return item.ventesBox || 0;
      case 'sim':
        return item.ventesSim || 0;
      case 'recruiters':
        return item.recrutementsTotal || 0;
      default:
        return 0;
    }
  };

  const getValueLabel = (type: string) => {
    switch (type) {
      case 'box':
        return 'ventes';
      case 'sim':
        return 'ventes';
      case 'recruiters':
        return 'recrutements';
      default:
        return 'points';
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-500 text-white";
      case 1:
        return "bg-gray-400 text-white";
      case 2:
        return "bg-orange-600 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="min-w-80 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/30 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="max-h-64 overflow-y-auto space-y-2 pr-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {data && data.length > 0 ? (
          data.slice(0, 10).map((vendor, index) => (
            <div
              key={`${vendor.codeVendeur}-${index}`}
              className={`
                flex items-center justify-between p-2 rounded-lg transition-all duration-200
                ${index < 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-2">
                <Badge 
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${getRankBadgeColor(index)}
                  `}
                >
                  {index + 1}
                </Badge>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {vendor.prenom} {vendor.nom}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getValueForType(vendor)} {getValueLabel(type)}
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            Aucun vendeur pour ce mois
          </div>
        )}
      </div>
    </div>
  );
}

export function VendorRankings() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // 0: Box, 1: Recruteurs (centre), 2: SIM

  // Récupérer les données des 3 classements
  const { data: boxSellers, isLoading: isLoadingBox } = useQuery<RankingData[]>({
    queryKey: ["/api/rankings/box-sellers"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: simSellers, isLoading: isLoadingSim } = useQuery<RankingData[]>({
    queryKey: ["/api/rankings/sim-sellers"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: recruiters, isLoading: isLoadingRecruiters } = useQuery<RankingData[]>({
    queryKey: ["/api/rankings/recruiters"],
    staleTime: 1000 * 60 * 5,
  });

  // Centrer automatiquement sur le tableau "Top 10 Recruteurs" au chargement
  useEffect(() => {
    if (scrollContainerRef.current && !isLoadingBox && !isLoadingSim && !isLoadingRecruiters) {
      const container = scrollContainerRef.current;
      // Largeur d'un tableau (256px) + gap ultra-réduit (2px) = 258px
      const tableWidth = 258;
      // Position pour afficher le tableau Recruteurs centré avec parties des autres visibles
      const scrollPosition = tableWidth * 1.25; // Ajusté pour les écarts ultra-réduits
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [isLoadingBox, isLoadingSim, isLoadingRecruiters]);

  // Gestionnaire pour détecter le scroll manuel et mettre à jour les points
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const tableWidth = 258;
      
      // Déterminer quelle page est visible basée sur la position de scroll
      if (scrollLeft < tableWidth * 0.5) {
        setCurrentPageIndex(0); // Box
      } else if (scrollLeft < tableWidth * 1.5) {
        setCurrentPageIndex(1); // Recruteurs
      } else {
        setCurrentPageIndex(2); // SIM
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef.current]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -258, behavior: 'smooth' });
      // Mettre à jour l'index de la page
      setCurrentPageIndex(prev => Math.max(0, prev - 1));
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 258, behavior: 'smooth' });
      // Mettre à jour l'index de la page
      setCurrentPageIndex(prev => Math.min(2, prev + 1));
    }
  };

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="whitespace-nowrap">Classement des vendeurs</span>
        </CardTitle>
        <CardDescription className="md:hidden text-center">
          Top 10 des vendeurs par catégorie • Glissez horizontalement ou utilisez les flèches
        </CardDescription>
        <CardDescription className="hidden md:block">
          Top 10 des vendeurs par catégorie - Affichage complet
        </CardDescription>
        
        {/* Curseurs de navigation mobile */}
        <div className="md:hidden flex flex-col items-center space-y-3 mt-2">
          <div className="flex items-center justify-center space-x-1">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPageIndex === 0 ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPageIndex === 1 ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPageIndex === 2 ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`}></div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="h-8 w-8 p-0 flex items-center justify-center border-2 border-orange-400 bg-white hover:bg-orange-50 rounded-full shadow-md"
            >
              <ChevronLeft className="h-4 w-4 text-orange-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="h-8 w-8 p-0 flex items-center justify-center border-2 border-orange-400 bg-white hover:bg-orange-50 rounded-full shadow-md"
            >
              <ChevronRight className="h-4 w-4 text-orange-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Affichage mobile: scroll horizontal */}
        <div className="block md:hidden">
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto pb-4 px-2 scroll-smooth"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="min-w-64 w-64 flex-shrink-0">
                <RankingTable
                  title="Top 10 vendeurs Box"
                  icon={Package}
                  data={boxSellers || []}
                  isLoading={isLoadingBox}
                  type="box"
                />
              </div>
              <div className="min-w-64 w-64 flex-shrink-0">
                <RankingTable
                  title="Top 10 Vendeurs SIM"
                  icon={Smartphone}
                  data={simSellers || []}
                  isLoading={isLoadingSim}
                  type="sim"
                />
              </div>
              <div className="min-w-64 w-64 flex-shrink-0">
                <RankingTable
                  title="Top 10 Recruteurs"
                  icon={Users}
                  data={recruiters || []}
                  isLoading={isLoadingRecruiters}
                  type="recruiters"
                />
              </div>
            </div>
            
            {/* Gradients fade améliorés pour mobile */}
            <div className="absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-gray-50 via-white/80 to-transparent pointer-events-none z-10 shadow-sm"></div>
            <div className="absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-gray-50 via-white/80 to-transparent pointer-events-none z-10 shadow-sm"></div>
            
            {/* Indicateurs de navigation plus visibles */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-orange-500 opacity-75 pointer-events-none z-20">
              <div className="animate-pulse">
                <ChevronLeft className="h-3 w-3" />
              </div>
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 opacity-75 pointer-events-none z-20">
              <div className="animate-pulse">
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Affichage desktop: grille pleine largeur */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RankingTable
              title="Top 10 vendeurs Box"
              icon={Package}
              data={boxSellers || []}
              isLoading={isLoadingBox}
              type="box"
            />
            <RankingTable
              title="Top 10 Vendeurs SIM"
              icon={Smartphone}
              data={simSellers || []}
              isLoading={isLoadingSim}
              type="sim"
            />
            <RankingTable
              title="Top 10 Recruteurs"
              icon={Users}
              data={recruiters || []}
              isLoading={isLoadingRecruiters}
              type="recruiters"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export des composants
export { DetailedStatsCard };