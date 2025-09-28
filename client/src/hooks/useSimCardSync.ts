/**
 * Hook de synchronisation des cartes SIM avec invalidation de cache automatique
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

export function useSimCardSync() {
  const queryClient = useQueryClient();

  // Force la mise à jour des cartes SIM
  const invalidateSimCards = useCallback(() => {
    console.log("🔄 [SIM SYNC] Invalidation cache cartes SIM");
    queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
    queryClient.refetchQueries({ queryKey: ["/api/sim-cards"] });
  }, [queryClient]);

  // Force l'actualisation toutes les 30 secondes pour éviter la surcharge
  useEffect(() => {
    const interval = setInterval(() => {
      invalidateSimCards();
    }, 30000);

    return () => clearInterval(interval);
  }, [invalidateSimCards]);

  // Force l'actualisation au montage
  useEffect(() => {
    invalidateSimCards();
  }, [invalidateSimCards]);

  return { invalidateSimCards };
}