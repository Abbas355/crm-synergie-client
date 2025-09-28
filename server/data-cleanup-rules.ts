import { db } from "@db";
import { clients } from "@shared/schema";
import { sql, and, eq, isNull, isNotNull } from "drizzle-orm";

/**
 * RÈGLES AUTOMATISÉES DÉFINITIVES POUR EMPÊCHER LES BUGS DE SYNCHRONISATION
 * 
 * Ces règles s'exécutent automatiquement pour maintenir l'intégrité des données
 * et éliminer définitivement les problèmes de doublons et de synchronisation.
 */

export class DataCleanupRules {
  
  /**
   * RÈGLE 1: Empêcher la création de doublons
   */
  static async preventDuplicates() {
    try {
      // Marquer les doublons existants comme supprimés (garde le plus ancien)
      await db.execute(sql`
        UPDATE clients 
        SET deletedAt = NOW()
        WHERE id IN (
          SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (
                     PARTITION BY LOWER(TRIM(email)), LOWER(TRIM(prenom)), LOWER(TRIM(nom))
                     ORDER BY createdAt ASC
                   ) as rn
            FROM clients 
            WHERE deletedAt IS NULL 
            AND email IS NOT NULL 
            AND email != ''
            AND prenom IS NOT NULL
            AND nom IS NOT NULL
          ) ranked
          WHERE rn > 1
        )
      `);
      
      console.log("✅ RÈGLE 1: Doublons éliminés");
    } catch (error) {
      console.error("❌ Erreur RÈGLE 1:", error);
    }
  }
  
  /**
   * RÈGLE 2: Assurer la cohérence des codes vendeurs
   */
  static async enforceVendorCodeConsistency() {
    try {
      const validCodes = ['FR98445061', 'FR52796953', 'FR00123456'];
      
      // Corriger les codes vendeurs invalides
      await db.execute(sql`
        UPDATE clients 
        SET codeVendeur = CASE 
          WHEN user_id = 1 THEN 'FR52796953'
          WHEN user_id = 16 THEN 'FR98445061'
          ELSE 'FR98445061'
        END
        WHERE (codeVendeur IS NULL OR codeVendeur NOT IN (${sql.join(validCodes, sql`, `)}))
        AND deletedAt IS NULL
      `);
      
      console.log("✅ RÈGLE 2: Codes vendeurs standardisés");
    } catch (error) {
      console.error("❌ Erreur RÈGLE 2:", error);
    }
  }
  
  /**
   * RÈGLE 3: Nettoyer les anciens clients supprimés (plus de 48h)
   */
  static async cleanupOldDeleted() {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      const result = await db.execute(sql`
        DELETE FROM clients 
        WHERE deletedAt IS NOT NULL 
        AND deletedAt < ${fortyEightHoursAgo}
      `);
      
      console.log("✅ RÈGLE 3: Anciens clients supprimés nettoyés");
    } catch (error) {
      console.error("❌ Erreur RÈGLE 3:", error);
    }
  }
  
  /**
   * RÈGLE 4: Validation des données obligatoires
   */
  static async validateRequiredFields() {
    try {
      // Marquer comme supprimés les clients avec des données manquantes critiques
      await db.execute(sql`
        UPDATE clients 
        SET deletedAt = NOW()
        WHERE deletedAt IS NULL 
        AND (
          prenom IS NULL OR prenom = '' OR
          nom IS NULL OR nom = '' OR
          email IS NULL OR email = ''
        )
      `);
      
      console.log("✅ RÈGLE 4: Données obligatoires validées");
    } catch (error) {
      console.error("❌ Erreur RÈGLE 4:", error);
    }
  }
  
  /**
   * RÈGLE 5: Synchroniser les champs name avec prenom/nom
   */
  static async syncNameFields() {
    try {
      await db.execute(sql`
        UPDATE clients 
        SET name = TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, '')))
        WHERE deletedAt IS NULL 
        AND (name IS NULL OR name != TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, ''))))
      `);
      
      console.log("✅ RÈGLE 5: Champs name synchronisés");
    } catch (error) {
      console.error("❌ Erreur RÈGLE 5:", error);
    }
  }
  
  /**
   * Exécuter toutes les règles de nettoyage
   */
  static async applyAllRules() {
    console.log("🔧 Application des règles de nettoyage automatisées...");
    
    await this.preventDuplicates();
    await this.enforceVendorCodeConsistency();
    await this.syncNameFields();
    await this.validateRequiredFields();
    await this.cleanupOldDeleted();
    
    console.log("✅ Toutes les règles de nettoyage appliquées");
  }
  
  /**
   * Obtenir une requête sécurisée pour les clients (TOUJOURS exclure les supprimés)
   */
  static getSecureClientQuery(userId: number, isAdmin: boolean, vendorCode?: string) {
    let query = db.select().from(clients);
    
    // RÈGLE ABSOLUE: Toujours exclure les clients supprimés
    query = query.where(isNull(clients.deletedAt));
    
    // Filtrage par rôle
    if (!isAdmin) {
      if (vendorCode) {
        query = query.where(eq(clients.codeVendeur, vendorCode));
      } else {
        query = query.where(eq(clients.userId, userId));
      }
    }
    
    return query;
  }
}

/**
 * Démarrer le nettoyage automatique périodique
 */
export function startAutomaticCleanup() {
  // Nettoyage initial
  DataCleanupRules.applyAllRules();
  
  // Nettoyage toutes les heures
  setInterval(() => {
    DataCleanupRules.applyAllRules();
  }, 60 * 60 * 1000); // 1 heure
  
  console.log("🔄 Nettoyage automatique démarré (toutes les heures)");
}