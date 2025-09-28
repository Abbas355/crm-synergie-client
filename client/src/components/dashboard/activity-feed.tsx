import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocation } from "wouter";
import {
  CalendarDays,
  Mail,
  User,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";

// Type définitions
type Activity = {
  id: number;
  title: string;
  type: string;
  createdAt: string;
  user: string;
  clientName?: string;
  campaignName?: string;
  clientId?: number;
  taskId?: number;
};

type Task = {
  id: number;
  title: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
  clientName?: string;
};

function ActivityItem({ activity }: { activity: Activity }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  
  // Format date using date-fns - safe handling of invalid dates
  const date = new Date(activity.createdAt);
  const timeAgo = isNaN(date.getTime()) 
    ? "Date invalide" 
    : formatDistanceToNow(date, { addSuffix: true, locale: fr });
  
  // Choose icon based on activity type
  const getIcon = () => {
    switch(activity.type) {
      case "client":
        return <User className="h-4 w-4 mr-2" />;
      case "campagne":
        return <Mail className="h-4 w-4 mr-2" />;
      case "tache":
        return <CheckCircle2 className="h-4 w-4 mr-2" />;
      default:
        return <Bell className="h-4 w-4 mr-2" />;
    }
  };
  
  // Choose badge color based on activity type
  const getBadge = () => {
    switch(activity.type) {
      case "client":
        return <Badge className="bg-green-500 hover:bg-green-600">Activité</Badge>;
      case "campagne":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Activité</Badge>;
      case "tache":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Activité</Badge>;
      default:
        return <Badge>Activité</Badge>;
    }
  };

  // Handle click navigation based on activity type
  const handleActivityClick = () => {
    switch(activity.type) {
      case "client":
        if (activity.clientId) {
          setLocation(`/clients?scrollTo=table`);
        }
        break;
      case "tache":
        if (activity.taskId) {
          setLocation(`/tasks/${activity.taskId}`);
        } else {
          setLocation('/tasks');
        }
        break;
      default:
        // For other activity types, stay on dashboard
        break;
    }
  };
  
  return (
    <div 
      className="border-b last:border-0 pb-3 mb-3 last:pb-0 last:mb-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
      onClick={handleActivityClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-sm">{activity.title}</h3>
        {getBadge()}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <User className="h-3.5 w-3.5 mr-1" />
        <span className="mr-2">{activity.user}</span>
        <Clock className="h-3.5 w-3.5 mr-1" />
        <span>{timeAgo}</span>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const [, setLocation] = useLocation();
  
  // Format due date
  const dueDate = new Date(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString('fr-FR');
  
  // Choose badge based on priority
  const getPriorityBadge = () => {
    switch(task.priority) {
      case "high":
        return <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Moyen</Badge>;
      case "low":
        return <Badge className="bg-green-500 hover:bg-green-600">Faible</Badge>;
      default:
        return <Badge>Normal</Badge>;
    }
  };
  
  // Handle task click to navigate to task details
  const handleTaskClick = () => {
    console.log("Clic sur la tâche:", task.title);
    setLocation(`/tasks/${task.id}`);
  };
  
  return (
    <div 
      className="border-b last:border-0 pb-3 mb-3 last:pb-0 last:mb-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
      onClick={handleTaskClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-sm">{task.title}</h3>
        {getPriorityBadge()}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 mr-1" />
        <span className="mr-2">Échéance: {formattedDate}</span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <User className="h-3.5 w-3.5 mr-1" />
        <span>Assignée à: {task.assignedTo}</span>
      </div>
      {task.clientName && (
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span>Pour: {task.clientName}</span>
        </div>
      )}
    </div>
  );
}

export function RecentActivityFeed() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [, setLocation] = useLocation();
  
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Éviter les requêtes inutiles
  });
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/dashboard/tasks'],
    staleTime: 60000, // 1 minute - correspond au cache serveur
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Éviter les requêtes inutiles
  });

  // Filter activities for vendors to show only their group's activities
  const filteredActivities = activities?.filter(activity => {
    if (isAdmin()) return true; // Admins see all activities
    // Vendors see only activities from their user group or their own activities
    const userFullName = user?.prenom && user?.nom ? `${user.prenom} ${user.nom.trim()}` : '';
    return activity.user === userFullName || activity.user === user?.email || (activity.user && activity.user.includes(user?.prenom || ''));
  }) || [];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Activités Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </>
          ) : filteredActivities && filteredActivities.length > 0 ? (
            <div className="max-h-80 overflow-y-auto pr-2">
              {filteredActivities.slice(0, 5).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              {filteredActivities.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t mt-2">
                  {filteredActivities.length} activité(s) au total
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Aucune activité récente à afficher
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Tâches à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </>
          ) : tasks && tasks.length > 0 ? (
            <div className="max-h-80 overflow-y-auto pr-2">
              {tasks.slice(0, 5).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
              {tasks.length > 5 && (
                <div className="space-y-3 pt-2">
                  {tasks.slice(5).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
              {tasks.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t mt-2">
                  {tasks.length} tâche(s) au total
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <div className="flex justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              Aucune tâche à venir
            </div>
          )}
          
          {tasks && tasks.length > 0 && (
            <div className="mt-2 text-right">
              <button 
                onClick={() => setLocation('/tasks')}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                Voir toutes les tâches
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}