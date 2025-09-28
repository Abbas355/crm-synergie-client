import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarCheck, AlertCircle, Clock, RotateCcw, CheckCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarSyncProps {
  taskId?: number;
  showFullInterface?: boolean;
}

export function CalendarSync({ taskId, showFullInterface = false }: CalendarSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les événements du calendrier
  const { data: calendarEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/calendar/events"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/events", {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Connexion Google requise");
        }
        throw new Error('Erreur lors de la récupération des événements');
      }
      return response.json();
    },
    enabled: showFullInterface
  });

  // Vérifier le statut de connexion Google Calendar
  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/calendar/status"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/status", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du statut');
      }
      return response.json();
    },
    enabled: showFullInterface
  });

  // Mutation pour synchroniser une tâche
  const syncTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/calendar/sync-task/${taskId}`, {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de synchronisation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation réussie",
        description: "La tâche a été ajoutée à votre agenda Google",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation pour synchroniser toutes les tâches
  const syncAllTasksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/sync-all", {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de synchronisation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation complète",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSyncTask = () => {
    if (taskId) {
      syncTaskMutation.mutate(taskId);
    }
  };

  const handleSyncAll = () => {
    syncAllTasksMutation.mutate();
  };

  if (!showFullInterface && taskId) {
    // Interface simple pour une tâche
    return (
      <Button
        onClick={handleSyncTask}
        disabled={syncTaskMutation.isPending}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {syncTaskMutation.isPending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Synchronisation...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4" />
            Ajouter à l'agenda
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Carte de synchronisation */}
      <Card className="border-2 border-blue-100 bg-blue-50/30">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-base md:text-lg">
            <CalendarCheck className="w-4 h-4 md:w-5 md:h-5" />
            Synchronisation Google Calendar
          </CardTitle>
          <CardDescription className="text-blue-700 text-sm md:text-base">
            Synchronisez vos tâches avec votre agenda Google pour ne rien oublier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 pt-0">
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            {taskId && (
              <Button
                onClick={handleSyncTask}
                disabled={syncTaskMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {syncTaskMutation.isPending ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Synchronisation...</span>
                    <span className="sm:hidden">Sync...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Synchroniser cette tâche</span>
                    <span className="sm:hidden">Sync tâche</span>
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleSyncAll}
              disabled={syncAllTasksMutation.isPending}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
            >
              {syncAllTasksMutation.isPending ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Synchronisation...</span>
                  <span className="sm:hidden">Sync...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Synchroniser toutes les tâches</span>
                  <span className="sm:hidden">Sync toutes</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Événements du calendrier */}
      {showFullInterface && (
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              Vos événements à venir
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Événements synchronisés dans votre agenda Google
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-6 md:py-8">
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6 animate-spin text-blue-500" />
              </div>
            ) : calendarEvents?.success && calendarEvents.events?.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {calendarEvents.events.slice(0, 5).map((event: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{event.summary}</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {event.start?.dateTime && format(
                          new Date(event.start.dateTime),
                          "dd/MM/yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Synchronisé</span>
                      <span className="sm:hidden">Sync</span>
                    </Badge>
                  </div>
                ))}
                {calendarEvents.events.length > 5 && (
                  <p className="text-xs md:text-sm text-gray-500 text-center">
                    Et {calendarEvents.events.length - 5} autres événements...
                  </p>
                )}
              </div>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm md:text-base">
                  {calendarEvents?.success === false ? 
                    "Connexion Google requise pour afficher les événements" :
                    "Aucun événement trouvé dans votre agenda"
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5" />
            Configuration requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-amber-800">
            <p>Pour utiliser la synchronisation Google Calendar :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Connectez-vous avec votre compte Google</li>
              <li>Autorisez l'accès à votre agenda</li>
              <li>Vos tâches seront automatiquement ajoutées</li>
              <li>Les mises à jour se font en temps réel</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}