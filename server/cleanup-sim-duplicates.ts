import { db } from "./db/index.js";
import { simCards } from "./db/schema.js";
import { eq, and, isNotNull } from "drizzle-orm";

// Script pour nettoyer les doublons de cartes SIM
export async function cleanupSimCardDuplicates() {
  console.log("🧹 Démarrage du nettoyage des doublons de cartes SIM...");
  
  try {
    // Récupérer toutes les cartes SIM
    const allCards = await db.select().from(simCards).orderBy(simCards.id);
    
    console.log(`📊 Total des cartes SIM trouvées: ${allCards.length}`);
    
    // Grouper les cartes par numéro pour identifier les doublons
    const numeroGroups = new Map<string, typeof allCards>();
    
    for (const card of allCards) {
      if (!numeroGroups.has(card.numero)) {
        numeroGroups.set(card.numero, []);
      }
      numeroGroups.get(card.numero)!.push(card);
    }
    
    // Identifier les doublons
    const duplicates = Array.from(numeroGroups.entries())
      .filter(([_, cards]) => cards.length > 1);
    
    console.log(`🔍 Doublons détectés: ${duplicates.length} numéros avec plusieurs entrées`);
    
    let totalDeleted = 0;
    
    for (const [numero, cards] of duplicates) {
      console.log(`\n📋 Traitement du numéro ${numero} (${cards.length} entrées):`);
      
      // Trier par priorité : garder les cartes avec clientId en premier, puis les plus récentes
      const sortedCards = cards.sort((a, b) => {
        // Priorité 1: Cartes avec client assigné
        if (a.clientId && !b.clientId) return -1;
        if (!a.clientId && b.clientId) return 1;
        
        // Priorité 2: Cartes activées
        if (a.statut === 'Activé' && b.statut !== 'Activé') return -1;
        if (a.statut !== 'Activé' && b.statut === 'Activé') return 1;
        
        // Priorité 3: Plus récente
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      const toKeep = sortedCards[0];
      const toDelete = sortedCards.slice(1);
      
      console.log(`  ✅ Carte à conserver: ID ${toKeep.id} (Client: ${toKeep.clientId || 'aucun'}, Statut: ${toKeep.statut})`);
      
      for (const card of toDelete) {
        console.log(`  🗑️ Suppression carte ID ${card.id} (Client: ${card.clientId || 'aucun'}, Statut: ${card.statut})`);
        
        await db.delete(simCards).where(eq(simCards.id, card.id));
        totalDeleted++;
      }
    }
    
    console.log(`\n✅ Nettoyage terminé: ${totalDeleted} cartes supprimées`);
    
    // Vérifier le résultat
    const finalCards = await db.select().from(simCards);
    const finalNumeros = new Set(finalCards.map(c => c.numero));
    
    console.log(`📊 Résultat final: ${finalCards.length} cartes, ${finalNumeros.size} numéros uniques`);
    
    if (finalCards.length === finalNumeros.size) {
      console.log("✅ Aucun doublon restant détecté");
    } else {
      console.log("⚠️ Des doublons persistent, vérification manuelle requise");
    }
    
    return {
      success: true,
      deletedCount: totalDeleted,
      finalCount: finalCards.length
    };
    
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des doublons:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}

// Fonction pour lister les doublons sans les supprimer
export async function listSimCardDuplicates() {
  try {
    const allCards = await db.select().from(simCards).orderBy(simCards.id);
    
    const numeroGroups = new Map<string, typeof allCards>();
    
    for (const card of allCards) {
      if (!numeroGroups.has(card.numero)) {
        numeroGroups.set(card.numero, []);
      }
      numeroGroups.get(card.numero)!.push(card);
    }
    
    const duplicates = Array.from(numeroGroups.entries())
      .filter(([_, cards]) => cards.length > 1);
    
    console.log(`🔍 Analyse des doublons:`);
    console.log(`Total cartes: ${allCards.length}`);
    console.log(`Numéros en doublon: ${duplicates.length}`);
    
    for (const [numero, cards] of duplicates) {
      console.log(`\n📋 Numéro ${numero} (${cards.length} entrées):`);
      for (const card of cards) {
        console.log(`  - ID ${card.id}: Client ${card.clientId || 'aucun'}, Statut: ${card.statut}, Créé: ${card.createdAt}`);
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse des doublons:", error);
    return [];
  }
}