import { db } from "../db";
import { simCards, SimCardStatut } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script pour mettre à jour le statut d'une carte SIM
 * Utilisation : npx tsx scripts/update-sim-card-status.ts <id_carte_sim> <nouveau_statut>
 */

async function updateSimCardStatus() {
  if (process.argv.length < 4) {
    console.error("Usage: npx tsx scripts/update-sim-card-status.ts <id_carte_sim> <nouveau_statut>");
    console.error("Statuts possibles: Disponible, Affecté, Activé, Résilié");
    process.exit(1);
  }

  const simCardId = parseInt(process.argv[2]);
  const newStatus = process.argv[3] as SimCardStatut;

  if (isNaN(simCardId)) {
    console.error("L'ID de la carte SIM doit être un nombre");
    process.exit(1);
  }

  if (!["Disponible", "Affecté", "Activé", "Résilié"].includes(newStatus)) {
    console.error("Le statut doit être l'un des suivants : Disponible, Affecté, Activé, Résilié");
    process.exit(1);
  }

  try {
    // Vérifier si la carte SIM existe
    const existingCard = await db.select().from(simCards).where(eq(simCards.id, simCardId));
    
    if (existingCard.length === 0) {
      console.error(`Aucune carte SIM trouvée avec l'ID ${simCardId}`);
      process.exit(1);
    }

    // Si le nouveau statut est Disponible, on retire également l'association avec le client
    const updateData = newStatus === "Disponible"
      ? { statut: newStatus, clientId: null }
      : { statut: newStatus };

    // Mettre à jour le statut
    const result = await db.update(simCards)
      .set(updateData)
      .where(eq(simCards.id, simCardId))
      .returning();

    console.log(`Carte SIM mise à jour avec succès:`);
    console.log(JSON.stringify(result, null, 2));
    
    console.log(`La carte SIM ${simCardId} a été mise à jour avec le statut "${newStatus}"`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la carte SIM:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateSimCardStatus();