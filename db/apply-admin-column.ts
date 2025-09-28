import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

// Se connecter a la base de donnees
const sql_url = process.env.DATABASE_URL!;
const client = neon(sql_url);
const db = drizzle(client);

async function applyAdminColumn() {
  console.log("Verification et ajout de la colonne is_admin a la table users...");
  
  try {
    // Verifier si la colonne existe deja
    const checkColumnExists = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name=\'users\' AND column_name=\'is_admin\'
    `);
    
    if (checkColumnExists.length === 0) {
      // La colonne n\u2019existe pas, on l\u2019ajoute
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Colonne is_admin ajoutee a la table users avec succes");
    } else {
      console.log("La colonne is_admin existe deja dans la table users");
    }
    
    console.log("Mise a jour du schema terminee avec succes.");
  } catch (error) {
    console.error("Erreur lors de la mise a jour du schema:", error);
  }
}

// Executer le script
applyAdminColumn()
  .then(() => {
    console.log("Script termine avec succes");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de l\u2019execution du script:", error);
    process.exit(1);
  });