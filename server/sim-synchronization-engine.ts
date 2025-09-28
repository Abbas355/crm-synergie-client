import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { eq, sql, isNull, and } from "drizzle-orm";

/**
 * Moteur de synchronisation automatique des cartes SIM
 * Résout définitivement les problèmes de synchronisation entre clients et cartes SIM
 */
export class SimSynchronizationEngine {
  
  /**
   * Synchronisation complète bidirectionnelle
   */
  static async performFullSync(): Promise<void> {
    try {
      console.log("🔄 Démarrage synchronisation complète cartes SIM...");
      
      // 1. Nettoyer les cartes SIM orphelines (clients supprimés)
      await this.cleanOrphanedSimCards();
      
      // 2. Synchroniser les attributions depuis les clients
      await this.syncFromClientsToSimCards();
      
      // 3. Synchroniser les attributions depuis les cartes SIM
      await this.syncFromSimCardsToClients();
      
      // 4. Corriger les incohérences de codes vendeurs
      await this.syncVendorCodes();
      
      // 5. Valider la cohérence finale
      await this.validateFinalConsistency();
      
      console.log("✅ Synchronisation complète terminée avec succès");
    } catch (error) {
      console.error("❌ Erreur synchronisation complète:", error);
      throw error;
    }
  }
  
  /**
   * 1. Nettoyer les cartes SIM orphelines
   */
  private static async cleanOrphanedSimCards(): Promise<void> {
    try {
      const result = await db.execute(sql`
        UPDATE sim_cards 
        SET client_id = NULL, 
            statut = 'disponible', 
            date_attribution = NULL,
            date_activation = NULL,
            dateInstallation = NULL
        WHERE client_id IS NOT NULL 
        AND client_id NOT IN (
          SELECT id FROM clients WHERE deletedAt IS NULL
        )
      `);
      
      console.log(`🧹 Cartes SIM orphelines nettoyées: ${result.rowCount || 0}`);
    } catch (error) {
      console.error("❌ Erreur nettoyage cartes orphelines:", error);
      throw error;
    }
  }
  
