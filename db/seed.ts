import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    // Supprimer toutes les données existantes pour un redémarrage propre
    await db.delete(schema.activities);
    await db.delete(schema.tasks);
    await db.delete(schema.contacts);
    await db.delete(schema.campaigns);
    await db.delete(schema.clients);
    
    // Vérifier si nous avons déjà des utilisateurs
    const existingUsers = await db.query.users.findMany();
    
    if (true) { // Forcer la réinitialisation
      console.log("Seeding database with initial data...");
      
      // Utiliser l'utilisateur existant
      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log("Using existing user with ID:", userId);
      } else {
        // Create default admin user
        const adminUser = await db.insert(schema.users).values({
          username: "admin@synergie.com",
          password: await hashPassword("password123"),
        }).returning();
        userId = adminUser[0].id;
      }
      
      // Génère un identifiant alphanumérique de format Fxxxxxxxxx
      function generateIdentifiant() {
        const random = Math.floor(100000000 + Math.random() * 900000000);
        return `F${random}`;
      }

      // Crée une date au format "DD/MM/YY"
      function randomDate() {
        const now = new Date();
        const pastDays = Math.floor(Math.random() * 90); // Entre 0 et 90 jours dans le passé
        const date = new Date(now);
        date.setDate(date.getDate() - pastDays);
        return date;
      }

      // Create sample clients
      const clients = await db.insert(schema.clients).values([
        { 
          name: "Thomas Moreau", 
          email: "t.moreau@example.com", 
          phone: "06 12 34 56 78", 
          status: "installation", 
          identifiant: "F056789012", 
          date: new Date("2025-04-28"), // 28/04/25 comme dans la capture d'écran
          type: "freebox",
          userId 
        },
        { 
          name: "Marie Martin", 
          email: "m.martin@example.com", 
          phone: "06 23 45 67 89", 
          status: "valide", 
          identifiant: "F023456789", 
          date: new Date("2025-04-20"), // 20/04/25
          type: "freebox",
          userId 
        },
        { 
          name: "Emma Laurent", 
          email: "e.laurent@example.com", 
          phone: "06 34 56 78 90", 
          status: "valide", 
          identifiant: "F001234567", 
          date: new Date("2025-04-20"), // 20/04/25
          type: "mobile",
          userId 
        },
        { 
          name: "Jean Dupont", 
          email: "j.dupont@example.com", 
          phone: "06 45 67 89 01", 
          status: "enregistre", 
          identifiant: "F012345678", 
          date: new Date("2025-04-15"), // 15/04/25
          type: "client",
          userId 
        },
        { 
          name: "Sophie Petit", 
          email: "s.petit@example.com", 
          phone: "06 56 78 90 12", 
          status: "rendez-vous", 
          identifiant: "F045678901", 
          date: new Date("2025-04-10"), // 10/04/25
          type: "freebox",
          userId 
        },
        { 
          name: "Lucas Simon", 
          email: "l.simon@example.com", 
          phone: "06 67 89 01 23", 
          status: "enregistre", 
          identifiant: "F090123456", 
          date: new Date("2025-04-10"), // 10/04/25
          type: "mobile",
          userId 
        },
        { 
          name: "Paul Bernard", 
          email: "p.bernard@example.com", 
          phone: "06 78 90 12 34", 
          status: "valide 7 jours", 
          identifiant: "F034567890", 
          date: new Date("2025-04-05"), // 05/04/25
          type: "freebox",
          userId 
        },
        { 
          name: "Julie Leroy", 
          email: "j.leroy@example.com", 
          phone: "06 89 01 23 45", 
          status: "post-production", 
          identifiant: "F067890123", 
          date: new Date("2025-03-30"), // 30/03/25
          type: "client",
          userId 
        },
        { 
          name: "Claire Fournier", 
          email: "c.fournier@example.com", 
          phone: "06 90 12 34 56", 
          status: "abandonne", 
          identifiant: "F089012345", 
          date: new Date("2025-03-15"), // 15/03/25
          type: "mobile",
          userId 
        },
        { 
          name: "Pierre Roux", 
          email: "p.roux@example.com", 
          phone: "06 01 23 45 67", 
          status: "resiliation", 
          identifiant: "F078901234", 
          date: new Date("2025-02-05"), // 05/02/25
          type: "freebox",
          userId 
        }
      ]).returning();
      
      // Create sample contacts
      await db.insert(schema.contacts).values([
        { name: "Sophie Martin", email: "s.martin@abc.com", phone: "06 12 34 56 78", position: "Directrice Marketing", clientId: clients[0].id, userId },
        { name: "Thomas Durand", email: "t.durand@xyz.fr", phone: "06 23 45 67 89", position: "Responsable Commercial", clientId: clients[1].id, userId },
        { name: "Marie Dubois", email: "m.dubois@def.fr", phone: "06 34 56 78 90", position: "Chargée de Communication", clientId: clients[2].id, userId },
      ]);
      
      // Create sample campaigns
      const campaigns = await db.insert(schema.campaigns).values([
        { name: "Printemps 2023", description: "Campagne promotionnelle printemps", status: "En cours", startDate: new Date("2023-03-01"), endDate: new Date("2023-05-31"), userId },
        { name: "Lancement Produit X", description: "Lancement du nouveau produit X", status: "Planifiée", startDate: new Date("2023-06-15"), endDate: new Date("2023-07-15"), userId },
      ]).returning();
      
      // Create sample tasks
      const tasks = await db.insert(schema.tasks).values([
        { title: "Appeler le client Société DEF pour suivi de proposition", description: "Prendre rendez-vous pour présentation", status: "en_cours", priority: "urgent", dueDate: new Date(), clientId: clients[2].id, userId, assignedTo: "Sophie Martin" },
        { title: "Préparer proposition commerciale pour Entreprise GHI", description: "Inclure les nouveaux tarifs", status: "en_cours", priority: "moyen", dueDate: new Date(Date.now() + 86400000), clientId: clients[3].id, userId, assignedTo: "Thomas Durand" },
        { title: "Finaliser la campagne réseaux sociaux pour le produit X", description: "Valider les visuels et le calendrier", status: "en_cours", priority: "faible", dueDate: new Date(Date.now() + 259200000), campaignId: campaigns[1].id, userId, assignedTo: "Marie Dubois" },
      ]).returning();
      
      // Create sample activities
      await db.insert(schema.activities).values([
        { title: "Nouveau client ajouté : Société ABC", type: "Client", userId, clientId: clients[0].id, createdAt: new Date() },
        { title: "Campagne email \"Printemps 2023\" lancée", type: "Campagne", userId, campaignId: campaigns[0].id, createdAt: new Date(Date.now() - 86400000) },
        { title: "Réunion planifiée avec Entreprise XYZ", type: "Tâche", userId, clientId: clients[1].id, createdAt: new Date(Date.now() - 172800000) },
      ]);
      
      console.log("Database seeded successfully!");
    } else {
      console.log("Database already contains data, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
