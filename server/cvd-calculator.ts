import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Calcul CVD pour admin avec TOUS les clients installés ce mois
 */
export async function calculateCVDCommissionForAdmin() {
  try {
    console.log(`CVD ADMIN: Calcul pour TOUS les clients installés ce mois`);
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    console.log(`CVD ADMIN: Calcul pour le mois ${firstDayOfMonth.toISOString().split('T')[0]} à ${lastDayOfMonth.toISOString().split('T')[0]}`);
    
    // Récupérer TOUS les clients avec installation ce mois
    const clientsData = await db.execute(sql`
      SELECT 
        id, 
        CONCAT(prenom, ' ', nom) as name,
        produit,
        "dateInstallation" as dateInstallation,
        CASE 
          WHEN produit = 'Freebox Ultra' THEN 6
          WHEN produit = 'Freebox Essentiel' THEN 5
          WHEN produit = 'Freebox Pop' THEN 4
          WHEN produit = 'Forfait 5G' OR produit = '5G' THEN 1
          ELSE 0
        END as points
      FROM clients 
      WHERE deletedAt IS NULL 
        AND produit IS NOT NULL
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${firstDayOfMonth.toISOString().split('T')[0]}
        AND "dateInstallation" <= ${lastDayOfMonth.toISOString().split('T')[0]}
      ORDER BY "dateInstallation" ASC, id ASC
    `);
    
    const clients = (clientsData as any).rows;
    let totalCommission = 0;
    let cumulativePoints = 0;
    const detailedSales = [];
    
    console.log(`CVD ADMIN: ${clients.length} clients trouvés avec dateInstallation valide ce mois`);
    
    // Traiter chaque client chronologiquement
    for (const client of clients) {
      const clientPoints = parseInt(client.points);
      const previousPoints = cumulativePoints;
      cumulativePoints += clientPoints;
      
      // Vérifier si on franchit un palier de 5 points
      const previousPalier = Math.floor(previousPoints / 5);
      const currentPalier = Math.floor(cumulativePoints / 5);
      
      let clientCommission = 0;
      
      if (currentPalier > previousPalier) {
        // On franchit un ou plusieurs paliers
        for (let palier = previousPalier + 1; palier <= currentPalier; palier++) {
          const palierPoints = palier * 5;
          
          let palierCommission = 0;
          
          if (palier === 1) {
            // Premier palier: 60€ (10€ + 50€)
            palierCommission = 60;
          } else {
            // Paliers suivants: 50€ chacun
            palierCommission = 50;
          }
          
          clientCommission += palierCommission;
          totalCommission += palierCommission;
          
          console.log(`CVD ADMIN: Palier ${palier} (${palierPoints} points) franchi par ${client.name} (${client.produit}) - ${palierCommission}€`);
        }
      }
      
      detailedSales.push({
        id: client.id,
        clientName: client.name,
        productType: client.produit,
        points: clientPoints,
        commission: clientCommission,
        cumulativePoints,
        date: client.dateInstallation,
        tier: Math.ceil(cumulativePoints / 25)
      });
    }
    
    console.log(`CVD ADMIN: Commission totale: ${totalCommission}€ pour ${cumulativePoints} points`);
    
    return {
      totalCommission,
      totalPoints: cumulativePoints,
      detailedSales,
      currentTranche: Math.ceil(cumulativePoints / 25),
      clientsCount: clients.length
    };
    
  } catch (error) {
    console.error("Erreur calcul CVD Admin:", error);
    return {
      totalCommission: 0,
      totalPoints: 0,
      detailedSales: [],
      currentTranche: 1,
      clientsCount: 0
    };
  }
}

/**
 * Calcul CVD corrigé avec logique de paliers de 5 points
 * Premier palier: 60€ (10€ + 50€)
 * Paliers suivants: 50€ chacun
 */
