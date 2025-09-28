import { db } from "../db";
import { simCards, clients } from "../shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Script pour nettoyer complètement la carte SIM 8933150222011572866
 * et garantir qu'elle soit vraiment disponible
 */

async function fixSimCard1572866() {
  try {
    const targetNumero = "8933150222011572866";
    
    console.log(`🔧 Nettoyage complet de la carte SIM ${targetNumero}...`);
    
    // 1. Rechercher la carte SIM
    const simCard = await db.select().from(simCards).where(eq(simCards.numero, targetNumero));
    
    if (simCard.length === 0) {
      console.error(`❌ Carte SIM ${targetNumero} non trouvée`);
      process.exit(1);
    }
    
    const card = simCard[0];
    console.log(`📋 État actuel:`, card);
    
    // 2. Nettoyer complètement la carte SIM
    const cleanResult = await db.update(simCards)
      .set({
        statut: "disponible",
        clientId: null,
        dateAttribution: null,
        dateActivation: null,
        dateInstallation: null,
        codeVendeur: null,
        note: null
      })
      .where(eq(simCards.numero, targetNumero))
      .returning();
    
    console.log(`✅ Carte SIM nettoyée:`, cleanResult[0]);
    
    // 3. Nettoyer toutes les références dans la table clients
    const clientCleanResult = await db.update(clients)
      .set({ carteSim: null })
      .where(eq(clients.carteSim, targetNumero));
    
    console.log(`🧹 Références clients nettoyées`);
    
    // 4. Vérifier l'état final
    const finalState = await db.select().from(simCards).where(eq(simCards.numero, targetNumero));
    console.log(`🔍 État final:`, finalState[0]);
    
    if (finalState[0].statut === "disponible" && finalState[0].clientId === null) {
      console.log(`✅ SUCCESS: Carte SIM ${targetNumero} est maintenant parfaitement disponible`);
    } else {
      console.error(`❌ ÉCHEC: La carte SIM n'est pas dans l'état attendu`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixSimCard1572866();