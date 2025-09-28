/**
 * SYSTÈME DE PLAN D'ACTION PERSONNALISÉ MLM RC
 * ==========================================
 * 
 * Ce fichier implémente la logique métier partagée pour générer
 * des plans d'action personnalisés vers la qualification Regional Coordinator (RC).
 * 
 * OBJECTIF :
 * - Analyser les gaps actuels vers RC
 * - Générer des objectifs prioritaires et personnalisés
 * - Fournir des actions concrètes et mesurables
 * 
 * UTILISATION :
 * - Frontend : Affichage du plan d'action dans le dashboard
 * - Backend : Calculs de progression et notifications
 */

import { computeRCQualification, determinerQualificationMLM, MLM_QUALIFICATIONS } from './mlm-qualifications';

/**
 * INTERFACES MÉTIER
 * =================
 */

export interface MLMMetrics {
  personalPoints: number;
  groupPoints: number;
  teamPoints: { [teamId: string]: number };
  joursDepuisInscription: number;
  recruitsCount: number;
}

export interface ObjectiveDTO {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  delta: number;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = urgent, 5 = moins urgent
  suggestedActions: string[];
  link?: string;
  metricKey: string;
  dueDate?: string;
}

export interface ActionPlanResult {
  positionActuelle: string;
  joursRestants: number;
  personalPoints: number;    // Points personnels actuels
  groupPoints: number;       // Points de groupe bruts totaux
  teamCount: number;         // Nombre d'équipes existantes
  rcDetails: {
    qualified: boolean;
    qualifiedTeams: number;
    totalEffective: number;
    breakdown: any;
  };
  gaps: {
    personalDelta: number;
    deltaTo16000: number;
    missingTeams: number;
    perTeam: { teamId: string; current: number; deltaTo4k: number }[];
  };
  objectives: ObjectiveDTO[];
  priorities: string[];
}

/**
 * FONCTION PRINCIPALE : CONSTRUCTION DU PLAN D'ACTION RC
 * =====================================================
 * 
 * Analyse les métriques actuelles et génère un plan d'action personnalisé
 * pour atteindre la qualification Regional Coordinator (RC).
 * 
 * @param metrics - Métriques actuelles du vendeur et de son équipe
 * @returns Plan d'action complet avec objectifs prioritaires
 */
export function buildRCActionPlan(metrics: MLMMetrics): ActionPlanResult {
  console.log('🎯 CONSTRUCTION PLAN D\'ACTION RC:', { metrics });
  
  // 1. ANALYSER LA POSITION ACTUELLE
  const teamPointsArray = Object.values(metrics.teamPoints);
  const qualification = determinerQualificationMLM(
    metrics.personalPoints,
    metrics.recruitsCount,
    metrics.groupPoints,
    metrics.joursDepuisInscription,
    teamPointsArray
  );
  
  // 2. ANALYSER LE STATUS RC SPÉCIFIQUE
  const rcDetails = computeRCQualification(teamPointsArray);
  
  // 3. CALCULER LES JOURS RESTANTS POUR RC (360 jours limite)
  const joursRestants = Math.max(0, 360 - metrics.joursDepuisInscription);
  
  // 4. CALCULER LES GAPS VERS RC
  const gaps = calculateRCGaps(metrics, rcDetails);
  
  // 5. GÉNÉRER LES OBJECTIFS PRIORITAIRES
  const objectives = generateRCObjectives(metrics, gaps, rcDetails, joursRestants);
  
  // 6. DÉTERMINER LES PRIORITÉS GLOBALES
  const priorities = determinePriorities(gaps, joursRestants, qualification.positionActuelle);
  
  return {
    positionActuelle: qualification.positionActuelle,
    joursRestants,
    personalPoints: metrics.personalPoints,
    groupPoints: metrics.groupPoints,
    teamCount: Object.keys(metrics.teamPoints).length,
    rcDetails: {
      qualified: rcDetails.qualified,
      qualifiedTeams: rcDetails.qualifiedTeams,
      totalEffective: rcDetails.totalEffective,
      breakdown: rcDetails.breakdown
    },
    gaps,
    objectives,
    priorities
  };
}

/**
 * CALCUL DES ÉCARTS VERS RC
 * =========================
 * 
 * Analyse les écarts entre la situation actuelle et les exigences RC.
 */
