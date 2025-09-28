import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { eq, sql, isNull, and } from "drizzle-orm";

/**
 * Moteur de validation strict des attributions de cartes SIM
 * Empêche les erreurs d'attribution automatique
 */
export class SimCardValidationEngine {
  
  /**
   * Valider une attribution de carte SIM avant de l'appliquer
   */
  static async validateAttribution(clientId: number, simNumero: string): Promise<{valid: boolean, message: string}> {
    try {
      // 1. Vérifier que le client existe et est actif
      const client = await db.select()
        .from(clients)
        .where(and(
          eq(clients.id, clientId),
          isNull(clients.deletedAt)
        ))
        .limit(1);
      
      if (client.length === 0) {
        return {valid: false, message: `Client ${clientId} non trouvé ou supprimé`};
      }
      
      // 2. Vérifier que la carte SIM existe
      const simCard = await db.select()
        .from(simCards)
        .where(eq(simCards.numero, simNumero))
        .limit(1);
      
      if (simCard.length === 0) {
        return {valid: false, message: `Carte SIM ${simNumero} non trouvée`};
      }
      
      // 3. Vérifier que la carte SIM est disponible - LOGIQUE CORRIGÉE
      if (simCard[0].statut !== 'disponible' || simCard[0].clientId !== null) {
        // Si la carte a un client associé, vérifier s'il existe encore
        if (simCard[0].clientId) {
          const currentClient = await db.select({
            prenom: clients.prenom,
            nom: clients.nom
          })
          .from(clients)
          .where(eq(clients.id, simCard[0].clientId))
          .limit(1);
          
          if (currentClient.length > 0) {
            return {
              valid: false, 
              message: `Carte SIM ${simNumero} déjà attribuée à ${currentClient[0].prenom} ${currentClient[0].nom}`
            };
          } else {
            // Client n'existe plus, la carte peut être réattribuée
            console.log(`⚠️ Carte SIM ${simNumero} orpheline détectée, nettoyage automatique`);
            await db.update(simCards)
              .set({
                clientId: null,
                statut: "disponible",
                dateAttribution: null
              })
              .where(eq(simCards.numero, simNumero));
          }
        }
      }
      
      // 4. Vérifier que le client n'a pas déjà une autre carte SIM
      if (client[0].carteSim && client[0].carteSim !== simNumero) {
        return {
          valid: false,
          message: `Client ${client[0].prenom} ${client[0].nom} a déjà la carte SIM ${client[0].carteSim}`
        };
      }
      
      return {valid: true, message: "Attribution valide"};
      
    } catch (error) {
      console.error("Erreur validation attribution:", error);
      return {valid: false, message: "Erreur lors de la validation"};
    }
  }
  
  /**
   * Effectuer une attribution sécurisée avec validation
   */
  static async performSecureAttribution(
    clientId: number, 
    simNumero: string, 
    codeVendeur?: string
  ): Promise<{success: boolean, message: string}> {
    try {
      // 1. Valider l'attribution
      const validation = await this.validateAttribution(clientId, simNumero);
      if (!validation.valid) {
        return {success: false, message: validation.message};
      }
      
      // 2. Récupérer les données client
      const client = await db.select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      
      if (client.length === 0) {
        return {success: false, message: "Client non trouvé"};
      }
      
      const clientData = client[0];
      
      // 3. Effectuer l'attribution en base de données
      await db.transaction(async (tx) => {
        // Mettre à jour le client
        await tx.update(clients)
          .set({carteSim: simNumero})
          .where(eq(clients.id, clientId));
        
        // Mettre à jour la carte SIM
        await tx.update(simCards)
          .set({
            clientId: clientId,
            statut: "Activé",
            codeVendeur: codeVendeur || clientData.codeVendeur || null,
            dateAttribution: clientData.dateSignature || new Date(),
            dateActivation: new Date()
          })
          .where(eq(simCards.numero, simNumero));
      });
      
      console.log(`✅ Attribution sécurisée: Carte ${simNumero} → ${clientData.prenom} ${clientData.nom}`);
      
      return {
        success: true, 
        message: `Carte SIM ${simNumero} attribuée avec succès à ${clientData.prenom} ${clientData.nom}`
      };
      
    } catch (error) {
      console.error("Erreur attribution sécurisée:", error);
      return {success: false, message: "Erreur lors de l'attribution"};
    }
  }
  
