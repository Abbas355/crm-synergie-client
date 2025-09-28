/**
 * Hook personnalisé pour forcer la synchronisation des données
 * Contourne les problèmes de cache React Query
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useForceRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  const forceRefresh = useCallback(() => {
    // 1. Vider complètement le cache
    queryClient.clear();
    
    // 2. Invalider tous les endpoints clients
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/clients/custom-stats"] });
    
    // 3. Refetch forcé
    queryClient.refetchQueries({ queryKey: ["/api/clients"] });
    
    // 4. Incrémenter la clé de refresh
    setRefreshKey(prev => prev + 1);
    
    console.log('🔄 Force refresh déclenché', { refreshKey: refreshKey + 1 });
  }, [queryClient, refreshKey]);

  return {
    refreshKey,
    forceRefresh
  };
}