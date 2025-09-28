import { Request, Response } from "express";
import { db } from "@db";
import { clients, activities, tasks, simCards, recruiters, recruitmentProspects, recruitmentStages } from "@shared/schema";
import { and, eq, gte, lte, isNotNull, desc, asc, count } from "drizzle-orm";

export function setupDashboardRoute(app: any) {
  // Nouvelle route pour le tableau de bord avec les statistiques mises à jour
  app.get("/api/dashboard-updated", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Non authentifié" });
      
      // Variables pour filtrer par mois courant
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Obtenir le nombre total de clients (tous, depuis le début)
      const totalClientsCount = await db.select({ count: count() })
        .from(clients)
        .where(eq(clients.userId, req.user.id));
      
      // Obtenir le nombre de clients en validation
      const validationClientsCount = await db.select({ count: count() })
        .from(clients)
        .where(and(
          eq(clients.userId, req.user.id),
          eq(clients.status, "valide")
        ));
      
      // Obtenir le nombre d'installations du mois en cours
      const installationClientsCount = await db.select({ count: count() })
        .from(clients)
        .where(and(
          eq(clients.userId, req.user.id),
          eq(clients.status, "installation"),
          // Filtrer par date d'installation dans le mois courant (si existe)
          isNotNull(clients.dateInstallation),
          gte(clients.dateInstallation, firstDayOfMonth),
          lte(clients.dateInstallation, lastDayOfMonth)
        ));
      
      // Obtenir les rendez-vous du mois en cours
      const rendezVousClientsCount = await db.select({ count: count() })
        .from(clients)
        .where(and(
          eq(clients.userId, req.user.id),
          // Filtrer par date de rendez-vous dans le mois courant (si existe)
          isNotNull(clients.dateRendezVous),
          gte(clients.dateRendezVous, firstDayOfMonth),
          lte(clients.dateRendezVous, lastDayOfMonth)
        ));
      
      // Obtenir le nombre de clients Freebox
      const freeboxClientsCount = await db.select({ count: count() })
        .from(clients)
        .where(and(
          eq(clients.userId, req.user.id),
          eq(clients.type, "freebox")
        ));
      
      // Obtenir le nombre total de cartes SIM
      const totalSimCardsCount = await db.select({ count: count() })
        .from(simCards)
        .where(eq(simCards.userId, req.user.id));
      
      // Obtenir le nombre de cartes SIM disponibles
      const availableSimCardsCount = await db.select({ count: count() })
        .from(simCards)
        .where(and(
          eq(simCards.userId, req.user.id),
          eq(simCards.statut, "disponible")
        ));
      
      // Obtenir le nombre de cartes SIM activées
      const assignedSimCardsCount = await db.select({ count: count() })
        .from(simCards)
        .where(and(
          eq(simCards.userId, req.user.id),
          eq(simCards.statut, "Activé")
        ));
      
      // Récupérer les statistiques du module de recrutement
      const totalRecruiters = await db.select({ count: count() }).from(recruiters);
      const totalProspects = await db.select({ count: count() }).from(recruitmentProspects);
      const activeProspects = await db.select({ count: count() })
        .from(recruitmentProspects)
        .where(eq(recruitmentProspects.stade, 'actif'));
      
      // Statistiques des prospects par étape
      const stageStats = [];
      const stages = await db.select().from(recruitmentStages).orderBy(asc(recruitmentStages.ordre));
      
      for (const stage of stages) {
        const stageCount = await db.select({ count: count() })
          .from(recruitmentProspects)
          .where(eq(recruitmentProspects.stade, stage.nom.toLowerCase()));
        
        stageStats.push({
          nom: stage.nom,
          count: stageCount[0].count,
          couleur: stage.couleur
        });
      }
      
      // Calcul des points selon produit (dans le mois courant)
      let totalPoints = 0;
      
      // Récupérer tous les clients du mois en cours
      const clientsThisMonth = await db.select()
        .from(clients)
        .where(and(
          eq(clients.userId, req.user.id),
          isNotNull(clients.date),
          gte(clients.date, firstDayOfMonth),
          lte(clients.date, lastDayOfMonth)
        ));
      
      // Attribution des points selon les produits
      clientsThisMonth.forEach(client => {
        if (client.boxType === "5G") totalPoints += 1;
        else if (client.boxType === "Freebox Pop") totalPoints += 4;
        else if (client.boxType === "Essentiel") totalPoints += 5;
        else if (client.boxType === "Ultra") totalPoints += 6;
      });
      
      // Get recent activities
      const recentActivities = await db.select().from(activities)
        .where(eq(activities.userId, req.user.id))
        .orderBy(desc(activities.createdAt))
        .limit(5);
      
      // Get upcoming tasks
      const upcomingTasks = await db.select().from(tasks)
        .where(and(
          eq(tasks.userId, req.user.id),
          eq(tasks.status, "en_cours")
        ))
        .orderBy(desc(tasks.createdAt))
        .limit(5);
      
      const stats = {
        totalClients: totalClientsCount[0].count,
        validationClients: validationClientsCount[0].count,
        installationClients: installationClientsCount[0].count,
        rendezVousClients: rendezVousClientsCount[0].count,
        freeboxClients: freeboxClientsCount[0].count,
        totalSimCards: totalSimCardsCount[0].count,
        availableSimCards: availableSimCardsCount[0].count,
        assignedSimCards: assignedSimCardsCount[0].count,
        totalPoints: totalPoints,
        // Stats pour le module recrutement
        totalRecruiters: totalRecruiters[0].count,
        totalProspects: totalProspects[0].count,
        activeProspects: activeProspects[0].count,
        stageStats
      };
      
      res.json({
        stats,
        recentActivities,
        upcomingTasks
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des données du tableau de bord:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
}