import { db } from "../db/index";
import { tasks, users } from "../shared/schema";

async function seedTasks() {
  try {
    console.log("🌱 Début du seeding des tâches...");

    // Récupérer les utilisateurs existants
    const allUsers = await db.query.users.findMany();
    console.log(`👥 ${allUsers.length} utilisateurs trouvés`);

    if (allUsers.length === 0) {
      console.log("❌ Aucun utilisateur trouvé. Impossible de créer des tâches.");
      return;
    }

    // Données de tâches d'exemple
    const sampleTasks = [
      {
        title: "Appeler client pour confirmation installation",
        description: "Confirmer le rendez-vous d'installation pour la Freebox Ultra",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
        category: "appel",
        taskType: "vendeur",
        userId: allUsers[0].id,
        estimatedDuration: 15
      },
      {
        title: "Suivi contrat en cours de validation",
        description: "Vérifier l'avancement de la validation du dossier client",
        status: "in_progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
        category: "suivi",
        taskType: "vendeur",
        userId: allUsers[0].id,
        estimatedDuration: 30
      },
      {
        title: "Prospection secteur centre-ville",
        description: "Démarcher les commerces du centre-ville pour nouveaux prospects",
        status: "pending",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
        category: "prospection",
        taskType: "vendeur",
        userId: allUsers[0].id,
        estimatedDuration: 120
      },
      {
        title: "Installation technique client VIP",
        description: "Accompagner l'installation technique chez client prioritaire",
        status: "pending",
        priority: "urgent",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Après-demain
        category: "installation",
        taskType: "vendeur",
        userId: allUsers[0].id,
        estimatedDuration: 90
      },
      {
        title: "Rappel client signature différée",
        description: "Relancer le client qui a reporté la signature de son contrat",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // Dans 6 heures
        category: "suivi",
        taskType: "vendeur",
        userId: allUsers[0].id,
        estimatedDuration: 20
      }
    ];

    // Si plusieurs utilisateurs, répartir les tâches
    if (allUsers.length > 1) {
      sampleTasks.push(
        {
          title: "Formation nouveaux produits",
          description: "Organiser session de formation sur les nouveaux forfaits 5G",
          status: "pending",
          priority: "medium",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          category: "formation",
          taskType: "vendeur",
          userId: allUsers[1].id,
          estimatedDuration: 60
        },
        {
          title: "Analyse performance équipe",
          description: "Compiler les résultats de vente du mois et analyser les performances",
          status: "in_progress",
          priority: "low",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          category: "administratif",
          taskType: "admin",
          userId: allUsers[1].id,
          estimatedDuration: 180
        }
      );
    }

    // Insérer les tâches
    console.log(`📝 Insertion de ${sampleTasks.length} tâches...`);
    
    for (const task of sampleTasks) {
      await db.insert(tasks).values(task);
      console.log(`✅ Tâche créée: ${task.title}`);
    }

    console.log("🎉 Seeding des tâches terminé avec succès!");

  } catch (error) {
    console.error("❌ Erreur lors du seeding des tâches:", error);
  }
}

seedTasks();