function calculateRCGaps(
  metrics: MLMMetrics, 
  rcDetails: ReturnType<typeof computeRCQualification>
) {
  const rcCriteria = MLM_QUALIFICATIONS.RC;
  
  // Gap points personnels
  const personalDelta = Math.max(0, rcCriteria.pointsPersonnelsRequis - metrics.personalPoints);
  
  // Gap points effectifs totaux (16000 - actuel)
  const deltaTo16000 = Math.max(0, 16000 - rcDetails.totalEffective);
  
  // Équipes manquantes (minimum 4 équipes qualifiées)
  const missingTeams = Math.max(0, 4 - rcDetails.qualifiedTeams);
  
  // Analyse par équipe : écarts vers 4000 points
  const perTeam = Object.entries(metrics.teamPoints).map(([teamId, points]) => ({
    teamId,
    current: points,
    deltaTo4k: Math.max(0, 4000 - points)
  }));
  
  return {
    personalDelta,
    deltaTo16000,
    missingTeams,
    perTeam
  };
}

/**
 * GÉNÉRATION DES OBJECTIFS RC PRIORITAIRES
 * ========================================
 * 
 * Crée une liste d'objectifs personnalisés et priorisés selon les gaps identifiés.
 */
function generateRCObjectives(
  metrics: MLMMetrics,
  gaps: any,
  rcDetails: any,
  joursRestants: number
): ObjectiveDTO[] {
  const objectives: ObjectiveDTO[] = [];
  let objectiveCounter = 1;
  
  // OBJECTIF 1: Points personnels (toujours afficher, même si complété)
  const personalCompleted = metrics.personalPoints >= MLM_QUALIFICATIONS.RC.pointsPersonnelsRequis;
  objectives.push({
    id: `rc-obj-${objectiveCounter++}`,
    title: personalCompleted ? '✅ Points personnels atteints' : 'Atteindre 100 points personnels',
    description: personalCompleted 
      ? `Vous avez ${metrics.personalPoints} points personnels (objectif: 100 points) - Condition remplie !`
      : `Vous devez obtenir ${gaps.personalDelta} points personnels supplémentaires pour la qualification RC`,
    target: MLM_QUALIFICATIONS.RC.pointsPersonnelsRequis,
    current: metrics.personalPoints,
    delta: gaps.personalDelta,
    priority: personalCompleted ? 5 : 2, // Basse priorité si déjà complété
    suggestedActions: personalCompleted 
      ? ['Maintenir votre niveau de performance actuel']
      : [
        'Finaliser les installations en attente',
        'Prospecter de nouveaux clients qualifiés',
        'Cibler les forfaits à fort points (Freebox Ultra = 6 pts)'
      ],
    metricKey: 'personalPoints',
    link: '/clients?filter=installations-pending'
  });
  
  // OBJECTIF 2: Équipes proches de 4000 points (priorité haute)
  const teamsCloseToQualification = gaps.perTeam.filter(
    (team: any) => team.current >= 2000 && team.current < 4000
  );
  
  teamsCloseToQualification.forEach((team: any) => {
    objectives.push({
      id: `rc-obj-${objectiveCounter++}`,
      title: `Pousser l'équipe ${team.teamId} vers 4000 points`,
      description: `Cette équipe a ${team.current} points et peut rapidement atteindre le seuil de qualification`,
      target: 4000,
      current: team.current,
      delta: team.deltaTo4k,
      priority: 1, // Priorité maximale car proche du seuil
      suggestedActions: [
        'Accompagner les vendeurs de cette équipe',
        'Organiser des formations ciblées',
        'Aider à finaliser les installations en cours'
      ],
      metricKey: `teamPoints.${team.teamId}`,
      link: `/equipe/${team.teamId}`
    });
  });
  
  // OBJECTIF 3: Équipes à développer (tenir compte des équipes existantes)
  const existingTeamsCount = Object.keys(metrics.teamPoints).length;
  const qualifiedTeamsCount = rcDetails.qualifiedTeams;
  
  if (gaps.missingTeams > 0) {
    const needsNewTeams = Math.max(0, 4 - existingTeamsCount); // Nouvelles équipes à recruter
    const needsToQualifyExisting = existingTeamsCount - qualifiedTeamsCount; // Équipes existantes à qualifier
    
    let title, description;
    if (needsNewTeams > 0 && needsToQualifyExisting > 0) {
      title = `Développer ${needsToQualifyExisting} équipe(s) + recruter ${needsNewTeams} nouvelle(s)`;
      description = `Vous avez ${existingTeamsCount} équipes. Il faut qualifier les ${needsToQualifyExisting} existantes et recruter ${needsNewTeams} équipe(s) supplémentaire(s)`;
    } else if (needsNewTeams > 0) {
      title = `Recruter ${needsNewTeams} équipe(s) supplémentaire(s)`;
      description = `Vous avez ${existingTeamsCount} équipes sur 4 requises. Il faut recruter ${needsNewTeams} équipe(s) supplémentaire(s) puis les qualifier`;
    } else {
      title = `Qualifier vos ${existingTeamsCount} équipes existantes`;
      description = `Vous avez ${existingTeamsCount} équipes mais aucune n'est qualifiée (≥4000 points). Concentrez-vous sur leur développement`;
    }
    
    objectives.push({
      id: `rc-obj-${objectiveCounter++}`,
      title,
      description,
      target: 4,
      current: qualifiedTeamsCount,
      delta: gaps.missingTeams,
      priority: joursRestants < 90 ? 1 : 2,
      suggestedActions: needsNewTeams > 0 
        ? [
          'Recruter de nouveaux vendeurs talentueux',
          'Former et accompagner les nouvelles recrues',
          'Développer les équipes existantes vers 4000 points',
          'Mettre en place un système de mentorat'
        ]
        : [
          'Accompagner intensivement vos équipes actuelles',
          'Organiser des formations commerciales ciblées',
          'Aider à finaliser les installations en cours',
          'Fixer des objectifs de points clairs par équipe'
        ],
      metricKey: 'qualifiedTeams',
      link: '/recruitment'
    });
  }
  
  // OBJECTIF 4: Équipes à renforcer (entre 1000-2000 points)
  const teamsToStrengthen = gaps.perTeam.filter(
    (team: any) => team.current >= 1000 && team.current < 2000
  );
  
  if (teamsToStrengthen.length > 0) {
    objectives.push({
      id: `rc-obj-${objectiveCounter++}`,
      title: 'Renforcer les équipes intermédiaires',
      description: `${teamsToStrengthen.length} équipe(s) ont un potentiel de croissance significatif`,
      target: 2000,
      current: Math.max(...teamsToStrengthen.map(t => t.current)),
      delta: Math.min(...teamsToStrengthen.map(t => 2000 - t.current)),
      priority: 3,
      suggestedActions: [
        'Intensifier le coaching des équipes',
        'Mettre en place des challenges d\'équipe',
        'Organiser des formations commerciales avancées'
      ],
      metricKey: 'teamDevelopment',
      link: '/mlm/teams'
    });
  }
  
  // OBJECTIF 5: Formation leadership (si proche de RC)
  if (rcDetails.qualifiedTeams >= 3 || gaps.deltaTo16000 < 4000) {
    objectives.push({
      id: `rc-obj-${objectiveCounter++}`,
      title: 'Formation leadership RC',
      description: 'Préparez-vous aux responsabilités de Regional Coordinator',
      target: 100,
      current: 75,
      delta: 25,
      priority: 4,
      suggestedActions: [
        'Suivre une formation en management d\'équipes',
        'Développer vos compétences de mentorat',
        'Apprendre la gestion de région commerciale',
        'Participer aux sessions de leadership avancé'
      ],
      metricKey: 'leadershipTraining',
      link: '/formation/leadership'
    });
  }
  
  // OBJECTIF 6: Optimisation totale (si déjà bien avancé)
  if (gaps.deltaTo16000 > 0 && gaps.deltaTo16000 < 8000) {
    objectives.push({
      id: `rc-obj-${objectiveCounter++}`,
      title: `Atteindre 16000 points effectifs totaux`,
      description: `Il vous reste ${gaps.deltaTo16000} points pour atteindre l'objectif global RC`,
      target: 16000,
      current: rcDetails.totalEffective,
      delta: gaps.deltaTo16000,
      priority: 2,
      suggestedActions: [
        'Optimiser la répartition des efforts entre équipes',
        'Maximiser les points de chaque équipe qualifiée',
        'Accompagner les équipes les plus proches des seuils'
      ],
      metricKey: 'totalEffectivePoints',
      link: '/mlm/rc-progress'
    });
  }
  
  // Trier par priorité (1 = plus urgent) et réassigner les priorités séquentiellement
  const sortedObjectives = objectives.sort((a, b) => a.priority - b.priority);
  
  // Réassigner les priorités de manière séquentielle (1, 2, 3, 4, ...)
  return sortedObjectives.map((objective, index) => ({
    ...objective,
    priority: (index + 1) as 1 | 2 | 3 | 4 | 5
  }));
}

