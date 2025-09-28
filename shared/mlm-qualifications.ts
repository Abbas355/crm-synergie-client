/**
 * SYSTÈME CENTRALISÉ DE QUALIFICATION MLM
 * =====================================
 * 
 * Ce fichier définit de manière définitive et centralisée tous les critères
 * de qualification MLM pour l'ensemble de l'application.
 * 
 * RÈGLES STRICTES :
 * - Ne jamais modifier les critères sans validation utilisateur
 * - Toutes les fonctions de l'app doivent utiliser ces définitions
 * - Ces critères sont la référence absolue pour toute logique de qualification
 */

export interface MLMQualificationCriteria {
  position: string;
  pointsPersonnelsRequis: number;
  equipeRequise?: {
    nombreVendeurs: number;
    conditionsSpecifiques?: string[];
  };
  pointsGroupeRequis?: number;
  delaiJours: number;
  description: string;
  bonusMontant: number;
}

/**
 * CRITÈRES OFFICIELS DE QUALIFICATION MLM
 * =======================================
 * 
 * Ces critères sont définitifs et ne peuvent être modifiés qu'avec
 * l'accord explicite de l'utilisateur.
 */
export const MLM_QUALIFICATIONS: Record<string, MLMQualificationCriteria> = {
  CQ: {
    position: 'CQ',
    pointsPersonnelsRequis: 25,
    delaiJours: 30,
    description: 'Conseiller Qualifié - Démarrage du parcours MLM',
    bonusMontant: 300
  },
  
  ETT: {
    position: 'ETT',
    pointsPersonnelsRequis: 50,
    equipeRequise: {
      nombreVendeurs: 2,
      conditionsSpecifiques: [
        'Avoir constitué une équipe de 2 vendeurs minimum',
        'Les vendeurs doivent être actifs et formés'
      ]
    },
    pointsGroupeRequis: 150,
    delaiJours: 30, // CORRECTION : 30 jours pour ETT, pas 60
    description: 'Executive Team Trainer - Développement de votre équipe et compétences de formation',
    bonusMontant: 800
  },
  
  ETL: {
    position: 'ETL',
    pointsPersonnelsRequis: 75, // Points personnels cumulés depuis le démarrage
    equipeRequise: {
      nombreVendeurs: 2, // Minimum 2 groupes (recrues directes)
      conditionsSpecifiques: [
        'Chaque groupe doit avoir AU MINIMUM un vendeur qui a atteint la position ETT',
        'Les vendeurs ETT peuvent être des recrues directes ou indirectes du groupe'
      ]
    },
    delaiJours: 120,
    description: 'Expert Terrain Leader - Management avec développement de leaders ETT',
    bonusMontant: 2000
  },
  
  Manager: {
    position: 'Manager',
    pointsPersonnelsRequis: 100,
    equipeRequise: {
      nombreVendeurs: 5,
      conditionsSpecifiques: [
        'Avoir une équipe de 5 vendeurs actifs minimum',
        'Démontrer des résultats de formation d\'équipe'
      ]
    },
    delaiJours: 180,
    description: 'Manager - Direction d\'organisation commerciale',
    bonusMontant: 5000
  },
  
  RC: {
    position: 'RC',
    pointsPersonnelsRequis: 100,
    equipeRequise: {
      nombreVendeurs: 4,
      conditionsSpecifiques: [
        'Avoir 4 groupes minimum avec 4000 points chacun',
        'Total de 16 000 points avec maximum 4000 points par équipe',
        'Chaque équipe doit atteindre le seuil minimum de 4000 points'
      ]
    },
    pointsGroupeRequis: 16000,
    delaiJours: 360,
    description: 'Regional Coordinator - Coordination régionale avec répartition équilibrée',
    bonusMontant: 16000
  },
  
  RVP: {
    position: 'RVP',
    pointsPersonnelsRequis: 150,
    equipeRequise: {
      nombreVendeurs: 25,
      conditionsSpecifiques: [
        'Gérer une organisation de 25+ vendeurs',
        'Atteindre 1000 ventes d\'organisation',
        'Formation executive leadership'
      ]
    },
    delaiJours: 540,
    description: 'Responsable Vice-Président - Direction nationale',
    bonusMontant: 30000
  },
  
  SVP: {
    position: 'SVP',
    pointsPersonnelsRequis: 200,
    equipeRequise: {
      nombreVendeurs: 50,
      conditionsSpecifiques: [
        'Diriger une organisation de 50+ vendeurs',
        'Atteindre 2000 ventes d\'organisation',
        'Mentorer d\'autres leaders RVP'
      ]
    },
    delaiJours: 720,
    description: 'Senior Vice-Président - Direction exécutive',
    bonusMontant: 50000
  }
};

/**
 * FONCTION DE QUALIFICATION CENTRALISÉE
 * =====================================
 * 
 * Cette fonction détermine la position actuelle d'un utilisateur
 * selon ses performances et son équipe.
 * 
 * @param teamPoints - NOUVEAU : Array optionnel des points par équipe pour qualification RC spécialisée
 */
export function determinerQualificationMLM(
  pointsPersonnels: number,
  equipeVendeurs: number = 0,
  pointsGroupe: number = 0,
  joursDepuisInscription: number = 0,
  teamPoints?: number[]
): {
  positionActuelle: string;
  prochainePossible: string | null;
  criteresSatisfaits: boolean;
  criteresManquants: string[];
  rcDetails?: string; // NOUVEAU : Détails spécifiques pour qualification RC
} {
  
  // Logique de qualification stricte
  let positionActuelle = 'Nouveau';
  let prochainePossible: string | null = 'CQ';
  let rcDetails: string | undefined;
  
  // Vérifier chaque niveau de qualification
  const qualifications = Object.values(MLM_QUALIFICATIONS).sort(
    (a, b) => a.pointsPersonnelsRequis - b.pointsPersonnelsRequis
  );
  
  for (const qual of qualifications) {
    const satisfaitPoints = pointsPersonnels >= qual.pointsPersonnelsRequis;
    
    // LOGIQUE SPÉCIALISÉE RC : Utiliser computeRCQualification pour équipe ET groupe
    let satisfaitEquipe: boolean;
    let satisfaitGroupe: boolean;
    
    if (qual.position === 'RC' && teamPoints && teamPoints.length > 0) {
      // CORRECTION CRITIQUE : Pour RC, utiliser les équipes qualifiées au lieu des recrues
      const rcResult = computeRCQualification(teamPoints);
      satisfaitEquipe = rcResult.qualifiedTeams >= 4; // ← CORRIGÉ: utiliser qualifiedTeams, pas recruits
      satisfaitGroupe = rcResult.qualified; // ← CORRIGÉ: utiliser la qualification RC complète
      rcDetails = rcResult.details;
      
      console.log(`🎯 QUALIFICATION RC ÉVALUÉE (CORRIGÉE):`, {
        satisfaitPoints,
        satisfaitEquipe: `${rcResult.qualifiedTeams}/4 équipes qualifiées`,
        satisfaitGroupe: rcResult.qualified,
        totalEffective: rcResult.totalEffective,
        rcDetails: rcResult.details,
        teamPointsProvided: teamPoints,
        rcBreakdown: rcResult.breakdown
      });
    } else {
      // Logique normale pour toutes les autres positions MLM
      satisfaitEquipe = !qual.equipeRequise || equipeVendeurs >= qual.equipeRequise.nombreVendeurs;
      satisfaitGroupe = !qual.pointsGroupeRequis || pointsGroupe >= qual.pointsGroupeRequis;
    }
    
    if (satisfaitPoints && satisfaitEquipe && satisfaitGroupe) {
      positionActuelle = qual.position;
    } else {
      // C'est le prochain niveau possible
      if (prochainePossible === null || prochainePossible === positionActuelle) {
        prochainePossible = qual.position;
      }
      break;
    }
  }
  
  // Déterminer les critères manquants pour le prochain niveau
  const criteresManquants: string[] = [];
  const prochaineCriterias = prochainePossible ? MLM_QUALIFICATIONS[prochainePossible] : null;
  
  if (prochaineCriterias) {
    if (pointsPersonnels < prochaineCriterias.pointsPersonnelsRequis) {
      criteresManquants.push(`${prochaineCriterias.pointsPersonnelsRequis - pointsPersonnels} points personnels manquants`);
    }
    
    // LOGIQUE SPÉCIALISÉE RC pour les critères manquants
    if (prochaineCriterias.position === 'RC' && teamPoints && teamPoints.length > 0) {
      const rcResult = computeRCQualification(teamPoints);
      
      if (rcResult.qualifiedTeams < 4) {
        criteresManquants.push(`${4 - rcResult.qualifiedTeams} équipe(s) qualifiée(s) manquante(s) (≥4000 pts chacune)`);
      }
      
      if (rcResult.totalEffective < 16000) {
        criteresManquants.push(`${16000 - rcResult.totalEffective} points effectifs manquants (plafonné à 4000/équipe)`);
      }
    } else {
      // Logique normale pour les autres positions
      if (prochaineCriterias.equipeRequise && equipeVendeurs < prochaineCriterias.equipeRequise.nombreVendeurs) {
        criteresManquants.push(`${prochaineCriterias.equipeRequise.nombreVendeurs - equipeVendeurs} vendeurs d'équipe manquants`);
      }
      
      if (prochaineCriterias.pointsGroupeRequis && pointsGroupe < prochaineCriterias.pointsGroupeRequis) {
        criteresManquants.push(`${prochaineCriterias.pointsGroupeRequis - pointsGroupe} points de groupe manquants`);
      }
    }
  }
  
  return {
    positionActuelle,
    prochainePossible,
    criteresSatisfaits: criteresManquants.length === 0,
    criteresManquants,
    rcDetails
  };
}

