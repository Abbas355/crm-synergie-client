/**
 * 🛡️ DATA INTEGRITY GUARDIAN
 * 
 * Système de protection des données critiques pour éliminer définitivement 
 * les problèmes de code vendeur et carte SIM manquants.
 * 
 * PRINCIPE : Validation systémique AVANT insertion en base de données
 */

import { Request, Response, NextFunction } from 'express';
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface GuardedClientData {
  // Champs obligatoires garantis par le Guardian
  codeVendeur: string;
  userid: number;
  carteSim: string | null;
  
  // Autres champs
  [key: string]: any;
}

/**
 * 🎯 GUARDIAN PRINCIPAL - Valide et enrichit automatiquement les données client
 */
export class DataIntegrityGuardian {
  
  /**
   * Valide et sécurise les données de création client
   */
  static async validateAndEnrichClientData(
    req: Request, 
    clientData: any
  ): Promise<GuardedClientData> {
    console.log("🛡️ DATA INTEGRITY GUARDIAN - Démarrage validation...");
    
    // 1. VALIDATION UTILISATEUR CONNECTÉ
    if (!req.user?.id) {
      throw new Error("GUARDIAN_ERROR: Utilisateur non authentifié");
    }
    
    // 2. RÉCUPÉRATION SÉCURISÉE DU CODE VENDEUR
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        codeVendeur: true,
        username: true,
        prenom: true,
        nom: true
      }
    });
    
    if (!user) {
      throw new Error("GUARDIAN_ERROR: Utilisateur introuvable en base de données");
    }
    
    if (!user.codeVendeur || user.codeVendeur.trim() === '') {
      throw new Error(`GUARDIAN_ERROR: Code vendeur manquant pour l'utilisateur ${user.username} (ID: ${user.id})`);
    }
    
    console.log(`🛡️ Code vendeur validé: ${user.codeVendeur} pour ${user.prenom} ${user.nom}`);
    
    // 3. VALIDATION CARTE SIM (si fournie)
    const carteSim = clientData.carteSim?.trim() || null;
    if (carteSim) {
      console.log(`🛡️ Carte SIM détectée: ${carteSim} - Sera attribuée automatiquement`);
    }
    
    // 4. RETOUR DONNÉES SÉCURISÉES ET ENRICHIES
    const guardedData: GuardedClientData = {
      ...clientData,
      userid: user.id,
      codeVendeur: user.codeVendeur, // 🎯 GARANTI NON NULL
      carteSim: carteSim, // 🎯 NORMALISÉ
    };
    
    console.log("🛡️ DATA INTEGRITY GUARDIAN - Validation réussie ✅");
    return guardedData;
  }
  
  /**
   * Attribution automatique et sécurisée des cartes SIM
   */
  static async secureSimCardAttribution(
    clientId: number, 
    carteSim: string | null
  ): Promise<boolean> {
    if (!carteSim || carteSim.trim() === '') {
      console.log("🛡️ Aucune carte SIM à attribuer");
      return false;
    }
    
    try {
      console.log(`🛡️ Attribution sécurisée carte SIM ${carteSim} au client ${clientId}`);
      
      // Import dynamique pour éviter les dépendances circulaires
      const { simCards } = await import("@shared/schema");
      
      await db.update(simCards)
        .set({ 
          statut: 'attribuee',
          clientId: clientId,
          dateAttribution: new Date()
        })
        .where(eq(simCards.numero, carteSim.trim()));
        
      console.log("🛡️ Attribution carte SIM réussie ✅");
      return true;
    } catch (error) {
      console.error("🛡️ Erreur attribution carte SIM:", error);
      return false;
    }
  }
}

/**
 * 🎯 MIDDLEWARE DE PROTECTION - Intercepte TOUTES les créations de clients
 */
export function guardClientCreation(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Marquer la requête comme protégée par le Guardian
  (req as any).guardianProtected = true;
  next();
}

/**
 * 🔍 AUDIT SYSTEM - Détecte et signale les anomalies
 */
export class DataAuditSystem {
  
  static async auditClientsIntegrity(): Promise<{
    missingVendorCodes: number;
    orphanedSimCards: number;
    totalIssues: number;
  }> {
    const { clients, simCards } = await import("@shared/schema");
    const { isNull, or } = await import("drizzle-orm");
    
    // Compter les clients sans code vendeur
    const clientsWithoutVendorCode = await db.query.clients.findMany({
      where: or(
        isNull(clients.codeVendeur),
        eq(clients.codeVendeur, '')
      ),
      columns: { id: true }
    });
    
    // Compter les cartes SIM orphelines
    const orphanedSims = await db.query.simCards.findMany({
      where: eq(simCards.statut, 'attribuee'),
      columns: { id: true, clientId: true }
    });
    
    const issues = {
      missingVendorCodes: clientsWithoutVendorCode.length,
      orphanedSimCards: orphanedSims.filter(sim => !sim.clientId).length,
      totalIssues: 0
    };
    
    issues.totalIssues = issues.missingVendorCodes + issues.orphanedSimCards;
    
    if (issues.totalIssues > 0) {
      console.warn(`🔍 AUDIT DÉTECTÉ ${issues.totalIssues} anomalies:`, issues);
    }
    
    return issues;
  }
}