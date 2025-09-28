import { db } from "../db";
import { simCards, clients, activities } from "../shared/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Moteur de gestion des attributions de cartes SIM
 * Gère la synchronisation bidirectionnelle entre cartes SIM et clients
 */
export class SimCardAssignmentEngine {
  
  /**
   * Attribuer une carte SIM à un client (depuis l'interface cartes SIM)
   */
  static async assignSimToClient(simCardId: number, clientId: number, userId: number): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🔄 Attribution carte SIM ${simCardId} → client ${clientId}`);
      
      // 1. Vérifier que la carte SIM existe et est disponible
      const simCard = await db.query.simCards.findFirst({
        where: eq(simCards.id, simCardId)
      });
      
      if (!simCard) {
        return {success: false, message: "Carte SIM non trouvée"};
      }
      
      if (simCard.statut !== "disponible") {
        return {success: false, message: "Cette carte SIM n'est pas disponible"};
      }
      
      // 2. Vérifier que le client existe
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, clientId), isNull(clients.deletedAt))
      });
      
      if (!client) {
        return {success: false, message: "Client non trouvé"};
      }
      
      // 3. Libérer l'ancienne carte SIM du client s'il en a une
      if (client.carteSim) {
        await this.unassignClientSimCard(clientId, userId);
      }
      
      // 4. Effectuer l'attribution
      await db.transaction(async (tx) => {
        // Mettre à jour la carte SIM
        await tx.update(simCards)
          .set({
            clientId: clientId,
            statut: "Activé",
            codeVendeur: client.codeVendeur || null,
            dateAttribution: client.dateSignature || new Date(),
            dateActivation: new Date()
          })
          .where(eq(simCards.id, simCardId));
        
        // Mettre à jour le client
        await tx.update(clients)
          .set({
            carteSim: simCard.numero,
            status: client.produit === "Forfait 5G" ? "installation" : client.status,
            produit: client.produit || "Forfait 5G"
          })
          .where(eq(clients.id, clientId));
        
        // Créer une activité
        await tx.insert(activities).values({
          title: `Carte SIM ${simCard.numero} attribuée à ${client.prenom} ${client.nom}`,
          type: "CarteSIM",
          userId: userId,
          clientId: clientId
        });
      });
      
      console.log(`✅ Attribution réussie: Carte ${simCard.numero} → ${client.prenom} ${client.nom}`);
      return {
        success: true, 
        message: `Carte SIM ${simCard.numero} attribuée avec succès à ${client.prenom} ${client.nom}`
      };
      
    } catch (error) {
      console.error("❌ Erreur attribution carte SIM:", error);
      return {success: false, message: "Erreur lors de l'attribution"};
    }
  }
  
  /**
   * Changer l'attribution d'une carte SIM vers un autre client
   */
  static async reassignSimCard(simCardId: number, newClientId: number, userId: number): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🔄 Réattribution carte SIM ${simCardId} → nouveau client ${newClientId}`);
      
      // 1. Vérifier la carte SIM
      const simCard = await db.query.simCards.findFirst({
        where: eq(simCards.id, simCardId)
      });
      
      if (!simCard) {
        return {success: false, message: "Carte SIM non trouvée"};
      }
      
      // 2. Libérer l'ancien client
      if (simCard.clientId) {
        await this.unassignClientSimCard(simCard.clientId, userId);
      }
      
      // 3. Attribuer au nouveau client
      return await this.assignSimToClient(simCardId, newClientId, userId);
      
    } catch (error) {
      console.error("❌ Erreur réattribution carte SIM:", error);
      return {success: false, message: "Erreur lors de la réattribution"};
    }
  }
  
  /**
   * Libérer une carte SIM d'un client
   */
  static async unassignClientSimCard(clientId: number, userId: number): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🔄 Libération carte SIM du client ${clientId}`);
      
      // 1. Trouver la carte SIM du client
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId)
      });
      
      if (!client || !client.carteSim) {
        return {success: true, message: "Aucune carte SIM à libérer"};
      }
      
      // 2. Trouver la carte SIM correspondante
      const simCard = await db.query.simCards.findFirst({
        where: eq(simCards.numero, client.carteSim)
      });
      
      // 3. Libérer la carte SIM
      await db.transaction(async (tx) => {
        // Libérer la carte SIM
        if (simCard) {
          await tx.update(simCards)
            .set({
              clientId: null,
              statut: "disponible",
              dateAttribution: null,
              dateActivation: null
            })
            .where(eq(simCards.id, simCard.id));
        }
        
        // Nettoyer le client
        await tx.update(clients)
          .set({
            carteSim: null
          })
          .where(eq(clients.id, clientId));
        
        // Créer une activité
        await tx.insert(activities).values({
          title: `Carte SIM ${client.carteSim} libérée du client ${client.prenom} ${client.nom}`,
          type: "CarteSIM",
          userId: userId,
          clientId: clientId
        });
      });
      
      console.log(`✅ Carte SIM ${client.carteSim} libérée du client ${clientId}`);
      return {success: true, message: "Carte SIM libérée avec succès"};
      
    } catch (error) {
      console.error("❌ Erreur libération carte SIM:", error);
      return {success: false, message: "Erreur lors de la libération"};
    }
  }
  
  /**
   * Changer la carte SIM d'un client (depuis l'interface client)
   */
  static async changeClientSimCard(clientId: number, newSimCardNumber: string, userId: number): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🔄 Changement carte SIM client ${clientId} → ${newSimCardNumber}`);
      
      // 1. Vérifier le client
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, clientId), isNull(clients.deletedAt))
      });
      
      if (!client) {
        return {success: false, message: "Client non trouvé"};
      }
      
      // 2. Vérifier la nouvelle carte SIM
      const newSimCard = await db.query.simCards.findFirst({
        where: eq(simCards.numero, newSimCardNumber)
      });
      
      if (!newSimCard) {
        return {success: false, message: "Nouvelle carte SIM non trouvée"};
      }
      
      if (newSimCard.statut !== "disponible") {
        return {success: false, message: "La nouvelle carte SIM n'est pas disponible"};
      }
      
      // 3. Libérer l'ancienne carte SIM
      if (client.carteSim) {
        await this.unassignClientSimCard(clientId, userId);
      }
      
      // 4. Attribuer la nouvelle carte SIM
      return await this.assignSimToClient(newSimCard.id, clientId, userId);
      
    } catch (error) {
      console.error("❌ Erreur changement carte SIM client:", error);
      return {success: false, message: "Erreur lors du changement"};
    }
  }
  
  /**
   * Obtenir les cartes SIM disponibles pour un code vendeur
   */
  static async getAvailableSimCards(vendorCode?: string): Promise<any[]> {
    try {
      const whereCondition = vendorCode 
        ? and(eq(simCards.statut, "disponible"), eq(simCards.codeVendeur, vendorCode))
        : eq(simCards.statut, "disponible");
      
      const availableCards = await db.query.simCards.findMany({
        where: whereCondition,
        orderBy: (simCards, { asc }) => [asc(simCards.numero)]
      });
      
      return availableCards;
    } catch (error) {
      console.error("❌ Erreur récupération cartes disponibles:", error);
      return [];
    }
  }
}