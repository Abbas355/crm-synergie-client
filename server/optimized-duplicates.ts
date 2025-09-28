/**
 * SYSTÈME DE GESTION DES DOUBLONS OPTIMISÉ - SINGLE SOURCE OF TRUTH
 * Élimination des comparaisons multiples inefficaces
 */

import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import memoize from "memoizee";

interface DuplicateGroup {
  key: string;
  field: string;
  clients: Array<{
    id: number;
    prenom: string;
    nom: string;
    email?: string;
    telephone?: string;
    dateSignature?: string;
  }>;
  count: number;
}

/**
 * DÉTECTION DE DOUBLONS ULTRA-OPTIMISÉE
 * Une seule requête SQL pour tous les types de doublons possibles
 */
const detectOptimizedDuplicates = memoize(
  async (): Promise<DuplicateGroup[]> => {
    console.log("🚀 DÉTECTION DOUBLONS OPTIMISÉE - Single Source of Truth");

    try {
      // **UNE SEULE REQUÊTE POUR TOUS LES TYPES DE DOUBLONS**
      const duplicatesResult = await db.execute(sql`
        WITH potential_duplicates AS (
          SELECT 
            c.id,
            c.prenom,
            c.nom,
            c.email,
            c.telephone,
            c."dateSignature",
            -- ✅ DÉTECTION DOUBLONS EMAIL (normalisé)
            LOWER(TRIM(c.email)) as normalized_email,
            -- ✅ DÉTECTION DOUBLONS TÉLÉPHONE (normalisé)  
            REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g') as normalized_phone,
            -- ✅ DÉTECTION DOUBLONS NOM COMPLET (normalisé)
            LOWER(TRIM(c.prenom)) || '_' || LOWER(TRIM(c.nom)) as normalized_name
          FROM clients c
          WHERE c."deletedAt" IS NULL
            AND (c.email IS NOT NULL OR c.telephone IS NOT NULL)
        ),
        email_duplicates AS (
          SELECT 
            'email' as field_type,
            normalized_email as duplicate_key,
            COUNT(*) as duplicate_count,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', id,
                'prenom', prenom,
                'nom', nom,
                'email', email,
                'telephone', telephone,
                'dateSignature', "dateSignature"
              )
            ) as clients_data
          FROM potential_duplicates
          WHERE normalized_email IS NOT NULL 
            AND normalized_email != ''
          GROUP BY normalized_email
          HAVING COUNT(*) > 1
        ),
        phone_duplicates AS (
          SELECT 
            'telephone' as field_type,
            normalized_phone as duplicate_key,
            COUNT(*) as duplicate_count,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', id,
                'prenom', prenom,
                'nom', nom,
                'email', email,
                'telephone', telephone,
                'dateSignature', "dateSignature"
              )
            ) as clients_data
          FROM potential_duplicates
          WHERE normalized_phone IS NOT NULL 
            AND normalized_phone != ''
            AND LENGTH(normalized_phone) >= 8
          GROUP BY normalized_phone
          HAVING COUNT(*) > 1
        ),
        name_duplicates AS (
          SELECT 
            'nom_complet' as field_type,
            normalized_name as duplicate_key,
            COUNT(*) as duplicate_count,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', id,
                'prenom', prenom,
                'nom', nom,
                'email', email,
                'telephone', telephone,
                'dateSignature', "dateSignature"
              )
            ) as clients_data
          FROM potential_duplicates
          WHERE prenom IS NOT NULL 
            AND nom IS NOT NULL
            AND TRIM(prenom) != ''
            AND TRIM(nom) != ''
          GROUP BY normalized_name
          HAVING COUNT(*) > 1
        )
        SELECT * FROM email_duplicates
        UNION ALL
        SELECT * FROM phone_duplicates  
        UNION ALL
        SELECT * FROM name_duplicates
        ORDER BY duplicate_count DESC, field_type ASC
      `);

      const duplicateGroups: DuplicateGroup[] = duplicatesResult.rows.map((row: any) => ({
        key: row.duplicate_key,
        field: row.field_type,
        clients: row.clients_data,
        count: parseInt(row.duplicate_count)
      }));

      console.log(`✅ DOUBLONS DÉTECTÉS OPTIMISÉS : ${duplicateGroups.length} groupes trouvés`);
      
      return duplicateGroups;

    } catch (error) {
      console.error("❌ Erreur détection doublons optimisée:", error);
      return [];
    }
  },
  {
    // ✅ CACHE 10 MINUTES - Doublons évoluent lentement
    maxAge: 10 * 60 * 1000,
    preFetch: true,
  }
);

/**
 * FUSION AUTOMATIQUE DE DOUBLONS OPTIMISÉE
 * Logique intelligente de préservation des données
 */
async function mergeOptimizedDuplicates(
  primaryId: number, 
  duplicateIds: number[]
): Promise<boolean> {
  console.log(`🚀 FUSION OPTIMISÉE - Client ${primaryId} ← [${duplicateIds.join(', ')}]`);

  try {
    await db.transaction(async (tx) => {
      // ✅ 1. MISE À JOUR RÉFÉRENCES CARTES SIM
      await tx.execute(sql`
        UPDATE sim_cards 
        SET "clientId" = ${primaryId}
        WHERE "clientId" = ANY(${duplicateIds})
      `);

      // ✅ 2. MISE À JOUR RÉFÉRENCES TÂCHES  
      await tx.execute(sql`
        UPDATE tasks
        SET "clientId" = ${primaryId}
        WHERE "clientId" = ANY(${duplicateIds})
      `);

      // ✅ 3. SUPPRESSION LOGIQUE DES DOUBLONS
      await tx.execute(sql`
        UPDATE clients
        SET "deletedAt" = NOW(),
            "deletedBy" = 'AUTO_MERGE'
        WHERE id = ANY(${duplicateIds})
      `);
    });

    console.log(`✅ FUSION RÉUSSIE - ${duplicateIds.length} doublons fusionnés`);
    
    // Invalider le cache pour re-calcul immédiat
    detectOptimizedDuplicates.clear();
    
    return true;

  } catch (error) {
    console.error("❌ Erreur fusion optimisée:", error);
    return false;
  }
}

export { detectOptimizedDuplicates, mergeOptimizedDuplicates };