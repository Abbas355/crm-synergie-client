/**
 * MOTEUR DE SYNCHRONISATION CARTES SIM - VERSION DEFINITIVE
 * Système de synchronisation bidirectionnelle automatique client ↔ carte SIM
 */

import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export class SimSyncEngine {
  /**
   * Synchronisation automatique après modification d'un client
   */
  static async syncAfterClientUpdate(clientId: number, updatedData: any): Promise<void> {
    try {
      console.log(`🔄 Synchronisation carte SIM pour client ${clientId}`);
      
      // Récupérer les données complètes du client
      const client = await db.select()
        .from(clients)
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .limit(1);
      
      if (client.length === 0) {
        console.log(`⚠️ Client ${clientId} introuvable`);
        return;
      }
      
      const clientData = client[0];
      
      // Si le client a une carte SIM assignée, synchroniser
      if (clientData.carte_sim && clientData.carte_sim.trim() !== '') {
        await this.syncClientToSimCard(clientData);
      }
      
      // Si l'utilisateur a modifié la carte SIM dans le formulaire
      if (updatedData.carteSIM && updatedData.carteSIM !== '') {
        await this.assignSimCardToClient(clientId, updatedData.carteSIM);
      }
      
    } catch (error) {
      console.error(`❌ Erreur synchronisation client ${clientId}:`, error);
    }
  }
  
  /**
   * Synchroniser les données du client vers la carte SIM
   */
  private static async syncClientToSimCard(clientData: any): Promise<void> {
    try {
      // Trouver la carte SIM correspondante
      const simCard = await db.select()
        .from(simCards)
        .where(eq(simCards.numero, clientData.carte_sim))
        .limit(1);
      
      if (simCard.length > 0) {
        const updateData: any = {
          clientId: clientData.id,
          statut: this.getSimStatusFromClientStatus(clientData.status),
          codeVendeur: clientData.codeVendeur || 'FR98445061'
        };
        
        // Mettre à jour les dates selon le statut du client
        if (clientData.dateSignature) {
          updateData.dateAttribution = new Date(clientData.dateSignature);
        }
        
        if (clientData.dateInstallation) {
          updateData.dateInstallation = new Date(clientData.dateInstallation);
          updateData.dateActivation = new Date(clientData.dateInstallation);
        }
        
        await db.update(simCards)
          .set(updateData)
          .where(eq(simCards.id, simCard[0].id));
        
        console.log(`✅ Carte SIM ${clientData.carte_sim} synchronisée avec client ${clientData.prenom} ${clientData.nom}`);
      } else {
        console.log(`⚠️ Carte SIM ${clientData.carte_sim} introuvable pour client ${clientData.prenom} ${clientData.nom}`);
      }
    } catch (error) {
      console.error(`❌ Erreur synchronisation carte SIM ${clientData.carte_sim}:`, error);
    }
  }
  
  /**
   * Assigner une carte SIM à un client (nouvelle assignation)
   */
  private static async assignSimCardToClient(clientId: number, simCardId: string): Promise<void> {
    try {
      const simCardIdNum = parseInt(simCardId);
      if (isNaN(simCardIdNum)) {
        console.log(`⚠️ ID carte SIM invalide: ${simCardId}`);
        return;
      }
      
      // Récupérer les données du client
      const client = await db.select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      
      if (client.length === 0) {
        console.log(`⚠️ Client ${clientId} introuvable pour assignation`);
        return;
      }
      
      const clientData = client[0];
      
      // Récupérer la carte SIM
      const simCard = await db.select()
        .from(simCards)
        .where(eq(simCards.id, simCardIdNum))
        .limit(1);
      
      if (simCard.length === 0) {
        console.log(`⚠️ Carte SIM ${simCardIdNum} introuvable`);
        return;
      }
      
      // Libérer l'ancienne carte SIM du client si elle existe
      if (clientData.carte_sim && clientData.carte_sim !== simCard[0].numero) {
        await this.releaseSimCardFromClient(clientData.carte_sim);
      }
      
      // Assigner la nouvelle carte SIM
      const updateData: any = {
        clientId: clientId,
        statut: this.getSimStatusFromClientStatus((clientData.status || 'enregistre') as string),
        codeVendeur: clientData.codeVendeur || 'FR98445061',
        dateAttribution: new Date()
      };
      
      // Dates selon statut client
      if (clientData.dateInstallation) {
        updateData.dateInstallation = new Date(clientData.dateInstallation);
        updateData.dateActivation = new Date(clientData.dateInstallation);
      }
      
      await db.update(simCards)
        .set(updateData)
        .where(eq(simCards.id, simCardIdNum));
      
      // Mettre à jour le client avec le numéro de la carte SIM
      await db.update(clients)
        .set({ carte_sim: simCard[0].numero })
        .where(eq(clients.id, clientId));
      
      console.log(`✅ Carte SIM ${simCard[0].numero} assignée au client ${clientData.prenom} ${clientData.nom}`);
      
    } catch (error) {
      console.error(`❌ Erreur assignation carte SIM ${simCardId} au client ${clientId}:`, error);
    }
  }
  
  /**
   * Libérer une carte SIM d'un client
   */
  private static async releaseSimCardFromClient(simCardNumber: string): Promise<void> {
    try {
      if (!simCardNumber) return;
      
      await db.update(simCards)
        .set({
          clientId: null,
          statut: 'disponible',
          dateAttribution: null,
          dateActivation: null,
          dateInstallation: null
        })
        .where(eq(simCards.numero, simCardNumber));
      
      console.log(`🧹 Carte SIM ${simCardNumber} libérée`);
    } catch (error) {
      console.error(`❌ Erreur libération carte SIM ${simCardNumber}:`, error);
    }
  }
  
  /**
   * Conversion statut client vers statut carte SIM
   */
  private static getSimStatusFromClientStatus(clientStatus: string): string {
    switch (clientStatus?.toLowerCase()) {
      case 'installation':
      case 'installé':
        return 'Activé';
      case 'rendez-vous':
      case 'rendez_vous':
      case 'post-production':
        return 'Activé';
      case 'valide':
      case 'validé':
      case 'validation + 7 jours':
        return 'Activé';
      case 'resilie':
      case 'résiliation':
      case 'resiliation':
        return 'disponible';
      case 'abandonne':
      case 'abandonné':
        return 'disponible';
      default:
        return 'Activé'; // Par défaut pour clients avec produits 5G
    }
  }
  
  /**
   * SUPPRIMÉ - Attribution automatique définitivement retirée
   * Les cartes SIM sont attribuées manuellement uniquement selon demande utilisateur
   */
  static async autoAssignSimToNewClient(clientId: number, vendorCode: string = 'FR98445061'): Promise<void> {
    console.log(`ℹ️ Attribution automatique désactivée pour client ${clientId} - Utilisez l'attribution manuelle`);
    return;
  }
}