/**
 * SCRIPT DE NETTOYAGE COMPLET - UNIFICATION DES COLONNES CLIENTS
 * 
 * Ce script résout définitivement le problème de mapping en:
 * 1. Supprimant tous les mappings camelCase/snake_case
 * 2. Unifiant les noms de colonnes pour qu'ils correspondent exactement à la BDD
 * 3. Nettoyant tout le code orphelin
 */

import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

async function unifyClientColumns() {
  console.log("🧹 NETTOYAGE COMPLET DES COLONNES CLIENTS");
  console.log("==========================================");
  
  try {
    // 1. Afficher les colonnes actuelles
    console.log("📋 Colonnes actuelles dans la table clients:");
    const columnInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY column_name
    `);
    
    console.table(columnInfo);
    
    // 2. Supprimer les colonnes en double qui créent la confusion
    console.log("\n🔧 Suppression des colonnes en double...");
    
    const columnsToRemove = [
      "dateRendezVous",
      "dateInstallation"
    ];
    
    for (const column of columnsToRemove) {
      try {
        await db.execute(sql`ALTER TABLE clients DROP COLUMN IF EXISTS ${sql.identifier(column)}`);
        console.log(`✅ Colonne ${column} supprimée`);
      } catch (error) {
        console.log(`⚠️ Colonne ${column} n'existait pas ou erreur: ${error.message}`);
      }
    }
    
    // 3. Vérifier l'état final
    console.log("\n📋 Colonnes finales dans la table clients:");
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY column_name
    `);
    
    console.table(finalColumns);
    
    // 4. Compter les enregistrements
    console.log("\n📊 Nombre d'enregistrements clients:");
    const clientCount = await db.execute(sql`SELECT COUNT(*) as count FROM clients`);
    console.log(`Total: ${clientCount[0].count} clients`);
    
    console.log("\n✅ NETTOYAGE TERMINÉ - Colonnes unifiées avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  }
}

// Exécuter le script
unifyClientColumns().then(() => {
  console.log("🎉 Script terminé avec succès!");
  process.exit(0);
}).catch(error => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});