/**
 * DÉTERMINATION DES PRIORITÉS GLOBALES
 * ===================================
 * 
 * Analyse la situation globale et détermine les axes prioritaires.
 */
function determinePriorities(
  gaps: any,
  joursRestants: number,
  positionActuelle: string
): string[] {
  const priorities: string[] = [];
  
  // Priorité temps : Urgent si moins de 6 mois restants
  if (joursRestants < 180) {
    priorities.push('⏰ URGENT : Temps limité pour qualification RC');
  }
  
  // Priorité équipes proches
  const teamsClose = gaps.perTeam.filter((t: any) => t.current >= 3000 && t.deltaTo4k <= 1000);
  if (teamsClose.length > 0) {
    priorities.push(`🎯 PRIORITÉ 1 : ${teamsClose.length} équipe(s) proche(s) de qualification`);
  }
  
  // Priorité recrutement si manque d'équipes
  if (gaps.missingTeams > 0) {
    priorities.push(`👥 PRIORITÉ 2 : Recruter ${gaps.missingTeams} équipe(s) supplémentaire(s)`);
  }
  
  // Priorité points personnels
  if (gaps.personalDelta > 0) {
    priorities.push(`💰 PRIORITÉ 3 : ${gaps.personalDelta} points personnels manquants`);
  }
  
  // Priorité développement si déjà Manager
  if (positionActuelle === 'Manager') {
    priorities.push('🚀 PRIORITÉ 4 : Formation leadership RC avancée');
  }
  
  return priorities;
}

