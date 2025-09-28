// Système de synchronisation intelligent pour les cartes SIM
// Compatible avec l'architecture "Single Source of Truth"

class SimCardSyncManager {
  private static instance: SimCardSyncManager;
  private updateCallbacks = new Set<() => void>();
  private isUpdating = false;

  static getInstance(): SimCardSyncManager {
    if (!SimCardSyncManager.instance) {
      SimCardSyncManager.instance = new SimCardSyncManager();
    }
    return SimCardSyncManager.instance;
  }

  // S'abonner aux mises à jour
  subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  // Déclencher une mise à jour
  async triggerUpdate(): Promise<void> {
    if (this.isUpdating) return; // Éviter les mises à jour en boucle

    this.isUpdating = true;
    
    try {
      // Notifier tous les composants
      this.updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Erreur lors du callback de synchronisation:', error);
        }
      });
    } finally {
      // Délai pour éviter les requêtes en rafale
      setTimeout(() => {
        this.isUpdating = false;
      }, 500);
    }
  }
}

export const simCardSync = SimCardSyncManager.getInstance();