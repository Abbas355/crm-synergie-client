/**
 * SERVICE D'ATTRIBUTION CARTES SIM - MANUEL UNIQUEMENT
 * 
 * Ce service gère UNIQUEMENT les attributions manuelles des cartes SIM.
 * L'attribution automatique est définitivement supprimée selon demande utilisateur.
 */

import { db } from "@db";
import { clients, sim_cards } from "@shared/schema";
import { eq, and, or, isNull, asc, sql } from "drizzle-orm";

export interface SimAssignmentResult {
  success: boolean;
  message: string;
  simCardNumber?: string;
  clientId?: number;
}

/**
 * SERVICE CENTRAL D'ATTRIBUTION - MANUEL UNIQUEMENT
 * Attribution manuelle exclusivement selon les préférences utilisateur
 */
export class SimAssignmentService {
  
  /**
   * SUPPRIMÉ - Attribution automatique définitivement retirée
   * Les cartes SIM sont attribuées manuellement uniquement selon demande utilisateur
   */
  static async autoAssignSimCard(
    clientId: number, 
    produit: string, 
    codeVendeur: string
  ): Promise<SimAssignmentResult> {
    
    return {
      success: false,
      message: "Attribution automatique supprimée - Utilisez l'attribution manuelle",
    };
  }

  /**
   * Attribution manuelle d'une carte SIM spécifique
   * @param clientId ID du client
   * @param simCardNumber Numéro de la carte SIM à assigner
   * @returns Résultat de l'attribution
   */
  static async manualAssignSimCard(
    clientId: number, 
    simCardNumber: string
  ): Promise<SimAssignmentResult> {
    
    console.log(`🔄 [SIM SERVICE] Attribution manuelle:`);
    console.log(`   - Client: ${clientId}`);
    console.log(`   - Carte SIM: ${simCardNumber}`);

    try {
      // Vérifier que la carte SIM existe et est disponible
      const simCard = await db.query.sim_cards.findFirst({
        where: eq(sim_cards.numero, simCardNumber)
      });

      if (!simCard) {
        return {
          success: false,
          message: `Carte SIM ${simCardNumber} introuvable`,
        };
      }

      if (simCard.statut !== "disponible" || simCard.clientId !== null) {
        return {
          success: false,
          message: `Carte SIM ${simCardNumber} déjà assignée ou indisponible`,
        };
      }

      // Attribution simultanée
      const now = new Date();

      await db.update(sim_cards)
        .set({
          clientId: clientId,
          statut: "affecte",
          dateAttribution: now
        })
        .where(eq(sim_cards.id, simCard.id));

      await db.update(clients)
        .set({ 
          carteSim: simCardNumber 
        })
        .where(eq(clients.id, clientId));

      console.log(`✅ [SIM SERVICE] Attribution manuelle réussie`);

      return {
        success: true,
        message: `Carte SIM ${simCardNumber} assignée manuellement avec succès`,
        simCardNumber: simCardNumber,
        clientId: clientId
      };

    } catch (error) {
      console.error(`❌ [SIM SERVICE] Erreur attribution manuelle:`, error);
      return {
        success: false,
        message: `Erreur lors de l'attribution manuelle: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      };
    }
  }

  /**
   * Libération d'une carte SIM (suppression du lien client)
   * @param simCardNumber Numéro de la carte SIM à libérer
   * @returns Résultat de la libération
   */
  static async releaseSimCard(simCardNumber: string): Promise<SimAssignmentResult> {
    
    console.log(`🔄 [SIM SERVICE] Libération carte SIM: ${simCardNumber}`);

    try {
      const simCard = await db.query.sim_cards.findFirst({
        where: eq(sim_cards.numero, simCardNumber)
      });

      if (!simCard) {
        return {
          success: false,
          message: `Carte SIM ${simCardNumber} introuvable`,
        };
      }

      // Libération simultanée
      if (simCard.clientId) {
        // Supprimer la référence dans le client
        await db.update(clients)
          .set({ carteSim: null })
          .where(eq(clients.id, simCard.clientId));
      }

      // Libérer la carte SIM
      await db.update(sim_cards)
        .set({
          clientId: null,
          statut: "disponible",
          dateAttribution: null
        })
        .where(eq(sim_cards.id, simCard.id));

      console.log(`✅ [SIM SERVICE] Carte SIM ${simCardNumber} libérée`);

      return {
        success: true,
        message: `Carte SIM ${simCardNumber} libérée avec succès`,
        simCardNumber: simCardNumber
      };

    } catch (error) {
      console.error(`❌ [SIM SERVICE] Erreur libération:`, error);
      return {
        success: false,
        message: `Erreur lors de la libération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      };
    }
  }
}