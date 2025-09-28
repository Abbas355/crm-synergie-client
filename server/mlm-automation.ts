/**
 * SYSTÈME D'AUTOMATISATION MLM - RÈGLES GÉNÉRALES
 * 
 * Ce module centralise toutes les règles d'automatisation MLM :
 * - Rattachement automatique des clients via codeVendeur
 * - Rattachement automatique des vendeurs dans la hiérarchie
 * - Validation automatique de l'intégrité des données MLM
 * - Synchronisation automatique des structures hiérarchiques
 */

import { db } from "../db";
import { users, clients } from "@shared/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";

export interface MLMAutomationResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface MLMValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * RÈGLE GÉNÉRALE 1: VALIDATION AUTOMATIQUE DES CODES VENDEURS
 * Vérifie qu'un code vendeur existe et est actif avant toute opération
 */
export async function validateCodeVendeur(codeVendeur: string): Promise<MLMValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!codeVendeur) {
    errors.push("Code vendeur manquant");
    return { isValid: false, errors, warnings };
  }

  // Format attendu: FR + 8 chiffres
  const formatRegex = /^FR\d{8}$/;
  if (!formatRegex.test(codeVendeur)) {
    errors.push("Format de code vendeur invalide (attendu: FR + 8 chiffres)");
  }

  try {
    // Vérifier l'existence du vendeur
    const vendeur = await db.execute(sql`
      SELECT id, prenom, nom, active, "codeVendeur"
      FROM users 
      WHERE "codeVendeur" = ${codeVendeur}
      LIMIT 1
    `);

    if (vendeur.rows.length === 0) {
      errors.push(`Code vendeur ${codeVendeur} introuvable`);
    } else {
      const vendeurData = vendeur.rows[0] as any;
      if (!vendeurData.active) {
        warnings.push(`Vendeur ${codeVendeur} inactif`);
      }
    }
  } catch (error) {
    errors.push("Erreur lors de la validation du code vendeur");
    console.error("Erreur validation code vendeur:", error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * RÈGLE GÉNÉRALE 2: RATTACHEMENT AUTOMATIQUE DES CLIENTS
 * Assigne automatiquement un client à un vendeur via son codeVendeur
 */
export async function autoAssignClientToVendeur(clientData: any): Promise<MLMAutomationResult> {
  try {
    const { codeVendeur } = clientData;

    if (!codeVendeur) {
      return {
        success: false,
        message: "Code vendeur requis pour le rattachement automatique"
      };
    }

    // Validation du code vendeur
    const validation = await validateCodeVendeur(codeVendeur);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Code vendeur invalide: ${validation.errors.join(", ")}`,
        details: validation
      };
    }

    // Récupérer l'ID du vendeur
    const vendeurResult = await db.execute(sql`
      SELECT id, prenom, nom 
      FROM users 
      WHERE "codeVendeur" = ${codeVendeur} 
      AND active = true
      LIMIT 1
    `);

    if (vendeurResult.rows.length === 0) {
      return {
        success: false,
        message: `Vendeur avec le code ${codeVendeur} introuvable ou inactif`
      };
    }

    const vendeur = vendeurResult.rows[0] as any;

    console.log(`🤖 AUTO-RATTACHEMENT: Client → Vendeur ${vendeur.prenom} ${vendeur.nom} (${codeVendeur})`);

    return {
      success: true,
      message: `Client automatiquement rattaché au vendeur ${vendeur.prenom} ${vendeur.nom}`,
      details: {
        vendeurId: vendeur.id,
        vendeurNom: `${vendeur.prenom} ${vendeur.nom}`,
        codeVendeur
      }
    };

  } catch (error) {
    console.error("Erreur auto-rattachement client:", error);
    return {
      success: false,
      message: "Erreur lors du rattachement automatique du client"
    };
  }
}

/**
 * RÈGLE GÉNÉRALE 3: RATTACHEMENT AUTOMATIQUE DES VENDEURS DANS LA HIÉRARCHIE MLM
 * Établit automatiquement la relation hiérarchique lors du recrutement
 */
export async function autoAssignVendeurToHierarchy(
  nouveauVendeur: any, 
  codeParrainRecrut: string
): Promise<MLMAutomationResult> {
  try {
    if (!codeParrainRecrut) {
      return {
        success: false,
        message: "Code du parrain recruteur requis pour le rattachement hiérarchique"
      };
    }

    // Validation du code parrain
    const validation = await validateCodeVendeur(codeParrainRecrut);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Code parrain invalide: ${validation.errors.join(", ")}`,
        details: validation
      };
    }

    // Vérifier que le parrain existe et est actif
    const parrainResult = await db.execute(sql`
      SELECT id, prenom, nom, "codeVendeur"
      FROM users 
      WHERE "codeVendeur" = ${codeParrainRecrut} 
      AND active = true
      LIMIT 1
    `);

    if (parrainResult.rows.length === 0) {
      return {
        success: false,
        message: `Parrain avec le code ${codeParrainRecrut} introuvable ou inactif`
      };
    }

    const parrain = parrainResult.rows[0] as any;

    // Mise à jour automatique du codeParrainage
    await db.execute(sql`
      UPDATE users 
      SET "codeParrainage" = ${codeParrainRecrut}
      WHERE "codeVendeur" = ${nouveauVendeur.codeVendeur}
    `);

    console.log(`🤖 AUTO-HIÉRARCHIE: ${nouveauVendeur.prenom} ${nouveauVendeur.nom} → Parrain: ${parrain.prenom} ${parrain.nom}`);

    return {
      success: true,
      message: `Vendeur automatiquement rattaché à la hiérarchie de ${parrain.prenom} ${parrain.nom}`,
      details: {
        nouveauVendeur: `${nouveauVendeur.prenom} ${nouveauVendeur.nom}`,
        parrain: `${parrain.prenom} ${parrain.nom}`,
        codeParrain: codeParrainRecrut
      }
    };

  } catch (error) {
    console.error("Erreur auto-rattachement hiérarchie:", error);
    return {
      success: false,
      message: "Erreur lors du rattachement automatique à la hiérarchie"
    };
  }
}

