import { db } from "../db";
import { simCards, clients } from "../shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * Script pour corriger les codes vendeurs des cartes SIM
 * Ce script synchronise le code vendeur de chaque carte SIM avec celui du client associé
 */

async function fixSimCardVendorCodes() {
  try {
    console.log("🔧 Début de la correction des codes vendeurs des cartes SIM...");
    
    // Récupérer toutes les cartes SIM qui ont un client associé
    const simCardsWithClients = await db
      .select({
        simId: simCards.id,
        simNumero: simCards.numero,
        simCodeVendeur: simCards.codeVendeur,
        clientId: simCards.clientId,
        clientNom: clients.nom,
        clientPrenom: clients.prenom,
        clientCodeVendeur: clients.codeVendeur
      })
      .from(simCards)
      .innerJoin(clients, eq(simCards.clientId, clients.id))
      .where(and(
        isNotNull(simCards.clientId),
        isNotNull(clients.codeVendeur)
      ));

    console.log(`📊 ${simCardsWithClients.length} cartes SIM avec clients trouvées`);

    let correctionsAppliquees = 0;

    for (const card of simCardsWithClients) {
      // Vérifier si le code vendeur de la carte SIM correspond à celui du client
      if (card.simCodeVendeur !== card.clientCodeVendeur) {
        console.log(`🔄 Correction nécessaire pour la carte SIM ${card.simNumero}:`);
        console.log(`   Client: ${card.clientPrenom} ${card.clientNom}`);
        console.log(`   Code vendeur carte SIM actuel: ${card.simCodeVendeur}`);
        console.log(`   Code vendeur client: ${card.clientCodeVendeur}`);

        // Mettre à jour le code vendeur de la carte SIM
        await db
          .update(simCards)
          .set({ codeVendeur: card.clientCodeVendeur })
          .where(eq(simCards.id, card.simId));

        console.log(`   ✅ Code vendeur mis à jour: ${card.clientCodeVendeur}`);
        correctionsAppliquees++;
      } else {
        console.log(`✅ Carte SIM ${card.simNumero} (${card.clientPrenom} ${card.clientNom}) - Code vendeur déjà correct: ${card.simCodeVendeur}`);
      }
    }

    console.log(`\n🎉 Correction terminée!`);
    console.log(`📈 ${correctionsAppliquees} corrections appliquées sur ${simCardsWithClients.length} cartes SIM`);

    if (correctionsAppliquees > 0) {
      console.log(`\n🔍 Vérification post-correction...`);
      
      // Vérifier que toutes les corrections ont été appliquées
      const verificationsCartes = await db
        .select({
          simNumero: simCards.numero,
          simCodeVendeur: simCards.codeVendeur,
          clientNom: clients.nom,
          clientPrenom: clients.prenom,
          clientCodeVendeur: clients.codeVendeur
        })
        .from(simCards)
        .innerJoin(clients, eq(simCards.clientId, clients.id))
        .where(and(
          isNotNull(simCards.clientId),
          isNotNull(clients.codeVendeur)
        ));

      const cartesIncorrectes = verificationsCartes.filter(
        card => card.simCodeVendeur !== card.clientCodeVendeur
      );

      if (cartesIncorrectes.length === 0) {
        console.log(`✅ Toutes les cartes SIM ont maintenant le bon code vendeur!`);
      } else {
        console.log(`❌ ${cartesIncorrectes.length} cartes SIM ont encore un code vendeur incorrect:`);
        cartesIncorrectes.forEach(card => {
          console.log(`   - ${card.simNumero} (${card.clientPrenom} ${card.clientNom}): SIM=${card.simCodeVendeur}, Client=${card.clientCodeVendeur}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Erreur lors de la correction des codes vendeurs:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
fixSimCardVendorCodes();