export async function calculateCVDCommissionCorrected(codeVendeur: string) {
  try {
    console.log(`CVD CORRECTED: Calcul pour vendeur ${codeVendeur}`);
    
    // CORRECTION CRITIQUE: Synchroniser avec le calcul du dashboard
    // Utiliser UNIQUEMENT les clients avec dateInstallation pour être cohérent avec les points mensuels
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    console.log(`CVD CORRECTED: Calcul synchronisé pour le mois ${firstDayOfMonth.toISOString().split('T')[0]} à ${lastDayOfMonth.toISOString().split('T')[0]}`);
    
    // CORRECTION CRITIQUE: Utiliser exactement la même logique que les sales stats
    // Utiliser la colonne 'produit' au lieu de 'forfaitType' pour la cohérence
    const clientsData = await db.execute(sql`
      SELECT 
        id, 
        CONCAT(prenom, ' ', nom) as name,
        produit,
        "dateInstallation" as dateInstallation,
        CASE 
          WHEN produit = 'Freebox Ultra' THEN 6
          WHEN produit = 'Freebox Essentiel' THEN 5
          WHEN produit = 'Freebox Pop' THEN 4
          WHEN produit = 'Forfait 5G' OR produit = '5G' THEN 1
          ELSE 0
        END as points
      FROM clients 
      WHERE "codeVendeur" = ${codeVendeur}
        AND deletedAt IS NULL 
        AND produit IS NOT NULL
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${firstDayOfMonth.toISOString().split('T')[0]}
        AND "dateInstallation" <= ${lastDayOfMonth.toISOString().split('T')[0]}
      ORDER BY "dateInstallation" ASC, id ASC
    `);
    
    const clients = (clientsData as any).rows;
    let totalCommission = 0;
    let cumulativePoints = 0;
    const detailedSales = [];
    
    console.log(`CVD CORRECTED: ${clients.length} clients trouvés pour ${currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })} avec dateInstallation valide`);
    
    // Traiter chaque client chronologiquement
    for (const client of clients) {
      const clientPoints = parseInt(client.points);
      const previousPoints = cumulativePoints;
      cumulativePoints += clientPoints;
      
      // Vérifier si on franchit un palier de 5 points
      const previousPalier = Math.floor(previousPoints / 5);
      const currentPalier = Math.floor(cumulativePoints / 5);
      
      let clientCommission = 0;
      
      if (currentPalier > previousPalier) {
        // On franchit un ou plusieurs paliers
        for (let palier = previousPalier + 1; palier <= currentPalier; palier++) {
          const palierPoints = palier * 5;
          
          // Logique de commission corrigée
          let palierCommission = 0;
          
          if (palier === 1) {
            // Premier palier: 60€ (10€ + 50€)
            palierCommission = 60;
          } else {
            // Paliers suivants: 50€ chacun
            palierCommission = 50;
          }
          
          clientCommission += palierCommission;
          totalCommission += palierCommission;
          
          // Palier franchi
        }
      }
      
      detailedSales.push({
        id: client.id,
        clientName: client.name,
        productType: client.produit,
        points: clientPoints,
        commission: clientCommission,
        cumulativePoints,
        date: client.dateInstallation,
        tier: Math.ceil(cumulativePoints / 25) // Tranche 1-4 selon les 25 points
      });
    }
    
    // Calcul terminé
    
    return {
      totalCommission,
      totalPoints: cumulativePoints,
      detailedSales,
      currentTranche: Math.ceil(cumulativePoints / 25),
      clientsCount: clients.length
    };
    
  } catch (error) {
    console.error("Erreur calcul CVD:", error);
    return {
      totalCommission: 0,
      totalPoints: 0,
      detailedSales: [],
      currentTranche: 1,
      clientsCount: 0
    };
  }
}

/**
 * Fonction principale pour calculer CVD par userId et période (format MM/YYYY)
 * Utilisée par l'endpoint de génération de factures
 */
