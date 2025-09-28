import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Merge, X, Check, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface DuplicateTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  clientName?: string;
  userName?: string;
  category: string;
}

interface DuplicateGroup {
  name: string;
  tasks: DuplicateTask[];
  count: number;
}

export default function DuplicateDetectionSystem() {
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<DuplicateGroup | null>(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [allGroups, setAllGroups] = useState<DuplicateGroup[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  // Vérifier si on doit lancer la détection mensuelle
  useEffect(() => {
    const checkForMonthlyDuplicates = () => {
      const now = new Date();
      const lastCheckDate = localStorage.getItem('lastDuplicateCheck');
      
      // Système de détection mensuelle automatique désactivé pour éviter les notifications intempestives
      // La détection se fait uniquement sur demande manuelle via le bouton dans l'interface admin
      
      if (!lastCheckDate) {
        // Première fois - programmer pour le mois prochain
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        localStorage.setItem('lastDuplicateCheck', nextMonth.toISOString());
        return;
      }

      const lastCheck = new Date(lastCheckDate);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      // Si le dernier check est plus ancien qu'un mois, lancer la détection
      if (lastCheck < oneMonthAgo) {
        // Détection automatique désactivée - uniquement manuelle
        // detectDuplicatesMutation.mutate();
        // localStorage.setItem('lastDuplicateCheck', now.toISOString());
      }
    };

    // Vérifier au chargement du composant
    checkForMonthlyDuplicates();
    
    // Vérifier toutes les heures - désactivé pour éviter les notifications
    // const interval = setInterval(checkForMonthlyDuplicates, 60 * 60 * 1000);
    
    // Écouter les événements de déclenchement manuel uniquement
    const handleManualTrigger = () => {
      detectDuplicatesMutation.mutate();
      localStorage.setItem('lastDuplicateCheck', new Date().toISOString());
    };

    window.addEventListener('triggerDuplicateCheck', handleManualTrigger);
    
    return () => {
      window.removeEventListener('triggerDuplicateCheck', handleManualTrigger);
    };
  }, []);

  // Mutation pour détecter tous les doublons en utilisant l'endpoint existant
  const detectDuplicatesMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Récupération des tâches pour détection de doublons...');
      
      // Récupérer toutes les tâches de l'utilisateur
      const response = await fetch('/api/tasks', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Réponse API tâches:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const tasks = await response.json();
      console.log('📊 Tâches récupérées:', tasks.length);
      
      // Analyser les doublons côté client
      const extractNameFromTitle = (title: string) => {
        const match = title.match(/Suivi client:\s*([^,]+)/i);
        return match ? match[1].trim() : title;
      };

      const duplicateGroups: { [key: string]: typeof tasks } = {};
      
      // Grouper les tâches par nom similaire
      for (const task of tasks) {
        const taskName = extractNameFromTitle(task.title);
        const nameParts = taskName.split(/\s+/).filter(part => part.length > 0);
        
        if (nameParts.length < 2) continue;
        
        // Créer une clé normalisée (nom + prénom)
        const normalizedName = nameParts.slice(0, 2).map(part => part.toLowerCase().trim()).sort().join(' ');
        
        if (!duplicateGroups[normalizedName]) {
          duplicateGroups[normalizedName] = [];
        }
        
        duplicateGroups[normalizedName].push(task);
      }

      // Filtrer pour ne garder que les groupes avec des doublons
      const actualDuplicates = Object.entries(duplicateGroups)
        .filter(([_, tasks]) => tasks.length > 1)
        .map(([name, tasks]) => ({
          name: name,
          tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            clientName: task.clientName || 'N/A',
            userName: task.userName || 'N/A',
            category: 'suivi'
          })),
          count: tasks.length
        }));

      console.log(`🔍 ${actualDuplicates.length} groupes de doublons détectés côté client`);
      
      return { 
        duplicateGroups: actualDuplicates,
        totalGroups: actualDuplicates.length,
        totalDuplicates: actualDuplicates.reduce((sum, group) => sum + group.count, 0)
      };
    },
    onSuccess: (data) => {
      if (data.duplicateGroups && data.duplicateGroups.length > 0) {
        setAllGroups(data.duplicateGroups);
        setGroupIndex(0);
        setCurrentGroup(data.duplicateGroups[0]);
        setShowDuplicateDialog(true);
      } else {
        toast({
          title: "Aucun doublon détecté",
          description: "Aucune tâche en double n'a été trouvée ce mois-ci.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les doublons.",
        variant: "destructive"
      });
    }
  });

  // Mutation pour fusionner les tâches avec logs de débogage
  const mergeTasksMutation = useMutation({
    mutationFn: async ({ sourceTaskId, targetTaskId }: { sourceTaskId: number, targetTaskId: number }) => {
      console.log('🔄 Tentative de fusion des tâches:', { sourceTaskId, targetTaskId });
      
      // Vérifier que les IDs sont valides
      if (!sourceTaskId || !targetTaskId) {
        throw new Error('IDs de tâche invalides');
      }
      
      const response = await apiRequest('POST', '/api/tasks/merge', {
        sourceTaskId,
        targetTaskId
      });
      
      console.log('✅ Fusion réussie:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Tâches fusionnées",
        description: "Les tâches ont été fusionnées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/tasks'] });
      handleNextGroup();
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la fusion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de fusionner les tâches. Vérifiez les logs pour plus de détails.",
        variant: "destructive"
      });
    }
  });

  const handleMerge = (sourceTaskId: number, targetTaskId: number) => {
    mergeTasksMutation.mutate({ sourceTaskId, targetTaskId });
  };

  const handleSkip = () => {
    handleNextGroup();
  };

  const handleNextGroup = () => {
    if (groupIndex < allGroups.length - 1) {
      const nextIndex = groupIndex + 1;
      setGroupIndex(nextIndex);
      setCurrentGroup(allGroups[nextIndex]);
    } else {
      // Terminé - fermer la boîte de dialogue
      setShowDuplicateDialog(false);
      setCurrentGroup(null);
      setAllGroups([]);
      setGroupIndex(0);
      
      toast({
        title: "Vérification terminée",
        description: "Toutes les tâches en double ont été vérifiées.",
      });
    }
  };

  const handleClose = () => {
    setShowDuplicateDialog(false);
    setCurrentGroup(null);
    setAllGroups([]);
    setGroupIndex(0);
  };

  const priorityColors = {
    urgent: "bg-red-500 text-white",
    high: "bg-orange-500 text-white", 
    medium: "bg-yellow-500 text-white",
    low: "bg-blue-500 text-white"
  };

  const statusColors = {
    pending: "bg-gray-400 text-white",
    in_progress: "bg-blue-500 text-white",
    completed: "bg-green-500 text-white"
  };

  return (
    <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="hidden sm:inline">Doublons détectés - Vérification mensuelle</span>
            <span className="sm:hidden">Doublons détectés</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {currentGroup && (
              <>
                <div className="font-medium">
                  Groupe {groupIndex + 1} sur {allGroups.length}
                </div>
                <div className="mt-1">
                  {currentGroup.count} tâches similaires pour "{currentGroup.name}"
                </div>
                <div className="mt-2 text-xs sm:text-sm">
                  Voulez-vous fusionner ces tâches pour éviter les doublons ?
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {currentGroup && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {currentGroup.tasks.map((task, index) => (
                <Card key={task.id} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                      <span className="font-bold">Tâche #{task.id}</span>
                      <div className="flex gap-1 sm:gap-2">
                        <Badge className={`text-xs px-2 py-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                          {task.priority === 'normale' ? 'normal' : task.priority}
                        </Badge>
                        <Badge className={`text-xs px-2 py-1 ${statusColors[task.status as keyof typeof statusColors]}`}>
                          {task.status}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div>
                      <p className="font-medium text-sm sm:text-base">{task.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-3">
                        {task.description || 'Pas de description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Créé le {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      {/* Boutons pour fusionner avec d'autres tâches */}
                      {currentGroup.tasks.filter(t => t.id !== task.id).map((targetTask) => (
                        <Button
                          key={targetTask.id}
                          onClick={() => handleMerge(task.id, targetTask.id)}
                          disabled={mergeTasksMutation.isPending}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs w-full sm:w-auto justify-center"
                        >
                          <Merge className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Fusionner avec #{targetTask.id}</span>
                          <span className="sm:hidden">Fusionner avec #{targetTask.id}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t gap-3">
              <p className="text-sm text-gray-600 w-full sm:w-auto">
                Ces tâches semblent être des doublons. Voulez-vous les fusionner ?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-800 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Ignorer ce groupe
                </Button>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 w-full sm:w-auto"
                >
                  Fermer tout
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}