/**
 * PAGE PROGRAMME DE PARRAINAGE CLIENTS ADDICTIF
 * Interface complète avec niveaux VIP, récompenses progressives,
 * événements bonus et gamification avancée
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { 
  Users, 
  Gift, 
  Crown, 
  TrendingUp, 
  Calendar,
  Star,
  Zap,
  Trophy,
  Target,
  Plus,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Types pour le système de parrainage
interface ReferralStats {
  userId: number;
  totalParrainages: number;
  parrainagesValides: number;
  moisGratuitsObtenus: number;
  prochainePalier?: {
    parrainage: number;
    moisGratuits: number;
  };
  niveauVip: string;
  avantagesVip: string[];
  couleurNiveau: string;
  prochainNiveau?: {
    nom: string;
    parrainagesRestants: number;
    avantages: string[];
  };
}

interface EventBonus {
  id: number;
  nom: string;
  description: string;
  typeBonus: string;
  valeurBonus: number;
  dateDebut: string;
  dateFin: string;
  couleurTheme: string;
  icone: string;
}

interface Parrainage {
  id: number;
  clientParrainNom: string;
  filleulPrenom: string;
  filleulNom: string;
  filleulEmail: string;
  produitSouhaite: string;
  statut: string;
  dateParrainage: string;
  recompenseParrain: number;
  recompenseAttribuee: boolean;
}

export default function ParrainageClientsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [, setLocation] = useLocation();

  const handleNouveauParrainage = () => {
    setLocation('/prospects?action=new');
  };

  // Récupérer les statistiques de parrainage de l'utilisateur
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: [`/api/referral/stats/${user?.id}`],
    enabled: !!user?.id
  });

  // Récupérer les événements bonus actifs
  const { data: eventsBonus } = useQuery<EventBonus[]>({
    queryKey: ['/api/referral/events-bonus']
  });

  // Récupérer la liste des parrainages
  const { data: parrainages } = useQuery<Parrainage[]>({
    queryKey: [`/api/referral/list/${user?.id}`],
    enabled: !!user?.id
  });

  // Récupérer la configuration du système
  const { data: config } = useQuery({
    queryKey: ['/api/referral/config']
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white/60 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white/60 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getVipIcon = (niveau: string) => {
    switch (niveau) {
      case 'platine': return <Crown className="h-5 w-5 text-gray-400" />;
      case 'or': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'argent': return <Award className="h-5 w-5 text-gray-400" />;
      default: return <Star className="h-5 w-5 text-amber-600" />;
    }
  };

  const getProgressToNext = () => {
    if (!stats?.prochainNiveau) return 100;
    const current = stats.parrainagesValides;
    const needed = stats.prochainNiveau.parrainagesRestants;
    const total = current + needed;
    return (current / total) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header avec titre et événements bonus */}
        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Programme de Parrainage
                  </h1>
                  <p className="text-gray-600">Recommandez vos amis et gagnez des récompenses</p>
                </div>
              </div>

              {/* Niveau VIP actuel */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getVipIcon(stats?.niveauVip || 'bronze')}
                  <span className="font-semibold text-lg capitalize" style={{ color: stats?.couleurNiveau }}>
                    Niveau {stats?.niveauVip}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">
                    {stats?.parrainagesValides || 0} parrainages validés
                  </div>
                  {stats?.prochainNiveau && (
                    <div className="space-y-1">
                      <Progress value={getProgressToNext()} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {stats.prochainNiveau.parrainagesRestants} parrainages restants pour {stats.prochainNiveau.nom}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Événements bonus actifs */}
          {eventsBonus && eventsBonus.length > 0 && (
            <Card className="w-full lg:w-80 bg-gradient-to-br from-orange-100 to-yellow-100 border-orange-200 shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800">Événements Actifs</h3>
                </div>
                <div className="space-y-3">
                  {eventsBonus.map(event => (
                    <div key={event.id} className="p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{event.icone}</span>
                        <span className="font-medium text-sm">{event.nom}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{event.description}</div>
                      <Badge variant="secondary" className="text-xs">
                        x{event.valeurBonus} multiplicateur
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalParrainages || 0}</div>
                  <div className="text-sm text-gray-600">Parrainages Total</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.parrainagesValides || 0}</div>
                  <div className="text-sm text-gray-600">Clients Installés</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats?.moisGratuitsObtenus || 0}</div>
                  <div className="text-sm text-gray-600">Mois Gratuits</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.prochainePalier?.moisGratuits || 0}
                  </div>
                  <div className="text-sm text-gray-600">Prochain Palier</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="parrainages" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Mes Parrainages</span>
            </TabsTrigger>
            <TabsTrigger value="recompenses" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Récompenses</span>
            </TabsTrigger>
            <TabsTrigger value="classement" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
          </TabsList>

          {/* Contenu Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Progression vers le prochain niveau */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    Progression VIP
                  </h3>
                  
                  {stats?.prochainNiveau ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Niveau actuel</span>
                        <span className="font-medium capitalize">{stats.niveauVip}</span>
                      </div>
                      
                      <Progress value={getProgressToNext()} className="h-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Objectif</span>
                        <span className="font-medium capitalize">{stats.prochainNiveau.nom}</span>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Avantages du niveau {stats.prochainNiveau.nom} :
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {stats.prochainNiveau.avantages.map((avantage, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-blue-600" />
                              {avantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 text-gold-500 mx-auto mb-4" />
                      <div className="text-lg font-semibold text-gray-700">Niveau Maximum Atteint !</div>
                      <div className="text-sm text-gray-600">Félicitations pour votre statut VIP Platine</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Prochaine récompense */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    Prochaine Récompense
                  </h3>
                  
                  {stats?.prochainePalier ? (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          +{stats.prochainePalier.moisGratuits}
                        </div>
                        <div className="text-sm text-gray-600">mois gratuits</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">
                          Pour votre {stats.prochainePalier.parrainage}ème parrainage
                        </div>
                        <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Parrainer un ami
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <div className="text-lg font-semibold text-gray-700">Toutes les récompenses débloquées !</div>
                      <div className="text-sm text-gray-600">Continuez à parrainer pour aider vos amis</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Bouton d'action principal */}
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                onClick={handleNouveauParrainage}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau Parrainage
              </Button>
            </div>
          </TabsContent>

          {/* Contenu Mes Parrainages */}
          <TabsContent value="parrainages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mes Parrainages</h2>
              <Button 
                className="bg-gradient-to-r from-green-600 to-blue-600"
                onClick={handleNouveauParrainage}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Parrainage
              </Button>
            </div>

            <div className="grid gap-4">
              {parrainages && parrainages.length > 0 ? (
                parrainages.map(parrainage => (
                  <Card key={parrainage.id} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold text-lg">
                              {parrainage.filleulPrenom} {parrainage.filleulNom}
                            </div>
                            <Badge 
                              variant={parrainage.statut === 'client_installe' ? 'default' : 'secondary'}
                              className={parrainage.statut === 'client_installe' ? 'bg-green-600' : ''}
                            >
                              {parrainage.statut === 'client_installe' ? 'Installé' : 'En cours'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Parrain : {parrainage.clientParrainNom}</div>
                            <div>Produit souhaité : {parrainage.produitSouhaite}</div>
                            <div>Email : {parrainage.filleulEmail}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Récompense</div>
                            <div className="font-semibold text-green-600">
                              +{parrainage.recompenseParrain} mois
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Date</div>
                            <div className="text-sm font-medium">
                              {new Date(parrainage.dateParrainage).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <div className="p-12 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucun parrainage pour le moment
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Commencez à parrainer vos amis et gagnez des récompenses exceptionnelles !
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                      onClick={handleNouveauParrainage}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Mon Premier Parrainage
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Contenu Récompenses */}
          <TabsContent value="recompenses" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  Barème des Récompenses
                </h2>
                
                {config?.RECOMPENSES_CLIENT && (
                  <div className="grid gap-4">
                    {config.RECOMPENSES_CLIENT.map((recompense: any, index: number) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          (stats?.parrainagesValides || 0) >= recompense.parrainage
                            ? 'bg-green-50 border-green-200 shadow-lg'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              (stats?.parrainagesValides || 0) >= recompense.parrainage
                                ? 'bg-green-600'
                                : 'bg-gray-400'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {recompense.parrainage}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold">
                                {recompense.description}
                              </div>
                              <div className="text-sm text-gray-600">
                                {recompense.parrainage}ème ami recommandé
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              +{recompense.moisGratuits} mois
                            </div>
                            <div className="text-sm text-gray-600">gratuits</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Contenu Classement */}
          <TabsContent value="classement" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Classement des Meilleurs Parrains
                </h2>
                
                <div className="text-center py-8">
                  <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Classement en cours de construction
                  </h3>
                  <p className="text-gray-600">
                    Le classement des meilleurs parrains sera bientôt disponible !
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}