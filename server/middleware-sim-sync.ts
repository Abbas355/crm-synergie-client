/**
 * MIDDLEWARE DE SYNCHRONISATION DES CARTES SIM
 * Automatise l'assignation des cartes SIM aux clients 5G
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface SimSyncResult {
  success: boolean;
  message: string;
  simAssigned?: {
    numero: string;
    clientId: number;
    clientNom: string;
  };
}

/**
 * Assigne automatiquement une carte SIM disponible à un client 5G
 */
export async function assignSimToClient(clientId: number, codeVendeur: string): Promise<SimSyncResult> {
  try {
    // Vérifier si le client existe et a un produit 5G
    const clientQuery = sql`
      SELECT id, prenom, nom, produit
      FROM clients 
      WHERE id = ${clientId} 
      AND deletedAt IS NULL
      AND (produit ILIKE '%5g%' OR produit ILIKE '%forfait%')
    `;
    
    const clientResult = await db.execute(clientQuery);
    
    if (clientResult.rows.length === 0) {
      return {
        success: false,
        message: "Client non trouvé ou produit non compatible 5G"
      };
    }
    
    const client = clientResult.rows[0];
    
    // Chercher une carte SIM disponible pour ce vendeur
    const simQuery = sql`
      SELECT id, numero, status
      FROM sim_cards 
      WHERE codeVendeur = ${codeVendeur}
      AND status = 'disponible'
      AND deletedAt IS NULL
      ORDER BY createdAt ASC
      LIMIT 1
    `;
    
    const simResult = await db.execute(simQuery);
    
    if (simResult.rows.length === 0) {
      return {
        success: false,
        message: "Aucune carte SIM disponible pour ce vendeur"
      };
    }
    
    const simCard = simResult.rows[0];
    
    // Mettre à jour la carte SIM avec les informations du client
    const updateSimQuery = sql`
      UPDATE sim_cards 
      SET 
        status = 'assignee',
        client_id = ${clientId},
        client_nom = ${client.nom},
        client_prenom = ${client.prenom},
        assigned_at = NOW()
      WHERE id = ${simCard.id}
      RETURNING *
    `;
    
    const updateResult = await db.execute(updateSimQuery);
    
    if (updateResult.rows.length === 0) {
      return {
        success: false,
        message: "Erreur lors de l'assignation de la carte SIM"
      };
    }
    
    return {
      success: true,
      message: "Carte SIM assignée avec succès",
      simAssigned: {
        numero: simCard.numero,
        clientId: clientId,
        clientNom: `${client.prenom} ${client.nom}`
      }
    };
    
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la carte SIM:', error);
    return {
      success: false,
      message: "Erreur technique lors de l'assignation"
    };
  }
}

/**
 * Libère une carte SIM d'un client (par exemple en cas de résiliation)
 */
export async function releaseSimFromClient(clientId: number): Promise<SimSyncResult> {
  try {
    // Mettre à jour la carte SIM pour la libérer
    const updateSimQuery = sql`
      UPDATE sim_cards 
      SET 
        status = 'disponible',
        client_id = NULL,
        client_nom = NULL,
        client_prenom = NULL,
        assigned_at = NULL
      WHERE client_id = ${clientId}
      RETURNING numero
    `;
    
    const updateResult = await db.execute(updateSimQuery);
    
    if (updateResult.rows.length === 0) {
      return {
        success: false,
        message: "Aucune carte SIM trouvée pour ce client"
      };
    }
    
    return {
      success: true,
      message: "Carte SIM libérée avec succès"
    };
    
  } catch (error) {
    console.error('Erreur lors de la libération de la carte SIM:', error);
    return {
      success: false,
      message: "Erreur technique lors de la libération"
    };
  }
}

/**
 * Synchronise les cartes SIM lors de la création d'un nouveau client
 */
export async function syncSimOnClientCreation(clientData: any): Promise<SimSyncResult> {
  const { produit, codeVendeur } = clientData;
  
  // Vérifier si le produit nécessite une carte SIM
  if (!produit || (!produit.toLowerCase().includes('5g') && !produit.toLowerCase().includes('forfait'))) {
    return {
      success: true,
      message: "Produit ne nécessitant pas de carte SIM"
    };
  }
  
  // Assigner automatiquement une carte SIM
  return await assignSimToClient(clientData.id, codeVendeur);
}

/**
 * Synchronise les cartes SIM lors de la modification d'un client
 */
export async function syncSimOnClientUpdate(clientId: number, oldData: any, newData: any): Promise<SimSyncResult> {
  const oldProduit = oldData.produit?.toLowerCase() || '';
  const newProduit = newData.produit?.toLowerCase() || '';
  
  const hadSim = oldProduit.includes('5g') || oldProduit.includes('forfait');
  const needsSim = newProduit.includes('5g') || newProduit.includes('forfait');
  
  if (hadSim && !needsSim) {
    // Libérer la carte SIM
    return await releaseSimFromClient(clientId);
  } else if (!hadSim && needsSim) {
    // Assigner une carte SIM
    return await assignSimToClient(clientId, newData.codeVendeur);
  }
  
  return {
    success: true,
    message: "Aucune synchronisation SIM nécessaire"
  };
}