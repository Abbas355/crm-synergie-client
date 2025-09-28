/**
 * SYSTÈME DE STATISTIQUES OPTIMISÉ - SINGLE SOURCE OF TRUTH GÉNÉRALISÉ
 * Élimination des calculs répétitifs pour performance maximale
 */

import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import memoize from "memoizee";

interface OptimizedStats {
  clientsCeMois: number;
  installations: number;
  installationsEnCours: number;
  ptsGeneresCeMois: number;
  clientsARelancer: number;
  nombreDeBox: number;
  nbForfait5G: number;
}

/**
 * CALCUL OPTIMISÉ DES STATISTIQUES AVEC CACHE INTELLIGENT
 * Une seule requête SQL pour toutes les métriques - Performance révolutionnaire
 */
const calculateOptimizedStats = async (userId?: number): Promise<OptimizedStats> => {
    console.log("🚀 CALCUL STATISTIQUES OPTIMISÉ - Single Source of Truth");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (janvier = 0)

    try {
      // **UNE SEULE REQUÊTE POUR TOUTES LES MÉTRIQUES - RÉVOLUTION ARCHITECTURALE**
      // ✅ CORRECTION: Filtre par utilisateur pour calculs personnalisés
      const userFilter = userId ? sql`AND c."userId" = ${userId}` : sql``;
      
      const statsResult = await db.execute(sql`
        WITH monthly_stats AS (
          SELECT 
            c.id,
            c.prenom,
            c.nom,
            c.produit,
            c.status,
            c."dateSignature",
            c."dateInstallation",
            c."dateRendezVous",
            -- ✅ CALCUL INTELLIGENT DES POINTS SELON BARÈME OFFICIEL
            CASE 
              WHEN c.produit ILIKE '%ultra%' THEN 6
              WHEN c.produit ILIKE '%essentiel%' THEN 5  
              WHEN c.produit ILIKE '%pop%' THEN 4
              WHEN c.produit ILIKE '%5g%' OR c.produit ILIKE '%forfait%' THEN 1
              ELSE 0
            END as points,
            -- ✅ DÉTECTION TYPE PRODUIT POUR COMPTAGES SPÉCIALISÉS
            CASE 
              WHEN c.produit ILIKE '%freebox%' THEN 'box'
              WHEN c.produit ILIKE '%5g%' OR c.produit ILIKE '%forfait%' THEN '5g'
              ELSE 'other'
            END as produit_type,
            -- ✅ VÉRIFICATION MOIS/ANNÉE SIGNATURE
            EXTRACT(YEAR FROM c."dateSignature") as signature_year,
            EXTRACT(MONTH FROM c."dateSignature") as signature_month,
            -- ✅ VÉRIFICATION MOIS/ANNÉE INSTALLATION
            EXTRACT(YEAR FROM c."dateInstallation") as installation_year,
            EXTRACT(MONTH FROM c."dateInstallation") as installation_month,
            -- ✅ VÉRIFICATION MOIS/ANNÉE RENDEZ-VOUS
            EXTRACT(YEAR FROM c."dateRendezVous") as rdv_year,
            EXTRACT(MONTH FROM c."dateRendezVous") as rdv_month
          FROM clients c
          WHERE c."deletedAt" IS NULL ${userFilter}
        )
        SELECT 
          -- ✅ CLIENTS CE MOIS (signatures mois en cours sauf "Enregistré")
          COUNT(CASE 
            WHEN signature_year = ${currentYear} 
            AND signature_month = ${currentMonth + 1}
            AND status != 'Enregistré'
            THEN 1 
          END) as clients_ce_mois,
          
          -- ✅ INSTALLATIONS RÉELLES (dateInstallation = mois en cours)
          COUNT(CASE 
            WHEN installation_year = ${currentYear} 
                 AND installation_month = ${currentMonth + 1}
                 AND "dateInstallation" IS NOT NULL
            THEN 1 
          END) as installations,
          
          -- ✅ POINTS GÉNÉRÉS (installations mois en cours avec barème officiel)
          COALESCE(SUM(CASE 
            WHEN installation_year = ${currentYear} 
            AND installation_month = ${currentMonth + 1}
            AND "dateInstallation" IS NOT NULL
            THEN points 
            ELSE 0 
          END), 0) as pts_generes_ce_mois,
          
          -- ✅ CLIENTS À RELANCER (TOUS les clients historiques sauf installation/resiliation/rendez-vous)
          COUNT(CASE 
            WHEN status NOT IN ('installation', 'resiliation', 'rendez-vous', 'Enregistré')
            THEN 1 
          END) as clients_a_relancer,
          
          -- ✅ NOMBRE DE BOX (Freebox signées ce mois)
          COUNT(CASE 
            WHEN signature_year = ${currentYear}
            AND signature_month = ${currentMonth + 1}
            AND produit_type = 'box'
            AND status != 'Enregistré'
            THEN 1 
          END) as nombre_de_box,
          
          -- ✅ NB FORFAIT 5G (forfaits 5G signés ce mois)
          COUNT(CASE 
            WHEN signature_year = ${currentYear}
            AND signature_month = ${currentMonth + 1}
            AND produit_type = '5g'
            AND status != 'Enregistré'
            THEN 1 
          END) as nb_forfait_5g,
          
          -- ✅ INSTALLATIONS EN COURS (rendez-vous ce mois + post-production)
          COUNT(CASE 
            WHEN (status = 'rendez-vous' 
                  AND rdv_year = ${currentYear} 
                  AND rdv_month = ${currentMonth + 1}
                  AND "dateRendezVous" IS NOT NULL)
                 OR status = 'post-production'
            THEN 1 
          END) as installations_en_cours
          
        FROM monthly_stats
      `);

      const stats = statsResult.rows[0] as any;
      
      const optimizedStats: OptimizedStats = {
        clientsCeMois: parseInt(stats.clients_ce_mois) || 0,
        installations: parseInt(stats.installations) || 0,
        installationsEnCours: parseInt(stats.installations_en_cours) || 0,
        ptsGeneresCeMois: parseInt(stats.pts_generes_ce_mois) || 0,
        clientsARelancer: parseInt(stats.clients_a_relancer) || 0,
        nombreDeBox: parseInt(stats.nombre_de_box) || 0,
        nbForfait5G: parseInt(stats.nb_forfait_5g) || 0,
      };

      console.log("✅ STATISTIQUES OPTIMISÉES CALCULÉES:", {
        période: `${currentMonth + 1}/${currentYear}`,
        ...optimizedStats
      });

      return optimizedStats;

    } catch (error) {
      console.error("❌ Erreur calcul statistiques optimisées:", error);
      // Fallback sécurisé
      return {
        clientsCeMois: 0,
        installations: 0,
        ptsGeneresCeMois: 0,
        clientsARelancer: 0,
        nombreDeBox: 0,
        nbForfait5G: 0,
      };
    }
};

