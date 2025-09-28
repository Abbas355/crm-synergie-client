import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, 
  Clock, 
  Users, 
  TrendingUp, 
  Crown, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Calendar,
  Euro,
  Trophy,
  Star,
  ExternalLink,
  ChevronRight,
  Lightbulb
} from "lucide-react";

/**
 * COMPOSANT ACTION PLAN DIALOG
 * ===========================
 * 
 * Interface utilisateur complète pour afficher le plan d'action personnalisé MLM
 * vers la qualification Regional Coordinator (RC).
 * 
 * FONCTIONNALITÉS :
 * - Récupération des données réelles via TanStack Query
 * - Affichage de la position actuelle et progression vers RC
 * - Liste des objectifs prioritaires avec actions suggérées
 * - Design glassmorphism cohérent avec l'application
 * - Responsive mobile-first
 */

interface ActionPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionPlanDialog({ isOpen, onOpenChange }: ActionPlanDialogProps) {
  // Récupération des données du plan d'action personnalisé avec unwrapping automatique
  const { data: actionPlan, isLoading, error } = useQuery({
    queryKey: ["/api/mlm/action-plan"],
    enabled: isOpen, // Ne charger que quand le dialog est ouvert
    staleTime: 2 * 60 * 1000, // Cache de 2 minutes
    gcTime: 5 * 60 * 1000, // Garbage collection après 5 minutes
    select: (response: any) => response?.data, // Unwrapper automatiquement les données
  });

  console.log('🎯 ACTION PLAN DIALOG - Données unwrappées:', { actionPlan, isLoading, error });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full max-h-[90vh] p-0 bg-white/90 backdrop-blur-md border-white/20 shadow-2xl">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-4 md:p-6 space-y-6">
            
            {/* HEADER */}
            <DialogHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Plan d'Action Personnalisé
                  </DialogTitle>
                  <p className="text-gray-600 text-sm md:text-base">
                    Votre roadmap vers la qualification Regional Coordinator
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* ÉTAT DE CHARGEMENT */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800">Génération du plan d'action...</p>
                  <p className="text-sm text-gray-600">Analyse de vos métriques MLM en cours</p>
                </div>
              </div>
            )}

            {/* GESTION D'ERREUR */}
            {error && (
              <Card className="bg-red-50/80 border-red-200/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Erreur de chargement</h3>
                      <p className="text-red-600">
                        Impossible de récupérer votre plan d'action. Veuillez réessayer.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CONTENU PRINCIPAL */}
            {actionPlan && !isLoading && (
              <div className="space-y-6">

                {/* APERÇU GLOBAL - KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Position Actuelle */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-gray-700">Position Actuelle</CardTitle>
                          <div className="text-xl font-bold text-blue-600">
                            {(() => {
                              const position = actionPlan.positionActuelle || "CQ";
                              switch(position) {
                                case "CQ": return "Conseiller Qualifié";
                                case "ETT": return "Executive Team Trainer";
                                case "ETL": return "Executive Team Leader";
                                case "Manager": return "Manager";
                                case "RC": return "Regional Coordinator";
                                default: return "Conseiller";
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Jours Restants */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-gray-700">Temps pour RC</CardTitle>
                          <div className="text-xl font-bold text-amber-600">
                            {actionPlan.joursRestants || 0} jours
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Équipes Qualifiées */}
                  <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-sm text-gray-700">Équipes Qualifiées</CardTitle>
                          <div className="text-xl font-bold text-emerald-600">
                            {actionPlan.rcDetails?.qualifiedTeams || 0} / 4
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                {/* PROGRESSION GLOBALE VERS RC */}
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span>Progression vers RC</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Barre de progression cumulative des équipes */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Points Cumulés des Équipes</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {actionPlan.groupPoints || 0} pts / 16,000 pts
                        </span>
                      </div>
                      
                      <div className="relative">
                        <Progress 
                          value={Math.min(((actionPlan.groupPoints || 0) / 4000) * 100, 100)} 
                          className="h-6" 
                        />
                        {/* Marqueur à 4000 points */}
                        <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
                          <div 
                            className="absolute top-0 h-full w-0.5 bg-green-500" 
                            style={{ left: '100%' }}
                          >
                            <div className="absolute -top-1 -left-8 text-xs text-green-600 font-medium">
                              4000
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                {/* OBJECTIFS PRIORITAIRES */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-800">Objectifs Prioritaires</h3>
                    <Badge variant="secondary" className="ml-2">
                      {actionPlan.objectives?.length || 0} objectifs
                    </Badge>
                  </div>

                  {actionPlan.objectives && actionPlan.objectives.length > 0 ? (
                    <div className="space-y-4">
                      {actionPlan.objectives.map((objective: any, index: number) => (
                        <Card key={objective.id} className={`bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all ${
                          objective.priority === 1 ? 'ring-2 ring-red-400 bg-red-50/30' :
                          objective.priority === 2 ? 'ring-2 ring-orange-400 bg-orange-50/30' :
                          'hover:ring-2 hover:ring-blue-400'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className={`p-2 rounded-lg ${
                                  objective.priority === 1 ? 'bg-red-500' :
                                  objective.priority === 2 ? 'bg-orange-500' :
                                  objective.priority === 3 ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}>
                                  {objective.priority === 1 ? <Zap className="h-4 w-4 text-white" /> :
                                   objective.priority === 2 ? <Star className="h-4 w-4 text-white" /> :
                                   <Target className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base md:text-lg text-gray-800">
                                    {objective.title}
                                  </CardTitle>
                                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                                    {objective.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <Badge variant={
                                  objective.priority === 1 ? "destructive" :
                                  objective.priority === 2 ? "default" : "secondary"
                                }>
                                  Priorité {objective.priority}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0 space-y-4">
                            {/* Progression de l'objectif */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progression</span>
                                <span className="font-medium">
                                  {objective.current} / {objective.target}
                                  {objective.metricKey?.includes('point') ? ' points' : ''}
                                </span>
                              </div>
                              <Progress 
                                value={Math.min((objective.current / objective.target) * 100, 100)} 
                                className="h-2" 
                              />
                              <p className="text-xs text-gray-500">
                                {objective.metricKey === 'qualifiedTeams' 
                                  ? `${objective.current} groupe(s) qualifié(s)` 
                                  : objective.delta > 0 
                                    ? `${objective.delta} manquant(s)` 
                                    : 'Objectif atteint'
                                }
                              </p>
                            </div>

                            {/* Actions suggérées */}
                            {objective.suggestedActions && objective.suggestedActions.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-gray-700">Actions suggérées</span>
                                </div>
                                <div className="space-y-1">
                                  {objective.suggestedActions.slice(0, 3).map((action: string, actionIndex: number) => (
                                    <div key={actionIndex} className="flex items-center space-x-2">
                                      <ChevronRight className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-600">{action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bouton d'action */}
                            {objective.link && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-3 hover:bg-blue-50"
                                onClick={() => window.open(objective.link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir les détails
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-green-50/80 border-green-200/50 shadow-lg">
                      <CardContent className="p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                          Félicitations !
                        </h3>
                        <p className="text-green-600">
                          Vous avez atteint tous vos objectifs actuels. Continuez sur cette lancée !
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* FOOTER ACTIONS */}
                <Separator className="my-6" />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/mlm/commissions'}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Voir Commissions MLM
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      window.location.href = '/clients?custom=relancer';
                      // Scroll vers le haut une fois la page chargée
                      setTimeout(() => window.scrollTo(0, 0), 100);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gérer Clients
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/recruitment'}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Recrutement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}