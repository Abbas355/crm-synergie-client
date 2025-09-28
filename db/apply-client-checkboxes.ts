import { db } from './index';
import { sql } from 'drizzle-orm';

async function applyClientCheckboxes() {
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

    // Vérifier et ajouter les colonnes de suivi client
    await checkAndAddColumn('clients', 'contrat_signe', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('clients', 'identite_validee', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('clients', 'rib_valide', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('clients', 'justificatif_domicile_valide', 'BOOLEAN DEFAULT false');
    
    console.log("Structure de la table clients mise à jour avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la structure :", error);
    process.exit(1);
  }
}

applyClientCheckboxes();