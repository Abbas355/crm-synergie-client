// SYSTÈME CVD PROGRESSIF - Déclenchement tous les 5 points
// Basé sur CVD_SYSTEM_LOCKED.md et barème officiel screenshot utilisateur

import { db } from "@db";
import { sql } from "drizzle-orm";

// Barème CVD officiel selon screenshot utilisateur - MISE À JOUR JUILLET 2025
const COMMISSIONS_CVD = {
  'Freebox Pop': [50, 60, 70, 90],      // T1, T2, T3, T4
  'Freebox Essentiel': [50, 70, 90, 100], // T1, T2, T3, T4
  'Freebox Ultra': [50, 80, 100, 120],   // T1, T2, T3, T4
  'Forfait 5G': [10, 10, 10, 10],       // Fixe toutes tranches
  '5G': [10, 10, 10, 10]
};

const POINTS_PRODUIT = {
  'Freebox Ultra': 6,
  'Freebox Essentiel': 5,
  'Freebox Pop': 4,
  'Forfait 5G': 1,
  '5G': 1
};

function determinerTranche(points: number): number {
  if (points >= 101) return 4;
  if (points >= 51) return 3;
  if (points >= 26) return 2;
  return 1;
}

interface InstallationClient {
  id: number;
  prenom: string;
  nom: string;
  produit: string;
  dateInstallation: string;
}

interface CommissionPalier {
  palier: number;
  pointsRequis: number;
  pointsAtteints: number;
  commissionObtenue: number;
  tranche: number;
  clientsContributeurs: string[];
}

export async function calculateProgressiveCVD(userId: string) {
  try {
    console.log(`🎯 CALCUL CVD PROGRESSIF pour userId ${userId}`);
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Récupérer toutes les installations du mois triées par date
    const installationsResult = await db.execute(sql`
      SELECT 
        id, prenom, nom, produit, "dateInstallation"
      FROM clients 
      WHERE userid = ${userId}
        AND "deletedAt" IS NULL 
        AND status = 'installation'
        AND "dateInstallation" IS NOT NULL
        AND "dateInstallation" >= ${firstDayOfMonth.toISOString().split('T')[0]}
        AND "dateInstallation" <= ${lastDayOfMonth.toISOString().split('T')[0]}
      ORDER BY "dateInstallation" ASC
    `);
    
    const installations = (installationsResult as any).rows as InstallationClient[];
    
    console.log(`📊 ${installations.length} installations trouvées pour le calcul progressif`);
    
    let pointsCumules = 0;
    let commissionTotale = 0;
    const paliersDetails: CommissionPalier[] = [];
    const commissionsParProduit: { [key: string]: number } = {};
    
    // Simuler l'accumulation progressive des points
    installations.forEach((client, index) => {
      const pointsClient = POINTS_PRODUIT[client.produit as keyof typeof POINTS_PRODUIT] || 0;
      const pointsAvant = pointsCumules;
      pointsCumules += pointsClient;
      
      console.log(`🔄 Client ${client.prenom} ${client.nom} (${client.produit}): +${pointsClient} pts → Total: ${pointsCumules}`);
      
      // Vérifier si on a franchi des paliers de 5 points
      const palierAvant = Math.floor(pointsAvant / 5);
      const palierApres = Math.floor(pointsCumules / 5);
      
      if (palierApres > palierAvant) {
        // Nouveaux paliers franchis !
        for (let palier = palierAvant + 1; palier <= palierApres; palier++) {
          const pointsRequisPalier = palier * 5;
          const tranchePalier = determinerTranche(pointsRequisPalier);
          
          // Commission selon la tranche ET le produit qui a déclenché le palier
          let commissionPalier = 0;
          
          // ✅ LOGIQUE PROGRESSIVE : Commission basée sur le PRODUIT du client qui déclenche le palier
          const commissionUnitaire = COMMISSIONS_CVD[client.produit as keyof typeof COMMISSIONS_CVD]?.[tranchePalier - 1] || 0;
          
          // Pour les paliers progressifs : commission = commission unitaire du produit déclencheur
          if (palier === 1) {
            // Premier palier : commission spéciale de 60€ ou selon produit
            commissionPalier = Math.max(60, commissionUnitaire);
          } else {
            // Paliers suivants : commission selon le produit et la tranche
            commissionPalier = commissionUnitaire;
          }
          
          commissionTotale += commissionPalier;
          
          // Comptabiliser par produit
          if (!commissionsParProduit[client.produit]) {
            commissionsParProduit[client.produit] = 0;
          }
          commissionsParProduit[client.produit] += commissionPalier;
          
          paliersDetails.push({
            palier,
            pointsRequis: pointsRequisPalier,
            pointsAtteints: pointsCumules,
            commissionObtenue: commissionPalier,
            tranche: tranchePalier,
            clientsContributeurs: [`${client.prenom} ${client.nom} (${client.produit})`]
          });
          
          console.log(`🎯 PALIER ${palier} FRANCHI ! ${pointsRequisPalier} pts → ${commissionPalier}€ (Tranche ${tranchePalier}, déclenché par ${client.produit})`);
        }
      }
    });
    
    const trancheFinale = determinerTranche(pointsCumules);
    const paliersTotal = Math.floor(pointsCumules / 5);
    
    console.log(`💰 CVD PROGRESSIF: ${commissionTotale}€ pour ${pointsCumules} points (${paliersTotal} paliers franchis)`);
    
    return {
      pointsTotal: pointsCumules,
      commissionTotale,
      tranche: trancheFinale,
      paliersTotal,
      paliersDetails,
      commissionsParProduit,
      installationsAnalysees: installations.length,
      systemType: 'progressif' as const
    };
    
  } catch (error) {
    console.error("Erreur calcul CVD progressif:", error);
    return {
      pointsTotal: 0,
      commissionTotale: 0,
      tranche: 1,
      paliersTotal: 0,
      paliersDetails: [],
      commissionsParProduit: {},
      installationsAnalysees: 0,
      systemType: 'progressif' as const
    };
  }
}

