import { db } from './index';
import { sql } from 'drizzle-orm';

async function applyTaskEnhancements() {
  try {
    console.log("Application des améliorations pour la table tasks...");

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

    // Ajouter les nouvelles colonnes pour la gestion avancée des tâches
    await checkAndAddColumn('tasks', 'category', 'TEXT NOT NULL DEFAULT \'general\'');
    await checkAndAddColumn('tasks', 'tags', 'TEXT');
    await checkAndAddColumn('tasks', 'estimated_duration', 'INTEGER');
    await checkAndAddColumn('tasks', 'actual_duration', 'INTEGER');
    await checkAndAddColumn('tasks', 'completed_at', 'TIMESTAMP');
    await checkAndAddColumn('tasks', 'reminder_sent', 'BOOLEAN DEFAULT false');
    await checkAndAddColumn('tasks', 'location', 'TEXT');
    await checkAndAddColumn('tasks', 'updated_at', 'TIMESTAMP DEFAULT NOW()');

    // Mise à jour du task_type par défaut
    console.log("Mise à jour du task_type par défaut...");
    await db.execute(sql`
      ALTER TABLE tasks 
      ALTER COLUMN task_type SET DEFAULT 'vendeur';
    `);

    // Créer des index pour optimiser les performances
    console.log("Création des index pour les performances...");
    
    const indexes = [
      { name: 'idx_tasks_user_status', columns: 'user_id, status' },
      { name: 'idx_tasks_due_date', columns: 'due_date' },
      { name: 'idx_tasks_category', columns: 'category' },
      { name: 'idx_tasks_priority', columns: 'priority' }
    ];

    for (const index of indexes) {
      try {
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS ${sql.raw(index.name)} 
          ON tasks (${sql.raw(index.columns)});
        `);
        console.log(`Index ${index.name} créé ou existe déjà.`);
      } catch (error) {
        console.log(`Index ${index.name} existe déjà ou erreur:`, error);
      }
    }

    console.log("Améliorations de la table tasks appliquées avec succès !");
    console.log("Mise à jour du schéma terminée avec succès.");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'application des améliorations:", error);
    process.exit(1);
  }
}

applyTaskEnhancements();