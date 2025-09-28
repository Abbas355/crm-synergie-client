import { db } from "./db.js";
import { tasks, clients, users } from "../shared/schema.js";
import { eq, isNull } from "drizzle-orm";

export async function initializeRealTasks() {
  try {
    // Vérifier si des tâches existent déjà
    const existingTasks = await db.query.tasks.findMany();
    if (existingTasks.length > 0) {
      console.log(`${existingTasks.length} tâches déjà existantes, pas d'initialisation nécessaire`);
      return;
    }

    console.log("Initialisation des vraies tâches basées sur les clients existants...");

    // Récupérer les clients avec commentaires
    const clientsWithComments = await db.query.clients.findMany({
      where: isNull(clients.deletedAt),
      columns: {
        id: true,
        prenom: true,
        nom: true,
        commentaire: true,
        status: true
      }
    });

    // Récupérer le vendeur
    const vendeur = await db.query.users.findFirst({
      where: eq(users.username, 'vendeur1@synergie.com')
    });

    if (!vendeur) {
      console.log("Aucun vendeur trouvé pour l'initialisation des tâches");
      return;
    }

    const tasksToCreate = [];

    // Créer des tâches basées sur les clients réels avec commentaires
    for (const client of clientsWithComments.slice(0, 8)) {
      if (client.commentaire && client.commentaire.trim()) {
        const comment = client.commentaire.toLowerCase();
        const callKeywords = ['appeler', 'rappeler', 'rappeller', 'recontacter', 'téléphoner', 'joindre'];
        const isCallTask = callKeywords.some(keyword => comment.includes(keyword));

        tasksToCreate.push({
          title: isCallTask 
            ? `Appeler ${client.prenom} ${client.nom}`
            : `Suivi contrat ${client.prenom} ${client.nom}`,
          description: `Suite au commentaire: ${client.commentaire}`,
          status: 'pending',
          priority: isCallTask ? 'high' : 'medium',
          category: isCallTask ? 'appel' : 'suivi',
          estimatedDuration: isCallTask ? 15 : 30,
          clientId: client.id,
          userId: vendeur.id,
          dueDate: new Date(Date.now() + (isCallTask ? 24 : 72) * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Ajouter des tâches générales réalistes
    tasksToCreate.push(
      {
        title: 'Prospection nouveaux clients',
        description: 'Démarcher de nouveaux prospects dans le secteur',
        status: 'pending',
        priority: 'medium',
        category: 'prospection',
        estimatedDuration: 120,
        clientId: null,
        userId: vendeur.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Formation produits Free',
        description: 'Session de formation sur les nouveaux forfaits 5G',
        status: 'in_progress',
        priority: 'medium',
        category: 'formation',
        estimatedDuration: 90,
        clientId: null,
        userId: vendeur.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        title: 'Validation dossiers clients',
        description: 'Valider les dossiers en attente de confirmation',
        status: 'completed',
        priority: 'high',
        category: 'validation',
        estimatedDuration: 45,
        clientId: null,
        userId: vendeur.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    );

    // Insérer les tâches dans la base de données
    if (tasksToCreate.length > 0) {
      const insertedTasks = await db.insert(tasks).values(tasksToCreate).returning();
      console.log(`✅ ${insertedTasks.length} vraies tâches créées avec succès!`);
      
      // Résumé par catégorie
      const summary = insertedTasks.reduce((acc: any, task: any) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Tâches créées par catégorie:', summary);
    } else {
      console.log('Aucune tâche à créer');
    }

  } catch (error) {
    console.error("Erreur lors de l'initialisation des tâches:", error);
  }
}