import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/app-layout";
import { ArrowLeft, Calendar, User, Clock, AlertCircle } from "lucide-react";

interface TaskDetail {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdAt: string;
  clientName?: string;
  userName?: string;
  category: string;
  estimatedDuration?: number;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300", 
  completed: "bg-green-100 text-green-800 border-green-300"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-300",
  medium: "bg-orange-100 text-orange-800 border-orange-300",
  high: "bg-red-100 text-red-800 border-red-300"
};

export default function TaskDetailSimple() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Récupération tâche ID:", id);
        
        const response = await fetch(`/api/tasks/${id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Non authentifié');
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const taskData = await response.json();
        console.log("Tâche récupérée:", taskData);
        setTask(taskData);
      } catch (err) {
        console.error("Erreur lors du chargement de la tâche:", err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non définie';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">Chargement des détails...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !task) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Tâche introuvable</h2>
              <p className="text-gray-600 mb-4">
                {error || 'La tâche demandée n\'existe pas ou a été supprimée.'}
              </p>
              <Button 
                onClick={() => setLocation('/tasks')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux tâches
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header avec retour */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/tasks')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour aux tâches
            </Button>
          </div>

          {/* Titre principal */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-0 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  {task.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${statusColors[task.status as keyof typeof statusColors]} px-3 py-1`}>
                    {task.status === 'pending' ? 'En attente' : 
                     task.status === 'in_progress' ? 'En cours' : 'Terminée'}
                  </Badge>
                  <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} px-3 py-1`}>
                    Priorité {task.priority === 'low' ? 'Basse' : 
                               task.priority === 'medium' ? 'Moyenne' : 'Haute'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center">
                📝 Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] text-gray-700">
                {task.description || 'Aucune description fournie'}
              </div>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center">
                ℹ️ Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Échéance</p>
                    <p className="text-gray-600">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Client</p>
                    <p className="text-gray-600">{task.clientName || 'Non assigné'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Durée estimée</p>
                    <p className="text-gray-600">{task.estimatedDuration || 0} minutes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Catégorie</p>
                    <p className="text-gray-600">{task.category || 'Général'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Créée le {formatDate(task.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}