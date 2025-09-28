import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardizedTabsList, StandardizedTabsTrigger } from "@/components/ui/standardized-tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NewTaskForm } from "@/components/forms/new-task-form";
import TaskAutomation from "@/components/tasks/TaskAutomation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Clock, AlertTriangle, Calendar, User, CheckCircle2, MoreVertical, Edit, Trash2, Eye, Plus, ArrowLeft, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  clientName?: string;
  userName?: string;
  category: string;
  estimatedDuration?: number;
  taskType?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  isTeamTask?: boolean;
}

const priorityColors = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200", 
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200"
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200"
};

const categoryIcons = {
  appel: "📞",
  suivi: "👥", 
  prospection: "🎯",
  installation: "🔧",
  formation: "📚",
  administratif: "📋",
  administration: "⚙️",
  general: "📋"
};

const taskTypeColors = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  vendeur: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function TasksAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les tâches
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/tasks'],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false
  });

  // Mutations
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      await apiRequest('PUT', `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la tâche a été mis à jour",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  });

  // Filtrer les tâches
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    let matchesTab = true;
    if (activeTab === "overdue") {
      // Tâches en retard : date d'échéance passée et pas terminées
      matchesTab = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    } else if (activeTab !== "all" && activeTab !== "automation") {
      matchesTab = task.status === activeTab;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTab;
  });

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  // Fonction pour obtenir le libellé de la priorité
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  // Statistiques des tâches
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t: Task) => t.status === 'pending').length,
    inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
    completed: tasks.filter((t: Task) => t.status === 'completed').length,
    urgent: tasks.filter((t: Task) => t.priority === 'urgent').length,
    overdue: tasks.filter((t: Task) => {
      if (!t.dueDate) return false;
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return dueDate < today && t.status !== 'completed';
    }).length
  };

  // Gestionnaires d'événements
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header moderne optimisé mobile */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg mb-6">
          <div className="px-4 py-6">
            {/* Bouton retour mobile uniquement */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/hub")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Titre principal */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Gestion des Tâches
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Organisez et suivez vos tâches quotidiennes avec automatisation intelligente
              </p>
            </div>
            
            {/* Bouton nouvelle tâche centré */}
            <div className="flex justify-center">
              <Button 
                onClick={() => setIsNewTaskFormOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-6 py-3 rounded-xl font-semibold"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques - Layout optimisé mobile */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                <div className="text-sm text-gray-600 font-medium">Total</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">{stats.pending}</div>
                <div className="text-sm text-gray-600 font-medium">En attente</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.inProgress}</div>
                <div className="text-sm text-gray-600 font-medium">En cours</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{stats.completed}</div>
                <div className="text-sm text-gray-600 font-medium">Terminées</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Carte En retard centrée en dessous */}
          <div className="flex justify-center mt-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 w-48">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{stats.overdue}</div>
                <div className="text-sm text-gray-600 font-medium">En retard</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtres - Design moderne */}
        <div className="px-4 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets - Design moderne mobile */}
        <div className="px-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Toutes ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "pending"
                      ? "bg-orange-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  En attente ({stats.pending})
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={() => setActiveTab("in_progress")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "in_progress"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  En cours ({stats.inProgress})
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "completed"
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Terminées ({stats.completed})
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={() => setActiveTab("overdue")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "overdue"
                      ? "bg-red-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  En retard ({stats.overdue})
                </button>
                <button
                  onClick={() => setActiveTab("automation")}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === "automation"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Bot className="h-4 w-4 mr-2 inline" />
                  Automatisation
                </button>
              </div>
            </div>

            <TabsContent value="automation" className="mt-6">
              <div className="px-4">
                <TaskAutomation />
              </div>
            </TabsContent>

            {["all", "pending", "in_progress", "completed"].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="mt-6">
                <div className="px-4">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Chargement des tâches...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune tâche à afficher</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTasks.map((task: Task) => (
                        <Card key={task.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl text-white text-lg flex-shrink-0">
                                {categoryIcons[task.category as keyof typeof categoryIcons] || "📋"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{task.title}</h3>
                                {task.description && (
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{task.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                  <Badge className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}>
                                    {getStatusLabel(task.status)}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    {task.dueDate && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(task.dueDate), "dd/MM", { locale: fr })}
                                      </div>
                                    )}
                                    {task.clientName && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.clientName}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setLocation(`/tasks/${task.id}`)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Voir détails
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteTask(task)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Espacement mobile sécurisé */}
        <div className="pb-24">
          {/* Contenu ajouté via les onglets ci-dessus */}
        </div>

        {/* Formulaire de nouvelle tâche */}
        <Dialog open={isNewTaskFormOpen} onOpenChange={setIsNewTaskFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Créer une nouvelle tâche
              </DialogTitle>
            </DialogHeader>
            <NewTaskForm 
              onClose={() => setIsNewTaskFormOpen(false)}
              onSuccess={() => {
                setIsNewTaskFormOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteTask}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}