export async function calculateCVDCommission(userId: number, periode: string) {
  try {
    console.log(`🎯 CVD TEMPS REEL: Calcul pour userId=${userId}, mois=${periode}`);
    
    // Convertir la période (ex: "8/2025") en dates
    const [month, year] = periode.split('/').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    console.log(`🎯 CVD TEMPS REEL: Recherche installations du ${startDate.toISOString()} au ${endDate.toISOString()}`);
    
    // Récupérer toutes les installations du mois pour ce vendeur
    const installationsData = await db.execute(sql`
      SELECT 
        id,
        prenom,
        nom,
        produit,
        "dateInstallation",
        CASE 
          WHEN produit = 'Freebox Ultra' THEN 6
          WHEN produit = 'Freebox Essentiel' THEN 5
          WHEN produit = 'Freebox Pop' THEN 4
          WHEN produit = 'Forfait 5G' OR produit = '5G' THEN 1
          ELSE 0
        END as points
      FROM clients 
      WHERE userid = ${userId}
        AND deletedAt IS NULL 
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${startDate.toISOString()}
        AND "dateInstallation" <= ${endDate.toISOString()}
      ORDER BY "dateInstallation" ASC, id ASC
    `);
    
    const installations = (installationsData as any).rows;
    
    console.log(`📊 CVD TEMPS REEL: ${installations.length} installations trouvées pour userId ${userId}`);
    
    if (installations.length === 0) {
      return {
        totalCommission: 0,
        totalPoints: 0,
        installations: [],
        palier: 1
      };
    }
    
    // Calculer les points totaux et commissions
    let totalPoints = 0;
    let totalCommission = 0;
    const installationDetails = [];
    
    for (const installation of installations) {
      const points = parseInt(installation.points) || 0;
      totalPoints += points;
      
      installationDetails.push({
        id: installation.id,
        nom: installation.nom || '',
        prenom: installation.prenom || '',
        produit: installation.produit || '',
        points: points,
        dateInstallation: installation.dateInstallation,
        pointsDescription: `${installation.prenom} ${installation.nom} - ${installation.produit} (${points}pts)`
      });
    }
    
    // Calculer la commission selon le système CVD par paliers
    const nbPaliers = Math.floor(totalPoints / 5);
    if (nbPaliers >= 1) {
      // Premier palier: 60€ (10€ + 50€)
      totalCommission = 60;
      
      // Paliers supplémentaires: 50€ chacun
      if (nbPaliers > 1) {
        totalCommission += (nbPaliers - 1) * 50;
      }
    }
    
    const palier = Math.min(Math.floor(totalPoints / 25) + 1, 8);
    
    console.log(`📈 CVD CALCUL: ${installations.length} installations avec points [${installationDetails.map(i => i.pointsDescription).join(', ')}]`);
    console.log(`📊 CVD RESULTAT: ${nbPaliers} paliers, ${totalCommission}€, ${totalPoints} points`);
    
    return {
      totalCommission,
      totalPoints,
      installations: installationDetails,
      palier
    };
    
  } catch (error) {
    console.error("❌ Erreur calcul CVD commission:", error);
    return {
      totalCommission: 0,
      totalPoints: 0,
      installations: [],
      palier: 1
    };
  }
}

/**
 * Calcule les commissions avec paliers à partir d'un tableau d'installations
 * Utilisé pour synchroniser les calculs entre API et factures
 */
export function calculateCommissionsAvecPaliers(installations: any[]) {
  let totalCommission = 0;
  let cumulativePoints = 0;
  const ventesDetails = [];
  
  // Calculer les points totaux
  const totalPoints = installations.reduce((total, installation) => {
    const points = calculateInstallationPoints(installation.produit || '');
    return total + points;
  }, 0);
  
  // Calculer la commission selon le système CVD par paliers de 5 points
  const nbPaliers = Math.floor(totalPoints / 5);
  if (nbPaliers >= 1) {
    // Premier palier: 60€ (10€ + 50€)
    totalCommission = 60;
    
    // Paliers supplémentaires: 50€ chacun
    if (nbPaliers > 1) {
      totalCommission += (nbPaliers - 1) * 50;
    }
  }
  
  // Détailler chaque installation pour la cohérence
  for (const installation of installations) {
    const points = calculateInstallationPoints(installation.produit || '');
    const previousPoints = cumulativePoints;
    cumulativePoints += points;
    
    // Vérifier si cette installation franchit un palier
    const previousPalier = Math.floor(previousPoints / 5);
    const currentPalier = Math.floor(cumulativePoints / 5);
    
    let installationCommission = 0;
    if (currentPalier > previousPalier) {
      // Cette installation contribue à franchir un palier
      for (let palier = previousPalier + 1; palier <= currentPalier; palier++) {
        if (palier === 1) {
          installationCommission += 60; // Premier palier
        } else {
          installationCommission += 50; // Paliers suivants
        }
      }
    }
    
    ventesDetails.push({
      client: `${installation.prenom || ''} ${installation.nom || ''}`.trim(),
      produit: installation.produit || '',
      points: points,
      commission: installationCommission,
      tranche: Math.min(Math.floor(cumulativePoints / 25) + 1, 4)
    });
  }
  
  return {
    totalCommission,
    totalPoints,
    ventesDetails,
    nbPaliers
  };
}

/**
 * Fonction utilitaire pour calculer les points d'une installation
 */
function calculateInstallationPoints(produit: string): number {
  switch (produit) {
    case 'Freebox Ultra':
      return 6;
    case 'Freebox Essentiel':
      return 5;
    case 'Freebox Pop':
      return 4;
    case 'Forfait 5G':
    case '5G':
      return 1;
    default:
      return 0;
  }
}