  /**
   * 2. Synchroniser depuis les clients vers les cartes SIM
   */
  private static async syncFromClientsToSimCards(): Promise<void> {
    try {
      // Récupérer tous les clients actifs avec cartes SIM
      const clientsWithSim = await db.select({
        id: clients.id,
        carteSim: clients.carteSim,
        codeVendeur: clients.codeVendeur,
        prenom: clients.prenom,
        nom: clients.nom
      })
      .from(clients)
      .where(and(
        isNull(clients.deletedAt),
        sql`carte_sim IS NOT NULL AND carte_sim != ''`
      ));
      
      console.log(`🔍 Clients avec cartes SIM trouvés: ${clientsWithSim.length}`);
      
      for (const client of clientsWithSim) {
        if (!client.carteSim) continue;
        
        try {
          // Trouver la carte SIM correspondante
          const simCard = await db.select()
            .from(simCards)
            .where(eq(simCards.numero, client.carteSim))
            .limit(1);
          
          if (simCard.length > 0) {
            const card = simCard[0];
            
            // Mettre à jour l'attribution
            await db.update(simCards)
              .set({
                clientId: client.id,
                statut: "Activé",
                codeVendeur: client.codeVendeur || card.codeVendeur,
                dateAttribution: card.dateAttribution || new Date(),
                dateActivation: new Date()
              })
              .where(eq(simCards.id, card.id));
              
            console.log(`✅ Carte SIM ${client.carteSim} synchronisée avec ${client.prenom} ${client.nom}`);
          } else {
            console.log(`⚠️ Carte SIM ${client.carteSim} introuvable pour ${client.prenom} ${client.nom}`);
          }
        } catch (error) {
          console.error(`❌ Erreur sync client ${client.id}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Erreur synchronisation clients vers SIM:", error);
      throw error;
    }
  }
  
  /**
   * 3. Synchroniser depuis les cartes SIM vers les clients
   */
  private static async syncFromSimCardsToClients(): Promise<void> {
    try {
      // Récupérer toutes les cartes SIM attribuées
      const assignedCards = await db.select()
        .from(simCards)
        .where(and(
          sql`${simCards.clientId} IS NOT NULL`,
          eq(simCards.statut, "affecte")
        ));
      
      console.log(`🔍 Cartes SIM attribuées trouvées: ${assignedCards.length}`);
      
      for (const card of assignedCards) {
        if (!card.clientId) continue;
        
        try {
          // Vérifier si le client existe et est actif
          const client = await db.select()
            .from(clients)
            .where(and(
              eq(clients.id, card.clientId),
              isNull(clients.deletedAt)
            ))
            .limit(1);
          
          if (client.length > 0) {
            const clientData = client[0];
            
            // Mettre à jour le client avec la carte SIM
            await db.update(clients)
              .set({
                carteSim: card.numero,
                codeVendeur: clientData.codeVendeur || card.codeVendeur
              })
              .where(eq(clients.id, card.clientId));
              
            console.log(`✅ Client ${clientData.prenom} ${clientData.nom} synchronisé avec carte ${card.numero}`);
          } else {
            // Client supprimé ou inexistant, libérer la carte
            await db.update(simCards)
              .set({
                clientId: null,
                statut: "disponible",
                dateAttribution: null,
                dateActivation: null,
                dateInstallation: null
              })
              .where(eq(simCards.id, card.id));
              
            console.log(`🧹 Carte SIM ${card.numero} libérée (client inexistant)`);
          }
        } catch (error) {
          console.error(`❌ Erreur sync carte ${card.id}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Erreur synchronisation SIM vers clients:", error);
      throw error;
    }
  }
  
  /**
   * 4. Synchroniser les codes vendeurs
   */
  private static async syncVendorCodes(): Promise<void> {
    try {
      const result = await db.execute(sql`
        UPDATE sim_cards 
        SET codeVendeur = (
          SELECT c.codeVendeur 
          FROM clients c 
          WHERE c.id = sim_cards.client_id 
          AND c.deletedAt IS NULL
          AND c.codeVendeur IS NOT NULL
        )
        WHERE client_id IS NOT NULL
        AND (codeVendeur IS NULL OR codeVendeur = '')
      `);
      
      console.log(`🔄 Codes vendeurs synchronisés: ${result.rowCount || 0}`);
    } catch (error) {
      console.error("❌ Erreur synchronisation codes vendeurs:", error);
      throw error;
    }
  }
  
  /**
   * 5. Validation finale de cohérence
   */
  private static async validateFinalConsistency(): Promise<void> {
    try {
      // Compter les incohérences restantes
      const inconsistencies = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM sim_cards WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM clients WHERE deletedAt IS NULL)) as orphaned_sim_cards,
          (SELECT COUNT(*) FROM clients WHERE carte_sim IS NOT NULL AND carte_sim != '' AND carte_sim NOT IN (SELECT numero FROM sim_cards)) as clients_with_invalid_sim,
          (SELECT COUNT(*) FROM sim_cards sc JOIN clients c ON sc.client_id = c.id WHERE sc.codeVendeur != c.codeVendeur AND c.deletedAt IS NULL) as mismatched_vendor_codes
      `);
      
      console.log("🔍 Validation cohérence finale:", inconsistencies.rows[0]);
      
      // Rapporter les clients problématiques pour le debugging
      const problematicClients = await db.execute(sql`
        SELECT c.id, c.prenom, c.nom, c.carte_sim, c.codeVendeur
        FROM clients c
        WHERE c.deletedAt IS NULL 
        AND c.carte_sim IS NOT NULL 
        AND c.carte_sim != ''
        AND c.carte_sim NOT IN (SELECT numero FROM sim_cards)
        LIMIT 5
      `);
      
      if (problematicClients.rows.length > 0) {
        console.log("⚠️ Clients avec cartes SIM invalides:", problematicClients.rows);
      }
      
    } catch (error) {
      console.error("❌ Erreur validation finale:", error);
      throw error;
    }
  }
  
  /**
   * Synchronisation rapide pour un client spécifique
   */
  static async syncSpecificClient(clientId: number): Promise<void> {
    try {
      const client = await db.select()
        .from(clients)
        .where(and(
          eq(clients.id, clientId),
          isNull(clients.deletedAt)
        ))
        .limit(1);
      
      if (client.length === 0) {
        console.log(`⚠️ Client ${clientId} non trouvé ou supprimé`);
        return;
      }
      
      const clientData = client[0];
      
      if (clientData.carteSim) {
        // Synchroniser la carte SIM correspondante
        const simCard = await db.select()
          .from(simCards)
          .where(eq(simCards.numero, clientData.carteSim))
          .limit(1);
        
        if (simCard.length > 0) {
          await db.update(simCards)
            .set({
              clientId: clientData.id,
              statut: "affecte",
              codeVendeur: clientData.codeVendeur || simCard[0].codeVendeur,
              dateAttribution: clientData.dateSignature || simCard[0].dateAttribution || new Date(),
              dateInstallation: clientData.dateInstallation || simCard[0].dateInstallation
            })
            .where(eq(simCards.id, simCard[0].id));
          
          console.log(`✅ Client ${clientData.prenom} ${clientData.nom} synchronisé avec carte ${clientData.carteSim}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur synchronisation client ${clientId}:`, error);
      throw error;
    }
  }
}

/**
 * Démarrer la synchronisation automatique périodique
 */
export function startSimSynchronization() {
  // Synchronisation initiale (désactivée temporairement pour accélérer le démarrage)
  // SimSynchronizationEngine.performFullSync();
  
  // Synchronisation toutes les 15 minutes
  setInterval(() => {
    SimSynchronizationEngine.performFullSync();
  }, 15 * 60 * 1000);
  
  console.log("🔄 Synchronisation automatique cartes SIM démarrée (toutes les 15 minutes)");
}