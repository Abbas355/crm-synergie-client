import * as pg from 'pg';
const { Pool } = pg;

async function main() {
  console.log("Verification et ajout des colonnes date_rendez_vous et date_installation...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  // Nous n'utilisons pas drizzle ici, juste des requetes SQL directes

  try {
    // 1. Verifier si la colonne date_rendez_vous existe
    const checkRendezVousColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients'
      AND column_name = 'date_rendez_vous'
    `);

    // Si la colonne n\u2019existe pas, l\u2019ajouter
    if (checkRendezVousColumn.rows.length === 0) {
      console.log("Ajout de la colonne date_rendez_vous a la table clients...");
      await pool.query(`
        ALTER TABLE clients
        ADD COLUMN date_rendez_vous TIMESTAMP
      `);
      console.log("Colonne date_rendez_vous ajoutee avec succes");
    } else {
      console.log("La colonne date_rendez_vous existe deja dans la table clients");
    }

    // 2. Verifier si la colonne date_installation existe
    const checkInstallationColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients'
      AND column_name = 'date_installation'
    `);

    // Si la colonne n\u2019existe pas, l\u2019ajouter
    if (checkInstallationColumn.rows.length === 0) {
      console.log("Ajout de la colonne date_installation a la table clients...");
      await pool.query(`
        ALTER TABLE clients
        ADD COLUMN date_installation TIMESTAMP
      `);
      console.log("Colonne date_installation ajoutee avec succes");
    } else {
      console.log("La colonne date_installation existe deja dans la table clients");
    }

    console.log("Mise a jour du schema terminee avec succes.");
  } catch (error) {
    console.error("Erreur lors de la mise a jour du schema:", error);
  } finally {
    await pool.end();
  }
}

main().then(() => {
  console.log("Script termine avec succes");
}).catch((err) => {
  console.error("Erreur lors de l\u2019execution du script:", err);
});