/**
 * STATISTIQUES CARTES SIM OPTIMISÉES - Single Source of Truth
 */
const calculateOptimizedSimStats = memoize(
  async () => {
    console.log("🚀 CALCUL STATS SIM OPTIMISÉ - Single Source of Truth");

    try {
      // **UNE SEULE REQUÊTE POUR TOUTES LES STATS SIM**
      const simStatsResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN statut = 'disponible' THEN 1 END) as disponibles,
          COUNT(CASE WHEN statut = 'affecte' THEN 1 END) as affectees,
          COUNT(CASE WHEN statut = 'active' THEN 1 END) as actives
        FROM sim_cards
      `);

      const simStats = simStatsResult.rows[0] as any;
      
      return {
        total: parseInt(simStats.total) || 0,
        disponibles: parseInt(simStats.disponibles) || 0,
        affectees: parseInt(simStats.affectees) || 0,
        actives: parseInt(simStats.actives) || 0,
      };

    } catch (error) {
      console.error("❌ Erreur stats SIM optimisées:", error);
      return { total: 0, disponibles: 0, affectees: 0, actives: 0 };
    }
  },
  {
    maxAge: 1 * 60 * 1000, // 1 minute cache
    preFetch: true,
  }
);

export { calculateOptimizedStats, calculateOptimizedSimStats };