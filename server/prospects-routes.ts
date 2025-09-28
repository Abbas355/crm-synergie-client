import type { Express } from "express";
import { db } from "@db";
import { prospects, users, tasks } from "@shared/schema";
import { eq, and, or, like, desc, isNull, isNotNull } from "drizzle-orm";
import { prospectsInsertSchema } from "@shared/schema";
// Fonction d'authentification locale (copiée depuis routes.ts)
async function requireAuth(req: any, res: any, next: any) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      if (req.session && req.session.id) {
        req.session.destroy(() => {});
      }
      return res.status(401).json({ message: "Non authentifie" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        email: true,
        prenom: true,
        nom: true,
        isAdmin: true,
        codeVendeur: true,
      }
    });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouve" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || "",
      prenom: user.prenom || "",
      nom: user.nom || "",
      isAdmin: user.isAdmin || false,
      codeVendeur: user.codeVendeur || undefined,
    };

    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Fonction utilitaire pour créer automatiquement une tâche à partir d'un commentaire de prospect
async function createTaskFromProspectComment(prospect: any) {
  try {
    const commentaire = prospect.commentaire?.toLowerCase() || "";
    
    // Déterminer le type de tâche selon les mots-clés
    let category = "suivi";
    let priority = "medium";
    let title = `Suivi prospect: ${prospect.prenom} ${prospect.nom}`;
    
    if (commentaire.includes("appel") || commentaire.includes("rappel") || commentaire.includes("tel")) {
      category = "appel";
      title = `Appeler: ${prospect.prenom} ${prospect.nom}`;
      priority = "high";
    } else if (commentaire.includes("email") || commentaire.includes("mail")) {
      category = "email";
      title = `Email à: ${prospect.prenom} ${prospect.nom}`;
    } else if (commentaire.includes("rendez-vous") || commentaire.includes("rdv")) {
      category = "rencontre";
      title = `RDV avec: ${prospect.prenom} ${prospect.nom}`;
      priority = "high";
    }

    // Utiliser la date de prochain contact comme échéance (obligatoire)
    if (!prospect.prochainContact) {
      console.log(`⚠️ Pas de date de prochain contact pour ${prospect.prenom} ${prospect.nom} - tâche non créée`);
      return;
    }

    const dueDate = new Date(prospect.prochainContact);
    
    // Vérifier que la date est dans le futur
    if (dueDate <= new Date()) {
      console.log(`⚠️ Date de prochain contact dans le passé pour ${prospect.prenom} ${prospect.nom} - tâche non créée`);
      return;
    }

    // Créer la tâche
    await db.insert(tasks).values([{
      title,
      commentaire: prospect.commentaire,
      status: "pending",
      priority,
      category,
      userId: prospect.userId,
      dueDate,
      createdAt: new Date(),
    }]);

    console.log(`✅ Tâche automatique créée pour prospect ${prospect.prenom} ${prospect.nom} (${category})`);
  } catch (error) {
    console.error("❌ Erreur lors de la création automatique de tâche:", error);
  }
}

export function setupProspectsRoutes(app: Express) {
  // GET /api/prospects - Récupérer la liste des prospects avec filtres
  app.get("/api/prospects", requireAuth, async (req, res) => {
    try {
      const { type, search, stade, userId } = req.query;
      
      console.log("🔒 SÉCURITÉ PROSPECTS - User connecté:", {
        id: (req as any).user?.id,
        codeVendeur: (req as any).user?.codeVendeur,
        isAdmin: (req as any).user?.isAdmin
      });
      
      // SÉCURITÉ CRITIQUE : Construire les conditions where avec isolation par vendeur
      const whereConditions = [isNull(prospects.deletedAt)];
      
      // ISOLATION SÉCURISÉE : Seuls les admins voient tous les prospects, les autres voient uniquement les leurs
      if (!(req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, (req as any).user.id));
      }
      
      if (type) {
        whereConditions.push(eq(prospects.type, type as string));
      }
      
      if (stade) {
        whereConditions.push(eq(prospects.stade, stade as string));
      }
      
      // Pour les admins uniquement : permettre le filtre par userId spécifique
      if (userId && (req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, parseInt(userId as string)));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        const searchConditions = or(
          like(prospects.prenom, searchTerm),
          like(prospects.nom, searchTerm),
          like(prospects.email, searchTerm),
          like(prospects.telephone, searchTerm),
          like(prospects.ville, searchTerm)
        );
        if (searchConditions) {
          whereConditions.push(searchConditions);
        }
      }

      // Exécuter la requête
      const result = await db.select()
        .from(prospects)
        .where(and(...whereConditions))
        .orderBy(desc(prospects.createdAt));

      // Calculer les statistiques
      const stats = {
        total: result.length,
        nouveau: result.filter(p => p.stade === "nouveau").length,
        contacte: result.filter(p => p.stade === "contacte").length,
        qualifie: result.filter(p => p.stade === "qualifie").length,
        pret_signature: result.filter(p => p.stade === "pret_signature").length,
        converti: result.filter(p => p.stade === "converti").length,
      };

      res.json({ prospects: result, stats });
    } catch (error) {
      console.error("Erreur lors de la récupération des prospects:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // GET /api/prospects/:id - Récupérer un prospect spécifique
  app.get("/api/prospects/:id", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      
      console.log("🔒 SÉCURITÉ PROSPECT ID - User connecté:", {
        id: (req as any).user?.id,
        prospectId: prospectId,
        isAdmin: (req as any).user?.isAdmin
      });
      
      // SÉCURITÉ CRITIQUE : Construire la requête avec isolation par vendeur
      const whereConditions = [
        eq(prospects.id, prospectId), 
        isNull(prospects.deletedAt)
      ];
      
      // ISOLATION SÉCURISÉE : Seuls les admins voient tous les prospects, les autres voient uniquement les leurs
      if (!(req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, (req as any).user.id));
      }
      
      const result = await db.select()
        .from(prospects)
        .where(and(...whereConditions))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Prospect non trouvé ou accès refusé" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Erreur lors de la récupération du prospect:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // POST /api/prospects - Créer un nouveau prospect
  app.post("/api/prospects", requireAuth, async (req, res) => {
    try {
      // SÉCURITÉ CRITIQUE : Forcer l'assignation à l'utilisateur connecté
      const currentUserId = (req as any).user?.id;
      
      console.log("🔒 CRÉATION PROSPECT SÉCURISÉE - User connecté:", {
        id: currentUserId,
        codeVendeur: (req as any).user?.codeVendeur,
        isAdmin: (req as any).user?.isAdmin
      });
      
      // Préparer les données avec valeurs par défaut et assurer que userId est défini
      const prospectData = {
        ...req.body,
        userId: currentUserId, // Toujours défini grâce au fallback
        stade: req.body.stade || "nouveau",
        nombreContacts: req.body.nombreContacts || 1,
        dernierContact: req.body.dernierContact ? new Date(req.body.dernierContact) : new Date(),
        prochainContact: req.body.prochainContact ? new Date(req.body.prochainContact) : null,
        commentaire: req.body.commentaire || "",
        // Gérer l'email : vide ou null = null
        email: (req.body.email && req.body.email.trim() !== "") ? req.body.email : null,
        // S'assurer que type est défini
        type: req.body.type || "client",
      };

      // S'assurer que economyData n'est enregistré que pour les prospects clients
      if (prospectData.type !== "client") {
        prospectData.economyData = null;
      }

      // Valider les données avec le schéma
      const validatedData = prospectsInsertSchema.parse(prospectData);

      // Transformer historiqueContacts en array correct si nécessaire
      const insertData = {
        ...validatedData,
        historiqueContacts: validatedData.historiqueContacts ? 
          Array.isArray(validatedData.historiqueContacts) ? 
            validatedData.historiqueContacts : [] 
          : []
      };

      const result = await db.insert(prospects).values([insertData]).returning();
      
      // Créer automatiquement une tâche si le prospect a un commentaire ET une date de prochain contact
      if (result[0] && result[0].commentaire && result[0].commentaire.trim().length > 0 && result[0].prochainContact) {
        await createTaskFromProspectComment(result[0]);
      }
      
      res.status(201).json(result[0]);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error("Erreur de validation prospect:", error.errors);
        return res.status(400).json({ 
          error: "Données invalides", 
          details: error.errors 
        });
      }
      console.error("Erreur lors de la création du prospect:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // PUT /api/prospects/:id - Mettre à jour un prospect
  app.put("/api/prospects/:id", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      
      console.log("🔒 MODIFICATION PROSPECT SÉCURISÉE - User connecté:", {
        id: (req as any).user?.id,
        prospectId: prospectId,
        isAdmin: (req as any).user?.isAdmin
      });
      
      // SÉCURITÉ CRITIQUE : Construire la requête avec isolation par vendeur
      const whereConditions = [
        eq(prospects.id, prospectId), 
        isNull(prospects.deletedAt)
      ];
      
      // ISOLATION SÉCURISÉE : Seuls les admins modifient tous les prospects, les autres modifient uniquement les leurs
      if (!(req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, (req as any).user.id));
      }
      
      // Vérifier que le prospect existe ET appartient au vendeur connecté
      const existingProspect = await db.select()
        .from(prospects)
        .where(and(...whereConditions))
        .limit(1);

      if (existingProspect.length === 0) {
        return res.status(404).json({ error: "Prospect non trouvé ou accès refusé" });
      }

      // Valider les données partielles
      const updateData = { ...req.body };
      
      // S'assurer que economyData n'est enregistré que pour les prospects clients
      if (updateData.type && updateData.type !== "client") {
        updateData.economyData = null;
      }

      // Corriger le formatage des dates
      if (updateData.prochainContact && typeof updateData.prochainContact === 'string') {
        updateData.prochainContact = new Date(updateData.prochainContact);
      }
      if (updateData.dernierContact && typeof updateData.dernierContact === 'string') {
        updateData.dernierContact = new Date(updateData.dernierContact);
      }

      // Ajouter la date de mise à jour
      updateData.updatedAt = new Date();

      const result = await db.update(prospects)
        .set(updateData)
        .where(eq(prospects.id, prospectId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prospect:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // DELETE /api/prospects/:id - Supprimer un prospect (soft delete)
  app.delete("/api/prospects/:id", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      
      console.log("🔒 SUPPRESSION PROSPECT SÉCURISÉE - User connecté:", {
        id: (req as any).user?.id,
        prospectId: prospectId,
        isAdmin: (req as any).user?.isAdmin
      });
      
      // SÉCURITÉ CRITIQUE : Construire la requête avec isolation par vendeur
      const whereConditions = [eq(prospects.id, prospectId)];
      
      // ISOLATION SÉCURISÉE : Seuls les admins suppriment tous les prospects, les autres suppriment uniquement les leurs
      if (!(req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, (req as any).user.id));
      }
      
      // Soft delete avec vérification d'appartenance
      const result = await db.update(prospects)
        .set({ deletedAt: new Date() })
        .where(and(...whereConditions))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Prospect non trouvé ou accès refusé" });
      }

      res.json({ message: "Prospect supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression du prospect:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // GET /api/prospects/trash - Récupérer les prospects supprimés (corbeille)
  app.get("/api/prospects/trash", requireAuth, async (req, res) => {
    try {
      const { userId } = req.query;
      
      console.log("🔒 CORBEILLE PROSPECTS SÉCURISÉE - User connecté:", {
        id: (req as any).user?.id,
        isAdmin: (req as any).user?.isAdmin
      });
      
      const whereConditions = [
        // Seulement les prospects supprimés (deletedAt non null)
        isNotNull(prospects.deletedAt)
      ];
      
      // ISOLATION SÉCURISÉE : Seuls les admins voient tous les prospects supprimés, les autres voient uniquement les leurs
      if (!(req as any).user?.isAdmin) {
        whereConditions.push(eq(prospects.userId, (req as any).user.id));
      } else if (userId) {
        // Pour les admins uniquement : permettre le filtre par userId spécifique
        whereConditions.push(eq(prospects.userId, parseInt(userId as string)));
      }
      
      const deletedProspects = await db.select()
        .from(prospects)
        .where(and(...whereConditions))
        .orderBy(desc(prospects.deletedAt));
      
      res.json(deletedProspects);
    } catch (error) {
      console.error("Erreur lors de la récupération de la corbeille:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // POST /api/prospects/:id/restore - Restaurer un prospect depuis la corbeille
  app.post("/api/prospects/:id/restore", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      
      // Vérifier que le prospect existe et est supprimé
      const existingProspect = await db.select()
        .from(prospects)
        .where(eq(prospects.id, prospectId))
        .limit(1);
      
      if (existingProspect.length === 0 || !existingProspect[0].deletedAt) {
        return res.status(404).json({ error: "Prospect non trouvé dans la corbeille" });
      }
      
      // Restaurer (remettre deletedAt à null)
      const result = await db.update(prospects)
        .set({ deletedAt: null })
        .where(eq(prospects.id, prospectId))
        .returning();

      res.json({ message: "Prospect restauré avec succès", prospect: result[0] });
    } catch (error) {
      console.error("Erreur lors de la restauration du prospect:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // DELETE /api/prospects/:id/permanent - Suppression définitive d'un prospect
  app.delete("/api/prospects/:id/permanent", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      
      // Vérifier que le prospect existe et est supprimé
      const existingProspect = await db.select()
        .from(prospects)
        .where(eq(prospects.id, prospectId))
        .limit(1);
      
      if (existingProspect.length === 0 || !existingProspect[0].deletedAt) {
        return res.status(404).json({ error: "Prospect non trouvé dans la corbeille" });
      }
      
      // Suppression définitive de la base de données
      await db.delete(prospects)
        .where(eq(prospects.id, prospectId));

      res.json({ message: "Prospect supprimé définitivement" });
    } catch (error) {
      console.error("Erreur lors de la suppression définitive:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // POST /api/prospects/:id/contact - Ajouter un contact à l'historique
  app.post("/api/prospects/:id/contact", requireAuth, async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      const { type, notes, resultat, prochainContact, objectif, actionsAPrev } = req.body;

      // Récupérer le prospect actuel
      const existingProspect = await db.select()
        .from(prospects)
        .where(and(eq(prospects.id, prospectId), isNull(prospects.deletedAt)))
        .limit(1);

      if (existingProspect.length === 0) {
        return res.status(404).json({ error: "Prospect non trouvé" });
      }

      const prospect = existingProspect[0];
      
      // Créer le nouveau contact avec structure conforme au schéma
      const nouveauContact = {
        date: new Date().toISOString(),
        type: (type || "appel") as "appel" | "email" | "sms" | "rencontre",
        commentaire: notes || "",
        resultat: (resultat || "neutre") as "positif" | "neutre" | "negatif",
      };

      // Mettre à jour l'historique
      const historiqueActuel = Array.isArray(prospect.historiqueContacts) ? prospect.historiqueContacts : [];
      const nouvelHistorique = [...historiqueActuel, nouveauContact];

      // Déterminer le nouveau stade basé sur le résultat
      let nouveauStade = prospect.stade;
      if (resultat === "positif" && prospect.stade === "nouveau") {
        nouveauStade = "contacte";
      } else if (resultat === "positif" && prospect.stade === "contacte") {
        nouveauStade = "qualifie";
      }

      // Mettre à jour le prospect
      const result = await db.update(prospects)
        .set({
          historiqueContacts: nouvelHistorique,
          nombreContacts: (prospect.nombreContacts || 0) + 1,
          dernierContact: new Date(),
          prochainContact: prochainContact ? new Date(prochainContact) : prospect.prochainContact,
          stade: nouveauStade,
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, prospectId))
        .returning();

      // Créer automatiquement une tâche pour le nouveau contact si une date de prochain contact est définie
      if (result[0] && notes && notes.trim().length > 0 && prochainContact) {
        await createTaskFromProspectComment({
          ...result[0],
          commentaire: notes,
          prochainContact: prochainContact
        });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Erreur lors de l_ajout du contact:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // GET /api/prospects/stats - Statistiques globales des prospects
  app.get("/api/prospects/stats", async (req, res) => {
    try {
      const allProspects = await db.select()
        .from(prospects)
        .where(isNull(prospects.deletedAt));

      const stats = {
        total: allProspects.length,
        parType: {
          client: allProspects.filter(p => p.type === "client").length,
          vendeur: allProspects.filter(p => p.type === "vendeur").length,
        },
        parStade: {
          nouveau: allProspects.filter(p => p.stade === "nouveau").length,
          contacte: allProspects.filter(p => p.stade === "contacte").length,
          qualifie: allProspects.filter(p => p.stade === "qualifie").length,
          pret_signature: allProspects.filter(p => p.stade === "pret_signature").length,
          converti: allProspects.filter(p => p.stade === "converti").length,
        },
        economiesCalculees: allProspects.filter(p => p.type === "client" && p.economyData && p.economyData.monthlySavings > 0).length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
}