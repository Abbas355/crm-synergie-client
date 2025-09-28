import { db } from "./index";
import { sql } from "drizzle-orm";

async function addAttestationColumn() {
  try {
    console.log("Ajout de la colonne 'attestation_sur_honneur' à la table recruitment_prospects...");
    
    // Vérifier si la colonne existe déjà
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recruitment_prospects' AND column_name = 'attestation_sur_honneur'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      // La colonne n'existe pas, on l'ajoute
      const alterTableQuery = sql`
        ALTER TABLE recruitment_prospects 
        ADD COLUMN IF NOT EXISTS attestation_sur_honneur BOOLEAN DEFAULT FALSE
      `;
      
      await db.execute(alterTableQuery);
      console.log("✅ Colonne 'attestation_sur_honneur' ajoutée avec succès !");
    } else {
      console.log("La colonne 'attestation_sur_honneur' existe déjà.");
    }
    
    console.log("Opération terminée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la colonne 'attestation_sur_honneur':", error);
  }
}

// Exécution de la fonction
addAttestationColumn()
  .then(() => {
    console.log("Script terminé.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });