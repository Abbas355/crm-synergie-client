import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter, Calendar, Bot, Clock, PlayCircle, CheckCircle, AlertTriangle, User, Zap, Star, ArrowUp, ArrowDown, Flame, Timer, Target, AlertCircle, History, Eye, Trash2, RotateCcw, Grid3X3, List } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewTaskForm } from "@/components/forms/new-task-form";
import TaskAutomation from "@/components/tasks/TaskAutomation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  clientId?: number;
  clientName?: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

interface TaskHistoryEntry {
  id: number;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: string;
  userNom?: string;
  userPrenom?: string;
  username?: string;
}

// Système de priorité intelligent avec calcul d'importance
const calculateTaskImportance = (task: Task): number => {
  let score = 0;
  
  // Points de priorité base
  const priorityPoints = {
    'urgent': 100,
    'high': 75,
    'medium': 50,
    'low': 25
  };
  score += priorityPoints[task.priority] || 0;
  
  // Bonus client lié (tâche avec client = plus importante)
  if (task.clientId) score += 20;
  
  // Malus si échéance dépassée (critique!)
  if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
    score += 50; // Les tâches en retard sont prioritaires
  }
  
  // Bonus si échéance dans les 48h
  if (task.dueDate) {
    const hoursUntilDue = (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 48 && hoursUntilDue > 0) score += 30;
  }
  
  // Malus si tâche ancienne (>7 jours)
  const daysOld = (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld > 7) score += Math.min(20, daysOld - 7); // Plus c'est vieux, plus c'est urgent
  
  return score;
};

// Fonction pour obtenir le style visuel selon l'importance
const getTaskVisualStyle = (task: Task, importance: number) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isUrgentDeadline = task.dueDate && (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60) <= 48;
  
  // 🎯 STYLE SPÉCIAL POUR TÂCHES TERMINÉES - Arrière-plan vert harmonisé avec médaillon visible
  if (task.status === 'completed') {
    return {
      borderColor: 'border-l-green-500',
      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      textColor: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
      badge: 'TERMINÉ',
      badgeColor: 'bg-green-600 text-white shadow-lg ring-2 ring-green-200'
    };
  }
  
  if (isOverdue) {
    return {
      borderColor: 'border-l-red-500',
      bgColor: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20',
      textColor: 'text-red-800 dark:text-red-200',
      icon: AlertCircle,
      badge: 'EN RETARD',
      badgeColor: 'bg-red-500 text-white'
    };
  }
  
  if (importance >= 120) {
    return {
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-gradient-to-r from-purple-50 to-indigo-100 dark:from-purple-950/20 dark:to-indigo-900/20',
      textColor: 'text-purple-800 dark:text-purple-200',
      icon: Flame,
      badge: 'CRITIQUE',
      badgeColor: 'bg-purple-600 text-white animate-pulse'
    };
  }
  
  if (importance >= 90 || task.priority === 'urgent') {
    return {
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
      textColor: 'text-orange-800 dark:text-orange-200',
      icon: Zap,
      badge: 'URGENT',
      badgeColor: 'bg-orange-500 text-white'
    };
  }
  
  if (importance >= 60 || isUrgentDeadline) {
    return {
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      icon: Timer,
      badge: 'IMPORTANT',
      badgeColor: 'bg-yellow-500 text-white'
    };
  }
  
  if (importance >= 40) {
    return {
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      textColor: 'text-blue-800 dark:text-blue-200',
      icon: Target,
      badge: 'NORMALE',
      badgeColor: 'bg-blue-500 text-white'
    };
  }
  
  return {
    borderColor: 'border-l-gray-300',
    bgColor: 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: ArrowDown,
    badge: 'FAIBLE',
    badgeColor: 'bg-gray-400 text-white'
  };
};

/**
 * PAGE TÂCHES AVEC PRIORISATION INTELLIGENTE
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Calcul automatique d'importance (score 0-150+)
 * - Tri intelligent par priorité réelle
 * - Design glassmorphisme avec codes couleurs
 * - Badges visuels animés pour urgence
 * - Médaillons esthétiques avec icônes contextuelles
 */
