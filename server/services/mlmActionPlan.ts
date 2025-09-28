/**
 * SERVICE MLM ACTION PLAN
 * ======================
 * 
 * Service backend pour générer des plans d'action personnalisés MLM 
 * en réutilisant la logique existante des endpoints MLM.
 * 
 * OBJECTIF :
 * - Agréger toutes les données MLM nécessaires
 * - Calculer les métriques d'équipe et points personnels
 * - Générer un plan d'action personnalisé vers RC
 * 
 * RÉUTILISE :
 * - Logique de /api/mlm/fast-start-bonus pour points personnels
 * - Logique de /api/mlm/groups-data pour équipes et points de groupe
 * - Fonction buildRCActionPlan du module partagé
 */

import { db } from "../../db";
import { users, clients } from "../../shared/schema";
import { eq, and, isNull, isNotNull, count, sum, sql } from "drizzle-orm";
import { 
  buildRCActionPlan, 
  type ActionPlanResult, 
  type MLMMetrics 
} from "../../shared/mlm-action-plan";

/**
 * FONCTION PRINCIPALE : GÉNÉRATION DU PLAN D'ACTION UTILISATEUR
 * ============================================================
 * 
 * Agrège toutes les données MLM nécessaires et génère un plan d'action
 * personnalisé pour atteindre la qualification Regional Coordinator (RC).
 * 
 * @param userId - ID de l'utilisateur pour lequel générer le plan
 * @returns Plan d'action complet avec objectifs prioritaires
 */
export async function generateUserActionPlan(userId: number): Promise<ActionPlanResult> {
  console.log(`🎯 GÉNÉRATION PLAN D'ACTION MLM pour utilisateur ${userId}`);
  
  try {
    // 1. VALIDATION DE L'UTILISATEUR
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        codeVendeur: true,
        createdAt: true,
        prenom: true,
        nom: true
      }
    });

    if (!user || !user.codeVendeur) {
      throw new Error(`Utilisateur ${userId} non trouvé ou sans code vendeur`);
    }

    console.log(`👤 Utilisateur trouvé: ${user.prenom} ${user.nom} (${user.codeVendeur})`);

    // 2. RÉCUPÉRATION DES MÉTRIQUES MLM
    const mlmMetrics = await fetchUserMLMMetrics(userId, user.codeVendeur);
    
    console.log(`📊 Métriques MLM récupérées:`, {
      personalPoints: mlmMetrics.personalPoints,
      groupPoints: mlmMetrics.groupPoints,
      teamCount: Object.keys(mlmMetrics.teamPoints).length,
      recruitsCount: mlmMetrics.recruitsCount,
      joursDepuisInscription: mlmMetrics.joursDepuisInscription
    });

    // 3. GÉNÉRATION DU PLAN D'ACTION
    const actionPlan = buildRCActionPlan(mlmMetrics);
    
    console.log(`✅ Plan d'action généré avec ${actionPlan.objectives.length} objectifs prioritaires`);
    
    return actionPlan;

  } catch (error) {
    console.error(`❌ Erreur génération plan d'action pour utilisateur ${userId}:`, error);
    throw error;
  }
}

/**
 * FONCTION UTILITAIRE : RÉCUPÉRATION DES MÉTRIQUES MLM
 * ===================================================
 * 
 * Agrège toutes les données MLM depuis la base de données
 * en réutilisant la logique des endpoints existants.
 */
async function fetchUserMLMMetrics(userId: number, codeVendeur: string): Promise<MLMMetrics> {
  console.log(`📈 Récupération métriques MLM pour ${codeVendeur}`);

  // 1. CALCUL DES POINTS PERSONNELS (lifetime)
  // Réutilise la logique de /api/mlm/fast-start-bonus
  const personalPoints = await calculatePersonalPointsLifetime(userId);
  
  // 2. CALCUL DES JOURS DEPUIS INSCRIPTION
  // Réutilise la logique MLM existante pour le démarrage d'activité
  const joursDepuisInscription = await calculateJoursDepuisDemarrage(userId);
  
  // 3. RÉCUPÉRATION DES ÉQUIPES ET POINTS
  // Réutilise la logique de /api/mlm/groups-data
  const { teamPoints, groupPoints, recruitsCount } = await fetchTeamPointsData(codeVendeur);

  return {
    personalPoints,
    groupPoints,
    teamPoints,
    joursDepuisInscription,
    recruitsCount
  };
}