// Calculer les détails d'une tranche spécifique
export async function getTrancheDetails(userId: string, trancheNumber: number) {
  try {
    console.log(`📋 DÉTAILS TRANCHE ${trancheNumber} pour userId ${userId}`);
    
    const trancheInfo = {
      1: { nom: "Débutant", de: 0, a: 25, description: "Première étape de votre parcours" },
      2: { nom: "Confirmé", de: 26, a: 50, description: "Vous montez en puissance" },
      3: { nom: "Expert", de: 51, a: 100, description: "Performance remarquable" },
      4: { nom: "Champion", de: 101, a: 999, description: "Excellence absolue" }
    };
    
    const tranche = trancheInfo[trancheNumber as keyof typeof trancheInfo];
    
    if (!tranche) {
      throw new Error(`Tranche ${trancheNumber} invalide`);
    }
    
    // Barème de commission pour cette tranche
    const baremeTrancheDetails = {
      'Freebox Pop': COMMISSIONS_CVD['Freebox Pop'][trancheNumber - 1],
      'Freebox Essentiel': COMMISSIONS_CVD['Freebox Essentiel'][trancheNumber - 1],
      'Freebox Ultra': COMMISSIONS_CVD['Freebox Ultra'][trancheNumber - 1],
      'Forfait 5G': COMMISSIONS_CVD['Forfait 5G'][trancheNumber - 1]
    };
    
    return {
      numero: trancheNumber,
      nom: tranche.nom,
      pointsRequis: `${tranche.de} - ${tranche.a === 999 ? '∞' : tranche.a} points`,
      description: tranche.description,
      baremeCommissions: baremeTrancheDetails,
      avantages: [
        `Commission Freebox Ultra: ${baremeTrancheDetails['Freebox Ultra']}€`,
        `Commission Freebox Essentiel: ${baremeTrancheDetails['Freebox Essentiel']}€`,
        `Commission Freebox Pop: ${baremeTrancheDetails['Freebox Pop']}€`,
        `Commission Forfait 5G: ${baremeTrancheDetails['Forfait 5G']}€`
      ]
    };
    
  } catch (error) {
    console.error("Erreur détails tranche:", error);
    return null;
  }
}