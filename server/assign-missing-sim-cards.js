/**
 * Script pour assigner automatiquement des cartes SIM 
 * aux clients Forfait 5G qui n'en ont pas encore
 */

const { db } = require("../db");
const { clients, sim_cards } = require("../shared/schema");
const { eq, and, isNull, like } = require("drizzle-orm");

async function assignMissingSimCards() {
  try {
    console.log("🔍 Recherche des clients Forfait 5G sans carte SIM...");
    
    // Trouver tous les clients 5G sans carte SIM
    const clientsWithout5G = await db.query.clients.findMany({
      where: and(
        like(clients.produit, "%5G%"),
        isNull(clients.carteSim),
        isNull(clients.deletedAt)
      ),
      columns: {
        id: true,
        prenom: true,
        nom: true,
        codeVendeur: true,
        produit: true
      }
    });

    console.log(`📱 ${clientsWithout5G.length} clients 5G sans carte SIM trouvés`);

    let assignedCount = 0;
    
    for (const client of clientsWithout5G) {
      // Chercher une carte SIM disponible pour ce vendeur
      const availableSimCard = await db.query.sim_cards.findFirst({
        where: and(
          eq(sim_cards.statut, "disponible"),
          isNull(sim_cards.clientId),
          eq(sim_cards.codeVendeur, client.codeVendeur || "FR98445061")
        ),
        orderBy: sim_cards.createdAt
      });

      if (availableSimCard) {
        // Assigner la carte SIM au client
        await db.update(sim_cards)
          .set({
            clientId: client.id,
            statut: "affecte",
            dateAttribution: new Date()
          })
          .where(eq(sim_cards.id, availableSimCard.id));

        // Mettre à jour le client avec le numéro de carte SIM
        await db.update(clients)
          .set({ carteSim: availableSimCard.numero })
          .where(eq(clients.id, client.id));

        console.log(`✅ ${client.prenom} ${client.nom} -> ${availableSimCard.numero}`);
        assignedCount++;
      } else {
        console.log(`⚠️  ${client.prenom} ${client.nom} : Aucune carte SIM disponible pour ${client.codeVendeur}`);
      }
    }

    console.log(`\n🎉 ${assignedCount} cartes SIM assignées avec succès !`);
    
  } catch (error) {
    console.error("❌ Erreur lors de l'assignation :", error);
  }
}

// Exporter la fonction
module.exports = { assignMissingSimCards };

// Si exécuté directement
if (require.main === module) {
  assignMissingSimCards().then(() => {
    console.log("✅ Script terminé");
    process.exit(0);
  });
}