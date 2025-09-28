import { db } from './index';
import { sql } from 'drizzle-orm';

async function applyChanges() {
  try {
    // Fonction pour vérifier et ajouter une colonne
    async function checkAndAddColumn(tableName: string, columnName: string, columnDefinition: string) {
      console.log(`Vérification de la colonne ${columnName} dans la table ${tableName}...`);
      
      const checkColumnExists = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND column_name = ${columnName};
      `);
      
      if (checkColumnExists.rows.length === 0) {
        await db.execute(sql`
          ALTER TABLE ${sql.raw(tableName)} 
          ADD COLUMN ${sql.raw(columnName)} ${sql.raw(columnDefinition)};
        `);
        console.log(`La colonne ${columnName} a été ajoutée avec succès à la table ${tableName}.`);
      } else {
        console.log(`La colonne ${columnName} existe déjà dans la table ${tableName}.`);
      }
    }

    // Vérifier et ajouter les colonnes manquantes à la table recruitment_prospects
    await checkAndAddColumn('recruitment_prospects', 'formation_completee', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'score_quiz', 'INTEGER');
    await checkAndAddColumn('recruitment_prospects', 'date_formation', 'TIMESTAMP');
    await checkAndAddColumn('recruitment_prospects', 'formulaire_complete', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'piece_identite_deposee', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'rib_depose', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'contrat_genere', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'contrat_signe', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('recruitment_prospects', 'date_signature_contrat', 'TIMESTAMP');
    
    // Vérifier si la table recruitment_documents existe déjà
    const checkTableExists = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'recruitment_documents';
    `);

    if (checkTableExists.rows.length === 0) {
      console.log("La table recruitment_documents n'existe pas. Création de la table...");
      
      await db.execute(sql`
        CREATE TABLE recruitment_documents (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          nom_fichier TEXT NOT NULL,
          chemin_fichier TEXT NOT NULL,
          taille_fichier INTEGER,
          date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          prospect_id INTEGER NOT NULL REFERENCES recruitment_prospects(id),
          uploaded_by_id INTEGER NOT NULL REFERENCES users(id),
          contenu_document TEXT,
          est_signe BOOLEAN DEFAULT false,
          signature_data JSONB,
          date_signature TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      console.log("La table recruitment_documents a été créée avec succès.");
    } else {
      console.log("La table recruitment_documents existe déjà.");
      
      // Vérifier et ajouter les colonnes manquantes à la table recruitment_documents
      await checkAndAddColumn('recruitment_documents', 'contenu_document', 'TEXT');
      await checkAndAddColumn('recruitment_documents', 'est_signe', 'BOOLEAN DEFAULT false');
      await checkAndAddColumn('recruitment_documents', 'signature_data', 'JSONB');
      await checkAndAddColumn('recruitment_documents', 'date_signature', 'TIMESTAMP');
    }
    
    // Mettre à jour la structure de la base de données
    console.log("Structure de la base de données mise à jour avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la structure :", error);
    process.exit(1);
  }
}

applyChanges();