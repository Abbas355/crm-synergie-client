/**
 * SYSTÈME CVD TEMPS RÉEL - CALCUL PAR PALIERS DE 5 POINTS
 * 
 * Logique officielle :
 * - CRITÈRE UNIQUE : Date d'installation du mois en cours
 * - Démarrage du mois à la Tranche 1
 * - Commissions se déclenchent aux paliers: 5pts, 10pts, 15pts, 20pts, 25pts, 30pts, 35pts...
 * - Changement de tranche automatique selon points cumulés
 * - Calcul tranche par tranche puis addition finale
 * 
 * BARÈME OFFICIEL - CORRIGÉ 28/08/2025:
 * Tranche 1 (0-25pts): Ultra/Pop/Essentiel 50€, Forfait 5G 10€
 * Tranche 2 (26-50pts): Ultra 80€ | Pop 60€ | Essentiel 70€ | Forfait 5G 10€
 * Tranche 3 (51-100pts): Ultra 100€ | Pop 70€ | Essentiel 90€ | Forfait 5G 10€
 * Tranche 4 (101+pts): Ultra 120€ | Pop 90€ | Essentiel 100€ | Forfait 5G 10€
 */

import { db } from "../db/index";
import { clients } from "@shared/schema";
import { eq, and, gte, lte, ne, sql } from "drizzle-orm";

// Barème officiel par tranche - CORRECTION 28/08/2025
const BAREME_CVD = {
  1: { "Freebox Ultra": 50, "Freebox Pop": 50, "Freebox Essentiel": 50, "Forfait 5G": 10 },
  2: { "Freebox Ultra": 80, "Freebox Pop": 60, "Freebox Essentiel": 70, "Forfait 5G": 10 },
  3: { "Freebox Ultra": 100, "Freebox Pop": 70, "Freebox Essentiel": 90, "Forfait 5G": 10 },
  4: { "Freebox Ultra": 120, "Freebox Pop": 90, "Freebox Essentiel": 100, "Forfait 5G": 10 } // CORRIGÉ: Pop 120→90, Essentiel 120→100
};

// Points par produit
const POINTS_PRODUIT = {
  "Freebox Ultra": 6,
  "Freebox Pop": 4,
  "Freebox Essentiel": 5,
  "Forfait 5G": 1
};

// Limites de tranches (points minimum pour accéder à la tranche)
const LIMITES_TRANCHES = {
  1: 0,   // 0-25 points
  2: 26,  // 26-50 points
  3: 51,  // 51-100 points
  4: 101  // 101+ points
};

interface ClientVente {
  id: number;
  prenom: string;
  nom: string;
  produit: string;
  dateInstallation: Date; // Gardé pour compatibilité mais alimenté par dateSignature
  points: number;
}

interface PalierCommission {
  palier: number;
  pointsCumules: number;
  tranche: number;
  produit: string;
  commission: number;
  client: string;
}

interface ResultatCVD {
  commissionsParTranche: { [tranche: number]: number };
  commissionsDetaillees: PalierCommission[];
  totalCommission: number;
  pointsTotal: number;
  trancheFinale: number;
  paliersAtteints: number[];
  detailedSales?: ClientVente[]; // Ajout pour le tableau des factures
}

/**
 * Détermine la tranche selon les points cumulés
 */
function determinerTranche(pointsCumules: number): number {
  if (pointsCumules >= LIMITES_TRANCHES[4]) return 4;
  if (pointsCumules >= LIMITES_TRANCHES[3]) return 3;
  if (pointsCumules >= LIMITES_TRANCHES[2]) return 2;
  return 1;
}

/**
 * Vérifie si un nouveau palier de 5 points est franchi
 */
function verifierPalierFranchi(pointsAvant: number, pointsApres: number): number | null {
  const palierAvant = Math.floor(pointsAvant / 5);
  const palierApres = Math.floor(pointsApres / 5);
  
  if (palierApres > palierAvant) {
    return (palierApres * 5); // Retourne le palier franchi (5, 10, 15, 20...)
  }
  return null;
}

/**
 * Calcul CVD temps réel avec progression par paliers
 */