/**
 * RÈGLE GÉNÉRALE 4: SYNCHRONISATION AUTOMATIQUE DE LA HIÉRARCHIE
 * Met à jour automatiquement toute la structure MLM
 */
export async function autoSyncMLMStructure(): Promise<MLMAutomationResult> {
  try {
    console.log("🔄 SYNC AUTO: Synchronisation de la structure MLM...");

    // Vérifier l'intégrité des relations hiérarchiques
    const orphansResult = await db.execute(sql`
      SELECT u1."codeVendeur", u1.prenom, u1.nom, u1."codeParrainage"
      FROM users u1
      LEFT JOIN users u2 ON u1."codeParrainage" = u2."codeVendeur"
      WHERE u1."codeParrainage" IS NOT NULL 
      AND u2."codeVendeur" IS NULL
    `);

    const orphans = orphansResult.rows;
    if (orphans.length > 0) {
      console.warn("⚠️ ORPHELINS MLM détectés:", orphans);
    }

    // Statistiques de la structure
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_vendeurs,
        COUNT(CASE WHEN "codeParrainage" IS NOT NULL THEN 1 END) as vendeurs_rattaches,
        COUNT(CASE WHEN "codeParrainage" IS NULL AND "codeVendeur" IS NOT NULL THEN 1 END) as vendeurs_racines
      FROM users 
      WHERE "codeVendeur" IS NOT NULL
    `);

    const stats = statsResult.rows[0] as any;

    return {
      success: true,
      message: "Structure MLM synchronisée avec succès",
      details: {
        totalVendeurs: Number(stats.total_vendeurs),
        vendeursRattaches: Number(stats.vendeurs_rattaches),
        vendeursRacines: Number(stats.vendeurs_racines),
        orphelins: orphans.length
      }
    };

  } catch (error) {
    console.error("Erreur sync MLM:", error);
    return {
      success: false,
      message: "Erreur lors de la synchronisation MLM"
    };
  }
}

/**
 * RÈGLE GÉNÉRALE 5: GÉNÉRATION AUTOMATIQUE DE CODES VENDEURS
 * Génère automatiquement un code vendeur unique au format FR + 8 chiffres
 */
export async function autoGenerateCodeVendeur(): Promise<string> {
  try {
    // Récupérer le dernier code vendeur pour incrémenter
    const lastCodeResult = await db.execute(sql`
      SELECT "codeVendeur" 
      FROM users 
      WHERE "codeVendeur" LIKE 'FR%' 
      ORDER BY "codeVendeur" DESC 
      LIMIT 1
    `);

    let nextNumber = 98445065; // Numéro de départ après les comptes existants

    if (lastCodeResult.rows.length > 0) {
      const lastCode = (lastCodeResult.rows[0] as any).codeVendeur;
      const lastNumber = parseInt(lastCode.substring(2));
      nextNumber = lastNumber + 1;
    }

    const newCodeVendeur = `FR${nextNumber.toString().padStart(8, '0')}`;

    // Vérifier que le code n'existe pas déjà (sécurité)
    const existsResult = await db.execute(sql`
      SELECT id FROM users WHERE "codeVendeur" = ${newCodeVendeur}
    `);

    if (existsResult.rows.length > 0) {
      // Si le code existe, réessayer avec le suivant
      return autoGenerateCodeVendeur();
    }

    console.log(`🤖 CODE AUTO-GÉNÉRÉ: ${newCodeVendeur}`);
    return newCodeVendeur;

  } catch (error) {
    console.error("Erreur génération code vendeur:", error);
    throw new Error("Impossible de générer un code vendeur unique");
  }
}

/**
 * VALIDATION GLOBALE MLM - Vérification complète du système
 */
export async function validateMLMIntegrity(): Promise<MLMValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Vérifier les codes vendeurs en doublon
    const duplicatesResult = await db.execute(sql`
      SELECT "codeVendeur", COUNT(*) as count
      FROM users 
      WHERE "codeVendeur" IS NOT NULL
      GROUP BY "codeVendeur"
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length > 0) {
      errors.push(`Codes vendeurs en doublon détectés: ${duplicatesResult.rows.length}`);
    }

    // 2. Vérifier les références hiérarchiques orphelines
    const orphansResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users u1
      LEFT JOIN users u2 ON u1."codeParrainage" = u2."codeVendeur"
      WHERE u1."codeParrainage" IS NOT NULL 
      AND u2."codeVendeur" IS NULL
    `);

    const orphansCount = Number((orphansResult.rows[0] as any).count);
    if (orphansCount > 0) {
      warnings.push(`${orphansCount} vendeurs avec des parrains inexistants`);
    }

    // 3. Vérifier les cycles hiérarchiques (protection contre les boucles infinies)
    // Cette vérification sera ajoutée si nécessaire

    console.log("🔍 VALIDATION MLM GLOBALE:", { errors: errors.length, warnings: warnings.length });

  } catch (error) {
    errors.push("Erreur lors de la validation de l'intégrité MLM");
    console.error("Erreur validation MLM:", error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}