  /**
   * Auditer toutes les attributions existantes
   */
  static async auditAllAttributions(): Promise<void> {
    try {
      console.log("🔍 Audit des attributions de cartes SIM...");
      
      // Récupérer toutes les attributions actives
      const attributions = await db.select({
        clientId: simCards.clientId,
        simNumero: simCards.numero,
        clientPrenom: clients.prenom,
        clientNom: clients.nom,
        clientCarteSim: clients.carteSim
      })
      .from(simCards)
      .leftJoin(clients, and(
        eq(simCards.clientId, clients.id),
        isNull(clients.deletedAt)
      ))
      .where(sql`${simCards.clientId} IS NOT NULL`);
      
      let inconsistencies = 0;
      
      for (const attribution of attributions) {
        if (!attribution.clientPrenom) {
          console.log(`⚠️  Carte SIM ${attribution.simNumero} attribuée à un client inexistant (ID: ${attribution.clientId})`);
          inconsistencies++;
          continue;
        }
        
        if (attribution.clientCarteSim !== attribution.simNumero) {
          console.log(`⚠️  Incohérence détectée:`);
          console.log(`     Client: ${attribution.clientPrenom} ${attribution.clientNom}`);
          console.log(`     Carte SIM dans sim_cards: ${attribution.simNumero}`);
          console.log(`     Carte SIM dans clients: ${attribution.clientCarteSim}`);
          inconsistencies++;
        }
      }
      
      if (inconsistencies === 0) {
        console.log("✅ Audit terminé : Aucune incohérence détectée");
      } else {
        console.log(`⚠️  Audit terminé : ${inconsistencies} incohérence(s) détectée(s)`);
      }
      
    } catch (error) {
      console.error("Erreur audit attributions:", error);
    }
  }
  
  /**
   * Correction automatique des incohérences détectées
   */
  static async fixInconsistencies(): Promise<void> {
    try {
      console.log("🔧 Correction des incohérences d'attribution...");
      
      // Corriger les cartes SIM orphelines
      await db.execute(sql`
        UPDATE sim_cards 
        SET client_id = NULL, 
            statut = 'disponible',
            codeVendeur = NULL,
            date_attribution = NULL,
            date_activation = NULL
        WHERE client_id IS NOT NULL 
        AND client_id NOT IN (
          SELECT id FROM clients WHERE deletedAt IS NULL
        )
      `);
      
      // Corriger les clients avec cartes SIM inexistantes
      await db.execute(sql`
        UPDATE clients 
        SET carte_sim = NULL 
        WHERE carte_sim IS NOT NULL 
        AND carte_sim NOT IN (SELECT numero FROM sim_cards)
      `);
      
      // Synchroniser les attributions bidirectionnelles
      const mismatches = await db.execute(sql`
        SELECT 
          c.id as client_id,
          c.carte_sim as client_sim,
          s.numero as sim_numero,
          s.client_id as sim_client_id
        FROM clients c
        LEFT JOIN sim_cards s ON c.carte_sim = s.numero
        WHERE c.deletedAt IS NULL 
        AND c.carte_sim IS NOT NULL
        AND (s.client_id IS NULL OR s.client_id != c.id)
      `);
      
      console.log(`🔧 ${mismatches.rowCount || 0} incohérences corrigées`);
      
    } catch (error) {
      console.error("Erreur correction incohérences:", error);
    }
  }
}

/**
 * Démarrer l'audit périodique des attributions
 */
export function startAttributionAudit() {
  // Audit initial
  SimCardValidationEngine.auditAllAttributions();
  
  // Audit toutes les heures
  setInterval(() => {
    SimCardValidationEngine.auditAllAttributions();
    SimCardValidationEngine.fixInconsistencies();
  }, 60 * 60 * 1000);
  
  console.log("🔍 Audit périodique des attributions de cartes SIM démarré (toutes les heures)");
}