import { db } from "./index";
import { simCards, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedSimCards() {
  try {
    console.log("Création des cartes SIM de test...");
    
    // Rechercher l'utilisateur admin
    const adminUser = await db.select().from(users).where(eq(users.username, "admin@synergie.com")).limit(1);
    
    if (adminUser.length === 0) {
      console.error("Utilisateur admin non trouvé");
      process.exit(1);
    }
    
    // Vérifier les cartes SIM existantes
    const existingCards = await db.select().from(simCards).where(eq(simCards.userId, adminUser[0].id));
    
    if (existingCards.length >= 5) {
      console.log(`${existingCards.length} cartes SIM déjà créées pour l'utilisateur admin`);
      
      // Mettre toutes les cartes en statut disponible pour les tests
      for (const card of existingCards) {
        if (card.statut !== "disponible") {
          await db.update(simCards)
            .set({ 
              statut: "disponible",
              clientId: null,
              dateAttribution: null
            })
            .where(eq(simCards.id, card.id));
          console.log(`Carte SIM ${card.numero} mise à jour avec le statut disponible`);
        }
      }
      
      console.log("Toutes les cartes SIM ont été mises à jour avec le statut disponible");
      process.exit(0);
    }
    
    // Créer des cartes SIM de test
    const testCards = [
      {
        codeVendeur: "V001",
        numero: "8933150222010001",
        note: "Carte SIM de test 1",
        statut: "disponible",
        userId: adminUser[0].id
      },
      {
        codeVendeur: "V001",
        numero: "8933150222010002",
        note: "Carte SIM de test 2",
        statut: "disponible",
        userId: adminUser[0].id
      },
      {
        codeVendeur: "V001",
        numero: "8933150222010003",
        note: "Carte SIM de test 3",
        statut: "disponible",
        userId: adminUser[0].id
      },
      {
        codeVendeur: "V001",
        numero: "8933150222010004",
        note: "Carte SIM de test 4",
        statut: "disponible",
        userId: adminUser[0].id
      },
      {
        codeVendeur: "V001",
        numero: "8933150222010005",
        note: "Carte SIM de test 5",
        statut: "disponible",
        userId: adminUser[0].id
      }
    ];
    
    for (const card of testCards) {
      // Vérifier si cette carte existe déjà
      const existing = await db.select().from(simCards).where(eq(simCards.numero, card.numero)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(simCards).values(card);
        console.log(`Carte SIM ${card.numero} créée`);
      } else {
        console.log(`Carte SIM ${card.numero} existe déjà`);
      }
    }
    
    console.log("Seed des cartes SIM terminé avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors du seed des cartes SIM:", error);
    process.exit(1);
  }
}

seedSimCards();