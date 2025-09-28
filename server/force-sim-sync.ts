import { db } from "@db";
import { clients, simCards } from "@shared/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";

/**
 * Forcer la synchronisation des cartes SIM pour tous les clients avec Forfait 5G
 */
export async function forceSyncSimCards() {
  try {
    console.log("🔄 Démarrage synchronisation forcée des cartes SIM...");
    
    // 1. Trouver tous les clients avec Forfait 5G sans carte SIM
    const clientsSansSim = await db.select({
      id: clients.id,
      prenom: clients.prenom,
      nom: clients.nom,
      produit: clients.produit,
      status: clients.status,
      codeVendeur: clients.codeVendeur,
      carteSim: clients.carteSim
    })
    .from(clients)
    .where(and(
      eq(clients.produit, "Forfait 5G"),
      isNull(clients.deletedAt),
      sql`(${clients.carteSim} IS NULL OR ${clients.carteSim} = '')`
    ));
    
    console.log(`📱 Clients Forfait 5G sans carte SIM: ${clientsSansSim.length}`);
    
    // 2. Pour chaque client, trouver et attribuer une carte SIM
    for (const client of clientsSansSim) {
      try {
        console.log(`🔍 Traitement client ${client.id}: ${client.prenom} ${client.nom}`);
        
        // Chercher une carte SIM disponible pour ce vendeur
        const carteDisponible = await db.select()
          .from(simCards)
          .where(and(
            eq(simCards.statut, "disponible"),
            eq(simCards.codeVendeur, client.codeVendeur || "")
          ))
          .limit(1);
        
        if (carteDisponible.length > 0) {
          const carte = carteDisponible[0];
          
          console.log(`✅ Carte trouvée: ${carte.numero} pour ${client.prenom} ${client.nom}`);
          
          // Attribution en transaction pour éviter les conflits
          await db.transaction(async (tx) => {
            // Mettre à jour la carte SIM
            await tx.update(simCards)
              .set({
                clientId: client.id,
                statut: "Activé",
                dateAttribution: new Date(),
                dateActivation: new Date()
              })
              .where(eq(simCards.id, carte.id));
            
            // Mettre à jour le client
            await tx.update(clients)
              .set({
                carteSim: carte.numero
              })
              .where(eq(clients.id, client.id));
          });
          
          console.log(`🎯 Attribution réussie: ${carte.numero} → ${client.prenom} ${client.nom}`);
        } else {
          console.log(`⚠️ Aucune carte disponible pour ${client.prenom} ${client.nom} (vendeur: ${client.codeVendeur})`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour client ${client.id}:`, error);
      }
    }
    
    console.log("✅ Synchronisation forcée terminée");
    
  } catch (error) {
    console.error("❌ Erreur synchronisation forcée:", error);
    throw error;
  }
}

/**
 * API endpoint pour déclencher la synchronisation manuelle
 */
export function addForceSyncEndpoint(app: any) {
  app.post('/api/force-sim-sync', async (req: any, res: any) => {
    try {
      await forceSyncSimCards();
      res.json({ success: true, message: "Synchronisation forcée terminée" });
    } catch (error) {
      console.error("Erreur sync forcée:", error);
      res.status(500).json({ error: "Erreur synchronisation" });
    }
  });
}