import { Pool } from 'pg';

async function addDateInstallationColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Ajout de la colonne date_installation à la table sim_cards...');
    
    // Vérifier si la colonne existe déjà
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sim_cards' AND column_name = 'date_installation'
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      // Ajouter la colonne si elle n'existe pas
      const addColumnQuery = `
        ALTER TABLE sim_cards 
        ADD COLUMN date_installation TIMESTAMP
      `;
      
      await pool.query(addColumnQuery);
      console.log('✅ Colonne date_installation ajoutée avec succès');
    } else {
      console.log('✅ La colonne date_installation existe déjà');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error);
  } finally {
    await pool.end();
  }
}

addDateInstallationColumn();