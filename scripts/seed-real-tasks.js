const { db } = require(\'../server/db\');
const { tasks, clients, users } = require(\'../shared/schema\');
const { eq, isNull } = require(\'drizzle-orm\');

async function seedRealTasks() {
  try {
    console.log(\'🚀 Generation de vraies taches basees sur les clients existants...\');

    // Recuperer les clients avec commentaires
    const clientsWithComments = await db.query.clients.findMany({
      where: isNull(clients.deletedAt),
      columns: {
        id: true,
        prenom: true,
        nom: true,
        commentaire: true,
        status: true,
        createdAt: true
      }
    });

    // Recuperer un utilisateur pour assigner les taches
    const vendeur = await db.query.users.findFirst({
      where: eq(users.username, \'vendeur1@synergie.com\')
    });

    if (!vendeur) {
      console.error(\'❌ Aucun vendeur trouve\');
      return;
    }

    console.log(`📋 ${clientsWithComments.length} clients trouves`);

    const tasksToCreate = [];

    for (const client of clientsWithComments) {
      if (client.commentaire && client.commentaire.trim()) {
        // Analyser le commentaire pour determiner le type de tache
        const comment = client.commentaire.toLowerCase();
        const callKeywords = [\'appeler\', \'rappeler\', \'rappeller\', \'recontacter\', \'telephoner\', \'joindre\'];
        const isCallTask = callKeywords.some(keyword => comment.includes(keyword));

        // Creer une tache basee sur le commentaire
        const task = {
          title: isCallTask 
            ? `Appeler ${client.prenom} ${client.nom}`
            : `Suivi contrat ${client.prenom} ${client.nom}`,
          description: `Suite au commentaire: ${client.commentaire}`,
          status: \'pending\',
          priority: isCallTask ? \'high\' : \'medium\',
          category: isCallTask ? \'appel\' : 'suivi\',
          estimatedDuration: isCallTask ? 15 : 30,
          clientId: client.id,
          userId: vendeur.id,
          dueDate: new Date(Date.now() + (isCallTask ? 24 : 72) * 60 * 60 * 1000), // 1 ou 3 jours
          createdAt: new Date(),
          updatedAt: new Date()
        };

        tasksToCreate.push(task);
      }

      // Creer des taches basees sur le statut du client
      if (client.status === \'post_production\') {
        tasksToCreate.push({
          title: `Suivi post-production ${client.prenom} ${client.nom}`,
          description: `Verifier l\'avancement du dossier en post-production`,
          status: \'pending\',
          priority: \'high\',
          category: 'suivi\',
          estimatedDuration: 20,
          clientId: client.id,
          userId: vendeur.id,
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 jours
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Ajouter quelques taches generales
    tasksToCreate.push(
      {
        title: \'Prospection nouveaux clients\',
        description: \'Demarcher de nouveaux prospects dans le secteur\',
        status: \'pending\',
        priority: \'medium\',
        category: \'prospection\',
        estimatedDuration: 120,
        clientId: null,
        userId: vendeur.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: \'Formation produits Free\',
        description: \'Session de formation sur les nouveaux forfaits 5G\',
        status: \'in_progress\',
        priority: \'medium\',
        category: \'formation\',
        estimatedDuration: 90,
        clientId: null,
        userId: vendeur.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Creee hier
        updatedAt: new Date()
      }
    );

    // Inserer les taches
    if (tasksToCreate.length > 0) {
      const insertedTasks = await db.insert(tasks).values(tasksToCreate).returning();
      console.log(`✅ ${insertedTasks.length} taches reelles creees avec succes!`);
      
      // Afficher un resume
      const summary = insertedTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log(\'📊 Resume des taches creees:\');
      Object.entries(summary).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} tache(s)`);
      });
    } else {
      console.log(\'ℹ️ Aucune tache a creer\');
    }

  } catch (error) {
    console.error(\'Erreur lors de la generation des taches:\', error);
  }
}

// Executer le seed
seedRealTasks();