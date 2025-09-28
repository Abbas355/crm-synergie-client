import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  ListChecks,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TaskForm } from "@/components/tasks/task-form";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  completedAt?: string;
  clientId?: number;
  clientName?: string;
  userId: number;
  userName?: string;
  taskType: string;
  createdAt: string;
  estimatedDuration?: number;
  location?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  completedToday: number;
  avgCompletionTime?: number;
}

export function TasksDashboardCard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user && [1, 15].includes(user.id);

  // Récupération des statistiques des tâches
  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ["/api/tasks-stats"],
    queryFn: async () => {
      console.log("🔍 Appel API tasks-stats");
      const response = await apiRequest("GET", "/api/tasks-stats");
      const data = await response.json();
      console.log("📊 Stats reçues:", data);
      return data;
    },
    staleTime: 0, // Pas de cache
    gcTime: 0, // Pas de cache
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Récupération des tâches avec filtres
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { status: filterStatus, priority: filterPriority, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiRequest("GET", `/api/tasks?${params.toString()}`);
      return await response.json();
    }
  });

  // Mutation pour mettre à jour le statut d'une tâche
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks-stats"] });
      toast({
        title: "Tâche mise à jour",
        description: "Le statut de la tâche a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour déclencher l'automatisation
  const automationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tasks/automation/trigger");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Automatisation exécutée",
        description: `${data.tasksCreated || 0} tâches automatiques créées.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur d'automatisation",
        description: "Une erreur s'est produite lors de l'exécution de l'automatisation.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    updateTaskMutation.mutate({ id, status });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  const statusColors = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const categoryIcons = {
    appel: "📞",
    suivi: "👥", 
    prospection: "🎯",
    installation: "🔧",
    general: "📋"
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-orange-600" />
              Gestion des Tâches
            </CardTitle>
            <CardDescription className="hidden sm:block">
              Suivi et gestion de toutes vos tâches
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => automationMutation.mutate()}
              disabled={automationMutation.isPending}
              className="flex items-center gap-1"
            >
              {automationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Auto</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvelle tâche</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                  <DialogDescription>
                    Remplissez les détails de la nouvelle tâche
                  </DialogDescription>
                </DialogHeader>
                <TaskForm
                  onSubmit={async (data) => {
                    try {
                      await apiRequest("POST", "/api/tasks", data);
                      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
                      setIsDialogOpen(false);
                      toast({
                        title: "Tâche créée",
                        description: "La nouvelle tâche a été créée avec succès.",
                      });
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Une erreur s'est produite lors de la création.",
                        variant: "destructive",
                      });
                    }
                  }}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm">Mes tâches</TabsTrigger>
            <TabsTrigger value="automation" className="text-xs sm:text-sm">Automatisation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Statistiques */}
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-yellow-700">En attente</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-green-700">Terminées</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-sm text-red-700">En retard</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Aucune statistique disponible
              </div>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm p-2 sm:p-3">
                  <ListChecks className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Toutes les tâches</span>
                  <span className="sm:hidden">Toutes</span>
                </Button>
              </Link>
              <Link href="/tasks?filter=pending">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm p-2 sm:p-3">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">En attente</span>
                  <span className="sm:hidden">Attente</span>
                </Button>
              </Link>
              <Link href="/tasks?filter=overdue">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm p-2 sm:p-3">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">En retard</span>
                  <span className="sm:hidden">Retard</span>
                </Button>
              </Link>
              <Link href="/task-management">
                <Button variant="outline" className="w-full justify-start text-xs sm:text-sm p-2 sm:p-3">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des tâches */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasksLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucune tâche trouvée
                </div>
              ) : (
                filteredTasks.slice(0, 10).map((task) => (
                  <Card key={task.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`text-xs ${statusColors[task.status]}`}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.clientName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.clientName}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                          >
                            Commencer
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            Terminer
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {filteredTasks.length > 10 && (
              <div className="text-center">
                <Link href="/tasks">
                  <Button variant="outline">
                    Voir toutes les tâches ({filteredTasks.length})
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            {/* Panneau d'automatisation */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Automatisation des Tâches</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => automationMutation.mutate()}
                    disabled={automationMutation.isPending}
                  >
                    {automationMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Exécuter
                  </Button>
                  <Link href="/task-management">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configurer
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                  <div className="text-sm text-gray-600">Tâches totales</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <div className="text-2xl font-bold text-green-600">{stats?.completedToday || 0}</div>
                  <div className="text-sm text-gray-600">Terminées aujourd'hui</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.in_progress || 0}</div>
                  <div className="text-sm text-gray-600">En cours</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
                  <div className="text-sm text-gray-600">En retard</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Règles d'automatisation actives :</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Création automatique de tâches de suivi après signature de contrat</li>
                  <li>• Rappels automatiques pour les rendez-vous à venir</li>
                  <li>• Tâches de prospection pour les nouveaux vendeurs</li>
                  <li>• Suivi des installations programmées</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}