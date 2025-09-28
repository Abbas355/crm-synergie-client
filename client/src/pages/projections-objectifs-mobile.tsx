import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, TrendingUp, Target, Calendar, Users, Euro, Award } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectionData {
  ventesActuelles: number;
  projectionFinMois: number;
  croissanceEstimee: number;
  objectifMensuel?: number;
  progressionObjectif?: number;
}

interface VentesStats {
  installations: number;
  pointsCVD: number;
  commission: number;
  clientsRelancer: number;
  palier: number;
  tranche: number;
}

export default function ProjectionsObjectifsMobile() {
  const [objectifPersonnalise, setObjectifPersonnalise] = useState<number>(20);

  // Récupérer les projections
  const { data: projections, isLoading: loadingProjections } = useQuery<ProjectionData>({
    queryKey: ['/api/ventes/projections-fin-mois'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupérer les statistiques actuelles
  const { data: stats, isLoading: loadingStats } = useQuery<VentesStats>({
    queryKey: ['/api/ventes/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculer la progression vers l'objectif
  const progressionObjectif = projections && objectifPersonnalise > 0 
    ? Math.min((projections.ventesActuelles / objectifPersonnalise) * 100, 100)
    : 0;

  const projectionProgressionObjectif = projections && objectifPersonnalise > 0 
    ? Math.min((projections.projectionFinMois / objectifPersonnalise) * 100, 100)
    : 0;

  // Calculer les jours restants dans le mois
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const joursRestants = lastDayOfMonth - now.getDate();

  // Calculer le rythme nécessaire pour atteindre l'objectif
  const ventesNecessaires = objectifPersonnalise - (projections?.ventesActuelles || 0);
  const rythmeNecessaire = joursRestants > 0 ? ventesNecessaires / joursRestants : 0;

  if (loadingProjections || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/ventes">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Projections & Objectifs
          </h1>
          <div className="w-10" />
        </div>

        {/* Statistiques actuelles */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {projections?.ventesActuelles || 0}
                </div>
                <div className="text-sm text-gray-600">Ventes ce mois</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.pointsCVD || 0}
                </div>
                <div className="text-sm text-gray-600">Points CVD</div>
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.commission || 0}€
              </div>
              <div className="text-sm text-gray-600">Commission actuelle</div>
            </div>
          </CardContent>
        </Card>

        {/* Objectif mensuel */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Objectif Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Objectif:</span>
              <input
                type="number"
                value={objectifPersonnalise}
                onChange={(e) => setObjectifPersonnalise(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded text-center"
                min="1"
                max="100"
              />
              <span className="text-sm text-gray-600">ventes</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression actuelle</span>
                <span className="font-medium">{progressionObjectif.toFixed(1)}%</span>
              </div>
              <Progress value={progressionObjectif} className="h-2" />
            </div>

            {ventesNecessaires > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-sm font-medium text-amber-800">
                  {ventesNecessaires} ventes restantes
                </div>
                <div className="text-xs text-amber-600">
                  Rythme nécessaire: {rythmeNecessaire.toFixed(1)} ventes/jour
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projections fin de mois */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Projections Fin de Mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {projections?.projectionFinMois || 0}
              </div>
              <div className="text-sm text-gray-600">Ventes projetées</div>
              <Badge variant="secondary" className="mt-2">
                +{projections?.croissanceEstimee || 0}% estimé
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression objectif (projetée)</span>
                <span className="font-medium">{projectionProgressionObjectif.toFixed(1)}%</span>
              </div>
              <Progress value={projectionProgressionObjectif} className="h-2" />
            </div>

            {projectionProgressionObjectif >= 100 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Objectif atteignable !
                </div>
                <div className="text-xs text-green-600">
                  Vous êtes sur la bonne voie pour dépasser votre objectif
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Informations du Mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Jours restants:</span>
              <span className="font-medium">{joursRestants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Clients à relancer:</span>
              <span className="font-medium">{stats?.clientsRelancer || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Palier CVD actuel:</span>
              <Badge variant="outline">{stats?.palier || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tranche commission:</span>
              <Badge variant="outline">Tranche {stats?.tranche || 1}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="space-y-3">
          <Link href="/clients">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Users className="h-4 w-4 mr-2" />
              Gérer mes clients
            </Button>
          </Link>
          
          <Link href="/ventes">
            <Button variant="outline" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Retour aux ventes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}