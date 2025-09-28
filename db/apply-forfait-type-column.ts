import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sql } from "drizzle-orm";

export default async function addForfaitTypeColumn() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    console.log("Vérification et ajout de la colonne forfait_type à la table clients...");
    
    // Vérifier si la colonne existe déjà
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'forfait_type'
    `);
    
    if (result.length === 0) {
      // La colonne n'existe pas, l'ajouter
      await db.execute(sql`
        ALTER TABLE clients
        ADD COLUMN forfait_type TEXT
      `);
      console.log("Colonne forfait_type ajoutée à la table clients");
      
      // Mettre à jour les valeurs forfait_type en fonction des produits existants
      console.log("Mise à jour des forfait_type en fonction des produits...");
      await db.execute(sql`
        UPDATE clients
        SET forfait_type = 
          CASE 
            WHEN LOWER(produit) LIKE '%ultra%' THEN 'freebox_ultra'
            WHEN LOWER(produit) LIKE '%essentiel%' THEN 'freebox_essentiel'
            WHEN LOWER(produit) LIKE '%pop%' THEN 'freebox_pop'
            WHEN LOWER(produit) LIKE '%5g%' OR LOWER(produit) LIKE '%forfait%' THEN 'forfait_5g'
            ELSE NULL
          END
        WHERE produit IS NOT NULL
      `);
      console.log("Valeurs forfait_type mises à jour avec succès");
    } else {
      console.log("La colonne forfait_type existe déjà dans la table clients");
    }
    
    console.log("Mise à jour du schéma terminée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du schéma:", error);
  } finally {
    console.log("Script terminé avec succès");
    await client.end();
    // Ne pas appeler process.exit() pour ne pas arrêter l'application
    return true;
  }
}

// Ne pas auto-exécuter la fonction ici, elle sera appelée à partir de server/index.ts