import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewTaskForm } from "@/components/forms/new-task-form";
import { CalendarSync } from "@/components/tasks/calendar-sync";
import { Search, Calendar, Clock, User, Plus, Filter, Grid3X3, List, Info, MessageSquare, Target, Award, BookOpen, Eye, Phone, Users, FileText, Settings, GraduationCap, Wrench } from "lucide-react";
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
}

const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-500", 
  medium: "bg-yellow-500",
  low: "bg-blue-500"
};

const statusColors = {
  pending: "bg-gray-400",
  in_progress: "bg-blue-500",
  completed: "bg-green-500"
};

const categoryIcons = {
  appel: <Phone className="h-4 w-4" />,
  suivi: <Users className="h-4 w-4" />, 
  prospection: <Target className="h-4 w-4" />,
  installation: <Wrench className="h-4 w-4" />,
  formation: <GraduationCap className="h-4 w-4" />,
  administratif: <FileText className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />
};

// Fonction pour formater les dates
function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
  } catch (error) {
    return "-";
  }
}

// Fonction pour formater la durée
function formatDuration(duration?: number): string {
  if (!duration || duration === 0) return "-";
  
  if (duration < 60) {
    return `${duration}min`;
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`;
  }
}

export default function TasksOverviewPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'tasks' | 'group-info'>('tasks');

  // Récupération des tâches
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: false
  });

  // Récupération des informations de groupe
  const { data: groupInfoData, isLoading: isGroupInfoLoading } = useQuery({
    queryKey: ["/api/group-info"],
    retry: false
  });

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.clientName && task.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesStatus = false;
    if (statusFilter === "all") {
      // Par défaut, masquer les tâches terminées
      matchesStatus = task.status !== 'completed';
    } else if (statusFilter === "overdue") {
      // Filtrer les tâches en retard
      if (task.status === 'completed') return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      matchesStatus = dueDate < now;
    } else {
      matchesStatus = task.status === statusFilter;
    }
    
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Fonction pour formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "-";
    }
  };

  // Fonction pour formater la durée
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  // Statistiques rapides
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      return dueDate < now;
    }).length
  };



  // Fonction pour gérer le clic sur une carte statistique
  const handleStatsCardClick = (filterType: string) => {
    if (filterType === 'urgent') {
      setPriorityFilter('urgent');
      setStatusFilter('all');
    } else if (filterType === 'overdue') {
      setStatusFilter('overdue');
      setPriorityFilter('all');
    } else {
      setStatusFilter(filterType);
      setPriorityFilter('all');
    }
    
    // Scroll vers la section des tâches filtrées
    setTimeout(() => {
      const tasksSection = document.getElementById('tasks-section');
      if (tasksSection) {
        tasksSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // Fallback: scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 pb-24 md:pb-8">
        {/* En-tête optimisé mobile */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Titre et description */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Aperçu des tâches
              </h1>
              <p className="text-gray-600 text-sm md:text-base">Vue d'ensemble de toutes vos tâches</p>
            </div>
            
            {/* Onglets Navigation mobile-friendly */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border overflow-x-auto">
              <Button
                variant={activeTab === 'tasks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tasks')}
                className={`px-2 py-2 text-xs md:text-sm md:px-4 whitespace-nowrap ${activeTab === 'tasks' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-gray-100'
                }`}
              >
                <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Mes Tâches</span>
                <span className="sm:hidden">Tâches</span>
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('calendar')}
                className={`px-2 py-2 text-xs md:text-sm md:px-4 whitespace-nowrap ${activeTab === 'calendar' 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Calendrier</span>
                <span className="sm:hidden">Agenda</span>
              </Button>
              <Button
                variant={activeTab === 'group-info' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('group-info')}
                className={`px-2 py-2 text-xs md:text-sm md:px-4 whitespace-nowrap ${activeTab === 'group-info' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'hover:bg-gray-100'
                }`}
              >
                <Info className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Info Groupe</span>
                <span className="sm:hidden">Info</span>
              </Button>
            </div>

            {activeTab === 'tasks' && (
              <div className="flex items-center gap-3">
                {/* Boutons de vue */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'hover:bg-gray-100'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'hover:bg-gray-100'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Bouton nouvelle tâche */}
              <Button 
                onClick={() => setIsNewTaskFormOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
              </div>
            )}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'tasks' && (
          <>
            {/* Statistiques rapides cliquables mobile-optimized */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              statusFilter === 'all' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl ring-4 ring-blue-200' 
                : 'bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('all');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${statusFilter === 'all' ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                {stats.total}
              </div>
              <div className={`text-xs md:text-sm font-medium ${statusFilter === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>
                Total
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              statusFilter === 'pending' 
                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xl ring-4 ring-orange-200' 
                : 'bg-gradient-to-br from-white to-amber-50 hover:from-amber-50 hover:to-amber-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('pending');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${statusFilter === 'pending' ? 'text-white' : 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent'}`}>
                {stats.pending}
              </div>
              <div className={`text-xs md:text-sm font-medium ${statusFilter === 'pending' ? 'text-orange-100' : 'text-gray-600'}`}>
                En attente
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              statusFilter === 'in_progress' 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-2xl ring-4 ring-blue-200' 
                : 'bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('in_progress');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${statusFilter === 'in_progress' ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'}`}>
                {stats.inProgress}
              </div>
              <div className={`text-xs md:text-sm font-medium ${statusFilter === 'in_progress' ? 'text-blue-100' : 'text-gray-600'}`}>
                En cours
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              statusFilter === 'completed' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl ring-4 ring-green-200' 
                : 'bg-gradient-to-br from-white to-green-50 hover:from-green-50 hover:to-green-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('completed');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${statusFilter === 'completed' ? 'text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'}`}>
                {stats.completed}
              </div>
              <div className={`text-xs md:text-sm font-medium ${statusFilter === 'completed' ? 'text-green-100' : 'text-gray-600'}`}>
                Terminées
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              statusFilter === 'overdue' 
                ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-2xl ring-4 ring-red-200' 
                : 'bg-gradient-to-br from-white to-red-50 hover:from-red-50 hover:to-red-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('overdue');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${statusFilter === 'overdue' ? 'text-white' : 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'}`}>
                {stats.overdue}
              </div>
              <div className={`text-xs md:text-sm font-medium ${statusFilter === 'overdue' ? 'text-red-100' : 'text-gray-600'}`}>
                En retard
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 ${
              priorityFilter === 'urgent' 
                ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-2xl ring-4 ring-purple-200' 
                : 'bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-purple-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatsCardClick('urgent');
            }}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <div className={`text-xl md:text-2xl font-bold ${priorityFilter === 'urgent' ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent'}`}>
                {stats.urgent}
              </div>
              <div className={`text-xs md:text-sm font-medium ${priorityFilter === 'urgent' ? 'text-purple-100' : 'text-gray-600'}`}>
                Urgentes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicateur de filtre actif */}
        {(statusFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Filtre actif: {statusFilter === 'overdue' ? 'En retard' : statusFilter !== 'all' ? statusFilter : priorityFilter} 
                ({filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              Réinitialiser
            </Button>
          </div>
        )}

        {/* Filtres compacts */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une tâche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
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

        {/* Liste des tâches compacte */}
        <div id="tasks-section">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des tâches...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">Aucune tâche à afficher</p>
          </div>
        ) : viewMode === 'list' ? (
          /* Vue Liste - Tableau compact */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
                  <TableHead className="font-bold text-gray-800 py-4">Type</TableHead>
                  <TableHead className="font-bold text-gray-800">Tâche</TableHead>
                  <TableHead className="font-bold text-gray-800">Client</TableHead>
                  <TableHead className="font-bold text-gray-800">Statut</TableHead>
                  <TableHead className="font-bold text-gray-800">Priorité</TableHead>
                  <TableHead className="font-bold text-gray-800">Échéance</TableHead>
                  <TableHead className="font-bold text-gray-800">Durée</TableHead>
                  <TableHead className="font-bold text-gray-800">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-gray-100"
                    onClick={() => {
                      console.log('Clic sur la tâche:', task.title);
                    }}
                  >
                    {/* Type/Catégorie */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                          {categoryIcons[task.category as keyof typeof categoryIcons] || categoryIcons.general}
                        </div>
                        <span className="text-xs text-gray-600 capitalize">{task.category}</span>
                      </div>
                    </TableCell>
                    
                    {/* Titre de la tâche */}
                    <TableCell className="py-4">
                      <div className="max-w-xs">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Client */}
                    <TableCell className="py-4">
                      <span className="text-sm text-gray-700">
                        {task.clientName || "-"}
                      </span>
                    </TableCell>
                    
                    {/* Statut */}
                    <TableCell className="py-4">
                      <Badge 
                        variant="outline" 
                        className={`px-2 py-1 text-xs font-medium whitespace-nowrap ${
                          task.status === 'completed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : task.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
{task.status === 'completed' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'En attente'}
                      </Badge>
                    </TableCell>
                    
                    {/* Priorité */}
                    <TableCell className="py-4">
                      <Badge 
                        variant="outline" 
                        className={`px-2 py-1 text-xs font-medium ${
                          task.priority === 'urgent' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : task.priority === 'high'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : task.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {task.priority === 'urgent' ? 'Urgent' : 
                         task.priority === 'high' ? 'Élevée' : 
                         task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    </TableCell>
                    
                    {/* Échéance */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="text-sm text-gray-700">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Durée */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-green-500" />
                        <span className="text-sm text-gray-700">
                          {formatDuration(task.estimatedDuration)}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Action */}
                    <TableCell className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/tasks/${task.id}`);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-full"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Vue Grille - Design compact */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <Card 
                key={task.id} 
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => {
                  setLocation(`/tasks/${task.id}`);
                }}
              >
                <CardContent className="p-5">
                  <div className="space-y-3">
                    {/* En-tête avec icône et priorité */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg text-white text-sm">
                          {categoryIcons[task.category as keyof typeof categoryIcons] || categoryIcons.general}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`}></div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}></div>
                    </div>

                    {/* Titre et description */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Informations compactes */}
                    <div className="space-y-2 text-xs text-gray-600">
                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>Échéance: {formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      {task.estimatedDuration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span>Durée: {formatDuration(task.estimatedDuration)}</span>
                        </div>
                      )}
                      {task.clientName && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-purple-500" />
                          <span>Client: {task.clientName}</span>
                        </div>
                      )}
                    </div>

                    {/* Bouton d'action */}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs py-1 px-2 h-6 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/tasks/${task.id}`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
        </>
        )}

        {/* ONGLET CALENDRIER */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-blue-100">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                Synchronisation Google Calendar
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                Synchronisez vos tâches avec votre agenda Google pour ne rien oublier
              </p>
              <CalendarSync showFullInterface={true} />
            </div>
          </div>
        )}

        {/* ONGLET INFO GROUPE */}
        {activeTab === 'group-info' && (
          <div className="space-y-6">
            {/* Header Info Groupe optimisé mobile */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    Informations de Groupe
                  </h2>
                  <p className="text-indigo-100 text-base md:text-lg">
                    Consultez les annonces, formations et ressources partagées par votre équipe
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Info className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chargement */}
            {isGroupInfoLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filtres par catégorie optimisés mobile */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-0">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                    {[
                      { key: 'all', label: 'Toutes', icon: MessageSquare, color: 'indigo' },
                      { key: 'promotion', label: 'Promotions', icon: Target, color: 'red' },
                      { key: 'formation', label: 'Formations', icon: BookOpen, color: 'blue' },
                      { key: 'objectif', label: 'Objectifs', icon: Award, color: 'green' },
                      { key: 'annonce', label: 'Annonces', icon: Info, color: 'purple' }
                    ].map(({ key, label, icon: Icon, color }) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className={`px-3 py-2 transition-all duration-300 hover:scale-105 ${
                          color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                          color === 'red' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                          color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                          color === 'green' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                          'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        <span className="text-xs md:text-sm">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Liste des informations optimisée mobile */}
                <div className="grid gap-4">
                  {groupInfoData?.items?.map((info: any) => (
                    <Card key={info.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Barre de couleur selon catégorie */}
                          <div className={`w-1 ${
                            info.category === 'promotion' ? 'bg-gradient-to-b from-red-500 to-red-600' :
                            info.category === 'formation' ? 'bg-gradient-to-b from-blue-500 to-blue-600' :
                            info.category === 'objectif' ? 'bg-gradient-to-b from-green-500 to-green-600' :
                            'bg-gradient-to-b from-purple-500 to-purple-600'
                          }`}></div>

                          <div className="flex-1 p-4 md:p-6">
                            {/* En-tête adapté mobile */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 md:p-3 rounded-xl shadow-md ${
                                  info.category === 'promotion' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                                  info.category === 'formation' ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                                  info.category === 'objectif' ? 'bg-gradient-to-br from-green-100 to-green-200' :
                                  'bg-gradient-to-br from-purple-100 to-purple-200'
                                }`}>
                                  {info.category === 'promotion' && <Target className="h-5 w-5 md:h-6 md:w-6 text-red-600" />}
                                  {info.category === 'formation' && <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
                                  {info.category === 'objectif' && <Award className="h-5 w-5 md:h-6 md:w-6 text-green-600" />}
                                  {info.category === 'annonce' && <Info className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{info.title}</h3>
                                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-gray-500">
                                    <span className="font-medium">Par {info.authorName}</span>
                                    <span className="hidden md:block">•</span>
                                    <span>{formatDate(info.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Badges optimisés mobile */}
                              <div className="flex flex-wrap gap-2">
                                {info.isPinned && (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md">
                                    📌 Épinglé
                                  </Badge>
                                )}
                                <Badge className={`shadow-md ${
                                  info.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                  info.priority === 'medium' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                  'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                }`}>
                                  {info.priority === 'high' ? '🔥 Urgent' :
                                   info.priority === 'medium' ? '⚡ Important' : '📋 Normal'}
                                </Badge>
                              </div>
                            </div>

                            {/* Contenu */}
                            <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-gray-300">
                              <p className="text-gray-700 leading-relaxed">{info.content}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg">Aucune information de groupe disponible</p>
                      <p className="text-gray-400 text-sm mt-2">Les informations apparaîtront ici lorsqu'elles seront publiées</p>
                    </div>
                  )}
                </div>

                {/* Informations sur les permissions optimisées */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <Info className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-blue-900 mb-2">Permissions & Niveau</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                              🏆 {groupInfoData?.userLevel || 'Vendeur'}
                            </Badge>
                            {groupInfoData?.canCreate && (
                              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                                ✅ Créateur
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            {groupInfoData?.canCreate 
                              ? "🎯 Vous pouvez créer et modifier les informations de groupe" 
                              : "👁️ Vous pouvez uniquement consulter les informations de groupe"}
                          </p>
                          <div className="bg-white/50 rounded-lg p-3 mt-3">
                            <p className="text-xs text-blue-600 font-medium">
                              💡 Hiérarchie MLM: CQ → ETT → ETL → Manager
                            </p>
                            <p className="text-xs text-blue-500 mt-1">
                              Seuls les ETL+ peuvent créer du contenu
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Formulaire de création de nouvelle tâche */}
        <NewTaskForm 
          isOpen={isNewTaskFormOpen} 
          onClose={() => setIsNewTaskFormOpen(false)} 
        />
      </div>
    </AppLayout>
  );
}