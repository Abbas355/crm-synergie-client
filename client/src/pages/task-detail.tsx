import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Clock, User, Calendar, AlertTriangle, CheckCircle, Save, Edit } from "lucide-react";
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
  updatedAt?: string;
  clientName?: string;
  userName?: string;
  category: string;
  estimatedDuration?: number;
  taskType?: string;
  isOverdue?: boolean;
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

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les détails de la tâche
  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: ['/api/tasks', id, Date.now()], // Force refresh avec timestamp
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Impossible de charger les détails de la tâche');
      }
      const data = await response.json();
      
      // Vérifier si la tâche est en retard
      if (data.dueDate && data.status !== 'completed') {
        data.isOverdue = new Date(data.dueDate) < new Date();
      }
      
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Mutation pour mettre à jour la tâche
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedData: Partial<Task>) => {
      await apiRequest('PUT', `/api/tasks/${id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsEditing(false);
      setEditedTask({});
      toast({
        title: "Tâche mise à jour",
        description: "Les modifications ont été sauvegardées avec succès",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (Object.keys(editedTask).length > 0) {
      updateTaskMutation.mutate(editedTask);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask({});
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !task) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="px-4 py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">Erreur lors du chargement de la tâche</p>
              <Button 
                onClick={() => setLocation('/tasks')}
                variant="outline"
                className="mt-2"
              >
                Retour aux tâches
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg mb-6">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/tasks')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>
              
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={updateTaskMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title}
              </h1>
              <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                <span className="text-2xl">
                  {categoryIcons[task.category as keyof typeof categoryIcons] || "📋"}
                </span>
                <span>Tâche {task.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="px-4 pb-24">
          <div className="space-y-6">
            {/* Informations principales */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Informations principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">Statut</label>
                      <Select
                        value={editedTask.status || task.status}
                        onValueChange={(value) => setEditedTask({...editedTask, status: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Badge className={`${statusColors[task.status as keyof typeof statusColors]} text-sm px-3 py-1`}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  )}
                  
                  {isEditing ? (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">Priorité</label>
                      <Select
                        value={editedTask.priority || task.priority}
                        onValueChange={(value) => setEditedTask({...editedTask, priority: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Faible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-sm px-3 py-1`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  )}

                  {task.isOverdue && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-sm px-3 py-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      En retard
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Échéance: {format(new Date(task.dueDate), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                    </div>
                  )}
                  
                  {task.clientName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4 text-green-500" />
                      <span>Client: {task.clientName}</span>
                    </div>
                  )}
                  
                  {task.userName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4 text-purple-500" />
                      <span>Assigné à: {task.userName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Créé le: {format(new Date(task.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description !== undefined ? editedTask.description : task.description || ''}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    placeholder="Description de la tâche..."
                    className="min-h-[120px] resize-none"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description || "Aucune description fournie"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Historique */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-blue-500 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tâche créée</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(task.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  
                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-green-500 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dernière modification</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(task.updatedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}