export default function TasksUnified() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Task>>({});
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("vue");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list"); // Vue liste par défaut

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation pour sauvegarder les modifications de tâche
  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const response = await apiRequest("PUT", `/api/tasks/${selectedTask?.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Succès",
        description: "La tâche a été modifiée avec succès",
        variant: "default",
      });
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la tâche",
        variant: "destructive",
      });
    }
  });

  // Fonction pour sauvegarder la tâche
  const handleSaveTask = async () => {
    if (!selectedTask || !editFormData.title?.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      title: editFormData.title.trim(),
      description: editFormData.description?.trim() || "",
      status: editFormData.status,
      priority: editFormData.priority,
      dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : null
    };


    updateTaskMutation.mutate(updateData);
  };

  // Récupérer les tâches - Cache optimisé pour performances
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 1000 * 60 * 5, // 5 minutes (au lieu de 1 minute)
    gcTime: 1000 * 60 * 15,   // 15 minutes de cache
  });

  // Query pour récupérer l'historique d'une tâche
  const { data: taskHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/tasks", historyTaskId, "history"],
    queryFn: () => apiRequest("GET", `/api/tasks/${historyTaskId}/history`).then(res => res.json()),
    enabled: !!historyTaskId && showTaskHistory
  });

  // Query pour récupérer les tâches supprimées
  // Requête pour les tâches supprimées supprimée - fonctionnalité déplacée vers /hub

  // Calculer les statistiques - OPTIMISÉ AVEC CACHE
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t: Task) => t.status === 'pending').length,
    inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
    completed: tasks.filter((t: Task) => t.status === 'completed').length,
    overdue: tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }), [tasks]);

  // Filtrer et trier les tâches avec système intelligent - OPTIMISÉ AVEC CACHE
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task: Task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             task.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 🎯 NOUVELLE LOGIQUE : Masquer les tâches terminées par défaut pour éviter la surcharge d'informations
        const matchesStatus = (() => {
          if (statusFilter === "all") {
            // Par défaut, exclure les tâches terminées pour ne pas surcharger l'affichage vendeur
            return task.status !== 'completed';
          } else if (statusFilter === "completed") {
            // Afficher uniquement les tâches terminées quand on clique sur la carte "Terminé"
            return task.status === 'completed';
          } else if (statusFilter === "pending") {
            return task.status === 'pending';
          } else if (statusFilter === "in_progress") {
            return task.status === 'in_progress';
          } else if (statusFilter === "overdue") {
            return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
          }
          return true;
        })();
        
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .map(task => ({
        ...task,
        importance: calculateTaskImportance(task)
      }))
      .sort((a, b) => {
        // Tri intelligent : priorité par importance décroissante
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        
        // Si même importance, trier par date d'échéance (plus proche en premier)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        // Si une seule a une échéance, elle passe en premier
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Sinon, trier par date de création (plus récent en premier)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, searchTerm, statusFilter, priorityFilter]); // Cache basé sur les dépendances

  // Ouvrir l'historique d'une tâche
  const openTaskHistory = (taskId: number) => {
    setHistoryTaskId(taskId);
    setShowTaskHistory(true);
  };

  // Mutation pour supprimer une tâche
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Succès",
        description: "La tâche a été supprimée définitivement",
        variant: "default",
      });
      setSelectedTask(null);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  });

  // Confirmer la suppression
  const confirmDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  // Mutation pour restaurer une tâche
  const restoreTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest("PUT", `/api/tasks/${taskId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/deleted"] });
      toast({
        title: "Succès",
        description: "La tâche a été restaurée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la tâche",
        variant: "destructive",
      });
    }
  });

  /**
   * CARTES STATISTIQUES CLIQUABLES - Remplacent les boutons redondants
   */
  const StatCard = ({ 
    title, 
    value, 
    color, 
    filterKey, 
    icon: Icon,
    subtitle
  }: { 
    title: string; 
    value: number; 
    color: string; 
    filterKey: string;
    icon: any;
    subtitle?: string;
  }) => (
    <Card 
      className={`p-2 sm:p-3 cursor-pointer transition-all duration-200 hover:scale-105 border-2 ${
        statusFilter === filterKey 
          ? `${color} border-opacity-50 shadow-lg` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => {
        setStatusFilter(filterKey);
        // Scroll automatique vers la zone des tâches après filtrage
        setTimeout(() => {
          const tasksSection = document.getElementById('tasks-section');
          if (tasksSection) {
            tasksSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-600 font-medium truncate">{title}</p>
          <p className={`text-lg sm:text-xl font-bold ${
            statusFilter === filterKey ? 'text-white' : color.includes('blue') ? 'text-blue-600' :
                                                         color.includes('orange') ? 'text-orange-600' :
                                                         color.includes('green') ? 'text-green-600' :
                                                         color.includes('red') ? 'text-red-600' : 'text-gray-600'
          }`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${
              statusFilter === filterKey ? 'text-white/80' : 'text-gray-500'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
          statusFilter === filterKey ? 'text-white' : color.includes('blue') ? 'text-blue-500' :
                                                      color.includes('orange') ? 'text-orange-500' :
                                                      color.includes('green') ? 'text-green-500' :
                                                      color.includes('red') ? 'text-red-500' : 'text-gray-500'
        }`} />
      </div>
    </Card>
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header moderne optimisé mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Titre optimisé - Mobile sur plusieurs lignes, Desktop sur une ligne */}
          <div className="text-center sm:text-left">
            {/* Version mobile - Titre sur plusieurs lignes */}
            <div className="block sm:hidden">
              <h1 className="text-xl font-bold text-white leading-tight">
                Gestion
              </h1>
              <h1 className="text-xl font-bold text-white -mt-1 leading-tight">
                des
              </h1>
              <h1 className="text-xl font-bold text-white -mt-1 leading-tight">
                Tâches
              </h1>
            </div>
            
            {/* Version desktop/tablette - Titre sur une seule ligne */}
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-white leading-tight whitespace-nowrap">
                Gestion des Tâches
              </h1>
            </div>
            
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Organisez et suivez vos tâches efficacement
            </p>
          </div>
          
          {/* Bouton optimisé mobile */}
          <div className="flex justify-center sm:justify-end">
            <Button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto max-w-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger value="vue" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Vue détaillée</span>
            <span className="sm:hidden">Tâches</span>
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendrier</span>
            <span className="sm:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="automatisation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Automatisation</span>
            <span className="sm:hidden">Auto</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vue" className="space-y-6">
          {/* Section cartes statistiques + boutons de vue */}
          <div className="space-y-4">
            {/* CARTES STATISTIQUES COMPACTES - Version mobile optimisée */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
              <StatCard
                title="Total"
                value={stats.total}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                filterKey="all"
                icon={Filter}
              />
              <StatCard
                title="En attente"
                value={stats.pending}
                color="bg-gradient-to-r from-orange-500 to-orange-600"
                filterKey="pending"
                icon={Clock}
              />
              <StatCard
                title="En cours"
                value={stats.inProgress}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                filterKey="in_progress"
                icon={PlayCircle}
              />
              <StatCard
                title="Terminées"
                value={stats.completed}
                color="bg-gradient-to-r from-green-500 to-green-600"
                filterKey="completed"
                icon={CheckCircle}
                subtitle="Cliquer pour voir"
              />
              <StatCard
                title="En retard"
                value={stats.overdue}
                color="bg-gradient-to-r from-red-500 to-red-600"
                filterKey="overdue"
                icon={AlertTriangle}
              />
            </div>

            {/* Boutons Liste/Grille */}
            <div className="flex justify-end">
              <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-xs sm:text-sm ${
                    viewMode === "list" 
                      ? "bg-blue-500 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Liste</span>
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 text-xs sm:text-sm ${
                    viewMode === "grid" 
                      ? "bg-blue-500 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Grille</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres complémentaires */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
                <SelectValue placeholder="Toutes priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== "all" || priorityFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className="bg-white border-gray-200"
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Indicateur de tri intelligent */}
          {filteredAndSortedTasks.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-full">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-800">Tri Intelligent Activé</h4>
                    <p className="text-xs text-indigo-600">
                      {filteredAndSortedTasks.length} tâche{filteredAndSortedTasks.length > 1 ? 's' : ''} triée{filteredAndSortedTasks.length > 1 ? 's' : ''} par importance et échéance
                    </p>
                  </div>
                </div>
                
                {/* Légende des priorités */}
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Retard</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Critique</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Urgent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Important</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Affichage des tâches - Mode Liste ou Grille */}
          <div id="tasks-section">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement des tâches...</p>
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50">
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                    ? "Aucune tâche ne correspond aux critères de filtrage."
                    : "Aucune tâche pour le moment."
                  }
                </p>
                {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                  >
                    Afficher toutes les tâches
                  </Button>
                )}
              </Card>
            ) : viewMode === "list" ? (
              // MODE LISTE - Affichage compact optimisé
              <div className="space-y-2">
                {filteredAndSortedTasks.map((task: any) => {
                  const taskStyle = getTaskVisualStyle(task, task.importance);
                  const IconComponent = taskStyle.icon;
                  
                  return (
                    <Card
                      key={task.id}
                      className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${taskStyle.borderColor} ${taskStyle.bgColor}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Icône et contenu principal */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-full ${taskStyle.badgeColor} flex-shrink-0`}>
                            <IconComponent className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm truncate ${taskStyle.textColor}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${taskStyle.badgeColor}`}>
                                {task.status === 'completed' ? '✅ TERMINÉ' : taskStyle.badge}
                              </span>
                              {task.clientName && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {task.clientName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Date d'échéance compacte */}
                        {task.dueDate && (
                          <div className="flex-shrink-0">
                            {(() => {
                              const now = new Date();
                              const due = new Date(task.dueDate);
                              const isOverdue = due < now && task.status !== 'completed';
                              const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
                              
                              if (isOverdue) {
                                return (
                                  <div className="bg-red-100 border border-red-400 rounded-md px-2 py-1 text-red-800 text-xs font-bold text-center">
                                    <AlertCircle className="h-3 w-3 mx-auto mb-0.5" />
                                    RETARD
                                  </div>
                                );
                              }
                              
                              if (hoursUntilDue <= 48 && hoursUntilDue > 0) {
                                return (
                                  <div className="bg-orange-100 border border-orange-400 rounded-md px-2 py-1 text-orange-800 text-xs font-medium text-center">
                                    <Timer className="h-3 w-3 mx-auto mb-0.5" />
                                    {hoursUntilDue < 24 ? `${Math.round(hoursUntilDue)}h` : `${Math.round(hoursUntilDue/24)}j`}
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 text-blue-700 text-xs text-center">
                                  <Calendar className="h-3 w-3 mx-auto mb-0.5" />
                                  {Math.round(hoursUntilDue/24)}j
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // MODE GRILLE - Affichage complet en cartes (existant)
              <div className="space-y-4">
                {filteredAndSortedTasks.map((task: any) => {
                  const taskStyle = getTaskVisualStyle(task, task.importance);
                  const IconComponent = taskStyle.icon;
                  
                  return (
                    <Card
                      key={task.id}
                      className={`p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-l-4 ${taskStyle.borderColor} ${taskStyle.bgColor} backdrop-blur-sm`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Contenu principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Médaillon de priorité */}
                            <div className={`p-2 rounded-full ${taskStyle.badgeColor} flex-shrink-0 ${
                              task.status === 'completed' ? 'ring-2 ring-green-300 animate-pulse shadow-lg' : ''
                            }`}>
                              <IconComponent className={`h-4 w-4 ${
                                task.status === 'completed' ? 'text-white' : ''
                              }`} />
                            </div>
                            
                            {/* Titre et badge */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-sm sm:text-base truncate ${taskStyle.textColor}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${taskStyle.badgeColor} ${
                                  task.status === 'completed' ? 'animate-pulse shadow-lg border border-green-300' : ''
                                }`}>
                                  {task.status === 'completed' ? '✅ TERMINÉ' : taskStyle.badge}
                                </span>
                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                  Score: {task.importance}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          {task.description && (
                            <div className="text-xs sm:text-sm text-gray-600 mb-3">
                              <div className="whitespace-pre-wrap break-words leading-relaxed max-h-16 overflow-hidden">
                                {task.description}
                              </div>
                            </div>
                          )}
                          
                          {/* Métadonnées */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {task.clientName && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <User className="h-3 w-3" />
                                {task.clientName}
                              </span>
                            )}
                            {task.dueDate && (() => {
                              const now = new Date();
                              const due = new Date(task.dueDate);
                              const isOverdue = due < now && task.status !== 'completed';
                              const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
                              const isUrgent = hoursUntilDue <= 48 && hoursUntilDue > 0;
                              
                              let dateStyle = "text-gray-600";
                              let bgStyle = "bg-gray-100";
                              let icon = Calendar;
                              
                              if (isOverdue) {
                                dateStyle = "text-red-800 font-bold";
                                bgStyle = "bg-red-100 border border-red-300 animate-pulse";
                                icon = AlertCircle;
                              } else if (isUrgent) {
                                dateStyle = "text-orange-800 font-semibold";
                                bgStyle = "bg-orange-100 border border-orange-300";
                                icon = Timer;
                              }
                              
                              const IconComponentDue = icon;
                              
                              return (
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${bgStyle} ${dateStyle} whitespace-nowrap`}>
                                  <IconComponentDue className="h-3 w-3" />
                                  📅 {due.toLocaleDateString('fr-FR')}
                                  {isOverdue && <span className="text-red-600 ml-1 font-bold whitespace-nowrap">⚠️ RETARD</span>}
                                  {isUrgent && <span className="text-orange-600 ml-1 font-medium whitespace-nowrap">⏰ URGENT</span>}
                                </span>
                              );
                            })()}
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              {task.status === 'pending' ? 'En attente' : 
                               task.status === 'in_progress' ? 'En cours' : 'Terminée'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Indicateur visuel d'échéance */}
                        {task.dueDate && (
                          <div className="flex-shrink-0 text-right">
                            {(() => {
                              const now = new Date();
                              const due = new Date(task.dueDate);
                              const isOverdue = due < now && task.status !== 'completed';
                              const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
                              
                              if (isOverdue) {
                                return (
                                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-2 text-red-800 font-bold text-xs text-center animate-pulse shadow-lg">
                                    <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                                    <div>EN RETARD</div>
                                    <div className="text-[10px] mt-1">⚠️ {Math.abs(Math.round(hoursUntilDue/24))}j</div>
                                  </div>
                                );
                              }
                              
                              if (hoursUntilDue <= 48 && hoursUntilDue > 0) {
                                return (
                                  <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-2 text-orange-800 font-semibold text-xs text-center shadow-md">
                                    <Timer className="h-5 w-5 mx-auto mb-1" />
                                    <div>URGENT</div>
                                    <div className="text-[10px] mt-1">
                                      ⏰ {hoursUntilDue < 24 ? 
                                        `${Math.round(hoursUntilDue)}h` : 
                                        `${Math.round(hoursUntilDue/24)}j`}
                                    </div>
                                  </div>
                                );
                              }
                              
                              if (hoursUntilDue > 0) {
                                return (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700 text-xs text-center">
                                    <Calendar className="h-4 w-4 mx-auto mb-1" />
                                    <div className="font-medium">Dans</div>
                                    <div className="text-[10px] mt-1">📅 {Math.round(hoursUntilDue/24)}j</div>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-gray-600 text-xs text-center">
                                  <Calendar className="h-4 w-4 mx-auto mb-1" />
                                  <div>Passé</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="automatisation">
          <TaskAutomation />
        </TabsContent>

        <TabsContent value="calendrier">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Vue Calendrier</h3>
            <p className="text-gray-500">
              Fonctionnalité calendrier en cours de développement...
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pop-up détails tâche moderne - Optimisé mobile scrollable */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-blue-100/50 shadow-2xl rounded-3xl overflow-hidden p-0">
            {/* Fond décoratif */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 bg-indigo-400/10 rounded-full blur-2xl"></div>
            </div>
            
            {/* Container scrollable complet */}
            <div className="relative z-10 h-full overflow-y-auto modal-scroll-container">
              {/* Header fixe avec boutons édition et fermeture */}
              <div className="sticky top-0 bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm border-b border-blue-200/30 p-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex-1">
                    {isEditMode ? "Modifier la tâche" : selectedTask.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isEditMode ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTaskHistory(selectedTask.id)}
                          className="h-9 px-3 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-200/50 shadow-sm text-indigo-600"
                        >
                          <History className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Historique</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditMode(true);
                            setEditFormData({
                              title: selectedTask.title,
                              description: selectedTask.description || "",
                              status: selectedTask.status,
                              priority: selectedTask.priority,
                              dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ""
                            });
                          }}
                          className="h-9 px-3 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-200/50 shadow-sm text-blue-600"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Modifier</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteTask(selectedTask)}
                          className="h-9 px-3 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-200/50 shadow-sm text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditMode(false)}
                          className="h-9 px-3 rounded-full bg-gray-500/10 hover:bg-gray-500/20 border border-gray-200/50 shadow-sm text-gray-600"
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveTask}
                          className="h-9 px-3 rounded-full bg-green-500/10 hover:bg-green-500/20 border border-green-200/50 shadow-sm text-green-600"
                        >
                          <span className="hidden sm:inline">Sauvegarder</span>
                          <span className="sm:hidden">✓</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(null);
                        setIsEditMode(false);
                      }}
                      className="h-9 w-9 p-0 rounded-full bg-white/70 hover:bg-white/90 border border-blue-200/50 shadow-sm"
                    >
                      <svg
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Contenu scrollable */}
              <div className="p-6 space-y-6 pb-8 mobile-safe-area">
                {isEditMode ? (
                  /* Mode édition */
                  <>
                    {/* Titre de la tâche */}
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Titre de la tâche
                      </h4>
                      <Input
                        value={editFormData.title || ""}
                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                        placeholder="Titre de la tâche"
                        className="text-base"
                      />
                    </div>

                    {/* Description */}
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Description
                      </h4>
                      <textarea
                        value={editFormData.description || ""}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        placeholder="Description de la tâche"
                        rows={4}
                        className="w-full p-3 border border-gray-200 rounded-lg text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Statut et Priorité */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                        <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Statut
                        </h4>
                        <Select
                          value={editFormData.status || "pending"}
                          onValueChange={(value) => setEditFormData({...editFormData, status: value as Task['status']})}
                        >
                          <SelectTrigger className="text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                        <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          Priorité
                        </h4>
                        <Select
                          value={editFormData.priority || "medium"}
                          onValueChange={(value) => setEditFormData({...editFormData, priority: value as Task['priority']})}
                        >
                          <SelectTrigger className="text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date d'échéance */}
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        Date d'échéance
                      </h4>
                      <Input
                        type="date"
                        value={editFormData.dueDate || ""}
                        onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                        className="text-base"
                      />
                    </div>
                  </>
                ) : (
                  /* Mode consultation */
                  <>
                    {/* Description */}
                    {selectedTask.description && (
                      <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Description
                        </h4>
                        <div className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap break-words">
                          {selectedTask.description}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {!isEditMode && (
                  /* Informations détaillées en grille responsive */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                    <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Statut
                    </h4>
                    <span className={`inline-flex px-4 py-2 text-base font-medium rounded-full ${
                      selectedTask.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTask.status === 'pending' ? 'En attente' :
                       selectedTask.status === 'in_progress' ? 'En cours' :
                       selectedTask.status === 'completed' ? 'Terminée' : 'En attente'}
                    </span>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                    <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      Priorité
                    </h4>
                    <span className={`inline-flex px-4 py-2 text-base font-medium rounded-full ${
                      selectedTask.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                      selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTask.priority === 'low' ? 'Faible' :
                       selectedTask.priority === 'medium' ? 'Moyenne' :
                       selectedTask.priority === 'high' ? 'Élevée' :
                       selectedTask.priority === 'urgent' ? 'Urgente' : 'Moyenne'}
                    </span>
                  </div>
                  
                  {/* Client associé */}
                  {selectedTask.clientName && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-500" />
                        Client
                      </h4>
                      <p className="text-gray-600 font-medium text-base">{selectedTask.clientName}</p>
                    </div>
                  )}
                  
                  {/* Date d'échéance */}
                  {selectedTask.dueDate && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        Échéance
                      </h4>
                      <p className="text-gray-600 font-medium text-base">
                        {new Date(selectedTask.dueDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  
                    {/* Informations supplémentaires pour mobile */}
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-sm sm:col-span-2">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Informations
                      </h4>
                      <div className="space-y-2 text-base">
                        <p className="text-gray-600">
                          <span className="font-medium">Créée le :</span> {new Date(selectedTask.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {selectedTask.assignedTo && (
                          <p className="text-gray-600">
                            <span className="font-medium">Assignée à :</span> {selectedTask.assignedTo}
                          </p>
                        )}
                        {selectedTask.completedAt && (
                          <p className="text-gray-600">
                            <span className="font-medium">Terminée le :</span> {new Date(selectedTask.completedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <NewTaskForm 
            onClose={() => setIsNewTaskModalOpen(false)}
            onSuccess={() => setIsNewTaskModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      {/* Modal d'historique des tâches - Optimisée mobile */}
      <Dialog open={showTaskHistory} onOpenChange={setShowTaskHistory}>
        <DialogContent className="max-w-4xl w-[98vw] max-h-[85vh] bg-gradient-to-br from-white via-purple-50 to-indigo-50 border border-purple-100/50 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden p-0">
          <DialogHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 md:p-6 border-b border-purple-200/30 sticky top-0 z-10">
            <DialogTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <History className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              <span className="truncate">Historique des modifications</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-3 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse flex space-x-4 w-full">
                  <div className="rounded-full bg-purple-200 h-6 w-6 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                    <div className="h-4 bg-purple-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ) : taskHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm md:text-base">Aucune modification enregistrée pour cette tâche</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {taskHistory.map((entry: TaskHistoryEntry, index) => (
                  <div key={entry.id} className="bg-white/70 border border-purple-100/50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Header mobile avec badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="font-semibold text-purple-700 text-sm md:text-base truncate">
                          {entry.fieldChanged === 'dueDate' ? '📅 Date d\'échéance' :
                           entry.fieldChanged === 'title' ? '📝 Titre' :
                           entry.fieldChanged === 'description' ? '📄 Description' :
                           entry.fieldChanged === 'status' ? '⚡ Statut' :
                           entry.fieldChanged === 'priority' ? '🎯 Priorité' :
                           `🔧 ${entry.fieldChanged || 'Modification'}`}
                        </span>
                      </div>
                      
                      {/* Badge numéro de modification */}
                      <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                        #{taskHistory.length - index}
                      </div>
                    </div>
                    
                    {/* Description de la modification */}
                    <div className="mb-3">
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                        {/* Formater la description si elle contient des dates */}
                        {entry.description && entry.description.includes('modifié:') && entry.fieldChanged === 'dueDate' ? (
                          <span>
                            <span className="font-semibold">{entry.fieldChanged}</span> modifié: 
                            <span className="font-mono text-gray-500 ml-1">
                              "{new Date(entry.oldValue).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: '2-digit', 
                                month: 'long',
                                year: 'numeric'
                              }) + ' à ' + new Date(entry.oldValue).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}" 
                              → 
                              "{new Date(entry.newValue).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long', 
                                year: 'numeric'
                              }) + ' à ' + new Date(entry.newValue).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}"
                            </span>
                          </span>
                        ) : (
                          entry.description
                        )}
                      </p>
                    </div>
                    
                    {/* Détails avant/après - Optimisé mobile */}
                    {entry.fieldChanged && entry.oldValue && entry.newValue && (
                      <div className="bg-gray-50/90 rounded-lg md:rounded-xl p-3 text-xs md:text-sm space-y-3 border border-gray-200/50">
                        <div className="bg-red-50 border border-red-200/50 rounded-lg p-2 md:p-3">
                          <div className="font-semibold text-red-700 mb-1 flex items-center gap-1">
                            <span className="text-red-500">❌</span> Ancien
                          </div>
                          <div className="text-red-600 break-words leading-relaxed">
                            {entry.fieldChanged === 'dueDate' ? 
                              new Date(entry.oldValue).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) + ' à ' + new Date(entry.oldValue).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              entry.oldValue}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200/50 rounded-lg p-2 md:p-3">
                          <div className="font-semibold text-green-700 mb-1 flex items-center gap-1">
                            <span className="text-green-500">✅</span> Nouveau
                          </div>
                          <div className="text-green-600 break-words leading-relaxed">
                            {entry.fieldChanged === 'dueDate' ? 
                              new Date(entry.newValue).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) + ' à ' + new Date(entry.newValue).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              entry.newValue}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Footer avec utilisateur et date - Mobile optimisé */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-purple-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {entry.userPrenom?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">
                          {entry.userPrenom} {entry.userNom}
                        </div>
                      </div>
                      
                      <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })} à {new Date(entry.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md w-[90vw] bg-gradient-to-br from-white via-red-50 to-orange-50 border border-red-100/50 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center justify-center gap-2">
              <Trash2 className="h-6 w-6" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 text-center space-y-4">
            <div className="bg-red-50 border border-red-200/50 rounded-xl p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la tâche
                <span className="font-semibold text-red-600 block mt-1">
                  "{taskToDelete?.title}"
                </span>
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-blue-700 text-xs">
                <RotateCcw className="h-4 w-4" />
                <span>La tâche sera supprimée définitivement</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTaskToDelete(null);
                }}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={deleteTaskMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {deleteTaskMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    Suppression...
                  </div>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}



/**
 * COMPOSANT CARTE TÂCHE SIMPLIFIÉ - Pour remplacer TaskCard manquant
 */
const TaskCardSimple = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const statusColors = {
    pending: "bg-orange-100 text-orange-800",
    in_progress: "bg-blue-100 text-blue-800", 
    completed: "bg-green-100 text-green-800"
  };
  
  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow" 
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status] || statusColors.pending}`}>
              {task.status === 'pending' ? 'En attente' : 
               task.status === 'in_progress' ? 'En cours' : 
               task.status === 'completed' ? 'Terminée' : 'En attente'}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority === 'low' ? 'Faible' : 
               task.priority === 'medium' ? 'Moyenne' : 
               task.priority === 'high' ? 'Élevée' :
               task.priority === 'urgent' ? 'Urgente' : 'Moyenne'}
            </span>
          </div>
        </div>
        {task.description && (
          <div className="text-sm text-gray-600 mb-2">
            <div className="whitespace-pre-wrap break-words leading-relaxed max-h-12 overflow-hidden">
              {task.description}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{task.clientName || 'Aucun client'}</span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};