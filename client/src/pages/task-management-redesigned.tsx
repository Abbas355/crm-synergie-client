import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle, Calendar, User, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppLayout } from "@/components/layout/app-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TaskForm, TaskFormValues } from "@/components/tasks/task-form";

// Types simplifiés et corrigés
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  clientName?: string;
  clientId?: number;
  taskType: string;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Fonction pour obtenir la couleur de priorité
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Composant carte de tâche optimisé
function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: number, status: string) => void }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* En-tête avec titre et statut */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight flex-1">{task.title}</h3>
            <Badge className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}>
              {task.status === 'pending' && 'En attente'}
              {task.status === 'in_progress' && 'En cours'}
              {task.status === 'completed' && 'Terminé'}
            </Badge>
          </div>

          {/* Description si présente */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {/* Priorité */}
              <Badge className={`text-xs px-1 py-0.5 ${getPriorityColor(task.priority)}`}>
                {task.priority === 'urgent' && 'Urgent'}
                {task.priority === 'high' && 'Élevée'}
                {task.priority === 'medium' && 'Moyenne'}
                {task.priority === 'low' && 'Faible'}
              </Badge>

              {/* Date d'échéance */}
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'dd/MM', { locale: fr })}
                </div>
              )}
            </div>

            {/* Client associé */}
            {task.clientName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-20">{task.clientName}</span>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onStatusChange(task.id, 'in_progress')}
              >
                Démarrer
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onStatusChange(task.id, 'completed')}
              >
                Terminer
              </Button>
            )}
            {task.status === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onStatusChange(task.id, 'pending')}
              >
                Réouvrir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskManagementRedesigned() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Récupération des tâches
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/vendor"],
  });

  // Récupération des statistiques
  const { data: stats }: { data?: TaskStats } = useQuery({
    queryKey: ["/api/tasks/stats"],
  });

  // Mutation pour changer le statut d'une tâche
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/vendor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({ title: "Statut mis à jour", description: "La tâche a été mise à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la tâche", variant: "destructive" });
    }
  });

  // Mutation pour créer une tâche
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/vendor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      setIsDialogOpen(false);
      toast({ title: "Tâche créée", description: "La nouvelle tâche a été créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la tâche", variant: "destructive" });
    }
  });

  // Gestionnaires d'événements
  const handleStatusChange = (id: number, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const onSubmit = (data: TaskFormValues) => {
    createMutation.mutate(data);
  };

  // Filtrage des tâches
  const filteredTasks = (tasks || []).filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Séparation par statut
  const pendingTasks = filteredTasks.filter((task: Task) => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter((task: Task) => task.status === 'in_progress');
  const completedTasks = filteredTasks.filter((task: Task) => task.status === 'completed');

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* En-tête optimisé */}
        <div className="mb-6">
          {/* Version mobile */}
          <div className="md:hidden text-center space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Tâches</h1>
              <p className="text-sm text-muted-foreground">Organisez vos activités</p>
            </div>
            <Button 
              className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white py-3"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle tâche
            </Button>
          </div>

          {/* Modal mobile custom plein écran */}
          {isDialogOpen && isMobile && (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
              {/* Header fixe */}
              <div className="flex items-center justify-between p-4 border-b bg-white">
                <h2 className="text-lg font-semibold">Créer une nouvelle tâche</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>
              
              {/* Contenu scrollable */}
              <div 
                className="flex-1 overflow-y-auto px-4 py-6"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  height: 'calc(100vh - 80px)'
                }}
              >
                <TaskForm
                  onSubmit={onSubmit}
                  onCancel={() => setIsDialogOpen(false)}
                  isMobile={true}
                />
              </div>
            </div>
          )}

          {/* Version desktop */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des tâches</h1>
              <p className="text-muted-foreground">Organisez et suivez vos activités</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                  isMobile={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistiques rapides */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">En attente</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">En cours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Terminées</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              Toutes ({filteredTasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-1" />
              Attente ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              <AlertCircle className="h-4 w-4 mr-1" />
              En cours ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-1" />
              Terminées ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Contenu des onglets */}
          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Aucune tâche trouvée</p>
                </div>
              ) : (
                filteredTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Aucune tâche en attente</p>
                </div>
              ) : (
                pendingTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="in_progress">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Aucune tâche en cours</p>
                </div>
              ) : (
                inProgressTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Aucune tâche terminée</p>
                </div>
              ) : (
                completedTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}