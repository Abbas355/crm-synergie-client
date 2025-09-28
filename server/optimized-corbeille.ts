/**
 * SYSTÈME DE CORBEILLE OPTIMISÉ - SINGLE SOURCE OF TRUTH GÉNÉRALISÉ
 * Élimination du stockage JSON redondant - Performance maximale
 */

import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import memoize from "memoizee";

interface DeletedItem {
  id: number;
  type: 'client' | 'task' | 'sim_card';
  deletedAt: string;
  deletedBy?: string;
  restoreDeadline: string;
  timeRemaining: number;
  // ✅ DONNÉES ENRICHIES VIA JOINs - ZÉRO REDONDANCE
  clientData?: {
    prenom: string;
    nom: string;
    civilite: string;
    email?: string;
    telephone?: string;
    produit?: string;
    status?: string;
  };
  taskData?: {
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    clientName?: string;
  };
  simData?: {
    numero: string;
    statut: string;
    clientName?: string;
  };
}

/**
 * RÉCUPÉRATION OPTIMISÉE DES ÉLÉMENTS SUPPRIMÉS
 * Une seule requête pour tous les types d'éléments - Performance révolutionnaire
 */
const getOptimizedDeletedItems = memoize(
  async (userId: number, isAdmin: boolean): Promise<DeletedItem[]> => {
    console.log("🚀 RÉCUPÉRATION CORBEILLE OPTIMISÉE - Single Source of Truth");

    try {
      // **UNE SEULE REQUÊTE POUR TOUS LES TYPES D'ÉLÉMENTS SUPPRIMÉS**
      const deletedItemsResult = await db.execute(sql`
        WITH deleted_clients AS (
          SELECT 
            'client' as item_type,
            c.id,
            c."deletedAt",
            'USER_DELETE' as deleted_by,
            c."deletedAt" + INTERVAL '48 hours' as restore_deadline,
            EXTRACT(EPOCH FROM (c."deletedAt" + INTERVAL '48 hours' - NOW())) as time_remaining_seconds,
            -- ✅ DONNÉES CLIENT VIA SOURCE UNIQUE
            JSON_BUILD_OBJECT(
              'prenom', c.prenom,
              'nom', c.nom,
              'civilite', c.civilite,
              'email', c.email,
              'telephone', c.telephone,
              'produit', c.produit,
              'status', c.status
            ) as item_data
          FROM clients c
          WHERE c."deletedAt" IS NOT NULL
            ${!isAdmin ? sql`AND c.userid = ${userId}` : sql``}
        ),
        deleted_tasks AS (
          SELECT 
            'task' as item_type,
            t.id,
            t."deletedAt",
            'USER_DELETE' as deleted_by,
            t."deletedAt" + INTERVAL '48 hours' as restore_deadline,
            EXTRACT(EPOCH FROM (t."deletedAt" + INTERVAL '48 hours' - NOW())) as time_remaining_seconds,
            -- ✅ DONNÉES TÂCHE ENRICHIES VIA JOINs
            JSON_BUILD_OBJECT(
              'title', t.title,
              'description', t.description,
              'priority', t.priority,
              'dueDate', t."dueDate",
              'clientName', CASE 
                WHEN c.prenom IS NOT NULL AND c.nom IS NOT NULL 
                THEN c.civilite || ' ' || c.prenom || ' ' || c.nom
                ELSE NULL
              END
            ) as item_data
          FROM tasks t
          LEFT JOIN clients c ON t."clientId" = c.id AND c."deletedAt" IS NULL
          WHERE t."deletedAt" IS NOT NULL
            ${!isAdmin ? sql`AND t."userId" = ${userId}` : sql``}
        ),
        deleted_simcards AS (
          SELECT 
            'sim_card' as item_type,
            s.id,
            s."deletedAt",
            'USER_DELETE' as deleted_by,
            s."deletedAt" + INTERVAL '48 hours' as restore_deadline,
            EXTRACT(EPOCH FROM (s."deletedAt" + INTERVAL '48 hours' - NOW())) as time_remaining_seconds,
            -- ✅ DONNÉES SIM ENRICHIES VIA JOINs
            JSON_BUILD_OBJECT(
              'numero', s.numero,
              'statut', s.statut,
              'clientName', CASE 
                WHEN c.prenom IS NOT NULL AND c.nom IS NOT NULL 
                THEN c.civilite || ' ' || c.prenom || ' ' || c.nom
                ELSE NULL
              END
            ) as item_data
          FROM sim_cards s
          LEFT JOIN clients c ON s."clientId" = c.id AND c."deletedAt" IS NULL
          WHERE s."deletedAt" IS NOT NULL
        )
        SELECT * FROM deleted_clients
        UNION ALL
        SELECT * FROM deleted_tasks
        UNION ALL  
        SELECT * FROM deleted_simcards
        ORDER BY "deletedAt" DESC
      `);

      const deletedItems: DeletedItem[] = deletedItemsResult.rows.map((row: any) => {
        const itemData = row.item_data;
        const timeRemainingHours = Math.max(0, Math.floor(row.time_remaining_seconds / 3600));

        const baseItem = {
          id: row.id,
          type: row.item_type as 'client' | 'task' | 'sim_card',
          deletedAt: row.deletedAt,
          deletedBy: row.deleted_by,
          restoreDeadline: row.restore_deadline,
          timeRemaining: timeRemainingHours,
        };

        // ✅ DONNÉES TYPÉES SELON LE TYPE D'ÉLÉMENT
        if (row.item_type === 'client') {
          return {
            ...baseItem,
            clientData: itemData,
          };
        } else if (row.item_type === 'task') {
          return {
            ...baseItem,
            taskData: itemData,
          };
        } else {
          return {
            ...baseItem,
            simData: itemData,
          };
        }
      });

      console.log(`✅ CORBEILLE OPTIMISÉE : ${deletedItems.length} éléments récupérés via JOINs`);
      
      return deletedItems;

    } catch (error) {
      console.error("❌ Erreur récupération corbeille optimisée:", error);
      return [];
    }
  },
  {
    // ✅ CACHE COURT 1 MINUTE - Corbeille change fréquemment
    maxAge: 1 * 60 * 1000,
    // ✅ CLÉ DE CACHE PERSONNALISÉE PAR UTILISATEUR
    normalizer: (userId: number, isAdmin: boolean) => `deleted-${userId}-${isAdmin}`,
  }
);