export async function calculerCVDTempsReel(userId: number, mois: number, annee: number): Promise<ResultatCVD> {
  // CRITIQUE: Récupérer les clients avec date d'installation du mois en cours UNIQUEMENT
  const startDate = new Date(annee, mois - 1, 1);
  const endDate = new Date(annee, mois, 0, 23, 59, 59);
  
  console.log(`🎯 CVD TEMPS REEL: Recherche installations du ${startDate.toISOString()} au ${endDate.toISOString()}`);
  
  // Utilisation de l'ORM Drizzle - FILTRE PAR DATE D'INSTALLATION DU MOIS EN COURS
  const ventesResult = await db.select({
    id: clients.id,
    prenom: clients.prenom,
    nom: clients.nom,
    produit: clients.produit,
    dateInstallation: clients.dateInstallation
  }).from(clients)
  .where(and(
    eq(clients.userid, userId),
    gte(clients.dateInstallation, startDate),
    lte(clients.dateInstallation, endDate),
    // Exclure les clients sans date d'installation
    sql`${clients.dateInstallation} IS NOT NULL`
  ))
  .orderBy(clients.dateInstallation);
  
  console.log(`📊 CVD TEMPS REEL: ${ventesResult.length} installations trouvées pour userId ${userId}`);

  // Mapper les résultats avec le type correct - INSTALLATIONS DU MOIS
  const ventes = ventesResult.map(row => ({
    id: row.id,
    prenom: row.prenom || '',
    nom: row.nom || '',
    produit: row.produit || '',
    dateInstallation: row.dateInstallation ? new Date(row.dateInstallation) : new Date(),
    points: POINTS_PRODUIT[row.produit as keyof typeof POINTS_PRODUIT] || 0
  }));
  
  console.log(`📈 CVD CALCUL: ${ventes.length} installations avec points`, ventes.map(v => `${v.prenom} ${v.nom} - ${v.produit} (${v.points}pts)`));

  const resultat: ResultatCVD = {
    commissionsParTranche: {},
    commissionsDetaillees: [],
    totalCommission: 0,
    pointsTotal: 0,
    trancheFinale: 1,
    paliersAtteints: []
  };

  let pointsCumules = 0;

  // Traitement chronologique des ventes
  for (const vente of ventes) {
    const pointsAvant = pointsCumules;
    pointsCumules += vente.points;
    
    // Vérifier si un palier de 5 points est franchi
    const palierFranchi = verifierPalierFranchi(pointsAvant, pointsCumules);
    
    if (palierFranchi) {
      // Déterminer la tranche au moment du palier franchi
      const tranche = determinerTranche(pointsCumules);
      
      // Calculer la commission selon le barème de la tranche
      const baremeTranche = BAREME_CVD[tranche as keyof typeof BAREME_CVD];
      const commission = baremeTranche[vente.produit as keyof typeof baremeTranche] || 0;
      
      // Enregistrer le détail de la commission
      const palierDetail: PalierCommission = {
        palier: palierFranchi,
        pointsCumules,
        tranche,
        produit: vente.produit,
        commission,
        client: `${vente.prenom} ${vente.nom}`
      };
      
      resultat.commissionsDetaillees.push(palierDetail);
      
      // Ajouter à la tranche correspondante
      if (!resultat.commissionsParTranche[tranche]) {
        resultat.commissionsParTranche[tranche] = 0;
      }
      resultat.commissionsParTranche[tranche] += commission;
      
      // Ajouter au total
      resultat.totalCommission += commission;
      
      // Enregistrer le palier atteint
      if (!resultat.paliersAtteints.includes(palierFranchi)) {
        resultat.paliersAtteints.push(palierFranchi);
      }
      
      // Palier franchi silencieusement
    }
  }

  resultat.pointsTotal = pointsCumules;
  resultat.trancheFinale = determinerTranche(pointsCumules);
  resultat.detailedSales = ventes; // Ajout des ventes pour l'affichage factures

  // Calcul CVD terminé silencieusement

  return resultat;
}

/**
 * Récupère le détail de calcul pour affichage utilisateur
 */
export async function getDetailCalculCVD(userId: number, mois: number, annee: number) {
  const resultat = await calculerCVDTempsReel(userId, mois, annee);
  
  return {
    resume: {
      pointsTotal: resultat.pointsTotal,
      trancheActuelle: resultat.trancheFinale,
      commissionsTotal: resultat.totalCommission,
      paliersAtteints: resultat.paliersAtteints.length
    },
    detailParTranche: Object.entries(resultat.commissionsParTranche).map(([tranche, montant]) => ({
      tranche: parseInt(tranche),
      montant,
      description: `Tranche ${tranche}: ${montant}€`
    })),
    chronologieCommissions: resultat.commissionsDetaillees.map(detail => ({
      palier: detail.palier,
      client: detail.client,
      produit: detail.produit,
      tranche: detail.tranche,
      commission: detail.commission,
      pointsCumules: detail.pointsCumules
    }))
  };
}