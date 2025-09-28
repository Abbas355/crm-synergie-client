import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, CheckCircle2, X, Eye, Phone, MapPin, ListTodo } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocation } from "wouter";

interface DailyTasksPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete: (taskId: number) => void;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  clientName?: string;
  clientPhone?: string;
  clientCity?: string;
  clientStatus?: string;
  category: string;
  status: string;
}

export function DailyTasksPopup({ isOpen, onClose, onTaskComplete }: DailyTasksPopupProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Récupérer les tâches du jour
  const { data: todayTasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks/today"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/notifications/tasks-today");
        return await response.json();
      } catch (error) {
        console.error("Erreur récupération tâches:", error);
        return [];
      }
    },
    enabled: isOpen,
  });

  const handleMarkAsComplete = async (taskId: number) => {
    try {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { status: "completed" });
      onTaskComplete(taskId);
      refetch();
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la tâche comme terminée",
        variant: "destructive",
      });
    }
  };

  const handleViewTask = (taskId: number) => {
    setLocation(`/tasks/${taskId}`);
    onClose();
  };

  const handleViewAllTasks = () => {
    setLocation('/tasks');
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "haute":
        return "bg-red-500";
      case "medium":
      case "normale":
        return "bg-yellow-500";
      case "low":
      case "faible":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
      case "haute":
        return "Haute";
      case "medium":
      case "normale":
        return "Normale";
      case "low":
      case "faible":
        return "Faible";
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-2xl backdrop-blur-sm">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                À faire aujourd'hui
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 shadow-lg"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="daily-tasks-popup daily-tasks-popup-content w-full max-w-[95vw] sm:max-w-2xl border-0 shadow-2xl p-4 sm:p-6">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                À faire aujourd'hui
              </span>
            </div>
            <Badge className="w-fit bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg text-xs sm:text-sm">
              {todayTasks.filter(task => task.status !== 'completed').length} tâche{todayTasks.filter(task => task.status !== 'completed').length > 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Aucune tâche aujourd'hui
            </h3>
            <p className="text-gray-600">
              Vous n'avez aucune tâche prévue pour aujourd'hui. Bonne journée !
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="task-card-hover bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 hover:bg-white/90 hover:shadow-lg cursor-pointer"
                onClick={() => handleViewTask(task.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{task.title}</h3>
                      <Badge className={`priority-badge ${getPriorityColor(task.priority)} text-white border-0 shadow-md w-fit`}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">
                            {task.dueDate ? (() => {
                              try {
                                const date = new Date(task.dueDate);
                                return isNaN(date.getTime()) ? "Date invalide" : format(date, "dd/MM/yyyy", { locale: fr });
                              } catch {
                                return "Date invalide";
                              }
                            })() : "Sans échéance"}
                          </span>
                        </div>
                        
                        {task.clientName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{task.clientName}</span>
                          </div>
                        )}
                      </div>
                      
                      {(task.clientPhone || task.clientCity) && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          {task.clientPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="whitespace-nowrap">{task.clientPhone}</span>
                            </div>
                          )}
                          
                          {task.clientCity && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-[100px] sm:max-w-none">{task.clientCity}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTask(task.id);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Voir
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsComplete(task.id);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Terminer</span>
                      <span className="sm:hidden">✓</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mobile-button-stack flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-white/20">
          <Button
            onClick={handleViewAllTasks}
            variant="outline"
            className="flex-1 bg-white/80 border-white/30 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base h-10 sm:h-11"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Voir toutes les tâches
          </Button>
          
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base h-10 sm:h-11"
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}