/**
 * CALCUL DES POINTS PERSONNELS LIFETIME
 * ====================================
 * 
 * CORRIGÉ : Utilise exactement la même logique que les endpoints fonctionnels
 * avec codeVendeur et normalisation des produits
 */
async function calculatePersonalPointsLifetime(userId: number): Promise<number> {
  console.log(`🎯 Calcul points personnels lifetime pour userId ${userId}`);

  // 1. Récupérer le codeVendeur de l'utilisateur
  const userInfo = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { codeVendeur: true }
  });

  if (!userInfo?.codeVendeur) {
    console.warn(`⚠️ Code vendeur non trouvé pour userId ${userId}`);
    return 0;
  }

  // 2. Récupérer tous les clients INSTALLÉS du vendeur avec la logique des endpoints fonctionnels
  const installedClients = await db.query.clients.findMany({
    where: and(
      eq(clients.codeVendeur, userInfo.codeVendeur),
      isNotNull(clients.dateInstallation),
      isNull(clients.deletedAt)
    ),
    columns: {
      produit: true,
      produit: true
    }
  });

  // 3. Calculer les points avec la même logique que les endpoints fonctionnels
  let personalPoints = 0;
  for (const client of installedClients) {
    const produitNormalized = (client.produit || client.produit || '').toLowerCase();
    switch (produitNormalized) {
      case 'freebox ultra':
      case 'freebox_ultra':
        personalPoints += 6;
        break;
      case 'freebox essentiel':
      case 'freebox_essentiel':
        personalPoints += 5;
        break;
      case 'freebox pop':
      case 'freebox_pop':
        personalPoints += 4;
        break;
      case 'forfait 5g':
      case 'forfait_5g':
        personalPoints += 1;
        break;
      default:
        personalPoints += 1; // Point par défaut comme dans les endpoints fonctionnels
    }
  }

  console.log(`✅ Points personnels lifetime CORRIGÉS: ${personalPoints} (${installedClients.length} clients installés)`);
  
  return personalPoints;
}

/**
 * CALCUL DES JOURS DEPUIS DÉMARRAGE MLM
 * ====================================
 * 
 * Réutilise la logique universelle de calcul des jours
 * depuis le démarrage d'activité MLM.
 */
async function calculateJoursDepuisDemarrage(userId: number): Promise<number> {
  console.log(`📅 Calcul jours depuis démarrage MLM pour userId ${userId}`);

  // Récupérer la date de création de l'utilisateur
  const userInfo = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      createdAt: true
    }
  });

  if (!userInfo?.createdAt) {
    console.warn(`⚠️ Date de création non trouvée pour userId ${userId}, utilisation fallback`);
    return 0;
  }

  // Calcul des jours depuis la création
  const currentDate = new Date();
  const dateDemarrage = new Date(userInfo.createdAt);
  const jours = Math.floor((currentDate.getTime() - dateDemarrage.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`✅ Jours depuis démarrage: ${jours} jours (depuis ${dateDemarrage.toISOString().split('T')[0]})`);
  
  return jours;
}

/**
 * RÉCUPÉRATION DES DONNÉES D'ÉQUIPES
 * =================================
 * 
 * CORRIGÉ : Utilise exactement la même logique que /api/mlm/stats
 * avec codeVendeur et normalisation des produits
 */
