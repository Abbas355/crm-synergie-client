import { db } from './index';
import { recruiters, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function seedRecruiters() {
  try {
    console.log("Création des recruteurs de test...");
    
    // Vérifier si des recruteurs existent déjà
    const existingRecruiters = await db.select().from(recruiters);
    
    if (existingRecruiters.length > 0) {
      console.log(`${existingRecruiters.length} recruteurs existent déjà`);
      for (const rec of existingRecruiters) {
        console.log(`- ${rec.prenom} ${rec.nom} (ID: ${rec.id})`);
      }
    } else {
      // Définir les noms d'utilisateurs
      const username1 = "recruteur1@synergie.com";
      const username2 = "recruteur2@synergie.com";
      
      // Vérifier si les utilisateurs existent déjà
      const existingUser1 = await db.select().from(users).where(eq(users.username, username1)).limit(1);
      const existingUser2 = await db.select().from(users).where(eq(users.username, username2)).limit(1);
      
      let user1: any;
      let user2: any;
      
      // Créer l'utilisateur 1 s'il n'existe pas
      if (existingUser1.length === 0) {
        const user1Data = {
          username: username1,
          password: await hashPassword("password123"),
        };
        const newUser1 = await db.insert(users).values(user1Data).returning();
        user1 = newUser1[0];
        console.log(`Utilisateur créé: ${user1.username} (ID: ${user1.id})`);
      } else {
        user1 = existingUser1[0];
        console.log(`Utilisateur existant: ${user1.username} (ID: ${user1.id})`);
      }
      
      // Créer l'utilisateur 2 s'il n'existe pas
      if (existingUser2.length === 0) {
        const user2Data = {
          username: username2,
          password: await hashPassword("password123"),
        };
        const newUser2 = await db.insert(users).values(user2Data).returning();
        user2 = newUser2[0];
        console.log(`Utilisateur créé: ${user2.username} (ID: ${user2.id})`);
      } else {
        user2 = existingUser2[0];
        console.log(`Utilisateur existant: ${user2.username} (ID: ${user2.id})`);
      }

      // Vérifier si les recruteurs existent déjà pour ces utilisateurs
      const existingRecruiter1 = await db.select().from(recruiters).where(eq(recruiters.userId, user1.id)).limit(1);
      const existingRecruiter2 = await db.select().from(recruiters).where(eq(recruiters.userId, user2.id)).limit(1);
      
      // Créer les recruteurs s'ils n'existent pas
      if (existingRecruiter1.length === 0) {
        const recruiter1Data = {
          userId: user1.id,
          nom: "Dupont",
          prenom: "Jean",
          codeVendeur: "V001",
          email: user1.username,
          telephone: "0601020304",
          niveau: 2,
          statut: "actif",
          niveauExperience: "senior"
        };
        
        const newRecruiter1 = await db.insert(recruiters).values(recruiter1Data).returning();
        console.log(`Recruteur créé: ${recruiter1Data.prenom} ${recruiter1Data.nom} (ID: ${newRecruiter1[0].id})`);
      } else {
        console.log(`Recruteur existant: ${existingRecruiter1[0].prenom} ${existingRecruiter1[0].nom} (ID: ${existingRecruiter1[0].id})`);
      }
      
      if (existingRecruiter2.length === 0) {
        const recruiter2Data = {
          userId: user2.id,
          nom: "Martin",
          prenom: "Sophie",
          codeVendeur: "V002",
          email: user2.username,
          telephone: "0607080910",
          niveau: 1,
          statut: "actif",
          niveauExperience: "junior"
        };
        
        const newRecruiter2 = await db.insert(recruiters).values(recruiter2Data).returning();
        console.log(`Recruteur créé: ${recruiter2Data.prenom} ${recruiter2Data.nom} (ID: ${newRecruiter2[0].id})`);
      } else {
        console.log(`Recruteur existant: ${existingRecruiter2[0].prenom} ${existingRecruiter2[0].nom} (ID: ${existingRecruiter2[0].id})`);
      }
    }

    console.log("Seed des recruteurs terminé avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors du seed des recruteurs :", error);
    process.exit(1);
  }
}

seedRecruiters();