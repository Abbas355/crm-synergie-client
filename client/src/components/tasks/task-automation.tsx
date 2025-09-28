import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Settings, 
  Plus, 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Phone,
  Users,
  Target,
  Wrench,
  FileText,
  Trash2,
  Edit3
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AutomationRule {
  id: number;
  name: string;
  description: string;
  trigger: 'client_signature' | 'appointment_reminder' | 'installation_followup' | 'new_vendor_task';
  action: 'create_task' | 'send_notification' | 'update_status';
  isActive: boolean;
  conditions?: Record<string, any>;
  taskTemplate?: {
    title: string;
    description: string;
    category: string;
    priority: string;
    dueInDays: number;
  };
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  executedToday: number;
  tasksCreated: number;
  lastExecution?: string;
  nextExecution?: string;
}

const triggerLabels = {
  client_signature: "Signature de contrat",
  appointment_reminder: "Rappel de rendez-vous",
  installation_followup: "Suivi d'installation",
  new_vendor_task: "Prospection nouveaux vendeurs"
};

const actionLabels = {
  create_task: "Créer une tâche",
  send_notification: "Envoyer une notification",
  update_status: "Mettre à jour le statut"
};

const categoryIcons = {
  appel: <Phone className="h-4 w-4" />,
  suivi: <Users className="h-4 w-4" />,
  prospection: <Target className="h-4 w-4" />,
  installation: <Wrench className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />
};

export function TaskAutomation() {
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données d'automatisation
  const { data: stats } = useQuery<AutomationStats>({
    queryKey: ["/api/automation/stats"],
    queryFn: async () => {
      // Données temporaires pour démonstration
      return {
        totalRules: 4,
        activeRules: 3,
        executedToday: 12,
        tasksCreated: 8,
        lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextExecution: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };
    }
  });

  const { data: rules = [] } = useQuery<AutomationRule[]>({
    queryKey: ["/api/automation/rules"],
    queryFn: async () => {
      // Données temporaires pour démonstration
      return [
        {
          id: 1,
          name: "Tâches de suivi après signature",
          description: "Créer automatiquement des tâches de suivi après signature de contrat",
          trigger: "client_signature",
          action: "create_task",
          isActive: true,
          taskTemplate: {
            title: "Suivi post-signature - {{client_name}}",
            description: "Contacter le client pour confirmer les détails du contrat",
            category: "suivi",
            priority: "high",
            dueInDays: 1
          },
          createdAt: "2025-06-10T10:00:00Z",
          lastExecuted: "2025-06-15T08:00:00Z",
          executionCount: 15
        },
        {
          id: 2,
          name: "Rappels automatiques rendez-vous",
          description: "Envoyer des rappels pour les rendez-vous à venir",
          trigger: "appointment_reminder",
          action: "create_task",
          isActive: true,
          taskTemplate: {
            title: "Rappel RDV - {{client_name}}",
            description: "Appeler le client 24h avant le rendez-vous",
            category: "appel",
            priority: "medium",
            dueInDays: 0
          },
          createdAt: "2025-06-08T14:30:00Z",
          lastExecuted: "2025-06-14T16:00:00Z",
          executionCount: 23
        },
        {
          id: 3,
          name: "Suivi installations programmées",
          description: "Créer des tâches de suivi pour les installations",
          trigger: "installation_followup",
          action: "create_task",
          isActive: true,
          taskTemplate: {
            title: "Suivi installation - {{client_name}}",
            description: "Vérifier que l'installation s'est bien déroulée",
            category: "installation",
            priority: "medium",
            dueInDays: 2
          },
          createdAt: "2025-06-05T09:15:00Z",
          lastExecuted: "2025-06-13T11:30:00Z",
          executionCount: 8
        },
        {
          id: 4,
          name: "Prospection nouveaux vendeurs",
          description: "Tâches de prospection pour les nouveaux vendeurs",
          trigger: "new_vendor_task",
          action: "create_task",
          isActive: false,
          taskTemplate: {
            title: "Formation nouveau vendeur - {{vendor_name}}",
            description: "Accompagner et former le nouveau vendeur",
            category: "prospection",
            priority: "high",
            dueInDays: 3
          },
          createdAt: "2025-06-01T16:45:00Z",
          executionCount: 2
        }
      ];
    }
  });

  // Mutation pour activer/désactiver une règle
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => {
      // Simulation d'API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Règle mise à jour",
        description: "Le statut de la règle d'automatisation a été modifié",
      });
    }
  });

  // Mutation pour exécuter manuellement les règles
  const executeRulesMutation = useMutation({
    mutationFn: async () => {
      // Simulation d'exécution
      return new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/stats"] });
      toast({
        title: "Automatisation exécutée",
        description: "Les règles d'automatisation ont été exécutées avec succès",
      });
    }
  });

  const handleExecuteRules = async () => {
    setIsExecuting(true);
    try {
      await executeRulesMutation.mutateAsync();
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffMinutes}min`;
    }
  };

  const formatTimeIn = (dateString?: string) => {
    if (!dateString) return "Non programmé";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Dans ${diffMinutes}min`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Dans ${diffHours}h`;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Automatisation des Tâches</CardTitle>
                <p className="text-sm text-blue-700 mt-1">Optimisez votre workflow avec des règles intelligentes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExecuteRules}
                disabled={isExecuting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isExecuting ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="ml-2">Exécuter</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRuleDialogOpen(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Configurer</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalRules || 0}</div>
              <div className="text-sm text-gray-600">Tâches totales</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{stats?.executedToday || 0}</div>
              <div className="text-sm text-gray-600">Terminées aujourd'hui</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{rules.filter(r => r.isActive).length}</div>
              <div className="text-sm text-gray-600">En cours</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{rules.filter(r => !r.isActive).length}</div>
              <div className="text-sm text-gray-600">En retard</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-6 text-sm text-blue-800">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Dernière exécution: {formatTimeAgo(stats?.lastExecution)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Prochaine: {formatTimeIn(stats?.nextExecution)}
              </span>
              <span className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                {stats?.activeRules || 0} règles actives
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section des règles d'automatisation actives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Règles d'automatisation actives
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsRuleDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle règle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune règle d'automatisation configurée</p>
              <Button
                className="mt-3"
                onClick={() => setIsRuleDialogOpen(true)}
              >
                Créer la première règle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-gray-100 rounded">
                          {categoryIcons[rule.taskTemplate?.category as keyof typeof categoryIcons] || <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {triggerLabels[rule.trigger]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[rule.action]}
                        </Badge>
                        {rule.taskTemplate && (
                          <Badge variant="outline" className="text-xs">
                            Priorité: {rule.taskTemplate.priority}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Exécutée {rule.executionCount} fois</span>
                        {rule.lastExecuted && (
                          <span>Dernière: {formatTimeAgo(rule.lastExecuted)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => {
                          toggleRuleMutation.mutate({
                            ruleId: rule.id,
                            isActive: checked
                          });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRule(rule);
                          setIsRuleDialogOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour créer/modifier une règle */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Modifier la règle" : "Nouvelle règle d'automatisation"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">Nom de la règle</Label>
                <Input
                  id="rule-name"
                  placeholder="Ex: Suivi post-signature"
                  defaultValue={editingRule?.name}
                />
              </div>
              <div>
                <Label htmlFor="rule-trigger">Déclencheur</Label>
                <Select defaultValue={editingRule?.trigger}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_signature">Signature de contrat</SelectItem>
                    <SelectItem value="appointment_reminder">Rappel de rendez-vous</SelectItem>
                    <SelectItem value="installation_followup">Suivi d'installation</SelectItem>
                    <SelectItem value="new_vendor_task">Prospection nouveaux vendeurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                placeholder="Décrivez ce que fait cette règle..."
                defaultValue={editingRule?.description}
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Configuration de la tâche</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-title">Titre de la tâche</Label>
                  <Input
                    id="task-title"
                    placeholder="Ex: Suivi - {{client_name}}"
                    defaultValue={editingRule?.taskTemplate?.title}
                  />
                </div>
                <div>
                  <Label htmlFor="task-category">Catégorie</Label>
                  <Select defaultValue={editingRule?.taskTemplate?.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appel">Appel</SelectItem>
                      <SelectItem value="suivi">Suivi</SelectItem>
                      <SelectItem value="prospection">Prospection</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="general">Général</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-priority">Priorité</Label>
                  <Select defaultValue={editingRule?.taskTemplate?.priority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-due">Échéance (jours)</Label>
                  <Input
                    id="task-due"
                    type="number"
                    placeholder="1"
                    defaultValue={editingRule?.taskTemplate?.dueInDays}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="task-description">Description de la tâche</Label>
                <Textarea
                  id="task-description"
                  placeholder="Description détaillée de la tâche à créer..."
                  defaultValue={editingRule?.taskTemplate?.description}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRuleDialogOpen(false);
                  setEditingRule(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setIsRuleDialogOpen(false);
                  setEditingRule(null);
                  toast({
                    title: editingRule ? "Règle mise à jour" : "Règle créée",
                    description: "La règle d'automatisation a été sauvegardée",
                  });
                }}
              >
                {editingRule ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}