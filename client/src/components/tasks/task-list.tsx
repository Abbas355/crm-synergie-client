import { useState } from "react";
import { CalendarIcon, Edit, Trash2, AlertTriangle, Clock, Eye, User, Calendar } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { TaskForm } from "./task-form";
import { useRole } from "@/hooks/use-role";

// Interface pour les propriétés du composant de liste de tâches
interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  clientId?: number;
  clientName?: string;
  userId: number;
  userName?: string;
  createdAt: string;
  taskType: string;
}

// Interface pour les propriétés du composant TaskList
interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onUpdateTask: (id: number, data: any) => void;
  onDeleteTask: (id: number) => void;
  isReadOnly: boolean;
  isMobile?: boolean;
}

// Composant principal pour afficher la liste des tâches
export function TaskList({ tasks, isLoading, onUpdateTask, onDeleteTask, isReadOnly, isMobile = false }: TaskListProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isAdmin } = useRole();

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setOpenAlert(true);
  };

  const handleViewDetails = (task: Task) => {
    console.log("Clic sur la tâche:", task.title);
    // Depuis que la page task-detail a été supprimée, on ouvre juste le dialog détails
    setSelectedTask(task);
    setOpenDetailsDialog(true);
  };

  const handleUpdateTask = (data: any) => {
    if (selectedTask) {
      onUpdateTask(selectedTask.id, data);
      setOpenDialog(false);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedTask) {
      onDeleteTask(selectedTask.id);
      setOpenAlert(false);
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'basse':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'normale':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'haute':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case 'urgente':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en attente':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'en cours':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case 'terminée':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'annulée':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Fonction pour obtenir le libellé du type de tâche
  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case 'suivi':
        return "Suivi client";
      case 'prospection':
        return "Prospection";
      case 'recrutement':
        return "Recrutement";
      case 'administratif':
        return "Administratif";
      case 'formation':
        return "Formation";
      case 'autre':
        return "Autre";
      default:
        return taskType;
    }
  };

  // Fonction pour obtenir le badge de type de tâche (violet pour admin, bleu pour vendeur)
  const getTaskTypeBadge = (taskType: string, userId: number) => {
    const isAdminTask = userId === 1 || userId === 15; // IDs des admins
    const baseClasses = "text-xs px-2 py-1 font-medium rounded-full";
    
    if (isAdminTask) {
      return `${baseClasses} bg-purple-100 text-purple-700 border border-purple-200`;
    } else {
      return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
    }
  };

  // Fonction pour vérifier si l'utilisateur est autorisé à modifier une tâche
  const canEditTask = (task: Task) => {
    if (isReadOnly) return false;
    if (isAdmin()) return true;
    return task.userId === parseInt(localStorage.getItem('userId') || '0', 10);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Aucune tâche à afficher</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-3' : 'space-y-4'} mt-4`} data-tasks-container>
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${
            isMobile ? 'mx-1 mb-3 rounded-lg shadow-sm border bg-white active:scale-[0.98]' : 'border rounded-lg shadow-sm'
          }`} 
          onClick={() => handleViewDetails(task)}
          style={{ 
            WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)',
            touchAction: 'manipulation'
          }}
        >
          {/* Indicateur de priorité urgent - optimisé mobile */}
          {task.priority === 'urgente' && (
            <div className={`absolute top-0 right-0 bg-gradient-to-l from-red-500 to-red-600 text-white ${
              isMobile ? 'px-2 py-1 text-xs rounded-bl-xl' : 'px-3 py-1 text-xs rounded-bl-lg'
            } font-bold z-10`}>
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {isMobile ? "!" : "URGENT"}
            </div>
          )}
          
          {/* Barre latérale de couleur selon le statut */}
          <div className={`absolute left-0 top-0 bottom-0 ${isMobile ? 'w-1' : 'w-1'} ${
            task.status === 'terminée' ? 'bg-green-500' :
            task.status === 'en cours' ? 'bg-amber-500' :
            task.status === 'en attente' ? 'bg-blue-500' : 'bg-gray-400'
          }`} />
          
          {isMobile ? (
            // Version mobile simplifiée et compacte
            <div className="p-3 pl-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                    {task.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1`}>
                      {task.status}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1`}>
                      {task.priority}
                    </Badge>
                    <Badge className={getTaskTypeBadge(task.taskType, task.userId)}>
                      {task.userId === 1 || task.userId === 15 ? 'Admin' : 'Vendeur'}
                    </Badge>
                  </div>
                  
                  {task.clientName && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{task.clientName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.createdAt), 'dd/MM/yy', { locale: fr })}</span>
                    {task.dueDate && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span className="text-amber-600">{format(new Date(task.dueDate), 'dd/MM', { locale: fr })}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {canEditTask(task) && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Edit button clicked");
                        handleEditClick(task);
                      }}
                      className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Delete button clicked");
                        handleDeleteClick(task);
                      }}
                      className="p-2 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              
              {task.description && (
                <div className="text-xs text-gray-600 mt-2">
                  <div className="whitespace-pre-wrap break-words line-clamp-3">
                    {task.description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Design desktop
            <div>
              <div className="pb-3 pl-6 pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors font-semibold">
                        {task.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {getTaskTypeLabel(task.taskType)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                      {task.clientName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.clientName}</span>
                        </div>
                      )}
                      {isReadOnly && task.userName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.userName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={`${getStatusColor(task.status)} text-xs font-medium`}>
                      {task.status}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} text-xs font-medium`}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pb-3 pl-6">
                {task.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="whitespace-pre-wrap break-words line-clamp-4 leading-relaxed">
                      {task.description}
                    </div>
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center mt-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Échéance: {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 pb-4 pl-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(task);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir détails
                </Button>
                
                {canEditTask(task) && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(task);
                      }}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(task);
                      }}
                      className="hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Boîte de dialogue pour l'édition des tâches */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className={isMobile ? "w-[95%] max-w-[95%] p-4" : "sm:max-w-[600px]"}>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la tâche ci-dessous
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              onSubmit={handleUpdateTask}
              onCancel={() => setOpenDialog(false)}
              defaultValues={{
                title: selectedTask.title,
                description: selectedTask.description,
                status: selectedTask.status,
                priority: selectedTask.priority,
                dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined,
                clientId: selectedTask.clientId,
                taskType: selectedTask.taskType
              }}
              isEdit={true}
              isMobile={isMobile}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue pour afficher les détails d'une tâche */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className={isMobile ? "w-[95%] max-w-[95%] p-4 max-h-[90vh] overflow-y-auto" : "sm:max-w-[600px] max-h-[80vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-blue-600" />
              Détails de la tâche
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6 py-4">
              {/* En-tête avec titre et badges */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedTask.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getStatusColor(selectedTask.status)} text-xs font-medium`}>
                    {selectedTask.status}
                  </Badge>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} text-xs font-medium`}>
                    {selectedTask.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getTaskTypeLabel(selectedTask.taskType)}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTask.clientName && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Client</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTask.clientName}
                      </span>
                    </div>
                  </div>
                )}

                {isReadOnly && selectedTask.userName && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <User className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Assignée à</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTask.userName}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Créée le</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(selectedTask.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>

                {selectedTask.dueDate && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Échéance</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(selectedTask.dueDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {canEditTask(selectedTask) && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => {
                      setOpenDetailsDialog(false);
                      handleEditClick(selectedTask);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier la tâche
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setOpenDetailsDialog(false);
                      handleDeleteClick(selectedTask);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue pour la confirmation de suppression */}
      <Dialog open={openAlert} onOpenChange={setOpenAlert}>
        <DialogContent className={isMobile ? "w-[90%] max-w-[90%] p-4" : "sm:max-w-[425px]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={isMobile ? "flex-col space-y-2 mt-4" : "sm:justify-between"}>
            <Button 
              variant="outline" 
              onClick={() => setOpenAlert(false)}
              className={isMobile ? "w-full" : ""}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className={isMobile ? "w-full" : ""}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}