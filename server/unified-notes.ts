/**
 * SYSTÈME UNIFIÉ DES NOTES/COMMENTAIRES
 * 
 * Principe "Single Source of Truth" :
 * - clients.commentaire = source unique de vérité
 * - tasks.description = récupérée via JOIN clients
 * - sim_cards.note = récupérée via JOIN clients
 * 
 * Avantages :
 * ✅ Centralisation totale des informations par client
 * ✅ Pas de synchronisation complexe
 * ✅ Mise à jour temps réel automatique
 * ✅ Évite la consultation multiple de rubriques
 */

import express from "express";
import { db } from "../db";
import { clients, tasks, sim_cards, users } from "../shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
// Middleware d'authentification simple
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}

interface UnifiedNote {
  id: number;
  clientId: number;
  clientName: string;
  content: string;
  lastUpdated: string;
  updatedBy: string;
  sources: {
    hasClientComment: boolean;
    hasTaskDescription: boolean;
    hasSimCardNote: boolean;
    taskIds: number[];
    simCardIds: number[];
  };
}

/**
 * ENDPOINT PRINCIPAL - Récupération des notes unifiées par client
 */
export function setupUnifiedNotesRoutes(app: express.Application) {
  
  // GET /api/unified-notes/client/:id - Récupération note unifiée d'un client
  app.get("/api/unified-notes/client/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;

      console.log(`📝 RÉCUPÉRATION NOTE UNIFIÉE - Client ${clientId} par utilisateur ${userId}`);

      // Vérifier l'accès au client (admins voient tout, vendeurs leurs clients)
      const client = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, clientId),
          isNull(clients.deletedAt),
          isAdmin ? undefined : eq(clients.userid, userId)
        ),
        columns: {
          id: true,
          prenom: true,
          nom: true,
          commentaire: true,
          createdAt: true,
          userid: true,
        },
        with: {
          user: {
            columns: {
              prenom: true,
              nom: true,
            }
          }
        }
      });

      if (!client) {
        return res.status(404).json({ message: "Client non trouvé ou accès refusé" });
      }

      // Récupérer les tâches liées à ce client
      const relatedTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.clientId, clientId),
          isNull(tasks.deletedAt)
        ),
        columns: {
          id: true,
          title: true,
          description: true,
        }
      });

      // Récupérer les cartes SIM liées à ce client
      const relatedSimCards = await db.query.sim_cards.findMany({
        where: eq(sim_cards.clientId, clientId),
        columns: {
          id: true,
          numero: true,
          note: true,
        }
      });

      const unifiedNote: UnifiedNote = {
        id: client.id,
        clientId: client.id,
        clientName: `${client.prenom || ''} ${client.nom || ''}`.trim(),
        content: client.commentaire || '',
        lastUpdated: client.createdAt?.toISOString() || new Date().toISOString(),
        updatedBy: `${client.user?.prenom || ''} ${client.user?.nom || ''}`.trim(),
        sources: {
          hasClientComment: !!client.commentaire,
          hasTaskDescription: relatedTasks.some(task => !!task.description),
          hasSimCardNote: relatedSimCards.some(sim => !!sim.note),
          taskIds: relatedTasks.map(task => task.id),
          simCardIds: relatedSimCards.map(sim => sim.id),
        }
      };

      console.log(`✅ NOTE UNIFIÉE récupérée: ${unifiedNote.content ? 'Avec contenu' : 'Vide'}`);
      res.json(unifiedNote);

    } catch (error) {
      console.error("❌ Erreur récupération note unifiée:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la note unifiée" });
    }
  });

  // PUT /api/unified-notes/client/:id - Mise à jour note unifiée d'un client
  app.put("/api/unified-notes/client/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const { content } = req.body;

      console.log(`📝 MISE À JOUR NOTE UNIFIÉE - Client ${clientId} par utilisateur ${userId}`);
      console.log(`📝 Nouveau contenu: "${content}"`);

      // Vérifier l'accès au client
      const client = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, clientId),
          isNull(clients.deletedAt),
          isAdmin ? undefined : eq(clients.userid, userId)
        )
      });

      if (!client) {
        return res.status(404).json({ message: "Client non trouvé ou accès refusé" });
      }

      // ✅ MISE À JOUR SOURCE UNIQUE - clients.commentaire
      await db
        .update(clients)
        .set({ 
          commentaire: content || null,
        })
        .where(eq(clients.id, clientId));

      console.log(`✅ NOTE UNIFIÉE mise à jour pour client ${clientId}`);

      // Retourner la note mise à jour
      res.json({
        success: true,
        message: "Note unifiée mise à jour avec succès",
        clientId: clientId,
        content: content || '',
        updatedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error("❌ Erreur mise à jour note unifiée:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la note unifiée" });
    }
  });

  // GET /api/unified-notes/task/:id - Récupération note via tâche (redirige vers client)
  app.get("/api/unified-notes/task/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Récupérer la tâche pour obtenir le clientId
      const task = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, taskId),
          isNull(tasks.deletedAt)
        ),
        columns: {
          clientId: true,
        }
      });

      if (!task?.clientId) {
        return res.status(404).json({ message: "Tâche non trouvée ou non liée à un client" });
      }

      // Rediriger vers l'endpoint client unifié
      const clientResponse = await fetch(`http://localhost:5000/api/unified-notes/client/${task.clientId}`, {
        headers: {
          'Cookie': req.headers.cookie || '',
        }
      });

      const clientNote = await clientResponse.json();
      res.json(clientNote);

    } catch (error) {
      console.error("❌ Erreur récupération note via tâche:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la note" });
    }
  });

  // GET /api/unified-notes/sim-card/:id - Récupération note via carte SIM (redirige vers client)
  app.get("/api/unified-notes/sim-card/:id", requireAuth, async (req: express.Request, res: express.Response) => {
    try {
      const simCardId = parseInt(req.params.id);
      
      // Récupérer la carte SIM pour obtenir le clientId
      const simCard = await db.query.sim_cards.findFirst({
        where: eq(sim_cards.id, simCardId),
        columns: {
          clientId: true,
        }
      });

      if (!simCard?.clientId) {
        return res.status(404).json({ message: "Carte SIM non trouvée ou non assignée à un client" });
      }

      // Rediriger vers l'endpoint client unifié
      const clientResponse = await fetch(`http://localhost:5000/api/unified-notes/client/${simCard.clientId}`, {
        headers: {
          'Cookie': req.headers.cookie || '',
        }
      });

      const clientNote = await clientResponse.json();
      res.json(clientNote);

    } catch (error) {
      console.error("❌ Erreur récupération note via carte SIM:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la note" });
    }
  });

  console.log("✅ Routes de notes unifiées configurées");
}