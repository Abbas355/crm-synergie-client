import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

// Se connecter a la base de donnees
const sql_url = process.env.DATABASE_URL!;
const client = neon(sql_url);
const db = drizzle(client);

async function applyAvatarColumn() {
  console.log("Verification et ajout des colonnes manquantes a la table users...");
  
  try {
    // Colonnes a ajouter avec leurs definitions
    const columnsToAdd = [
      { name: 'email', definition: 'TEXT' },
      { name: 'prenom', definition: 'TEXT' },
      { name: 'nom', definition: 'TEXT' },
      { name: 'phone', definition: 'TEXT' },
      { name: 'code_vendeur', definition: 'TEXT' },
      { name: 'active', definition: 'BOOLEAN DEFAULT TRUE' },
      { name: 'is_admin', definition: 'BOOLEAN DEFAULT FALSE' },
      { name: 'avatar', definition: 'TEXT' },
      { name: 'last_login', definition: 'TIMESTAMP' },
      { name: 'updated_at', definition: 'TIMESTAMP' }
    ];
    
    for (const column of columnsToAdd) {
      // Verifier si la colonne existe deja
      const checkColumnExists = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='users' AND column_name=${column.name}
      `);
      
      if (checkColumnExists.length === 0) {
        // La colonne n\u2019existe pas, on l\u2019ajoute
        await db.execute(sql`
          ALTER TABLE users ADD COLUMN ${sql.raw(column.name)} ${sql.raw(column.definition)}
        `);
        console.log(`Colonne ${column.name} ajoutee a la table users avec succes`);
      } else {
        console.log(`La colonne ${column.name} existe deja dans la table users`);
      }
    }
    
    console.log("Mise a jour du schema terminee avec succes.");
  } catch (error) {
    console.error("Erreur lors de la mise a jour du schema:", error);
  }
}

// Executer le script
applyAvatarColumn()
  .then(() => {
    console.log("Script termine avec succes");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de l\u2019execution du script:", error);
    process.exit(1);
  });