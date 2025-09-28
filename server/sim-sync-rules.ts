import { db } from "@db";
import { clients, simCards, activities } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * RÈGLES STRICTES DE SYNCHRONISATION CLIENT-CARTE SIM EN TEMPS RÉEL
 * 
 * Ces règles garantissent que toute modification de client ou carte SIM
 * se reflète instantanément dans l'interface utilisateur.
 */

export class SimSyncRules {
  
  /**
   * RÈGLE 1: Attribution automatique de carte SIM lors de la création d'un client
   */
  static async autoAssignSimCard(clientId: number, vendorCode: string, userId: number) {
    try {
      console.log(`🔄 Attribution automatique carte SIM pour client ${clientId}, vendeur ${vendorCode}`);
      
      // Rechercher une carte SIM disponible pour ce vendeur
      const availableCard = await db.query.simCards.findFirst({
        where: and(
          eq(simCards.statut, "disponible"),
          eq(simCards.codeVendeur, vendorCode)
        ),
        orderBy: sql`createdAt ASC` // Prendre la plus ancienne disponible
      });
      
      if (availableCard) {
        // Attribuer la carte au client
        await db.update(simCards)
          .set({
            clientId: clientId,
            statut: "affecte",
            dateAttribution: new Date()
          })
          .where(eq(simCards.id, availableCard.id));
        
        // Mettre à jour le client avec la carte SIM
        await db.update(clients)
          .set({ carteSim: availableCard.id.toString() })
          .where(eq(clients.id, clientId));
        
        // Créer une activité de traçabilité
        await db.insert(activities).values({
          title: `Attribution automatique carte SIM ${availableCard.numero}`,
          type: "CarteSIM",
          userId: userId,
          clientId: clientId,
          createdAt: new Date()
        });
        
        console.log(`✅ Carte SIM ${availableCard.numero} attribuée automatiquement au client ${clientId}`);
        return availableCard;
      } else {
        console.log(`⚠️ Aucune carte SIM disponible pour le vendeur ${vendorCode}`);
        return null;
      }
    } catch (error) {
      console.error("❌ Erreur attribution automatique carte SIM:", error);
      return null;
    }
  }
  
