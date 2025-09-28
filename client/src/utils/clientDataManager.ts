/**
 * Gestionnaire de données client avec synchronisation forcée
 * Solution définitive pour contourner les problèmes de cache React Query
 */

export class ClientDataManager {
  private static instance: ClientDataManager;
  private clientsData: any[] = [];
  private listeners: Set<Function> = new Set();

  static getInstance() {
    if (!ClientDataManager.instance) {
      ClientDataManager.instance = new ClientDataManager();
    }
    return ClientDataManager.instance;
  }

  async fetchClients(): Promise<any[]> {
    console.log('🔄 ClientDataManager: Récupération des clients...');
    
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ClientDataManager: Clients récupérés:', data.length);
      
      this.clientsData = data;
      this.notifyListeners();
      return data;
    } catch (error) {
      console.error('❌ ClientDataManager: Erreur:', error);
      throw error;
    }
  }

  async updateClient(clientId: number, data: any): Promise<any> {
    console.log('🔄 ClientDataManager: Mise à jour client', clientId, data);
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ ClientDataManager: Client mis à jour:', result);
      
      // Mettre à jour le client dans les données locales immédiatement
      const clientIndex = this.clientsData.findIndex(c => c.id === clientId);
      if (clientIndex !== -1) {
        this.clientsData[clientIndex] = { ...this.clientsData[clientIndex], ...result.client };
        this.notifyListeners();
      }
      
      // Forcer la récupération des données après mise à jour
      setTimeout(() => {
        this.fetchClients();
      }, 100);
      
      return result;
    } catch (error) {
      console.error('❌ ClientDataManager: Erreur mise à jour:', error);
      throw error;
    }
  }

  subscribe(listener: Function) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.clientsData));
  }

  getClients() {
    return this.clientsData;
  }

  forceRefresh() {
    console.log('🔄 ClientDataManager: Force refresh déclenché');
    this.fetchClients();
  }
}

export const clientDataManager = ClientDataManager.getInstance();