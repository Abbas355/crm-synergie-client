import { db } from "../db";
import { simCards, clients } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script pour mettre à jour les dates d'attribution des cartes SIM
 * en utilisant la date de signature du client associé
 */

async function updateAttributionDates() {
  try {
    console.log("Mise à jour des dates d'attribution des cartes SIM...");
    
    // Récupérer toutes les cartes SIM avec un client associé
    const cardsWithClients = await db.select({
      id: simCards.id,
      numero: simCards.numero,
      clientId: simCards.clientId,
      statut: simCards.statut,
      dateAttribution: simCards.dateAttribution
    }).from(simCards)
    .where(eq(simCards.statut, "Activé"));
    
    console.log(`Nombre de cartes SIM activées trouvées: ${cardsWithClients.length}`);
    
    // Pour chaque carte SIM, mettre à jour la date d'attribution avec la date de signature du client
    for (const card of cardsWithClients) {
      if (!card.clientId) {
        console.log(`Carte SIM ${card.numero} activée mais sans client associé. Ignorée.`);
        continue;
      }
      
      // Récupérer le client associé
      const client = await db.select({
        id: clients.id,
        nom: clients.nom,
        prenom: clients.prenom,
        dateSignature: clients.dateSignature
      }).from(clients)
      .where(eq(clients.id, card.clientId))
      .then(rows => rows[0]);
      
      if (!client) {
        console.log(`Client ID ${card.clientId} non trouvé pour la carte SIM ${card.numero}. Ignorée.`);
        continue;
      }
      
      if (!client.dateSignature) {
        console.log(`Le client ${client.prenom} ${client.nom} (ID: ${client.id}) n'a pas de date de signature. La carte SIM ${card.numero} sera ignorée.`);
        continue;
      }
      
      // Mettre à jour la date d'attribution avec la date de signature du client
      await db.update(simCards)
        .set({
          dateAttribution: client.dateSignature
        })
        .where(eq(simCards.id, card.id));
      
      console.log(`Carte SIM ${card.numero} mise à jour: date d'attribution = ${client.dateSignature.toISOString()}`);
    }
    
    console.log("Mise à jour des dates d'attribution terminée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour des dates d'attribution:", error);
    process.exit(1);
  }
}

// Exécuter la fonction
updateAttributionDates()
  .then(() => {
    console.log("Script terminé avec succès.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur lors de l'exécution du script:", error);
    process.exit(1);
  });