  /**
   * RÈGLE 2: Synchronisation bidirectionnelle client-carte SIM
   */
  static async syncClientSimCard(clientId: number, newSimCardId?: string, userId?: number) {
    try {
      console.log(`🔄 Synchronisation client ${clientId} avec carte SIM ${newSimCardId}`);
      
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId)
      });
      
      if (!client) {
        console.error(`❌ Client ${clientId} non trouvé`);
        return;
      }
      
      // Si le client avait une ancienne carte SIM, la libérer
      if (client.carteSim && client.carteSim !== newSimCardId) {
        const oldSimCardId = parseInt(client.carteSim);
        if (!isNaN(oldSimCardId)) {
          await db.update(simCards)
            .set({
              clientId: null,
              statut: "disponible",
              dateAttribution: null
            })
            .where(eq(simCards.id, oldSimCardId));
          
          console.log(`🔄 Ancienne carte SIM ${oldSimCardId} libérée`);
        }
      }
      
      // Si une nouvelle carte SIM est attribuée
      if (newSimCardId) {
        const newSimCardIdNum = parseInt(newSimCardId);
        if (!isNaN(newSimCardIdNum)) {
          await db.update(simCards)
            .set({
              clientId: clientId,
              statut: "affecte",
              dateAttribution: new Date(),
              codeVendeur: client.codeVendeur
            })
            .where(eq(simCards.id, newSimCardIdNum));
          
          // Créer une activité si userId fourni
          if (userId) {
            await db.insert(activities).values({
              title: `Carte SIM mise à jour pour ${client.prenom} ${client.nom}`,
              type: "CarteSIM",
              userId: userId,
              clientId: clientId,
              createdAt: new Date()
            });
          }
          
          console.log(`✅ Nouvelle carte SIM ${newSimCardId} attribuée au client ${clientId}`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur synchronisation client-carte SIM:", error);
    }
  }
  
  /**
   * RÈGLE 3: Mise à jour en temps réel du statut des cartes SIM
   */
  static async updateSimCardStatus(simCardId: number, newStatus: string, clientId?: number) {
    try {
      console.log(`🔄 Mise à jour statut carte SIM ${simCardId} vers ${newStatus}`);
      
      const updateData: any = { statut: newStatus };
      
      // Logique de gestion des dates selon le statut
      if (newStatus === "Activé") {
        updateData.dateActivation = new Date();
        if (!updateData.dateAttribution) {
          updateData.dateAttribution = new Date();
        }
      } else if (newStatus === "disponible") {
        updateData.clientId = null;
        updateData.dateAttribution = null;
        updateData.dateActivation = null;
      }
      
      await db.update(simCards)
        .set(updateData)
        .where(eq(simCards.id, simCardId));
      
      // Si la carte est libérée, mettre à jour le client
      if (newStatus === "disponible" && clientId) {
        await db.update(clients)
          .set({ carteSim: null })
          .where(eq(clients.id, clientId));
      }
      
      console.log(`✅ Statut carte SIM ${simCardId} mis à jour vers ${newStatus}`);
    } catch (error) {
      console.error("❌ Erreur mise à jour statut carte SIM:", error);
    }
  }
  
  /**
   * RÈGLE 4: Validation de cohérence en temps réel
   */
  static async validateSimCardConsistency() {
    try {
      console.log("🔍 Validation cohérence cartes SIM...");
      
      // Corriger les cartes SIM orphelines (clientId mais client n'existe plus)
      await db.execute(sql`
        UPDATE sim_cards 
        SET client_id = NULL, statut = 'disponible', date_attribution = NULL 
        WHERE client_id IS NOT NULL 
        AND client_id NOT IN (SELECT id FROM clients WHERE deletedAt IS NULL)
      `);
      
      // Corriger les clients avec carte SIM inexistante
      await db.execute(sql`
        UPDATE clients 
        SET carte_sim = NULL 
        WHERE carte_sim IS NOT NULL 
        AND carte_sim NOT IN (SELECT numero FROM sim_cards)
      `);
      
      // Synchroniser les codes vendeurs
      await db.execute(sql`
        UPDATE sim_cards 
        SET codeVendeur = (
          SELECT c.codeVendeur 
          FROM clients c 
          WHERE c.id = sim_cards.client_id 
          AND c.deletedAt IS NULL
        )
        WHERE client_id IS NOT NULL
      `);
      
      console.log("✅ Cohérence cartes SIM validée");
    } catch (error) {
      console.error("❌ Erreur validation cohérence:", error);
    }
  }
  
  /**
   * RÈGLE 5: Obtenir les informations complètes en temps réel
   */
  static async getSimCardWithClientInfo(simCardId: number) {
    try {
      const simCard = await db.query.simCards.findFirst({
        where: eq(simCards.id, simCardId),
        with: {
          client: {
            where: isNull(clients.deletedAt)
          }
        }
      });
      
      if (simCard?.client) {
        return {
          ...simCard,
          clientNom: `${simCard.client.prenom || ''} ${simCard.client.nom || ''}`.trim(),
          clientEmail: simCard.client.email,
          clientPhone: simCard.client.phone
        };
      }
      
      return simCard;
    } catch (error) {
      console.error("❌ Erreur récupération carte SIM avec infos client:", error);
      return null;
    }
  }
}

/**
 * Démarrer la validation automatique périodique
 */
export function startSimSyncValidation() {
  // Validation initiale (désactivée temporairement pour accélérer le démarrage)
  // SimSyncRules.validateSimCardConsistency();
  
  // Validation toutes les 30 minutes
  setInterval(() => {
    SimSyncRules.validateSimCardConsistency();
  }, 30 * 60 * 1000);
  
  console.log("🔄 Validation automatique cartes SIM démarrée (toutes les 30 minutes)");
}