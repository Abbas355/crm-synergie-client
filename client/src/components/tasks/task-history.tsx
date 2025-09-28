import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  FileText,
  Flag,
  CheckCircle,
  XCircle,
  Clock3,
  MessageSquare
} from "lucide-react";

interface HistoryItem {
  id: number;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
  userName?: string;
}

interface TaskHistoryProps {
  taskId: number;
}

const actionIcons = {
  created: <FileText className="h-3 w-3 text-green-500" />,
  updated: <Edit className="h-3 w-3 text-blue-500" />,
  status_changed: <Flag className="h-3 w-3 text-orange-500" />,
  due_date_changed: <Calendar className="h-3 w-3 text-purple-500" />,
  priority_changed: <Flag className="h-3 w-3 text-red-500" />,
  completed: <CheckCircle className="h-3 w-3 text-green-500" />,
  reopened: <XCircle className="h-3 w-3 text-yellow-500" />,
  comment_added: <MessageSquare className="h-3 w-3 text-indigo-500" />
};

const actionLabels = {
  created: "Tâche créée",
  updated: "Mise à jour",
  status_changed: "Statut modifié",
  due_date_changed: "Date d'échéance modifiée",
  priority_changed: "Priorité modifiée",
  completed: "Tâche terminée",
  reopened: "Tâche rouverte",
  comment_added: "Commentaire ajouté"
};

const statusLabels = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée"
};

const priorityLabels = {
  low: "Faible",
  medium: "Moyenne", 
  high: "Élevée",
  urgent: "Urgente"
};

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["/api/tasks", taskId, "history"],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Impossible de charger l\'historique');
      }
      return response.json();
    },
    enabled: !!taskId
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  const formatValue = (fieldChanged: string, value: string) => {
    if (!value) return 'Non défini';
    
    switch (fieldChanged) {
      case 'status':
        return statusLabels[value as keyof typeof statusLabels] || value;
      case 'priority':
        return priorityLabels[value as keyof typeof priorityLabels] || value;
      case 'dueDate':
        try {
          return format(new Date(value), 'dd/MM/yyyy à HH:mm', { locale: fr });
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <Separator />
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item: HistoryItem, index: number) => (
        <div key={item.id}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
              {actionIcons[item.action as keyof typeof actionIcons] || <Edit className="h-3 w-3 text-gray-500" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {actionLabels[item.action as keyof typeof actionLabels] || item.action}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
                {item.userName && (
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.userName}
                  </span>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-700 mb-2">
                  {item.description}
                </p>
              )}
              
              {item.fieldChanged && (
                <div className="text-sm space-y-1">
                  {item.oldValue && (
                    <div className="text-gray-600">
                      <span className="font-medium">Avant :</span> {formatValue(item.fieldChanged, item.oldValue)}
                    </div>
                  )}
                  {item.newValue && (
                    <div className="text-gray-800">
                      <span className="font-medium">Maintenant :</span> {formatValue(item.fieldChanged, item.newValue)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {index < history.length - 1 && (
            <Separator className="my-3" />
          )}
        </div>
      ))}
    </div>
  );
}