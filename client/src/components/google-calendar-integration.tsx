import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, ExternalLink, Link2, Unlink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarIntegrationProps {
  taskId?: number;
  showFullInterface?: boolean;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  htmlLink: string;
  colorId?: string;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ 
  taskId, 
  showFullInterface = true 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Vérifier le statut de connexion Google Calendar
  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/calendar/status'],
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 60 * 1000, // 1 minute
  });

  // Récupérer les événements à venir
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/calendar/upcoming'],
    enabled: connectionStatus?.connected && showUpcomingEvents,
    staleTime: 60 * 1000, // 1 minute
  });

  // Mutation pour connecter Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      window.location.href = '/api/auth/google/calendar';
    },
    onMutate: () => {
      setIsConnecting(true);
    },
    onError: (error) => {
      setIsConnecting(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à Google Calendar",
        variant: "destructive",
      });
    },
  });

  // Mutation pour déconnecter Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur de déconnexion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/status'] });
      toast({
        title: "Déconnecté",
        description: "Calendrier Google déconnecté avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le calendrier",
        variant: "destructive",
      });
    },
  });

  // Mutation pour créer un événement depuis une tâche
  const createEventMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ taskId }),
      });
      if (!response.ok) throw new Error('Erreur création événement');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Événement créé",
        description: "Tâche ajoutée à votre calendrier Google",
        action: data.eventLink ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(data.eventLink, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ouvrir
          </Button>
        ) : undefined,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'événement calendrier",
        variant: "destructive",
      });
    },
  });

  // Mutation pour synchroniser toutes les tâches
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/sync-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur synchronisation');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Synchronisation réussie",
        description: `${data.synced} tâches synchronisées avec Google Calendar`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser les tâches",
        variant: "destructive",
      });
    },
  });

  // Vérifier si on revient d'une authentification réussie
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') {
      toast({
        title: "Calendrier connecté",
        description: "Votre calendrier Google est maintenant synchronisé",
      });
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
      // Rafraîchir le statut
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/status'] });
    }
  }, [toast, queryClient]);

  const formatEventTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (statusLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendrier Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionStatus?.connected;

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Calendar className="w-5 h-5" />
          Google Calendar
          {isConnected && (
            <Badge variant="success" className="ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connecté
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Synchronisez vos tâches avec votre calendrier Gmail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Alert className="border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connectez votre calendrier Google pour synchroniser automatiquement vos tâches
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Votre calendrier Google est connecté et prêt à synchroniser vos tâches
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {!isConnected ? (
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link2 className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connexion...' : 'Connecter Gmail'}
            </Button>
          ) : (
            <>
              {taskId && (
                <Button
                  onClick={() => createEventMutation.mutate(taskId)}
                  disabled={createEventMutation.isPending}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {createEventMutation.isPending ? 'Création...' : 'Ajouter au calendrier'}
                </Button>
              )}
              
              {showFullInterface && (
                <>
                  <Button
                    onClick={() => syncAllMutation.mutate()}
                    disabled={syncAllMutation.isPending}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {syncAllMutation.isPending ? 'Synchronisation...' : 'Synchroniser toutes'}
                  </Button>
                  
                  <Button
                    onClick={() => setShowUpcomingEvents(!showUpcomingEvents)}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {showUpcomingEvents ? 'Masquer' : 'Voir événements'}
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {disconnectMutation.isPending ? 'Déconnexion...' : 'Déconnecter'}
              </Button>
            </>
          )}
        </div>

        {showUpcomingEvents && isConnected && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Événements à venir
              </h4>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              ) : upcomingEvents?.events?.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {upcomingEvents.events.map((event: CalendarEvent) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {event.summary}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatEventTime(event.start.dateTime)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.htmlLink, '_blank')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  Aucun événement à venir
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarIntegration;