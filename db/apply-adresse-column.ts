import { db } from "./index";
import { sql } from "drizzle-orm";

async function addAdresseColumn() {
  try {
    console.log("Ajout de la colonne 'adresse' à la table recruitment_prospects...");
    
    // Vérifier si la colonne existe déjà
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recruitment_prospects' AND column_name = 'adresse'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      // La colonne n'existe pas, on l'ajoute
      const alterTableQuery = sql`
        ALTER TABLE recruitment_prospects 
        ADD COLUMN IF NOT EXISTS adresse TEXT
      `;
      
      await db.execute(alterTableQuery);
      console.log("✅ Colonne 'adresse' ajoutée avec succès !");
    } else {
      console.log("La colonne 'adresse' existe déjà.");
    }
    
    console.log("Opération terminée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la colonne 'adresse':", error);
  }
}

// Exécution de la fonction
addAdresseColumn()
  .then(() => {
    console.log("Script terminé.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });