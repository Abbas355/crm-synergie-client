import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

export function useDailyTasksNotification() {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [lastShownDate, setLastShownDate] = useState<string | null>(null);

  // Récupérer les tâches du jour
  const { data: todayTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/today"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notifications/tasks-today");
      return await response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Vérifier toutes les 5 minutes
  });

  // Vérifier si on doit afficher le popup
  useEffect(() => {
    const checkShouldShowPopup = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toDateString();
      
      // Vérifier si on est dans les heures d'affichage (6h-20h)
      if (currentHour < 6 || currentHour >= 20) {
        return false;
      }

      // Vérifier s'il y a des tâches à faire
      if (todayTasks.length === 0) {
        return false;
      }

      // Vérifier s'il y a des tâches non terminées
      const pendingTasks = todayTasks.filter(task => task.status !== 'completed');
      if (pendingTasks.length === 0) {
        return false;
      }

      // Récupérer la dernière fois que le popup a été affiché
      const lastShown = localStorage.getItem('dailyTasksPopupLastShown');
      
      if (!lastShown) {
        // Première fois - afficher le popup
        return true;
      }

      const lastShownTime = new Date(lastShown);
      const hoursSinceLastShown = (now.getTime() - lastShownTime.getTime()) / (1000 * 60 * 60);
      
      // Afficher le pop-up toutes les 6 heures en production
      return hoursSinceLastShown >= 6;
    };

    if (!isLoading && checkShouldShowPopup()) {
      setShouldShowPopup(true);
    }
  }, [todayTasks, isLoading]);

  // Marquer le popup comme affiché
  const markPopupAsShown = () => {
    const now = new Date();
    localStorage.setItem('dailyTasksPopupLastShown', now.toISOString());
    setShouldShowPopup(false);
  };

  // Fonction appelée quand une tâche est terminée
  const handleTaskComplete = (taskId: number) => {
    // Vérifier s'il reste des tâches non terminées
    const remainingTasks = todayTasks.filter(task => task.id !== taskId && task.status !== 'completed');
    
    if (remainingTasks.length === 0) {
      // Plus de tâches - fermer le popup
      setShouldShowPopup(false);
    }
  };

  return {
    shouldShowPopup,
    todayTasks,
    isLoading,
    markPopupAsShown,
    handleTaskComplete,
  };
}