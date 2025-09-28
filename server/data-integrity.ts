import { db } from "@db";
import { clients } from "@shared/schema";
import { sql, and, eq, isNull, isNotNull } from "drizzle-orm";

/**
 * RÈGLES DE SYNCHRONISATION ET D'INTÉGRITÉ DES DONNÉES
 * 
 * Ce module établit des règles définitives pour éviter les bugs de synchronisation :
 * 1. Élimination automatique des doublons
 * 2. Filtrage strict des clients supprimés
 * 3. Validation des codes vendeurs
 * 4. Nettoyage automatique des données incohérentes
 */

interface DataIntegrityReport {
  duplicatesRemoved: number;
  orphanedClientsFixed: number;
  invalidVendorCodesFixed: number;
  deletedClientsFiltered: number;
}

/**
 * Nettoie automatiquement les doublons basés sur email + nom + prénom
 */
export async function removeDuplicateClients(): Promise<number> {
  try {
    console.log("🔧 Nettoyage des doublons...");
    
    // Identifier les doublons (même email, nom, prénom)
    const duplicateQuery = sql`
      WITH ranked_clients AS (
        SELECT id, email, prenom, nom, createdAt,
               ROW_NUMBER() OVER (
                 PARTITION BY LOWER(email), LOWER(prenom), LOWER(nom) 
                 ORDER BY createdAt ASC
               ) as rn
        FROM clients 
        WHERE deletedAt IS NULL 
        AND email IS NOT NULL 
        AND email != ''
      )
      SELECT id FROM ranked_clients WHERE rn > 1
    `;
    
    const duplicateResults = await db.execute(duplicateQuery);
    const duplicateIds = (duplicateResults as any).rows.map((row: any) => row.id);
    
    if (duplicateIds.length > 0) {
      // Marquer les doublons comme supprimés au lieu de les supprimer définitivement
      await db.update(clients)
        .set({ deletedAt: new Date() })
        .where(sql`id = ANY(${duplicateIds})`);
      
      console.log(`✅ ${duplicateIds.length} doublons marqués comme supprimés`);
    }
    
    return duplicateIds.length;
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des doublons:", error);
    return 0;
  }
}

/**
 * Corrige les codes vendeurs incohérents
 */
export async function fixVendorCodeConsistency(): Promise<number> {
  try {
    console.log("🔧 Correction des codes vendeurs...");
    
    // Codes vendeurs valides connus
    const validVendorCodes = ['FR98445061', 'FR52796953', 'FR00123456'];
    
    // Trouver les clients avec des codes vendeurs invalides
    const invalidClients = await db.select()
      .from(clients)
      .where(
        and(
          isNull(clients.deletedAt),
          sql`codeVendeur NOT IN ${validVendorCodes} OR codeVendeur IS NULL`
        )
      );
    
    let fixedCount = 0;
    
    for (const client of invalidClients) {
      // Assigner un code vendeur par défaut basé sur l'utilisateur
      let defaultVendorCode = 'FR98445061'; // Code par défaut
      
      if (client.userId === 1) {
        defaultVendorCode = 'FR52796953';
      } else if (client.userId === 16) {
        defaultVendorCode = 'FR98445061';
      }
      
      await db.update(clients)
        .set({ codeVendeur: defaultVendorCode })
        .where(eq(clients.id, client.id));
      
      fixedCount++;
    }
    
    console.log(`✅ ${fixedCount} codes vendeurs corrigés`);
    return fixedCount;
  } catch (error) {
    console.error("❌ Erreur lors de la correction des codes vendeurs:", error);
    return 0;
  }
}

/**
 * Applique un nettoyage automatique des clients supprimés depuis plus de 48h
 */
export async function cleanupOldDeletedClients(): Promise<number> {
  try {
    console.log("🔧 Nettoyage des clients supprimés anciens...");
    
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // Supprimer définitivement les clients supprimés depuis plus de 48h
    const deleteResult = await db.delete(clients)
      .where(
        and(
          isNotNull(clients.deletedAt),
          sql`deletedAt < ${fortyEightHoursAgo}`
        )
      );
    
    console.log(`✅ Clients supprimés définitivement nettoyés`);
    return (deleteResult as any).rowCount || 0;
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des clients supprimés:", error);
    return 0;
  }
}

/**
 * Valide et corrige l'intégrité complète des données
 */
export async function enforceDataIntegrity(): Promise<DataIntegrityReport> {
  console.log("🚀 Application des règles d'intégrité des données...");
  
  const report: DataIntegrityReport = {
    duplicatesRemoved: 0,
    orphanedClientsFixed: 0,
    invalidVendorCodesFixed: 0,
    deletedClientsFiltered: 0
  };
  
  try {
    // 1. Nettoyer les doublons
    report.duplicatesRemoved = await removeDuplicateClients();
    
    // 2. Corriger les codes vendeurs
    report.invalidVendorCodesFixed = await fixVendorCodeConsistency();
    
    // 3. Nettoyer les anciens clients supprimés
    report.deletedClientsFiltered = await cleanupOldDeletedClients();
    
    console.log("📊 Rapport d'intégrité des données:", report);
    
    return report;
  } catch (error) {
    console.error("❌ Erreur globale lors de l'application de l'intégrité:", error);
    return report;
  }
}

/**
 * Requête sécurisée pour récupérer les clients avec tous les filtres appliqués
 */
export function getSecureClientQuery(userId: number, isAdmin: boolean, vendorCode?: string) {
  let baseQuery = db.select().from(clients);
  
  // RÈGLE 1: TOUJOURS exclure les clients supprimés
  baseQuery = baseQuery.where(isNull(clients.deletedAt));
  
  // RÈGLE 2: Filtrage par rôle
  if (isAdmin) {
    // Les admins voient tous les clients actifs
    console.log("ADMIN - Accès complet aux clients actifs");
  } else if (vendorCode) {
    // Les vendeurs voient uniquement leurs clients
    console.log(`VENDEUR - Filtrage strict par code: ${vendorCode}`);
    baseQuery = baseQuery.where(eq(clients.codeVendeur, vendorCode));
  } else {
    // Fallback : clients créés par l'utilisateur uniquement
    console.log(`UTILISATEUR - Filtrage par user_id: ${userId}`);
    baseQuery = baseQuery.where(eq(clients.userId, userId));
  }
  
  return baseQuery;
}