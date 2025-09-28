import { db } from "../../db";
import { sql } from "drizzle-orm";

// Fonction pour calculer les points selon le type de forfait
// Freebox Ultra = 6 points
// Freebox Essentiel = 5 points
// Freebox Pop = 4 points 
// Forfait 5G = 1 point
export async function calculatePoints(codeVendeur: string): Promise<number> {
  try {
    // Récupérer les différents types de forfaits pour calculer les points
    // IMPORTANT: Ne compter que les clients installés (dateInstallation IS NOT NULL)
    const pointsResult = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN "forfaitType" = 'freebox_ultra' AND "dateInstallation" IS NOT NULL THEN 1 END) as count_ultra,
        COUNT(CASE WHEN "forfaitType" = 'freebox_essentiel' AND "dateInstallation" IS NOT NULL THEN 1 END) as count_essentiel,
        COUNT(CASE WHEN "forfaitType" = 'freebox_pop' AND "dateInstallation" IS NOT NULL THEN 1 END) as count_pop,
        COUNT(CASE WHEN ("forfaitType" = 'forfait_5g' OR "forfaitType" = '5g') AND "dateInstallation" IS NOT NULL THEN 1 END) as count_5g,
        COUNT(CASE WHEN "dateInstallation" IS NOT NULL THEN 1 END) as total_count
      FROM clients 
      WHERE codeVendeur = ${codeVendeur}
    `);
    
    if (!pointsResult || !(pointsResult as any).rows || !(pointsResult as any).rows[0]) {
      console.error("Aucun résultat obtenu pour le calcul des points");
      return 0;
    }
    
    const row = (pointsResult as any).rows[0];
    const countUltra = parseInt(row.count_ultra || '0');
    const countEssentiel = parseInt(row.count_essentiel || '0');
    const countPop = parseInt(row.count_pop || '0');
    const count5G = parseInt(row.count_5g || '0');
    const totalCount = parseInt(row.total_count || '0');
    
    // Calculer le total des points selon les barèmes pour les clients avec forfait
    let totalPoints = (countUltra * 6) + (countEssentiel * 5) + (countPop * 4) + (count5G * 1);
    
    // Pour les clients sans type de forfait spécifique, attribuer 1 point par client
    const clientsWithoutForfait = totalCount - (countUltra + countEssentiel + countPop + count5G);
    
    if (clientsWithoutForfait > 0) {
      totalPoints += clientsWithoutForfait;
      console.log(`${clientsWithoutForfait} clients sans type de forfait pour ${codeVendeur}, attribution de ${clientsWithoutForfait} points supplémentaires`);
    }
    
    // Calculer le nombre de clients avec forfait attribué
    const clientsWithForfait = countUltra + countEssentiel + countPop + count5G;
    
    console.log(`Points calculés pour le vendeur ${codeVendeur}:`, {
      countUltra, countEssentiel, countPop, count5G, 
      clientsWithForfait, // Nombre de clients avec un forfait
      totalCount, // Nombre total de clients 
      totalPoints
    });
    
    return totalPoints;
  } catch (error) {
    console.error("Erreur lors du calcul des points:", error);
    return 0;
  }
}