import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { users, recruiters, recruitmentProspects } from "../shared/schema";

async function findInconsistencies() {
  console.log("===== DIAGNOSTIC DE LA BASE DE DONNÉES =====");
  
  // 1. Récupérer tous les utilisateurs
  const allUsers = await db.query.users.findMany();
  console.log(`Nombre total d'utilisateurs: ${allUsers.length}`);
  
  // 2. Récupérer tous les recruteurs
  const allRecruiters = await db.query.recruiters.findMany();
  console.log(`Nombre total de recruteurs: ${allRecruiters.length}`);
  
  // 3. Récupérer tous les prospects
  const allProspects = await db.query.recruitmentProspects.findMany();
  console.log(`Nombre total de prospects: ${allProspects.length}`);

  // 4. Identifier les utilisateurs sans recruteur associé
  const usersWithoutRecruiter = [];
  for (const user of allUsers) {
    const recruiter = await db.query.recruiters.findFirst({
      where: eq(recruiters.userId, user.id)
    });
    if (!recruiter) {
      usersWithoutRecruiter.push(user);
    }
  }
  console.log(`Utilisateurs sans recruteur associé: ${usersWithoutRecruiter.length}`);
  if (usersWithoutRecruiter.length > 0) {
    console.log("Premiers 5 utilisateurs sans recruteur:", usersWithoutRecruiter.slice(0, 5).map(u => `ID: ${u.id}, Username: ${u.username}`));
  }

  // 5. Identifier les recruteurs sans prospect associé
  const recruitersWithoutProspect = [];
  for (const recruiter of allRecruiters) {
    const prospect = await db.query.recruitmentProspects.findFirst({
      where: eq(recruitmentProspects.recruteurId, recruiter.id)
    });
    if (!prospect) {
      recruitersWithoutProspect.push(recruiter);
    }
  }
  console.log(`Recruteurs sans prospect associé: ${recruitersWithoutProspect.length}`);
  if (recruitersWithoutProspect.length > 0) {
    console.log("Premiers 5 recruteurs sans prospect:", recruitersWithoutProspect.slice(0, 5).map(r => `ID: ${r.id}, Nom: ${r.nom}, Prénom: ${r.prenom}, UserID: ${r.userId}`));
  }

  // 6. Identifier les prospects avec des recruteurs inexistants
  const prospectsWithInvalidRecruiter = [];
  for (const prospect of allProspects) {
    const recruiter = await db.query.recruiters.findFirst({
      where: eq(recruiters.id, prospect.recruteurId)
    });
    if (!recruiter) {
      prospectsWithInvalidRecruiter.push(prospect);
    }
  }
  console.log(`Prospects avec recruteur invalide: ${prospectsWithInvalidRecruiter.length}`);
  if (prospectsWithInvalidRecruiter.length > 0) {
    console.log("Premiers 5 prospects avec recruteur invalide:", prospectsWithInvalidRecruiter.slice(0, 5).map(p => `ID: ${p.id}, RecruteurID: ${p.recruteurId}`));
  }

  return {
    usersWithoutRecruiter,
    recruitersWithoutProspect,
    prospectsWithInvalidRecruiter
  };
}

async function fixInconsistencies() {
  const { usersWithoutRecruiter, recruitersWithoutProspect } = await findInconsistencies();
  
  console.log("\n===== CORRECTION DES INCOHÉRENCES =====");

  // 1. Créer des recruteurs pour les utilisateurs qui n'en ont pas
  console.log("\nCréation de profils recruteur manquants...");
  for (const user of usersWithoutRecruiter.slice(0, 5)) { // Limiter aux 5 premiers pour éviter les problèmes
    try {
      const codeVendeur = `FR${Math.floor(10000000 + Math.random() * 90000000)}`;
      const username = user.username;
      const prenom = username.split('@')[0]; // Utiliser la partie avant @ comme prénom
      
      console.log(`Création d'un recruteur pour l'utilisateur ${user.id} (${username})...`);
      
      const [newRecruiter] = await db.insert(recruiters).values({
        userId: user.id,
        nom: "Utilisateur",
        prenom: prenom,
        email: username,
        telephone: "",
        codeVendeur,
        niveau: 1,
        statut: "actif",
        niveauExperience: "debutant",
        commissionBase: 5
      }).returning();
      
      console.log(`Recruteur créé avec succès: ID ${newRecruiter.id}`);
      
      // Créer également un prospect pour ce recruteur
      const [newProspect] = await db.insert(recruitmentProspects).values({
        prenom: newRecruiter.prenom,
        nom: newRecruiter.nom,
        email: newRecruiter.email,
        telephone: newRecruiter.telephone,
        codePostal: newRecruiter.codePostal || "",
        ville: newRecruiter.ville || "",
        source: "interne",
        stade: "formation",
        recruteurId: newRecruiter.id,
        formationCompletee: false,
        formulaireComplete: false,
        pieceIdentiteDeposee: false,
        ribDepose: false,
        contratGenere: false,
        contratSigne: false
      }).returning();
      
      console.log(`Prospect créé avec succès: ID ${newProspect.id}`);
    } catch (error) {
      console.error(`Erreur lors de la création du recruteur pour l'utilisateur ${user.id}:`, error);
    }
  }

  // 2. Créer des prospects pour les recruteurs qui n'en ont pas
  console.log("\nCréation de prospects manquants...");
  for (const recruiter of recruitersWithoutProspect.slice(0, 5)) { // Limiter aux 5 premiers pour éviter les problèmes
    try {
      console.log(`Création d'un prospect pour le recruteur ${recruiter.id}...`);
      
      const [newProspect] = await db.insert(recruitmentProspects).values({
        prenom: recruiter.prenom,
        nom: recruiter.nom,
        email: recruiter.email,
        telephone: recruiter.telephone,
        codePostal: recruiter.codePostal || "",
        ville: recruiter.ville || "",
        source: "interne",
        stade: "formation",
        recruteurId: recruiter.id,
        formationCompletee: false,
        formulaireComplete: false,
        pieceIdentiteDeposee: false,
        ribDepose: false,
        contratGenere: false,
        contratSigne: false
      }).returning();
      
      console.log(`Prospect créé avec succès: ID ${newProspect.id}`);
    } catch (error) {
      console.error(`Erreur lors de la création du prospect pour le recruteur ${recruiter.id}:`, error);
    }
  }

  console.log("\n===== VÉRIFICATION APRÈS CORRECTION =====");
  await findInconsistencies();
}

// Exécution du script
fixInconsistencies()
  .then(() => {
    console.log("\nScript de correction terminé");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur lors de l'exécution du script:", error);
    process.exit(1);
  });