/**
 * FONCTIONS UTILITAIRES
 * =====================
 */

/**
 * Calcule le pourcentage de progression vers RC
 */
export function calculateRCProgressPercentage(metrics: MLMMetrics): number {
  const teamPointsArray = Object.values(metrics.teamPoints);
  const rcDetails = computeRCQualification(teamPointsArray);
  
  // Calcul composite : 40% équipes + 40% points + 20% points personnels
  const teamsProgress = (rcDetails.qualifiedTeams / 4) * 40;
  const pointsProgress = Math.min(rcDetails.totalEffective / 16000, 1) * 40;
  const personalProgress = Math.min(metrics.personalPoints / 100, 1) * 20;
  
  return Math.round(teamsProgress + pointsProgress + personalProgress);
}

/**
 * Estime le temps nécessaire pour atteindre RC
 */
export function estimateTimeToRC(metrics: MLMMetrics): {
  estimatedDays: number;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
} {
  const gaps = calculateRCGaps(metrics, computeRCQualification(Object.values(metrics.teamPoints)));
  const factors: string[] = [];
  
  let estimatedDays = 90; // Base : 3 mois minimum
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  
  // Facteur équipes manquantes
  if (gaps.missingTeams > 0) {
    estimatedDays += gaps.missingTeams * 60; // 2 mois par nouvelle équipe
    factors.push(`+${gaps.missingTeams * 2} mois pour nouvelles équipes`);
  }
  
  // Facteur points manquants
  if (gaps.deltaTo16000 > 8000) {
    estimatedDays += 120; // 4 mois supplémentaires si gros gap
    factors.push('+4 mois pour rattrapage points');
    confidence = 'low';
  }
  
  // Facteur position actuelle
  if (metrics.personalPoints < 75) {
    estimatedDays += 60; // 2 mois si pas encore ETL
    factors.push('+2 mois pour progression personnelle');
  }
  
  // Confiance selon équipes déjà qualifiées
  if (gaps.missingTeams === 0) {
    confidence = 'high';
  } else if (gaps.missingTeams <= 1) {
    confidence = 'medium';
  }
  
  return {
    estimatedDays: Math.min(estimatedDays, 360), // Max 1 an
    confidence,
    factors
  };
}

/**
 * EXPORT DEFAULT
 */
export default buildRCActionPlan;