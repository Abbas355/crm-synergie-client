import { db } from "@db";
import { clients } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * Gestionnaire des doublons clients
 */
export class DuplicateManager {
  
  /**
   * Détecter tous les doublons potentiels
   */
  static async detectDuplicates() {
    try {
      const duplicates = await db.execute(sql`
        SELECT 
          prenom,
          nom,
          phone,
          COUNT(*) as count,
          ARRAY_AGG(id ORDER BY "dateSignature" DESC) as client_ids,
          ARRAY_AGG("identifiantContrat") as contracts,
          ARRAY_AGG(produit) as products
        FROM clients 
        WHERE deletedAt IS NULL
        GROUP BY prenom, nom, phone
        HAVING COUNT(*) > 1
        ORDER BY prenom, nom
      `);
      
      return duplicates.rows;
    } catch (error) {
      console.error("Erreur détection doublons:", error);
      throw error;
    }
  }
  
  /**
   * Marquer un client comme doublon (suppression douce)
   */
  static async markAsDuplicate(clientId: number, reason: string = "Doublon détecté") {
    try {
      const result = await db.update(clients)
        .set({
          deletedAt: new Date(),
          commentaire: reason
        })
        .where(eq(clients.id, clientId))
        .returning();
      
      console.log(`Client ${clientId} marqué comme doublon`);
      return result[0];
    } catch (error) {
      console.error("Erreur marquage doublon:", error);
      throw error;
    }
  }
  
  /**
   * Signaler un doublon (pour les vendeurs)
   */
  static async reportDuplicate(clientId: number, reportedBy: number, reason: string) {
    try {
      // Ajouter un commentaire sur le client
      const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      
      if (client.length > 0) {
        const currentComment = client[0].commentaire || "";
        const newComment = currentComment 
          ? `${currentComment}\n[DOUBLON SIGNALÉ] ${reason} (User ${reportedBy})`
          : `[DOUBLON SIGNALÉ] ${reason} (User ${reportedBy})`;
        
        await db.update(clients)
          .set({ commentaire: newComment })
          .where(eq(clients.id, clientId));
        
        console.log(`Doublon signalé pour client ${clientId} par user ${reportedBy}`);
        return { success: true, message: "Doublon signalé aux administrateurs" };
      }
      
      return { success: false, message: "Client non trouvé" };
    } catch (error) {
      console.error("Erreur signalement doublon:", error);
      throw error;
    }
  }
  
  /**
   * Fusionner deux clients (garder le plus récent, transférer les données importantes)
   */
  static async mergeClients(keepClientId: number, removeClientId: number) {
    try {
      const [keepClient, removeClient] = await Promise.all([
        db.select().from(clients).where(eq(clients.id, keepClientId)).limit(1),
        db.select().from(clients).where(eq(clients.id, removeClientId)).limit(1)
      ]);
      
      if (keepClient.length === 0 || removeClient.length === 0) {
        throw new Error("Un des clients n'existe pas");
      }
      
      // Fusionner les commentaires
      const keepComment = keepClient[0].commentaire || "";
      const removeComment = removeClient[0].commentaire || "";
      const mergedComment = [keepComment, removeComment, `[FUSION] Fusionné avec client ${removeClientId}`]
        .filter(Boolean)
        .join("\n");
      
      // Mettre à jour le client à conserver
      await db.update(clients)
        .set({ commentaire: mergedComment })
        .where(eq(clients.id, keepClientId));
      
      // Marquer l'autre comme supprimé
      await this.markAsDuplicate(removeClientId, `Fusionné avec client ${keepClientId}`);
      
      console.log(`Clients fusionnés: ${keepClientId} (gardé) et ${removeClientId} (supprimé)`);
      return { success: true, message: "Clients fusionnés avec succès" };
      
    } catch (error) {
      console.error("Erreur fusion clients:", error);
      throw error;
    }
  }
}

export function addDuplicateManagementEndpoints(app: any) {
  
  // Détecter les doublons (admin seulement)
  app.get('/api/duplicates/detect', async (req: any, res: any) => {
    try {
      const duplicates = await DuplicateManager.detectDuplicates();
      res.json(duplicates);
    } catch (error) {
      res.status(500).json({ error: 'Erreur détection doublons' });
    }
  });
  
  // Signaler un doublon (vendeurs)
  app.post('/api/duplicates/report', async (req: any, res: any) => {
    try {
      const { clientId, reason } = req.body;
      const userId = req.user?.id || 1;
      
      const result = await DuplicateManager.reportDuplicate(clientId, userId, reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erreur signalement doublon' });
    }
  });
  
  // Marquer comme doublon (admin seulement)
  app.post('/api/duplicates/mark', async (req: any, res: any) => {
    try {
      const { clientId, reason } = req.body;
      
      const result = await DuplicateManager.markAsDuplicate(clientId, reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erreur marquage doublon' });
    }
  });
  
  // Fusionner des clients (admin seulement)
  app.post('/api/duplicates/merge', async (req: any, res: any) => {
    try {
      const { keepClientId, removeClientId } = req.body;
      
      const result = await DuplicateManager.mergeClients(keepClientId, removeClientId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erreur fusion clients' });
    }
  });
}