import { db } from "./index";
import { sql } from "drizzle-orm";

async function addCompanyColumns() {
  try {
    console.log("Ajout des colonnes 'nom_societe' et 'siret' à la table recruitment_prospects...");
    
    // Vérifier si les colonnes existent déjà
    const checkNomSocieteQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recruitment_prospects' AND column_name = 'nom_societe'
    `;
    
    const checkSiretQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recruitment_prospects' AND column_name = 'siret'
    `;
    
    const nomSocieteExists = await db.execute(checkNomSocieteQuery);
    const siretExists = await db.execute(checkSiretQuery);
    
    // Ajouter nom_societe si elle n'existe pas
    if (nomSocieteExists.rows.length === 0) {
      const alterTableQuery = sql`
        ALTER TABLE recruitment_prospects 
        ADD COLUMN IF NOT EXISTS nom_societe TEXT
      `;
      
      await db.execute(alterTableQuery);
      console.log("✅ Colonne 'nom_societe' ajoutée avec succès !");
    } else {
      console.log("La colonne 'nom_societe' existe déjà.");
    }
    
    // Ajouter siret si elle n'existe pas
    if (siretExists.rows.length === 0) {
      const alterTableQuery = sql`
        ALTER TABLE recruitment_prospects 
        ADD COLUMN IF NOT EXISTS siret TEXT
      `;
      
      await db.execute(alterTableQuery);
      console.log("✅ Colonne 'siret' ajoutée avec succès !");
    } else {
      console.log("La colonne 'siret' existe déjà.");
    }
    
    console.log("Opération terminée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout des colonnes:", error);
  }
}

// Exécution de la fonction
addCompanyColumns()
  .then(() => {
    console.log("Script terminé.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });