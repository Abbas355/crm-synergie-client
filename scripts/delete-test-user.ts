import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { users, recruiters, recruitmentProspects, recruitmentActivities, recruitmentDocuments } from "../shared/schema";

async function deleteUserByEmail(email: string) {
  console.log(`Tentative de suppression de l'utilisateur avec l'email: ${email}`);

  try {
    // 1. Trouver l'utilisateur
    const user = await db.query.users.findFirst({
      where: eq(users.username, email)
    });

    if (!user) {
      console.log(`Aucun utilisateur trouvé avec l'email: ${email}`);
      return;
    }

    console.log(`Utilisateur trouvé: ID ${user.id}`);

    // 2. Trouver le recruteur associé
    const recruteur = await db.query.recruiters.findFirst({
      where: eq(recruiters.userId, user.id)
    });

    if (recruteur) {
      console.log(`Recruteur trouvé: ID ${recruteur.id}`);

      // 3. Trouver les prospects associés au recruteur
      const prospects = await db.select().from(recruitmentProspects)
        .where(eq(recruitmentProspects.recruteurId, recruteur.id));

      if (prospects.length > 0) {
        console.log(`${prospects.length} prospects trouvés à supprimer`);

        // Pour chaque prospect, supprimer les activités et documents
        for (const prospect of prospects) {
          // Supprimer les documents
          const docsDeleted = await db.delete(recruitmentDocuments)
            .where(eq(recruitmentDocuments.prospectId, prospect.id));
          console.log(`${docsDeleted.rowCount ?? 0} documents supprimés pour le prospect ID ${prospect.id}`);

          // Supprimer les activités
          const activitiesDeleted = await db.delete(recruitmentActivities)
            .where(eq(recruitmentActivities.prospectId, prospect.id));
          console.log(`${activitiesDeleted.rowCount ?? 0} activités supprimées pour le prospect ID ${prospect.id}`);
        }

        // Supprimer les prospects
        const prospectsDeleted = await db.delete(recruitmentProspects)
          .where(eq(recruitmentProspects.recruteurId, recruteur.id));
        console.log(`${prospectsDeleted.rowCount ?? 0} prospects supprimés`);
      }

      // Supprimer le recruteur
      const recruteurDeleted = await db.delete(recruiters)
        .where(eq(recruiters.id, recruteur.id));
      console.log(`Recruteur supprimé: ${recruteurDeleted.rowCount ?? 0} ligne(s)`);
    }

    // 4. Supprimer les sessions associées à l'utilisateur (utiliser une approche plus simple)
    await db.execute(sql`DELETE FROM session`);
    console.log("Toutes les sessions ont été supprimées (approche simple pour le test)");

    // 5. Supprimer l'utilisateur
    const userDeleted = await db.delete(users)
      .where(eq(users.id, user.id));
    console.log(`Utilisateur supprimé: ${userDeleted.rowCount ?? 0} ligne(s)`);

    console.log(`Suppression de l'utilisateur avec l'email ${email} terminée.`);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
  }
}

// Supprimer l'utilisateur spécifié
deleteUserByEmail("rostand.eric@gmail.com")
  .then(() => {
    console.log("Script terminé");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });