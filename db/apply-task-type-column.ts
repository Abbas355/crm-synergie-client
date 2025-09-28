import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

// Connexion à la base de données
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL n'est pas défini");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Fonction pour appliquer les changements au schéma
async function applyChanges() {
  try {
    console.log("Vérification et ajout de la colonne task_type à la table tasks...");

    // Vérifier si la colonne task_type existe déjà
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'task_type'
    `);

    if ((columnExists as any).rows.length === 0) {
      // Ajouter la colonne task_type si elle n'existe pas
      await db.execute(sql`
        ALTER TABLE tasks
        ADD COLUMN task_type TEXT DEFAULT 'admin'
      `);
      console.log("Colonne task_type ajoutée à la table tasks avec succès");
    } else {
      console.log("La colonne task_type existe déjà dans la table tasks");
    }

    console.log("Mise à jour du schéma terminée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du schéma :", error);
  }
}

// Dans un contexte ESM, il n'y a pas de require.main === module
// Nous exportons simplement la fonction pour qu'elle soit appelée par d'autres modules

export { applyChanges };