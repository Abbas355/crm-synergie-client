import { db } from "../db";
import { simCards } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script pour mettre à jour une carte SIM en la passant au statut "Disponible" à partir de son numéro
 */

async function updateSimCardByNumero() {
  try {
    const numeroSimCard = "8933150222011797778"; // Numéro de la carte SIM à mettre à jour
    
    // Rechercher la carte SIM par son numéro
    const existingCard = await db.select().from(simCards).where(eq(simCards.numero, numeroSimCard));
    
    if (existingCard.length === 0) {
      console.error(`Aucune carte SIM trouvée avec le numéro ${numeroSimCard}`);
      process.exit(1);
    }

    console.log("Carte SIM trouvée :", existingCard[0]);
    
    // Mettre à jour le statut et les relations client
    const updateData = {
      statut: "disponible",
      clientId: null,
      dateAttribution: null,
      dateActivation: null
    };

    // Exécuter la mise à jour
    const result = await db.update(simCards)
      .set(updateData)
      .where(eq(simCards.numero, numeroSimCard))
      .returning();

    console.log(`Carte SIM mise à jour avec succès:`);
    console.log(JSON.stringify(result, null, 2));
    
    console.log(`La carte SIM avec le numéro ${numeroSimCard} a été mise à jour avec le statut "disponible"`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la carte SIM:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateSimCardByNumero();