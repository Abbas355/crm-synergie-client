import { db } from "../db";
import { users, recruiters, recruitmentProspects, recruitmentActivities, recruitmentDocuments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function deleteUserByEmail(email: string) {
  try {
    console.log(`Recherche de l'utilisateur avec l'email: ${email}`);
    
    // Trouver l'utilisateur
    const user = await db.query.users.findFirst({
      where: eq(users.username, email)
    });
    
    if (!user) {
      console.log(`Aucun utilisateur trouvé avec l'email: ${email}`);
      return;
    }
    
    console.log(`Utilisateur trouvé: ID ${user.id}, username: ${user.username}`);
    
    // Trouver le recruteur associé
    const recruteur = await db.query.recruiters.findFirst({
      where: eq(recruiters.userId, user.id)
    });
    
    if (recruteur) {
      console.log(`Recruteur trouvé: ID ${recruteur.id}`);
      
      // Trouver les prospects associés au recruteur
      const prospects = await db.query.recruitmentProspects.findMany({
        where: eq(recruitmentProspects.recruteurId, recruteur.id)
      });
      
      // Supprimer les activités et documents pour chaque prospect
      for (const prospect of prospects) {
        console.log(`Suppression des activités et documents pour le prospect ID ${prospect.id}`);
        
        // Supprimer documents
        await db.delete(recruitmentDocuments)
          .where(eq(recruitmentDocuments.prospectId, prospect.id));
          
        // Supprimer activités
        await db.delete(recruitmentActivities)
          .where(eq(recruitmentActivities.prospectId, prospect.id));
      }
      
      // Supprimer les prospects
      console.log(`Suppression des prospects pour le recruteur ID ${recruteur.id}`);
      await db.delete(recruitmentProspects)
        .where(eq(recruitmentProspects.recruteurId, recruteur.id));
      
      // Supprimer le recruteur
      console.log(`Suppression du recruteur ID ${recruteur.id}`);
      await db.delete(recruiters)
        .where(eq(recruiters.id, recruteur.id));
    }
    
    // Supprimer l'utilisateur
    console.log(`Suppression de l'utilisateur ID ${user.id}`);
    await db.delete(users)
      .where(eq(users.id, user.id));
      
    console.log(`Utilisateur ${email} supprimé avec succès`);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
  } finally {
    process.exit(0);
  }
}

// Email à supprimer
const emailToDelete = "rostand.eric@gmail.com";
deleteUserByEmail(emailToDelete);