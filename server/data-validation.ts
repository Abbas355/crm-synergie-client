import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { clients } from "@shared/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { SimSyncRules } from "./sim-sync-rules";

/**
 * RÈGLES DE VALIDATION STRICTES POUR EMPÊCHER LES BUGS DE SYNCHRONISATION
 * 
 * Ces règles s'appliquent automatiquement à toutes les opérations sur les clients
 * pour garantir l'intégrité des données et éliminer les doublons.
 */

/**
 * Valide les données client avant insertion pour empêcher les doublons
 */
export async function validateClientData(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.method === 'POST' && req.path === '/api/clients') {
      const clientData = req.body;
      
      // RÈGLE 1: Vérifier l'unicité de l'identifiant de contrat
      // Un client peut avoir plusieurs contrats, mais chaque identifiant de contrat doit être unique
      if (clientData.identifiantContrat && clientData.identifiantContrat.trim() !== '') {
        const existingContract = await db.query.clients.findFirst({
          where: and(
            eq(clients.identifiantContrat, clientData.identifiantContrat.trim()),
            isNull(clients.deletedAt)
          )
        });
        
        if (existingContract) {
          return res.status(409).json({
            message: "Un contrat avec cet identifiant existe déjà",
            existingClientId: existingContract.id,
            existingContract: clientData.identifiantContrat
          });
        }
      }
      
      // Log des clients multiples pour le même email (pour traçabilité)
      if (clientData.email) {
        const existingClients = await db.query.clients.findMany({
          where: and(
            eq(clients.email, clientData.email.toLowerCase()),
            isNull(clients.deletedAt)
          )
        });
        
        if (existingClients.length > 0) {
          console.log(`📋 Client existant avec email ${clientData.email}. Nouveau contrat autorisé.`);
          console.log(`📊 Nombre de contrats existants pour cet email: ${existingClients.length}`);
        }
      }
      
      // RÈGLE 2: Valider le code vendeur obligatoire
      const validVendorCodes = ['FR98445061', 'FR52796953', 'FR00123456'];
      if (!clientData.codeVendeur) {
        // Assigner automatiquement le code vendeur basé sur l'utilisateur
        if (req.user?.id === 1) {
          clientData.codeVendeur = 'FR52796953';
        } else if (req.user?.id === 16) {
          clientData.codeVendeur = 'FR98445061';
        } else {
          clientData.codeVendeur = 'FR98445061'; // Par défaut
        }
      } else if (!validVendorCodes.includes(clientData.codeVendeur)) {
        return res.status(400).json({
          message: "Code vendeur invalide",
          validCodes: validVendorCodes
        });
      }
      
      // RÈGLE 3: Normaliser les données
      if (clientData.email) {
        clientData.email = clientData.email.toLowerCase().trim();
      }
      if (clientData.prenom) {
        clientData.prenom = clientData.prenom.trim();
      }
      if (clientData.nom) {
        clientData.nom = clientData.nom.trim();
      }
      
      // RÈGLE 4: Générer un nom complet cohérent
      if (clientData.prenom && clientData.nom) {
        clientData.name = `${clientData.prenom} ${clientData.nom}`;
      }
      
      // RÈGLE 5: Préparer la synchronisation carte SIM automatique
      req.body._autoAssignSim = true;
      req.body._vendorCode = clientData.codeVendeur;
    }
    
    next();
  } catch (error) {
    console.error("Erreur validation client:", error);
    res.status(500).json({ message: "Erreur de validation" });
  }
}

/**
 * Force le filtrage des clients supprimés sur toutes les requêtes GET
 */
export function enforceDeletedFilter(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/clients' && req.method === 'GET') {
    console.log("🔒 Application du filtre supprimés obligatoire");
    req.query._forceFilterDeleted = 'true';
  }
  next();
}