import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Script pour ajouter la colonne code_vendeur à la table clients
 * Cette colonne permettra de suivre quel vendeur a effectué la vente
 * et d'uniformiser le système de commissions
 */
async function addVendorCodeColumn() {
  try {
    console.log("Vérification et ajout de la colonne code_vendeur à la table clients...");
    
    // Vérifier si la colonne existe déjà
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'code_vendeur'
    `);
    
    // Si la colonne n'existe pas, l'ajouter
    if ((checkColumnExists as any).rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS code_vendeur TEXT
      `);
      console.log("✅ Colonne code_vendeur ajoutée à la table clients");
    } else {
      console.log("La colonne code_vendeur existe déjà dans la table clients");
    }
    
    // Vérifier si un index existe pour cette colonne
    const checkIndexExists = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'clients' AND indexname = 'idx_clients_code_vendeur'
    `);
    
    // Si l'index n'existe pas, le créer pour optimiser les recherches
    if ((checkIndexExists as any).rows.length === 0) {
      try {
        await db.execute(sql`
          CREATE INDEX idx_clients_code_vendeur ON clients(code_vendeur)
        `);
        console.log("✅ Index idx_clients_code_vendeur créé sur la table clients");
      } catch (error: any) {
        // Ignorer l'erreur si l'index existe déjà (code 42P07)
        if (error.code === '42P07') {
          console.log("L'index idx_clients_code_vendeur existe déjà pour la table clients");
        } else {
          throw error;
        }
      }
    } else {
      console.log("L'index idx_clients_code_vendeur existe déjà pour la table clients");
    }
    
    console.log("Mise à jour du schéma terminée avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du schéma:", error);
    process.exit(1);
  }
}

// Exécution du script
addVendorCodeColumn()
  .then(() => {
    console.log("Script terminé avec succès");
  })
  .catch((error) => {
    console.error("Erreur lors de l'exécution du script:", error);
    process.exit(1);
  });

export default addVendorCodeColumn;