/**
 * RESTAURATION OPTIMISÉE D'ÉLÉMENT SUPPRIMÉ
 * Mise à jour directe sans stockage redondant
 */
async function restoreOptimizedItem(
  itemType: 'client' | 'task' | 'sim_card',
  itemId: number,
  userId: number
): Promise<boolean> {
  console.log(`🚀 RESTAURATION OPTIMISÉE - ${itemType} ID: ${itemId}`);

  try {
    let tableName: string;
    switch (itemType) {
      case 'client':
        tableName = 'clients';
        break;
      case 'task':
        tableName = 'tasks';
        break;
      case 'sim_card':
        tableName = 'sim_cards';
        break;
      default:
        throw new Error(`Type d'élément inconnu: ${itemType}`);
    }

    await db.execute(sql.raw(`
      UPDATE ${tableName}
      SET "deletedAt" = NULL
      WHERE id = ${itemId}
    `));

    console.log(`✅ RESTAURATION RÉUSSIE - ${itemType} ${itemId} restauré`);
    
    // Invalider le cache pour mise à jour immédiate
    getOptimizedDeletedItems.clear();
    
    return true;

  } catch (error) {
    console.error(`❌ Erreur restauration optimisée ${itemType} ${itemId}:`, error);
    return false;
  }
}

/**
 * SUPPRESSION DÉFINITIVE AUTOMATIQUE DES ÉLÉMENTS EXPIRÉS
 * Nettoyage intelligent basé sur les délais
 */
async function cleanupExpiredItems(): Promise<number> {
  console.log("🚀 NETTOYAGE AUTOMATIQUE ÉLÉMENTS EXPIRÉS");

  try {
    const cleanupResult = await db.execute(sql`
      WITH expired_items AS (
        SELECT 'clients' as table_name, COUNT(*) as count
        FROM clients 
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
        
        UNION ALL
        
        SELECT 'tasks' as table_name, COUNT(*) as count
        FROM tasks
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
          
        UNION ALL
        
        SELECT 'sim_cards' as table_name, COUNT(*) as count
        FROM sim_cards
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
      )
      SELECT SUM(count) as total_expired FROM expired_items
    `);

    const totalExpired = parseInt(cleanupResult.rows[0]?.total_expired || '0');

    if (totalExpired > 0) {
      // Suppression définitive des éléments expirés
      await db.execute(sql`
        DELETE FROM clients 
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
      `);

      await db.execute(sql`
        DELETE FROM tasks
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
      `);

      await db.execute(sql`
        DELETE FROM sim_cards
        WHERE "deletedAt" IS NOT NULL 
          AND "deletedAt" < NOW() - INTERVAL '48 hours'
      `);

      console.log(`✅ NETTOYAGE RÉUSSI - ${totalExpired} éléments supprimés définitivement`);
    }

    return totalExpired;

  } catch (error) {
    console.error("❌ Erreur nettoyage automatique:", error);
    return 0;
  }
}

export { getOptimizedDeletedItems, restoreOptimizedItem, cleanupExpiredItems };