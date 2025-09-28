import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle, Circle, AlertTriangle, User, Calendar, Timer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TimelineItem {
  id: number;
  type: 'task' | 'activity';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  activityType?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    prenom?: string;
    nom?: string;
  };
  estimatedDuration?: number;
  actualDuration?: number;
  relatedTask?: {
    id: number;
    title: string;
  };
}

interface ClientTimelineProps {
  clientId: number;
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const { data: timelineData, isLoading, error } = useQuery({
    queryKey: [`/api/clients/${clientId}/timeline`],
    enabled: !!clientId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline du client</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Chargement de la timeline...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline du client</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Erreur lors du chargement de la timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeline: TimelineItem[] = timelineData?.timeline || [];
  const client = timelineData?.client;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'appel': return '📞';
      case 'suivi': return '👥';
      case 'prospection': return '🎯';
      case 'installation': return '🔧';
      case 'general': return '📋';
      default: return '📄';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Circle className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Circle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const formatUserName = (user?: TimelineItem['user']) => {
    if (!user) return 'Utilisateur inconnu';
    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user.username;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline - {client?.prenom} {client?.nom}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {timeline.length} événement{timeline.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Aucun événement dans la timeline</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={`${item.type}-${item.id}`} className="relative">
                  {/* Ligne de connexion */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Icône de statut */}
                    <div className="flex-shrink-0 mt-1">
                      {item.type === 'task' ? getStatusIcon(item.status) : <User className="h-4 w-4 text-blue-600" />}
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-grow min-w-0">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        {/* En-tête */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-grow">
                            <h4 className="font-medium text-sm">
                              {item.type === 'task' && item.category && (
                                <span className="mr-2">{getCategoryIcon(item.category)}</span>
                              )}
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          
                          {/* Badges de statut et priorité */}
                          <div className="flex flex-col items-end space-y-1 ml-4">
                            {item.type === 'task' && item.status && (
                              <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(item.status)}`}>
                                {item.status === 'completed' ? 'Terminé' : 
                                 item.status === 'in_progress' ? 'En cours' : 'En attente'}
                              </Badge>
                            )}
                            {item.type === 'task' && item.priority && (
                              <Badge className={`text-xs px-2 py-0.5 ${getPriorityColor(item.priority)}`}>
                                {item.priority === 'urgent' ? 'Urgent' :
                                 item.priority === 'high' ? 'Élevé' :
                                 item.priority === 'medium' ? 'Moyen' : 'Faible'}
                              </Badge>
                            )}
                            {item.type === 'activity' && item.activityType && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {item.activityType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Informations détaillées */}
                        <div className="space-y-2">
                          {/* Dates et durées pour les tâches */}
                          {item.type === 'task' && (
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                              {item.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Échéance: {format(new Date(item.dueDate), 'dd/MM/yyyy', { locale: fr })}</span>
                                </div>
                              )}
                              {item.completedAt && (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Terminé: {format(new Date(item.completedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                                </div>
                              )}
                              {(item.estimatedDuration || item.actualDuration) && (
                                <div className="flex items-center space-x-1">
                                  <Timer className="h-3 w-3" />
                                  <span>
                                    {item.actualDuration ? 
                                      `Durée: ${formatDuration(item.actualDuration)}` :
                                      `Estimé: ${formatDuration(item.estimatedDuration)}`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Tâche liée pour les activités */}
                          {item.type === 'activity' && item.relatedTask && (
                            <div className="text-xs text-gray-600">
                              <span>Tâche liée: {item.relatedTask.title}</span>
                            </div>
                          )}
                          
                          {/* Pied de page avec utilisateur et date */}
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{formatUserName(item.user)}</span>
                            </div>
                            <span>
                              {format(new Date(item.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}