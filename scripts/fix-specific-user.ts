import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, recruiters, recruitmentProspects } from "../shared/schema";

async function fixSpecificUser(email: string) {
  console.log(`Tentative de correction pour l'utilisateur avec l'email: ${email}`);
  
  // 1. Récupérer l'utilisateur
  const user = await db.query.users.findFirst({
    where: eq(users.username, email)
  });
  
  if (!user) {
    console.log(`Aucun utilisateur trouvé avec l'email ${email}`);
    return;
  }
  
  console.log(`Utilisateur trouvé: ID ${user.id}`);
  
  // 2. Vérifier si l'utilisateur a déjà un recruteur
  const existingRecruiter = await db.query.recruiters.findFirst({
    where: eq(recruiters.userId, user.id)
  });
  
  if (existingRecruiter) {
    console.log(`L'utilisateur a déjà un recruteur (ID: ${existingRecruiter.id})`);
    
    // Vérifier si le recruteur a un prospect
    const existingProspect = await db.query.recruitmentProspects.findFirst({
      where: eq(recruitmentProspects.recruteurId, existingRecruiter.id)
    });
    
    if (existingProspect) {
      console.log(`Le recruteur a déjà un prospect (ID: ${existingProspect.id})`);
      return;
    }
    
    // Créer un prospect pour ce recruteur
    try {
      console.log(`Création d'un prospect pour le recruteur ID ${existingRecruiter.id}...`);
      
      const [newProspect] = await db.insert(recruitmentProspects).values({
        prenom: existingRecruiter.prenom,
        nom: existingRecruiter.nom,
        email: existingRecruiter.email,
        telephone: existingRecruiter.telephone,
        codePostal: existingRecruiter.codePostal || "",
        ville: existingRecruiter.ville || "",
        source: "interne",
        stade: "formation",
        recruteurId: existingRecruiter.id,
        formationCompletee: false,
        formulaireComplete: false,
        pieceIdentiteDeposee: false,
        ribDepose: false,
        contratGenere: false,
        contratSigne: false
      }).returning();
      
      console.log(`Prospect créé avec succès: ID ${newProspect.id}`);
    } catch (error) {
      console.error(`Erreur lors de la création du prospect:`, error);
    }
  } else {
    // 3. Créer un recruteur pour cet utilisateur
    try {
      const codeVendeur = `FR${Math.floor(10000000 + Math.random() * 90000000)}`;
      const username = user.username;
      const prenom = username.split('@')[0]; // Utiliser la partie avant @ comme prénom
      
      console.log(`Création d'un recruteur pour l'utilisateur ID ${user.id}...`);
      
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
      
      // 4. Créer un prospect pour ce recruteur
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
      console.error(`Erreur lors de la création du recruteur ou du prospect:`, error);
    }
  }
  
  console.log(`Correction terminée pour l'utilisateur ${email}`);
}

// Exécution du script pour l'utilisateur ab@test.com
fixSpecificUser("ab@test.com")
  .then(() => {
    console.log("Script terminé");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });