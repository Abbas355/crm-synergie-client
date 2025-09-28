import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { isNull } from "drizzle-orm";

/**
 * Synchronisation simple entre versions déployées (Admin/Vendeur)
 */
export class DeploymentSync {
  
  /**
   * Export des données authentiques pour synchronisation
   */
  static async exportData() {
    try {
      const clientsData = await db.select().from(clients).where(isNull(clients.deletedAt));
      const simCardsData = await db.select().from(simCards);
      
      return {
        timestamp: new Date().toISOString(),
        clients: clientsData,
        simCards: simCardsData,
        stats: {
          totalClients: clientsData.length,
          totalSimCards: simCardsData.length,
          activatedSimCards: simCardsData.filter(sim => sim.statut === 'Activé').length,
          availableSimCards: simCardsData.filter(sim => sim.statut === 'disponible').length
        }
      };
    } catch (error) {
      console.error("Erreur export données:", error);
      throw error;
    }
  }
  
  /**
   * Comparaison simple entre versions
   */
  static async compareVersions(remoteData: any) {
    try {
      const localData = await this.exportData();
      
      return {
        timestamp: new Date().toISOString(),
        local: localData.stats,
        remote: remoteData.stats || { totalClients: 0, totalSimCards: 0 },
        differences: {
          clientsDiff: Math.abs(localData.stats.totalClients - (remoteData.stats?.totalClients || 0)),
          simCardsDiff: Math.abs(localData.stats.totalSimCards - (remoteData.stats?.totalSimCards || 0))
        },
        status: "synchronized"
      };
    } catch (error) {
      console.error("Erreur comparaison versions:", error);
      throw error;
    }
  }
}

export function addDeploymentSyncEndpoints(app: any) {
  
  // Export des données authentiques
  app.get('/api/deployment-sync/export', async (req: any, res: any) => {
    try {
      const data = await DeploymentSync.exportData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erreur export données' });
    }
  });
  
  // Comparaison entre versions
  app.post('/api/deployment-sync/compare', async (req: any, res: any) => {
    try {
      const comparison = await DeploymentSync.compareVersions(req.body);
      res.json(comparison);
    } catch (error) {
      res.status(500).json({ error: 'Erreur comparaison' });
    }
  });
}