import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL as string;
const client = postgres(databaseUrl);
const db = drizzle(client);

async function main() {
  console.log("Vérification et ajout des colonnes is_admin et role à la table users...");

  // Vérifier si la colonne is_admin existe déjà
  const checkIsAdminColumn = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  `);

  if (checkIsAdminColumn.length === 0) {
    console.log("Ajout de la colonne is_admin à la table users...");
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log("Colonne is_admin ajoutée avec succès");
  } else {
    console.log("La colonne is_admin existe déjà dans la table users");
  }

  // Vérifier si la colonne role existe déjà
  const checkRoleColumn = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  `);

  if (checkRoleColumn.length === 0) {
    console.log("Ajout de la colonne role à la table users...");
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'vendeur'
    `);
    console.log("Colonne role ajoutée avec succès");
  } else {
    console.log("La colonne role existe déjà dans la table users");
  }

  // Définir l'utilisateur admin par défaut (utilisateur id = 1)
  await db.execute(sql`
    UPDATE users SET is_admin = TRUE, role = 'admin' WHERE id = 1
  `);
  console.log("Utilisateur ID 1 défini comme admin");

  console.log("Mise à jour du schéma terminée avec succès.");
}

main()
  .then(() => {
    console.log("Script terminé avec succès");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Erreur lors de l'exécution du script:", e);
    process.exit(1);
  });