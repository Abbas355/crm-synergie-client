/**
 * HOOK UNIFIED NOTES - Gestion centralisée des notes/commentaires
 * 
 * Principe "Single Source of Truth" côté client :
 * ✅ Une seule source de données pour toutes les notes client
 * ✅ Synchronisation automatique temps réel
 * ✅ API unifiée pour tous les composants
 * ✅ Évite la duplication et les incohérences
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export interface UnifiedNote {
  id: number;
  clientId: number;
  clientName: string;
  content: string;
  lastUpdated: string;
  updatedBy: string;
  sources: {
    hasClientComment: boolean;
    hasTaskDescription: boolean;
    hasSimCardNote: boolean;
    taskIds: number[];
    simCardIds: number[];
  };
}

/**
 * Hook pour récupérer la note unifiée d'un client
 */
export function useClientNote(clientId: number | null | undefined) {
  return useQuery({
    queryKey: ["unified-notes", "client", clientId],
    queryFn: async (): Promise<UnifiedNote> => {
      if (!clientId) throw new Error("Client ID requis");
      
      const response = await apiRequest("GET", `/api/unified-notes/client/${clientId}`);
      return await response.json();
    },
    enabled: !!clientId,
    staleTime: 0, // Toujours récupérer les données fraîches
    gcTime: 0, // Pas de mise en cache pour garantir la synchronisation
  });
}

/**
 * Hook pour récupérer la note via une tâche (redirige vers le client)
 */
export function useTaskNote(taskId: number | null | undefined) {
  return useQuery({
    queryKey: ["unified-notes", "task", taskId],
    queryFn: async (): Promise<UnifiedNote> => {
      if (!taskId) throw new Error("Task ID requis");
      
      const response = await apiRequest("GET", `/api/unified-notes/task/${taskId}`);
      return await response.json();
    },
    enabled: !!taskId,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Hook pour récupérer la note via une carte SIM (redirige vers le client)
 */
export function useSimCardNote(simCardId: number | null | undefined) {
  return useQuery({
    queryKey: ["unified-notes", "sim-card", simCardId],
    queryFn: async (): Promise<UnifiedNote> => {
      if (!simCardId) throw new Error("SIM Card ID requis");
      
      const response = await apiRequest("GET", `/api/unified-notes/sim-card/${simCardId}`);
      return await response.json();
    },
    enabled: !!simCardId,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Hook pour mettre à jour une note unifiée
 */
export function useUpdateUnifiedNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, content }: { clientId: number; content: string }) => {
      console.log(`📝 MISE À JOUR NOTE UNIFIÉE - Client ${clientId}:`, content);
      
      const response = await apiRequest("PUT", `/api/unified-notes/client/${clientId}`, {
        content,
      });
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      const { clientId } = variables;
      
      // Invalider tous les caches liés à ce client
      queryClient.invalidateQueries({
        queryKey: ["unified-notes", "client", clientId],
      });
      
      // Invalider les caches des composants liés
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["sim-cards"],
      });
      
      console.log(`✅ CACHE INVALIDÉ pour client ${clientId} - Synchronisation temps réel`);
      
      toast({
        title: "Note mise à jour",
        description: "La note a été mise à jour dans toutes les sections.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("❌ Erreur mise à jour note unifiée:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la note. Réessayez.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook combiné pour faciliter l'utilisation dans les composants
 */
export function useUnifiedNotes(clientId: number | null | undefined) {
  const noteQuery = useClientNote(clientId);
  const updateMutation = useUpdateUnifiedNote();

  return {
    // Données
    note: noteQuery.data,
    content: noteQuery.data?.content || "",
    isLoading: noteQuery.isLoading,
    isError: noteQuery.isError,
    error: noteQuery.error,
    
    // Actions
    updateNote: (content: string) => {
      if (!clientId) {
        console.error("❌ Client ID requis pour mettre à jour la note");
        return;
      }
      return updateMutation.mutate({ clientId, content });
    },
    isUpdating: updateMutation.isPending,
    
    // Métadonnées
    sources: noteQuery.data?.sources,
    lastUpdated: noteQuery.data?.lastUpdated,
    updatedBy: noteQuery.data?.updatedBy,
    clientName: noteQuery.data?.clientName,
    
    // Actions de refetch
    refetch: noteQuery.refetch,
  };
}