/**
 * FONCTION DE CALCUL DES JOURS RESTANTS (CORRIGÉE)
 * =============================================
 * 
 * Calcule le temps restant pour un délai donné depuis une date de début
 */
export function calculerJoursRestants(
  dateDebut: Date,
  delaiJours: number
): number {
  const maintenant = new Date();
  const joursEcoules = Math.floor((maintenant.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, delaiJours - joursEcoules);
}

/**
 * FONCTION D'AIDE POUR DÉTERMINER LE PROCHAIN NIVEAU
 */
export function getProchainNiveau(positionActuelle: string): string | null {
  const ordreNiveaux = ['CQ', 'ETT', 'ETL', 'Manager', 'RC', 'RVP', 'SVP'];
  const indexActuel = ordreNiveaux.indexOf(positionActuelle);
  
  if (indexActuel >= 0 && indexActuel < ordreNiveaux.length - 1) {
    return ordreNiveaux[indexActuel + 1];
  }
  
  return null;
}

/**
 * FONCTION DE VALIDATION DES AUTORISATIONS
 * =======================================
 * 
 * Détermine si un utilisateur a les autorisations pour une action donnée
 * selon sa position MLM
 */
export function verifierAutorisationMLM(
  positionUtilisateur: string,
  actionRequise: string
): boolean {
  
  const hierarchie = ['CQ', 'ETT', 'ETL', 'Manager', 'RC', 'RVP', 'SVP'];
  const niveauUtilisateur = hierarchie.indexOf(positionUtilisateur);
  
  // Définir les autorisations par action
  const autorisations: Record<string, number> = {
    'creer_prospect': 0, // CQ et plus
    'modifier_client': 0, // CQ et plus  
    'voir_equipe': 1, // ETT et plus
    'creer_tache_equipe': 1, // ETT et plus
    'voir_commissions_equipe': 2, // ETL et plus
    'modifier_parametre_groupe': 3, // Manager et plus
    'acceder_gestion_avancee': 4, // RC et plus
    'administration_complete': 5, // RVP et plus
    'gestion_executive': 6, // SVP uniquement
  };
  
  const niveauRequis = autorisations[actionRequise];
  return niveauRequis !== undefined && niveauUtilisateur >= niveauRequis;
}

/**
 * FONCTION DE QUALIFICATION RC SPÉCIALISÉE
 * ========================================
 * 
 * Implemente la vraie logique métier pour la qualification Regional Coordinator (RC)
 * selon les règles spécifiques de plafonnement et seuils d'équipes.
 */
export function computeRCQualification(teamPoints: number[]): {
  qualified: boolean;
  totalEffective: number;
  qualifiedTeams: number;
  details: string;
  breakdown: Array<{teamIndex: number, originalPoints: number, effectivePoints: number, qualified: boolean}>;
} {
  
  // RÈGLE 1: Filtrer les équipes avec ≥4000 points (seules ces équipes comptent)
  const qualifiedTeamData = teamPoints.map((points, index) => ({
    teamIndex: index,
    originalPoints: points,
    qualified: points >= 4000,
    effectivePoints: points >= 4000 ? Math.min(points, 4000) : 0 // RÈGLE 2: Plafond 4000 points par équipe
  }));
  
  const qualifiedTeams = qualifiedTeamData.filter(team => team.qualified);
  const qualifiedTeamsCount = qualifiedTeams.length;
  
  // RÈGLE 3: Calculer le total effectif (somme des points plafonnés des équipes qualifiées)
  const totalEffective = qualifiedTeams.reduce((total, team) => total + team.effectivePoints, 0);
  
  // RÈGLE 4: Qualification RC = minimum 4 équipes qualifiées ET total ≥16000 points
  const hasMinimumTeams = qualifiedTeamsCount >= 4;
  const hasMinimumPoints = totalEffective >= 16000;
  const qualified = hasMinimumTeams && hasMinimumPoints;
  
  // Créer un détail explicatif
  let details = `RC Qualification Check: ${qualifiedTeamsCount}/4 équipes qualifiées (≥4000 pts), `;
  details += `${totalEffective}/16000 points effectifs. `;
  
  if (!hasMinimumTeams) {
    details += `❌ Il manque ${4 - qualifiedTeamsCount} équipe(s) qualifiée(s). `;
  }
  if (!hasMinimumPoints) {
    details += `❌ Il manque ${16000 - totalEffective} points effectifs. `;
  }
  if (qualified) {
    details += `✅ Qualification RC atteinte !`;
  }
  
  console.log(`🎯 CALCUL RC QUALIFICATION:`, {
    teamPointsInput: teamPoints,
    qualifiedTeamsCount,
    totalEffective,
    hasMinimumTeams,
    hasMinimumPoints,
    qualified,
    breakdown: qualifiedTeamData
  });
  
  return {
    qualified,
    totalEffective,
    qualifiedTeams: qualifiedTeamsCount,
    details,
    breakdown: qualifiedTeamData
  };
}

/**
 * EXPORT DES FONCTIONS UTILITAIRES
 */
export { MLM_QUALIFICATIONS as default };