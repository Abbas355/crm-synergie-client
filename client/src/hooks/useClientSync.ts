import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour forcer la synchronisation des données client après modification
 */
export function useClientSync(clientId: string) {
  const queryClient = useQueryClient();

  // Écouter les changements dans le localStorage pour détecter les modifications
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `client-updated-${clientId}`) {
        console.log('🔄 Synchronisation détectée pour client', clientId);
        
        // Invalider et refetch les données
        queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
        
        // Nettoyer le signal
        localStorage.removeItem(`client-updated-${clientId}`);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier également périodiquement
    const interval = setInterval(() => {
      const updateSignal = localStorage.getItem(`client-updated-${clientId}`);
      if (updateSignal) {
        console.log('🔄 Signal de mise à jour détecté pour client', clientId);
        queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
        localStorage.removeItem(`client-updated-${clientId}`);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [clientId, queryClient]);

  // Fonction pour déclencher une synchronisation
  const triggerSync = () => {
    localStorage.setItem(`client-updated-${clientId}`, Date.now().toString());
    console.log('🔄 Signal de synchronisation envoyé pour client', clientId);
  };

  return { triggerSync };
}