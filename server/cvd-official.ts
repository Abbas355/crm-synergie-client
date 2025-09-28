import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * CALCULATEUR CVD OFFICIEL - EXACT selon screenshot utilisateur
 * Tableau des commissions par tranche et par produit
 */

// TRANCHES CVD OFFICIELLES selon screenshot
const CVD_TRANCHES = [
  { numero: 1, de: 0, a: 25, nom: "De 0 à 25" },
  { numero: 2, de: 26, a: 50, nom: "De 26 à 50" }, 
  { numero: 3, de: 51, a: 100, nom: "De 51 à 100" },
  { numero: 4, de: 101, a: 999, nom: "De 101 à +" }
];

// COMMISSIONS OFFICIELLES selon screenshot (en euros)
const COMMISSIONS_CVD = {
  "Freebox Pop": { 1: 50, 2: 60, 3: 70, 4: 80 },
  "Freebox Essentiel": { 1: 50, 2: 70, 3: 90, 4: 110 },
  "Freebox Ultra": { 1: 50, 2: 80, 3: 100, 4: 120 },
  "Forfait 5G": { 1: 10, 2: 10, 3: 10, 4: 10 }
};

// POINTS PAR PRODUIT selon screenshot
const POINTS_PRODUIT = {
  "Freebox Pop": 4,
  "Freebox Essentiel": 5, 
  "Freebox Ultra": 6,
  "Forfait 5G": 1
};

/**
 * Détermine la tranche selon le nombre de points total
 */
function determinerTranche(points: number): number {
  if (points >= 0 && points <= 25) return 1;
  if (points >= 26 && points <= 50) return 2;
  if (points >= 51 && points <= 100) return 3;
  if (points >= 101) return 4;
  return 1;
}

/**
 * Calcul CVD officiel pour un vendeur selon screenshot
 */
export async function calculateOfficialCVD(userId: string) {
  try {
        
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const endMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-31`;

    // Récupérer toutes les installations du mois pour ce vendeur
    const installationsData = await db.execute(sql`
      SELECT 
        id,
        CONCAT(prenom, ' ', nom) as clientName,
        produit,
        "dateInstallation"
      FROM clients 
      WHERE userId = ${userId}
        AND deletedAt IS NULL 
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${monthStr}
        AND "dateInstallation" <= ${endMonthStr}
      ORDER BY "dateInstallation" ASC
    `);
    
    const installations = (installationsData as any).rows;
        
    // Compter les installations par produit
    const compteurs = {
      "Freebox Ultra": 0,
      "Freebox Essentiel": 0, 
      "Freebox Pop": 0,
      "Forfait 5G": 0
    };
    
    installations.forEach((installation: any) => {
      const produit = installation.produit;
      if (produit && compteurs.hasOwnProperty(produit)) {
        compteurs[produit as keyof typeof compteurs]++;
      } else if (produit?.includes('5G') || produit === '5G') {
        compteurs["Forfait 5G"]++;
      }
    });
    
    // Calculer points total
    let totalPoints = 0;
    Object.entries(compteurs).forEach(([produit, count]) => {
      const points = POINTS_PRODUIT[produit as keyof typeof POINTS_PRODUIT] || 0;
      totalPoints += count * points;
    });

    // Déterminer la tranche
    const tranche = determinerTranche(totalPoints);
    
    // Calculer commission pour chaque produit
    let commissionTotale = 0;
    const detailsCommission: Array<{
      produit: string;
      quantite: number;
      commissionUnitaire: number;
      commissionTotale: number;
      tranche: number;
    }> = [];
    
    Object.entries(compteurs).forEach(([produit, count]) => {
      if (count > 0) {
        const commissionUnitaire = COMMISSIONS_CVD[produit as keyof typeof COMMISSIONS_CVD]?.[tranche as 1|2|3|4] || 0;
        const commissionProduit = count * commissionUnitaire;
        commissionTotale += commissionProduit;

        detailsCommission.push({
          produit,
          quantite: count,
          commissionUnitaire,
          commissionTotale: commissionProduit,
          tranche
        });
      }
    });

    return {
      totalPoints,
      tranche,
      commissionTotale,
      detailsCommission,
      installations: compteurs,
      trancheInfo: {
        numero: tranche,
        nom: CVD_TRANCHES[tranche - 1].nom,
        de: CVD_TRANCHES[tranche - 1].de,
        a: CVD_TRANCHES[tranche - 1].a
      }
    };
    
  } catch (error) {
    console.error("Erreur calcul CVD officiel:", error);
    return {
      totalPoints: 0,
      tranche: 1,
      commissionTotale: 0,
      detailsCommission: [],
      installations: { "Freebox Ultra": 0, "Freebox Essentiel": 0, "Freebox Pop": 0, "Forfait 5G": 0 },
      trancheInfo: { numero: 1, nom: "De 0 à 25", de: 0, a: 25 }
    };
  }
}

/**
 * Calcul CVD pour admin - toutes les installations du mois
 */
export async function calculateOfficialCVDAdmin() {
  try {
        
    const currentDate = new Date();
    const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const endMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-31`;
    
    // Récupérer toutes les installations du mois
    const installationsData = await db.execute(sql`
      SELECT 
        id,
        CONCAT(prenom, ' ', nom) as clientName,
        produit,
        "dateInstallation",
        userId
      FROM clients 
      WHERE deletedAt IS NULL 
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${monthStr}
        AND "dateInstallation" <= ${endMonthStr}
      ORDER BY "dateInstallation" ASC
    `);
    
    const installations = (installationsData as any).rows;
    
    // Compter par produit
    const compteurs = {
      "Freebox Ultra": 0,
      "Freebox Essentiel": 0, 
      "Freebox Pop": 0,
      "Forfait 5G": 0
    };
    
    installations.forEach((installation: any) => {
      const produit = installation.produit;
      if (produit && compteurs.hasOwnProperty(produit)) {
        compteurs[produit as keyof typeof compteurs]++;
      } else if (produit?.includes('5G') || produit === '5G') {
        compteurs["Forfait 5G"]++;
      }
    });
    
    // Calculer points total
    let totalPoints = 0;
    Object.entries(compteurs).forEach(([produit, count]) => {
      const points = POINTS_PRODUIT[produit as keyof typeof POINTS_PRODUIT] || 0;
      totalPoints += count * points;
    });
    
    const tranche = determinerTranche(totalPoints);
    
    // Calculer commission totale
    let commissionTotale = 0;
    Object.entries(compteurs).forEach(([produit, count]) => {
      if (count > 0) {
        const commissionUnitaire = COMMISSIONS_CVD[produit as keyof typeof COMMISSIONS_CVD]?.[tranche as 1|2|3|4] || 0;
        commissionTotale += count * commissionUnitaire;
      }
    });
    
    return {
      totalPoints,
      tranche,
      commissionTotale,
      installations: compteurs,
      clientsCount: installations.length
    };
    
  } catch (error) {
    console.error("Erreur calcul CVD Admin:", error);
    return {
      totalPoints: 0,
      tranche: 1,
      commissionTotale: 0,
      installations: { "Freebox Ultra": 0, "Freebox Essentiel": 0, "Freebox Pop": 0, "Forfait 5G": 0 },
      clientsCount: 0
    };
  }
}