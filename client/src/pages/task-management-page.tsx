import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Clock, MapPin, User, Plus, Filter, BarChart3, Settings, Play, Activity, AlertTriangle, Search, CheckCircle, Circle, Calendar } from "lucide-react";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppLayout } from "@/components/layout/app-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TaskForm, TaskFormValues } from "@/components/tasks/task-form";
import { TaskAutomation } from "@/components/tasks/task-automation";

// Types pour les tâches
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'appel' | 'suivi' | 'prospection' | 'installation' | 'general';
  tags?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  location?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  clientName?: string;
  clientId?: number;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent: number;
  high: number;
  overdue: number;
  avgDuration: number;
}

// Schéma de validation pour les tâches


const priorityColors = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200'
};

const categoryIcons = {
  appel: "📞",
  suivi: "👥",
  prospection: "🎯",
  installation: "🔧",
  general: "📋"
};

export default function TaskManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Récupération des statistiques
  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  // Récupération des tâches avec filtres
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks/vendor", { status: filterStatus, priority: filterPriority, category: filterCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      
      const response = await fetch(`/api/tasks/vendor?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
      return response.json();
    }
  });



  // Mutation pour créer une tâche
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks/vendor", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tâche créée",
        description: "La nouvelle tâche a été ajoutée avec succès",
      });
      setIsDialogOpen(false);

      queryClient.invalidateQueries({ queryKey: ["/api/tasks/vendor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour une tâche
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tâche mise à jour",
        description: "Les modifications ont été enregistrées",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/vendor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const handleStatusChange = (taskId: number, newStatus: Task['status']) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Tâches groupées par statut
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-2 px-3 sm:py-4 sm:px-6 space-y-3 sm:space-y-6 pb-24">
        {/* PANNEAU D'AUTOMATISATION MOBILE OPTIMISÉ */}
        <div className="p-3 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Automatisation
            </h2>
            <div className="flex gap-2">
              <button className="flex-1 sm:flex-none px-3 py-2 text-sm border-2 border-blue-400 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 font-semibold">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Exécuter</span>
                <span className="sm:hidden">▶️</span>
              </button>
              <button className="flex-1 sm:flex-none px-3 py-2 text-sm border-2 border-purple-400 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurer</span>
                <span className="sm:hidden">⚙️</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="bg-white p-3 sm:p-4 text-center rounded-lg border-2 border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Tâches totales</div>
            </div>
            <div className="bg-white p-3 sm:p-4 text-center rounded-lg border-2 border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">En attente</div>
            </div>
            <div className="bg-white p-3 sm:p-4 text-center rounded-lg border-2 border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">En retard</div>
            </div>
            <div className="bg-white p-3 sm:p-4 text-center rounded-lg border-2 border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Terminées</div>
            </div>
          </div>
          <div className="text-sm sm:text-base text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
            ✅ Dernière exécution: Il y a 2h | ⏰ Prochaine: Dans 30min | ⚙️ 3 règles actives
          </div>
        </div>

        {/* En-tête mobile optimisé */}
        <div className="mb-6">
          {/* Version mobile - Stack vertical */}
          <div className="md:hidden space-y-3">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Tâches</h1>
              <p className="text-sm text-muted-foreground mt-1">Organisez et suivez vos activités</p>
            </div>
            <div className="flex justify-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm py-3">
                    <Plus className="mr-2 h-5 w-5" />
                    Nouvelle tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className={isMobile ? "w-full h-full max-w-none max-h-none p-0 m-0 rounded-none flex flex-col" : "max-w-2xl"}>
                  <DialogHeader className={isMobile ? "p-4 pb-2 border-b flex-shrink-0 bg-white z-10" : ""}>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                  </DialogHeader>
                  <div className={isMobile ? "flex-1 overflow-y-auto p-4 bg-gray-50" : ""}>
                    <TaskForm
                      onSubmit={onSubmit}
                      onCancel={() => setIsDialogOpen(false)}
                      isMobile={isMobile}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Version desktop - Horizontal */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Gestion des tâches</h1>
              <p className="text-muted-foreground mt-1">Organisez et suivez vos activités de vente</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                </DialogHeader>
                <TaskForm
                  onSubmit={onSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                  isMobile={isMobile}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>





        {/* Filtres et recherche - Optimisé mobile */}
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Input
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Filtres en grille mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="appel">Appel client</SelectItem>
                <SelectItem value="suivi">Suivi</SelectItem>
                <SelectItem value="prospection">Prospection</SelectItem>
                <SelectItem value="installation">Installation</SelectItem>
                <SelectItem value="general">Général</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vue des tâches par colonnes (Kanban) */}
        {/* Navigation par onglets mobile-friendly */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <StandardizedTabsList className="grid w-full grid-cols-5 mb-6" variant="blue">
            <StandardizedTabsTrigger value="overview" variant="blue" icon={<BarChart3 className="h-4 w-4" />}>
              <span className="hidden sm:inline">Vue</span>
              <span className="sm:hidden">Vue</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="automation" variant="blue" icon={<Settings className="h-4 w-4" />}>
              <span className="hidden sm:inline">Auto</span>
              <span className="sm:hidden">Auto</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="pending" variant="blue" icon={<Clock className="h-4 w-4" />}>
              <span className="hidden sm:inline">Attente</span>
              <span className="sm:hidden">Attente</span>
              <span className="ml-1">({pendingTasks.length})</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="progress" variant="blue" icon={<User className="h-4 w-4" />}>
              <span className="hidden sm:inline">En cours</span>
              <span className="sm:hidden">En cours</span>
              <span className="ml-1">({inProgressTasks.length})</span>
            </StandardizedTabsTrigger>
            <StandardizedTabsTrigger value="completed" variant="blue" icon={<CheckCircle className="h-4 w-4" />}>
              <span className="hidden sm:inline">Terminé</span>
              <span className="sm:hidden">Terminé</span>
              <span className="ml-1">({completedTasks.length})</span>
            </StandardizedTabsTrigger>
          </StandardizedTabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Vue d'ensemble en colonnes pour desktop, en liste pour mobile */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {/* Desktop: colonnes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    En attente ({pendingTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingTasks.slice(0, 3).map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucune tâche en attente</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    En cours ({inProgressTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inProgressTasks.slice(0, 3).map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                  {inProgressTasks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucune tâche en cours</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Terminées ({completedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.slice(0, 3).map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                  {completedTasks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucune tâche terminée</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mobile: résumé des tâches */}
            <div className="md:hidden space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé des tâches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{pendingTasks.length}</div>
                      <div className="text-sm text-blue-700">En attente</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{inProgressTasks.length}</div>
                      <div className="text-sm text-purple-700">En cours</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Utilisez les onglets ci-dessus pour voir les détails de chaque catégorie
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <TaskAutomation />
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Tâches en attente ({pendingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
                {pendingTasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune tâche en attente</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Tâches en cours ({inProgressTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
                {inProgressTasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune tâche en cours</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Tâches terminées ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune tâche terminée</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        </div>
      </div>
    </AppLayout>
  );
}

// Composant pour afficher une tâche
function TaskCard({ 
  task, 
  onStatusChange 
}: { 
  task: Task; 
  onStatusChange: (id: number, status: Task['status']) => void;
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card className={`p-4 border-l-4 ${isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-transparent'}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-lg">{categoryIcons[task.category]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          {task.clientName && (
            <Badge variant="outline" className="text-xs">
              {task.clientName}
            </Badge>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {format(new Date(task.dueDate), "dd/MM/yyyy HH:mm", { locale: fr })}
          </div>
        )}

        {task.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {task.location}
          </div>
        )}

        {task.estimatedDuration && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.estimatedDuration} min
          </div>
        )}

        <div className="flex gap-1 pt-2">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onStatusChange(task.id, 'in_progress')}
            >
              Commencer
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              Terminer
            </Button>
          )}
          {task.status === 'completed' && task.completedAt && (
            <div className="text-xs text-green-600">
              ✓ Terminé le {format(new Date(task.completedAt), "dd/MM", { locale: fr })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}