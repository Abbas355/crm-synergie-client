import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Connexion à la base de données
// La variable DATABASE_URL est déjà définie dans l'environnement Replit
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL n\'est pas défini');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function applyMlmTables() {
  try {
    console.log('Création des tables MLM si elles n\'existent pas...');

    // Vérifier si la table mlm_distributeurs existe
    const mlmDistributeursExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'mlm_distributeurs'
      );
    `);

    if (!mlmDistributeursExist[0].exists) {
      console.log('Création de la table mlm_distributeurs...');
      await db.execute(sql`
        CREATE TABLE mlm_distributeurs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          code_vendeur TEXT NOT NULL UNIQUE,
          parent_id INTEGER REFERENCES mlm_distributeurs(id),
          niveau INTEGER NOT NULL DEFAULT 1,
          date_recrutement TIMESTAMP DEFAULT NOW(),
          actif BOOLEAN DEFAULT TRUE,
          taux_commission DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Table mlm_distributeurs créée avec succès');
    } else {
      console.log('La table mlm_distributeurs existe déjà');
    }

    // Vérifier si la table mlm_regles_commission existe
    const mlmReglesCommissionExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'mlm_regles_commission'
      );
    `);

    if (!mlmReglesCommissionExist[0].exists) {
      console.log('Création de la table mlm_regles_commission...');
      await db.execute(sql`
        CREATE TABLE mlm_regles_commission (
          id SERIAL PRIMARY KEY,
          niveau INTEGER NOT NULL,
          produit_type TEXT NOT NULL,
          taux_commission DECIMAL(5,2) NOT NULL,
          volume_minimum INTEGER DEFAULT 0,
          actif BOOLEAN DEFAULT TRUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Table mlm_regles_commission créée avec succès');

      // Insérer les règles de commission par défaut
      console.log('Insertion des règles de commission par défaut...');
      await db.execute(sql`
        INSERT INTO mlm_regles_commission 
          (niveau, produit_type, taux_commission, volume_minimum, actif, description)
        VALUES
          (1, 'freebox_ultra', 5.00, 0, TRUE, 'Commission directe sur Freebox Ultra'),
          (1, 'freebox_pop', 3.50, 0, TRUE, 'Commission directe sur Freebox Pop'),
          (1, 'freebox_essentiel', 2.00, 0, TRUE, 'Commission directe sur Freebox Essentiel'),
          (1, 'forfait_5g', 1.50, 0, TRUE, 'Commission directe sur Forfait 5G'),
          (2, 'freebox_ultra', 2.00, 3, TRUE, 'Commission niveau 2 sur Freebox Ultra'),
          (2, 'freebox_pop', 1.50, 3, TRUE, 'Commission niveau 2 sur Freebox Pop'),
          (2, 'freebox_essentiel', 1.00, 3, TRUE, 'Commission niveau 2 sur Freebox Essentiel'),
          (2, 'forfait_5g', 0.75, 3, TRUE, 'Commission niveau 2 sur Forfait 5G'),
          (3, 'freebox_ultra', 1.00, 5, TRUE, 'Commission niveau 3 sur Freebox Ultra'),
          (3, 'freebox_pop', 0.75, 5, TRUE, 'Commission niveau 3 sur Freebox Pop'),
          (3, 'freebox_essentiel', 0.50, 5, TRUE, 'Commission niveau 3 sur Freebox Essentiel'),
          (3, 'forfait_5g', 0.25, 5, TRUE, 'Commission niveau 3 sur Forfait 5G');
      `);
      console.log('Règles de commission par défaut insérées avec succès');
    } else {
      console.log('La table mlm_regles_commission existe déjà');
    }

    // Vérifier si la table mlm_transactions_commission existe
    const mlmTransactionsCommissionExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'mlm_transactions_commission'
      );
    `);

    if (!mlmTransactionsCommissionExist[0].exists) {
      console.log('Création de la table mlm_transactions_commission...');
      await db.execute(sql`
        CREATE TABLE mlm_transactions_commission (
          id SERIAL PRIMARY KEY,
          distributeur_id INTEGER NOT NULL REFERENCES mlm_distributeurs(id),
          client_id INTEGER NOT NULL REFERENCES clients(id),
          montant DECIMAL(10,2) NOT NULL,
          taux DECIMAL(5,2) NOT NULL,
          niveau INTEGER NOT NULL,
          produit_type TEXT NOT NULL,
          statut TEXT DEFAULT 'calculee',
          mois_calcul TEXT NOT NULL,
          date_validation TIMESTAMP,
          date_versement TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Table mlm_transactions_commission créée avec succès');
    } else {
      console.log('La table mlm_transactions_commission existe déjà');
    }

    console.log('Script terminé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création des tables MLM:', error);
  } finally {
    await client.end();
  }
}

applyMlmTables();