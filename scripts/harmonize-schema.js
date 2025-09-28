import { Pool } from \'pg\';
import dotenv from \'dotenv\';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function harmonizeSchema() {
  const client = await pool.connect();
  
  try {
    console.log(\'🔄 Harmonisation des noms de colonnes...\');
    
    // Verifier les colonnes existantes
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = \'clients\' AND table_schema = \'public\'
      ORDER BY column_name;
    `);
    
    console.log(\'📋 Colonnes actuelles:\', checkColumns.rows.map(r => r.column_name));
    
    // Harmoniser les noms de colonnes problematiques
    const migrations = [
      // CarteSIM: utiliser carte_sim comme standard
      {
        check: \'carteSIM\',
        standard: \'carte_sim\',
        action: \'rename\'
      },
      // IdentifiantContrat: utiliser identifiant_contrat comme standard  
      {
        check: \'identifiantContrat\',
        standard: \'identifiant_contrat\',
        action: \'rename\'
      },
      // DateSignature: utiliser date_signature comme standard
      {
        check: \'dateSignature\', 
        standard: \'date_signature\',
        action: \'rename\'
      },
      // DateRendezVous: utiliser date_rendez_vous comme standard
      {
        check: \'dateRendezVous\',
        standard: \'date_rendez_vous\', 
        action: \'rename\'
      },
      // DateInstallation: utiliser date_installation comme standard
      {
        check: \'dateInstallation\',
        standard: \'date_installation\',
        action: \'rename\'
      }
    ];
    
    for (const migration of migrations) {
      const hasOldColumn = checkColumns.rows.some(r => r.column_name === migration.check);
      const hasNewColumn = checkColumns.rows.some(r => r.column_name === migration.standard);
      
      if (hasOldColumn && !hasNewColumn) {
        console.log(`🔄 Renommage: ${migration.check} → ${migration.standard}`);
        await client.query(`
          ALTER TABLE clients 
          RENAME COLUMN "${migration.check}" TO "${migration.standard}";
        `);
      } else if (hasOldColumn && hasNewColumn) {
        console.log(`⚠️  Les deux colonnes existent: ${migration.check} et ${migration.standard}`);
        // Migrer les donnees vers la colonne standard et supprimer l\ancienne
        await client.query(`
          UPDATE clients 
          SET "${migration.standard}" = "${migration.check}" 
          WHERE "${migration.standard}" IS NULL AND "${migration.check}" IS NOT NULL;
        `);
        await client.query(`ALTER TABLE clients DROP COLUMN "${migration.check}";`);
        console.log(`✅ Migration des donnees et suppression de ${migration.check}`);
      } else if (hasNewColumn) {
        console.log(`✅ Colonne ${migration.standard} deja presente`);
      } else {
        console.log(`ℹ️  Aucune des colonnes ${migration.check}/${migration.standard} n’existe`);
      }
    }
    
    // Verifier les colonnes finales
    const finalColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = \'clients\' AND table_schema = \'public\'
      ORDER BY column_name;
    `);
    
    console.log(\'📋 Colonnes apres harmonisation:\', finalColumns.rows.map(r => r.column_name));
    console.log(\'✅ Harmonisation terminee avec succes\');
    
  } catch (error) {
    console.error(\'Erreur lors de l\u2019harmonisation:\', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executer si appele directement
if (import.meta.url === `file://${process.argv[1]}`) {
  harmonizeSchema().catch(console.error);
}

export { harmonizeSchema };