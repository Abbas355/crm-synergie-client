import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { isNull, eq } from "drizzle-orm";

/**
 * Gestionnaire de synchronisation des données entre versions déployées
 * Synchronise les clients et cartes SIM entre tableaux Admin et Vendeur
 */
export class DataSyncManager {

  /**
   * Exporter toutes les données clients authentiques pour synchronisation
   */
  static async exportClientsData(): Promise<any> {
    try {
      console.log("📤 Export des données clients authentiques...");
      
      // Récupérer tous les clients actifs (données authentiques uniquement)
      const clientsData = await db.select()
        .from(clients)
        .where(isNull(clients.deletedAt));
      
      // Récupérer toutes les cartes SIM
      const simCardsData = await db.select()
        .from(simCards);
      
      const exportData = {
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
      
      console.log(`✅ Export terminé: ${clientsData.length} clients, ${simCardsData.length} cartes SIM`);
      return exportData;
      
    } catch (error) {
      console.error("❌ Erreur lors de l'export:", error);
      throw error;
    }
  }
  
  /**
   * Importer et synchroniser les données depuis un export
   */
  static async importAndSyncData(importData: any): Promise<{success: boolean, message: string}> {
    try {
      console.log("📥 Import et synchronisation des données...");
      
      if (!importData.clients || !importData.simCards) {
        return {success: false, message: "Données d'import invalides"};
      }
      
      await db.transaction(async (tx) => {
        // 1. Synchroniser les clients
        for (const clientData of importData.clients) {
          const existingClient = await tx.select()
            .from(clients)
            .where(eq(clients.id, clientData.id))
            .limit(1);
          
          if (existingClient.length === 0) {
            // Créer nouveau client
            await tx.insert(clients).values({
              ...clientData,
              createdAt: new Date(clientData.createdAt),
              dateSignature: clientData.dateSignature ? new Date(clientData.dateSignature) : null,
              dateInstallation: clientData.dateInstallation ? new Date(clientData.dateInstallation) : null,
              dateRendezVous: clientData.dateRendezVous ? new Date(clientData.dateRendezVous) : null,
              deletedAt: clientData.deletedAt ? new Date(clientData.deletedAt) : null
            });
            console.log(`➕ Client créé: ${clientData.prenom} ${clientData.nom}`);
          } else {
            // Mettre à jour client existant
            await tx.update(clients)
              .set({
                ...clientData,
                createdAt: new Date(clientData.createdAt),
                dateSignature: clientData.dateSignature ? new Date(clientData.dateSignature) : null,
                dateInstallation: clientData.dateInstallation ? new Date(clientData.dateInstallation) : null,
                dateRendezVous: clientData.dateRendezVous ? new Date(clientData.dateRendezVous) : null,
                deletedAt: clientData.deletedAt ? new Date(clientData.deletedAt) : null
              })
              .where(eq(clients.id, clientData.id));
            console.log(`🔄 Client mis à jour: ${clientData.prenom} ${clientData.nom}`);
          }
        }
        
        // 2. Synchroniser les cartes SIM
        for (const simData of importData.simCards) {
          const existingSim = await tx.select()
            .from(simCards)
            .where(eq(simCards.numero, simData.numero))
            .limit(1);
          
          if (existingSim.length === 0) {
            // Créer nouvelle carte SIM
            await tx.insert(simCards).values({
              ...simData,
              dateAttribution: simData.dateAttribution ? new Date(simData.dateAttribution) : null,
              dateActivation: simData.dateActivation ? new Date(simData.dateActivation) : null
            });
            console.log(`➕ Carte SIM créée: ${simData.numero}`);
          } else {
            // Mettre à jour carte SIM existante
            await tx.update(simCards)
              .set({
                ...simData,
                dateAttribution: simData.dateAttribution ? new Date(simData.dateAttribution) : null,
                dateActivation: simData.dateActivation ? new Date(simData.dateActivation) : null
              })
              .where(eq(simCards.numero, simData.numero));
            console.log(`🔄 Carte SIM mise à jour: ${simData.numero}`);
          }
        }
      });
      
      console.log(`✅ Synchronisation terminée: ${importData.clients.length} clients, ${importData.simCards.length} cartes SIM`);
      
      return {
        success: true, 
        message: `Synchronisation réussie: ${importData.clients.length} clients et ${importData.simCards.length} cartes SIM`
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de l'import:", error);
      return {success: false, message: `Erreur: ${error}`};
    }
  }
  
  /**
   * Générer un rapport de différences entre environnements
   */
  static async generateSyncReport(remoteData: any): Promise<any> {
    try {
      console.log("📊 Génération du rapport de synchronisation...");
      
      // Récupérer les données locales
      const localData = await this.exportClientsData();
      
      const report = {
        timestamp: new Date().toISOString(),
        local: {
          clients: localData.clients.length,
          simCards: localData.simCards.length
        },
        remote: {
          clients: remoteData.clients?.length || 0,
          simCards: remoteData.simCards?.length || 0
        },
        differences: {
          clientsDiff: Math.abs(localData.clients.length - (remoteData.clients?.length || 0)),
          simCardsDiff: Math.abs(localData.simCards.length - (remoteData.simCards?.length || 0))
        },
        recommendations: []
      };
      
      if (report.differences.clientsDiff > 0) {
        report.recommendations.push(`Différence de ${report.differences.clientsDiff} clients détectée`);
      }
      
      if (report.differences.simCardsDiff > 0) {
        report.recommendations.push(`Différence de ${report.differences.simCardsDiff} cartes SIM détectée`);
      }
      
      if (report.recommendations.length === 0) {
        report.recommendations.push("Données synchronisées");
      }
      
      return report;
      
    } catch (error) {
      console.error("❌ Erreur génération rapport:", error);
      throw error;
    }
  }
  
  /**
   * Synchronisation bidirectionnelle avec validation
   */
  static async performBidirectionalSync(remoteEndpoint: string, apiKey?: string): Promise<{success: boolean, message: string}> {
    try {
      console.log("🔄 Démarrage synchronisation bidirectionnelle...");
      
      // 1. Exporter les données locales
      const localData = await this.exportClientsData();
      
      // 2. Récupérer les données distantes
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(`${remoteEndpoint}/api/sync/export`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const remoteData = await response.json();
      
      // 3. Générer le rapport
      const report = await this.generateSyncReport(remoteData);
      console.log("📊 Rapport de synchronisation:", report);
      
      // 4. Synchroniser les données
      if (report.differences.clientsDiff > 0 || report.differences.simCardsDiff > 0) {
        const syncResult = await this.importAndSyncData(remoteData);
        
        if (syncResult.success) {
          // 5. Envoyer les données locales vers le distant
          const pushResponse = await fetch(`${remoteEndpoint}/api/sync/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(localData)
          });
          
          if (pushResponse.ok) {
            return {success: true, message: "Synchronisation bidirectionnelle réussie"};
          } else {
            return {success: false, message: "Erreur lors du push vers distant"};
          }
        } else {
          return syncResult;
        }
      } else {
        return {success: true, message: "Données déjà synchronisées"};
      }
      
    } catch (error) {
      console.error("❌ Erreur synchronisation bidirectionnelle:", error);
      return {success: false, message: `Erreur: ${error}`};
    }
  }
}

/**
 * Endpoints API pour la synchronisation entre versions déployées
 */
export function addSyncEndpoints(app: any) {
  
  // Export des données authentiques
  app.get('/api/sync/export', async (req: any, res: any) => {
    try {
      const exportData = await DataSyncManager.exportClientsData();
      res.json(exportData);
    } catch (error) {
      console.error('Erreur export sync:', error);
      res.status(500).json({error: 'Erreur lors de l\'export'});
    }
  });
  
  // Rapport simple de comparaison
  app.post('/api/sync/report', async (req: any, res: any) => {
    try {
      const localData = await DataSyncManager.exportClientsData();
      const remoteData = req.body;
      
      const report = {
        timestamp: new Date().toISOString(),
        local: localData.stats,
        remote: remoteData.stats || { totalClients: 0, totalSimCards: 0 },
        differences: {
          clientsDiff: Math.abs(localData.stats.totalClients - (remoteData.stats?.totalClients || 0)),
          simCardsDiff: Math.abs(localData.stats.totalSimCards - (remoteData.stats?.totalSimCards || 0))
        },
        recommendations: []
      };
      
      if (report.differences.clientsDiff === 0 && report.differences.simCardsDiff === 0) {
        report.recommendations.push("Données synchronisées entre Admin et Vendeur");
      } else {
        if (report.differences.clientsDiff > 0) {
          report.recommendations.push(`Différence de ${report.differences.clientsDiff} clients détectée`);
        }
        if (report.differences.simCardsDiff > 0) {
          report.recommendations.push(`Différence de ${report.differences.simCardsDiff} cartes SIM détectée`);
        }
      }
      
      res.json(report);
    } catch (error) {
      console.error('Erreur rapport sync:', error);
      res.status(500).json({error: 'Erreur lors de la génération du rapport'});
    }
  });
}