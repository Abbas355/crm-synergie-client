import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, TrendingUp, CheckCircle, Box, Smartphone } from 'lucide-react';
import { Link } from 'wouter';

interface DashboardStats {
  ventesValidees: number;
  clientsARelancer: number;
  ptsGeneres: number;
  installations: number;
  nombreBox: number;
  nbForfait5g: number;
}

export function DashboardCards() {
  // 🎯 STATISTIQUES MOIS COURANT (pour page /clients)
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/clients/custom-stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // 🎯 POINTS MOIS COURANT spécifiques (installations ce mois)
  const { data: pointsMoisData } = useQuery({
    queryKey: ['/api/clients/points-mois-courant'],
    staleTime: 30 * 1000, // 30 secondes
  });

  // Fonction pour obtenir l'URL du filtre selon l'ID de la carte
  const getFilterUrl = (filterId: string) => {
    switch (filterId) {
      case 'ventes-validees':
        return '/clients?custom=signatures';
      case 'clients-relancer':
        return '/clients?custom=relancer';
      case 'pts-generes':
        return '/clients?custom=points';
      case 'installations':
        return '/clients?custom=installations';
      case 'nombre-box':
        return '/clients?custom=box';
      case 'nb-forfait-5g':
        return '/clients?custom=5g';
      default:
        return '/clients';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white shadow border-0">
            <CardContent className="p-3">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
        <p className="text-red-600 text-sm">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  const cardsData = [
    {
      id: 'ventes-validees',
      title: 'Ventes validées',
      value: stats?.ventesValidees ?? 0,
      subtitle: 'Signatures ce mois',
      actionText: 'Cliquez pour filtrer',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'clients-relancer',
      title: 'Clients à relancer',
      value: stats?.clientsARelancer ?? 0,
      subtitle: 'Pour valider',
      actionText: 'Cliquez pour filtrer',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'pts-generes',
      title: 'Pts générés',
      value: pointsMoisData?.pointsMoisCourant ?? stats?.ptsGeneres ?? 0,
      subtitle: 'Ce mois →',
      actionText: 'Cliquez pour filtrer',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'installations',
      title: 'Installations',
      value: stats?.installations ?? 0,
      subtitle: 'En cours ce mois',
      actionText: 'Cliquez pour filtrer',
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'nombre-box',
      title: 'Nombre de Box',
      value: stats?.nombreBox ?? 0,
      subtitle: 'Ce mois',
      actionText: 'Cliquez pour filtrer',
      icon: Box,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: 'nb-forfait-5g',
      title: 'Nb Forfait 5G',
      value: stats?.nbForfait5g ?? 0,
      subtitle: 'Ce mois',
      actionText: 'Cliquez pour filtrer',
      icon: Smartphone,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {cardsData.map((card) => {
        const IconComponent = card.icon;
        const filterUrl = getFilterUrl(card.id);
        
        return (
          <Card 
            key={card.id} 
            className="bg-white shadow border-0 cursor-pointer hover:shadow-md transition-shadow duration-200 transform hover:scale-105"
            onClick={() => {
              console.log('🔧 Dashboard card clicked:', card.id, 'redirecting to:', filterUrl);
              window.location.href = filterUrl;
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-start">
                <div className={`${card.bgColor} h-9 w-9 rounded-md flex items-center justify-center mb-2`}>
                  <IconComponent className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">{card.title}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-xs text-gray-500 mb-1">
                {card.subtitle}
              </div>
              <div className="text-xs text-blue-600 font-medium flex items-center">
                {card.actionText}
                <span className="ml-1">→</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}