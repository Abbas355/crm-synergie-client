/**
 * Script pour créer automatiquement des tâches pour tous les clients existants
 * qui ont des commentaires mais pas encore de tâches associées
 */

import { db } from '../db/index.js';
import { clients, tasks } from '../shared/schema.js';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';

async function createTasksFromExistingComments() {
  console.log('🔧 Début de la création automatique des tâches pour les clients avec commentaires...');
  
  try {
    // Récupérer tous les clients qui ont des commentaires
    const clientsWithComments = await db
      .select()
      .from(clients)
      .where(and(
        isNotNull(clients.commentaire),
        eq(clients.deletedAt, null)
      ));
    
    console.log(`📊 ${clientsWithComments.length} clients trouvés avec des commentaires`);
    
    let tasksCreated = 0;
    let tasksSkipped = 0;
    
    for (const client of clientsWithComments) {
      // Vérifier si une tâche existe déjà pour ce client
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.clientId, client.id),
          isNull(tasks.deletedAt)
        ))
        .limit(1);
      
      if (existingTask.length > 0) {
        console.log(`⏭️ Tâche déjà existante pour ${client.prenom} ${client.nom} - ignoré`);
        tasksSkipped++;
        continue;
      }
      
      // Analyser le commentaire pour déterminer le type de tâche
      const commentaireLower = client.commentaire.toLowerCase();
      const isCallTask = commentaireLower.includes('appel') || 
                        commentaireLower.includes('rappel') || 
                        commentaireLower.includes('téléphone') ||
                        commentaireLower.includes('joindre') ||
                        commentaireLower.includes('contact');
      
      // Extraire une éventuelle date du commentaire
      const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/;
      const dateMatch = client.commentaire.match(dateRegex);
      let dueDate = new Date();
      
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        console.log(`📅 Date extraite du commentaire pour ${client.prenom} ${client.nom}: ${dueDate.toLocaleDateString()}`);
      } else {
        // Échéance par défaut selon le type de tâche
        dueDate.setHours(dueDate.getHours() + (isCallTask ? 24 : 48));
      }
      
      // Créer la tâche
      const taskData = {
        userId: client.userid, // Utiliser l'ID du vendeur qui a créé le client
        title: `Suivi client: ${client.prenom} ${client.nom}`,
        description: `Suite au commentaire: ${client.commentaire}`,
        status: 'pending',
        priority: isCallTask ? 'high' : 'medium',
        category: isCallTask ? 'appel' : 'suivi',
        dueDate: dueDate,
        clientId: client.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.insert(tasks).values(taskData);
      
      console.log(`✅ Tâche créée pour ${client.prenom} ${client.nom} - Type: ${isCallTask ? 'appel' : 'suivi'}, Priorité: ${taskData.priority}`);
      tasksCreated++;
    }
    
    console.log(`\n📈 Résumé:`);
    console.log(`   • Tâches créées: ${tasksCreated}`);
    console.log(`   • Tâches ignorées (déjà existantes): ${tasksSkipped}`);
    console.log(`   • Total clients traités: ${clientsWithComments.length}`);
    console.log(`\n✅ Processus terminé avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tâches:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createTasksFromExistingComments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { createTasksFromExistingComments };