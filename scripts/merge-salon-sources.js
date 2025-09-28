// Script de migration pour fusionner les sources "salon" et "stand_salon"
import { db } from '../db/index.js';

async function mergeSalonSources() {
  try {
    console.log("🔄 Démarrage de la fusion des sources salon...");
    
    // 1. Mettre à jour tous les clients avec source "salon" vers "stand_salon"
    const clientsResult = await db.execute(`
      UPDATE clients 
      SET source = 'stand_salon' 
      WHERE source = 'salon' AND deleted_at IS NULL
    `);
    
    console.log(`✅ Clients mis à jour: ${clientsResult.rowCount || 0} enregistrements`);
    
    // 2. Mettre à jour les prospects de recrutement avec source "salon"
    const prospectsResult = await db.execute(`
      UPDATE recruitment_prospects 
      SET source = 'stand_salon' 
      WHERE source = 'salon'
    `);
    
    console.log(`✅ Prospects mis à jour: ${prospectsResult.rowCount || 0} enregistrements`);
    
    // 3. Vérification finale - compter les sources restantes
    const verificationResult = await db.execute(`
      SELECT 
        source,
        COUNT(*) as count
      FROM clients 
      WHERE deleted_at IS NULL
      GROUP BY source
      ORDER BY count DESC
    `);
    
    console.log("\n📊 Répartition des sources après fusion:");
    verificationResult.rows.forEach(row => {
      const displayName = row.source === 'stand_salon' ? 'Stand & Salons' : 
                         row.source === 'prospection_direct' ? 'Prospection directe' :
                         row.source === 'recommandation' ? 'Recommandation' :
                         row.source === 'flyer' ? 'Flyer' :
                         row.source || 'Non spécifiée';
      console.log(`  - ${displayName}: ${row.count} clients`);
    });
    
    // 4. Vérifier qu'il ne reste plus d'entrées "salon"
    const remainingSalonResult = await db.execute(`
      SELECT COUNT(*) as count 
      FROM clients 
      WHERE source = 'salon' AND deleted_at IS NULL
    `);
    
    const remainingSalon = parseInt(remainingSalonResult.rows[0]?.count || '0');
    
    if (remainingSalon === 0) {
      console.log("\n✅ Migration réussie: Aucune entrée 'salon' restante");
      console.log("🎯 Toutes les sources 'salon' ont été fusionnées vers 'stand_salon'");
    } else {
      console.log(`\n⚠️  Attention: ${remainingSalon} entrées 'salon' n'ont pas été migrées`);
    }
    
    return {
      success: true,
      clientsUpdated: clientsResult.rowCount || 0,
      prospectsUpdated: prospectsResult.rowCount || 0,
      remainingSalon
    };
    
  } catch (error) {
    console.error("❌ Erreur lors de la fusion des sources:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  mergeSalonSources().then(result => {
    console.log("\n=== RÉSULTAT DE LA MIGRATION ===");
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

export { mergeSalonSources };