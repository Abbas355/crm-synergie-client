/**
 * Gestionnaire de données SIM Cards avec synchronisation forcée
 * Contourne les problèmes de cache React Query
 */

export interface SimCardData {
  id: number;
  numero: string;
  statut: string;
  clientNom?: string;
  clientPrenom?: string;
  codeVendeur?: string;
  dateAttribution?: string;
  [key: string]: any;
}

class SimCardDataManager {
  private subscribers: Array<(data: SimCardData[]) => void> = [];
  private lastData: SimCardData[] = [];

  subscribe(callback: (data: SimCardData[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  async fetchSimCards(): Promise<SimCardData[]> {
    try {

      
      const response = await fetch("/api/sim-cards", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'If-None-Match': '*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      


      this.lastData = data;
      this.notifySubscribers(data);
      return data;
    } catch (error) {

      throw error;
    }
  }

  private notifySubscribers(data: SimCardData[]) {
    this.subscribers.forEach(callback => callback(data));
  }

  getLastData(): SimCardData[] {
    return this.lastData;
  }

  // Force refresh pour éviter les problèmes de cache
  async forceRefresh(): Promise<SimCardData[]> {

    return await this.fetchSimCards();
  }
}

export const simCardDataManager = new SimCardDataManager();