async function fetchTeamPointsData(codeVendeur: string): Promise<{
  teamPoints: { [teamId: string]: number };
  groupPoints: number;
  recruitsCount: number;
}> {
  console.log(`👥 Récupération données équipes CORRIGÉES pour ${codeVendeur}`);

  // 1. RÉCUPÉRER LES RECRUES DIRECTES avec la même logique que les endpoints fonctionnels
  const directRecruits = await db.query.users.findMany({
    where: and(
      eq(users.codeParrainage, codeVendeur),
      eq(users.active, true),
      isNotNull(users.codeVendeur)
    ),
    columns: {
      id: true,
      prenom: true,
      nom: true,
      codeVendeur: true
    }
  });

  const teamPoints: { [teamId: string]: number } = {};
  let totalGroupPoints = 0;

  console.log(`👥 ${directRecruits.length} recrues directes trouvées`);

  // 2. CALCULER LES POINTS DE CHAQUE ÉQUIPE avec la logique des endpoints fonctionnels
  for (const recruit of directRecruits) {
    const recruitId = recruit.id;
    const teamId = `team_${recruitId}`;
    
    // CORRIGÉ : Utiliser codeVendeur comme les endpoints fonctionnels
    const recruitClients = await db.query.clients.findMany({
      where: and(
        eq(clients.codeVendeur, recruit.codeVendeur!),
        isNotNull(clients.dateInstallation),
        isNull(clients.deletedAt)
      ),
      columns: {
        produit: true,
        produit: true
      }
    });

    // CORRIGÉ : Calculer les points avec normalisation comme les endpoints fonctionnels
    let recruitPoints = 0;
    for (const client of recruitClients) {
      const produitNormalized = (client.produit || client.produit || '').toLowerCase();
      switch (produitNormalized) {
        case 'freebox ultra':
        case 'freebox_ultra':
          recruitPoints += 6;
          break;
        case 'freebox essentiel':
        case 'freebox_essentiel':
          recruitPoints += 5;
          break;
        case 'freebox pop':
        case 'freebox_pop':
          recruitPoints += 4;
          break;
        case 'forfait 5g':
        case 'forfait_5g':
          recruitPoints += 1;
          break;
        default:
          recruitPoints += 1; // Point par défaut comme dans les endpoints fonctionnels
      }
    }

    teamPoints[teamId] = recruitPoints;
    totalGroupPoints += recruitPoints;

    console.log(`📊 Équipe CORRIGÉE ${teamId} (${recruit.prenom} ${recruit.nom}): ${recruitPoints} points (${recruitClients.length} clients)`);
  }

  console.log(`✅ Total points de groupe CORRIGÉS: ${totalGroupPoints} sur ${directRecruits.length} équipes`);

  return {
    teamPoints,
    groupPoints: totalGroupPoints,
    recruitsCount: directRecruits.length
  };
}

/**
 * FONCTION UTILITAIRE : VALIDATION UTILISATEUR EXISTE
 * ==================================================
 * 
 * Vérifie qu'un utilisateur existe et a un code vendeur valide.
 */
export async function validateUserExists(userId: number): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        codeVendeur: true
      }
    });

    return !!(user && user.codeVendeur);
  } catch (error) {
    console.error(`❌ Erreur validation utilisateur ${userId}:`, error);
    return false;
  }
}

/**
 * FONCTION UTILITAIRE : APERÇU RAPIDE DES MÉTRIQUES
 * ================================================
 * 
 * Retourne un résumé rapide des métriques sans calcul complet du plan.
 */
export async function getQuickMLMMetrics(userId: number): Promise<{
  personalPoints: number;
  teamCount: number;
  totalGroupPoints: number;
  currentLevel: string;
} | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { codeVendeur: true }
    });

    if (!user?.codeVendeur) {
      return null;
    }

    const personalPoints = await calculatePersonalPointsLifetime(userId);
    const { teamPoints, groupPoints, recruitsCount } = await fetchTeamPointsData(user.codeVendeur);

    // Détermination rapide du niveau (logique simplifiée)
    let currentLevel = 'CQ';
    if (personalPoints >= 100 && recruitsCount >= 4) {
      currentLevel = 'Manager';
    } else if (personalPoints >= 75 && recruitsCount >= 3) {
      currentLevel = 'ETL';
    } else if (personalPoints >= 50 && recruitsCount >= 2) {
      currentLevel = 'ETT';
    }

    return {
      personalPoints,
      teamCount: Object.keys(teamPoints).length,
      totalGroupPoints: groupPoints,
      currentLevel
    };
  } catch (error) {
    console.error(`❌ Erreur récupération métriques rapides:`, error);
    return null;
  }
}