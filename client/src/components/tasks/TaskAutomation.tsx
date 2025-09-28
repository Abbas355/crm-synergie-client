import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TaskAutomationDemo from "./TaskAutomationDemo";
import ClientsWithComments from "./ClientsWithComments";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Settings, 
  MessageCircle, 
  Phone, 
  Calendar, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Play,
  RefreshCw
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  category: string;
  priority: string;
  conditions: string[];
  actions: string[];
  createdTasks: number;
}

const TaskAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState("rules");
  const [activeRules, setActiveRules] = useState<{ [key: string]: boolean }>({
    'comment_analysis': true,
    'status_post_production': true,
    'appointment_reminder': false,
    'new_vendor_follow': false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createTasksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/tasks/create-from-comments');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Tâches créées avec succès",
        description: `${data.statistics.tasksCreated} nouvelles tâches créées, ${data.statistics.tasksSkipped} ignorées (déjà existantes)`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la création des tâches",
        description: "Impossible de créer les tâches automatiquement",
        variant: "destructive",
      });
      console.error('Erreur création tâches:', error);
    }
  });

  const automationRules: AutomationRule[] = [
    {
      id: 'comment_analysis',
      name: 'Analyse des commentaires',
      description: 'Création automatique de tâches basée sur l\'analyse des mots-clés dans les commentaires clients',
      trigger: 'Ajout/modification de commentaire',
      isActive: activeRules['comment_analysis'],
      category: 'appel/suivi',
      priority: 'moyenne',
      conditions: [
        'Mots-clés d\'appel: appeler, rappeler, recontacter, téléphoner',
        'Détection de dates dans le commentaire',
        'Analyse du contexte pour définir la priorité'
      ],
      actions: [
        'Créer tâche "Appeler [Nom Client]" si mots-clés d\'appel détectés',
        'Créer tâche "Suivi du contrat [Nom Client]" pour autres cas',
        'Extraire et assigner les dates d\'échéance automatiquement'
      ],
      createdTasks: 12
    },
    {
      id: 'status_post_production',
      name: 'Suivi Post-production',
      description: 'Génération automatique de tâches de suivi installation quand le statut client passe en Post-production',
      trigger: 'Changement de statut → Post-production',
      isActive: activeRules['status_post_production'],
      category: 'installation',
      priority: 'élevée',
      conditions: [
        'Statut client change vers "Post-production"',
        'Client n\'a pas déjà une tâche d\'installation active'
      ],
      actions: [
        'Créer tâche "Installation - [Nom Client]"',
        'Description: Reprendre contact pour comprendre l\'échec d\'installation',
        'Échéance: lendemain du changement de statut'
      ],
      createdTasks: 3
    },
    {
      id: 'appointment_reminder',
      name: 'Rappels de rendez-vous',
      description: 'Création automatique de rappels avant les rendez-vous clients programmés',
      trigger: 'Date de rendez-vous définie',
      isActive: activeRules['appointment_reminder'],
      category: 'rappel',
      priority: 'moyenne',
      conditions: [
        'Date de rendez-vous renseignée',
        'Statut client = "Rendez-vous"',
        'Pas de rappel déjà programmé'
      ],
      actions: [
        'Créer rappel J-1 avant le rendez-vous',
        'Créer rappel J-7 pour confirmation',
        'Notification automatique au vendeur'
      ],
      createdTasks: 0
    },
    {
      id: 'new_vendor_follow',
      name: 'Suivi nouveaux vendeurs',
      description: 'Génération automatique de tâches de prospection et formation pour les nouveaux vendeurs',
      trigger: 'Création d\'un nouveau vendeur',
      isActive: activeRules['new_vendor_follow'],
      category: 'prospection',
      priority: 'moyenne',
      conditions: [
        'Nouveau compte vendeur créé',
        'Première semaine d\'activité',
        'Moins de 5 clients créés'
      ],
      actions: [
        'Créer tâche de formation initiale',
        'Programmer suivi hebdomadaire',
        'Assigner mentor expérimenté'
      ],
      createdTasks: 0
    }
  ];

  const toggleRule = (ruleId: string) => {
    setActiveRules(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-gray-400" />
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'élevée': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalActiveTasks = automationRules.reduce((sum, rule) => 
    rule.isActive ? sum + rule.createdTasks : sum, 0
  );

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* En-tête mobile optimisé */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <Bot className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Automatisation
        </h1>
        <p className="text-gray-500 text-sm md:text-base">Règles intelligentes connectées aux données réelles</p>
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
          <Zap className="h-4 w-4 mr-1" />
          {totalActiveTasks} tâches créées
        </div>
      </div>

      {/* Statistiques mobiles optimisées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-white/90 to-green-50/80 border-0 shadow-lg">
          <CardContent className="p-3 text-center">
            <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-600">
              {automationRules.filter(rule => rule.isActive).length}/{automationRules.length}
            </div>
            <div className="text-xs text-gray-600">Règles actives</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-blue-50/80 border-0 shadow-lg">
          <CardContent className="p-3 text-center">
            <MessageCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-600">
              {automationRules.find(r => r.id === 'comment_analysis')?.createdTasks || 0}
            </div>
            <div className="text-xs text-gray-600">Commentaires</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-purple-50/80 border-0 shadow-lg">
          <CardContent className="p-3 text-center">
            <Settings className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-purple-600">
              {automationRules.find(r => r.id === 'status_post_production')?.createdTasks || 0}
            </div>
            <div className="text-xs text-gray-600">Post-prod</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-orange-50/80 border-0 shadow-lg">
          <CardContent className="p-3 text-center">
            <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-orange-600">
              {automationRules.filter(r => !r.isActive).length}
            </div>
            <div className="text-xs text-gray-600">En attente</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets mobile optimisés */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 gap-1 h-auto p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
          <TabsTrigger 
            value="rules" 
            className="text-xs md:text-sm px-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-1">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Règles</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="clients" 
            className="text-xs md:text-sm px-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Clients réels</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="demo" 
            className="col-span-2 md:col-span-1 text-xs md:text-sm px-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              <span className="text-xs">Test en direct</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Alerte d'information mobile optimisée */}
          <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <Bot className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-sm">
              Règles intelligentes connectées aux données réelles pour automatiser la création de tâches.
            </AlertDescription>
          </Alert>

          {/* Bouton d'action rapide */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Action rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">
                    Créer automatiquement des tâches pour tous les clients ayant des commentaires
                  </p>
                  <p className="text-xs text-gray-500">
                    Analyse les commentaires existants et génère des tâches de suivi intelligentes
                  </p>
                </div>
                <Button 
                  onClick={() => createTasksMutation.mutate()}
                  disabled={createTasksMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                >
                  {createTasksMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Créer les tâches
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des règles mobile optimisée */}
          <div className="grid gap-3">
            {automationRules.map((rule) => (
              <Card key={rule.id} className={`${rule.isActive ? 'border-green-200 bg-gradient-to-br from-white/90 to-green-50/50' : 'border-gray-200 bg-white/90'} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardHeader className="pb-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2 flex-1">
                      {getStatusIcon(rule.isActive)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg text-gray-800">{rule.name}</CardTitle>
                        <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{rule.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{rule.trigger}</Badge>
                          <Badge className={`${getPriorityColor(rule.priority)} text-xs`}>
                            {rule.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {rule.createdTasks} tâches
                          </span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                      className="flex-shrink-0"
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Conditions de déclenchement</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Actions automatiques</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rule.actions.map((action, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des tâches créées automatiquement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>L'historique des tâches automatiques sera affiché ici</p>
                <p className="text-sm">Les nouvelles tâches apparaîtront au fur et à mesure de leur création</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres globaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Les paramètres d'automatisation permettent de personnaliser le comportement des règles selon vos besoins.
                  </AlertDescription>
                </Alert>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Paramètres de configuration avancés</p>
                  <p className="text-sm">Délais, priorités, notifications...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientsWithComments />
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <TaskAutomationDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskAutomation;