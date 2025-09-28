/**
 * SYSTÈME DE CONVERSION DES NIVEAUX MLM
 * ====================================
 * 
 * Ce fichier centralise la conversion des niveaux MLM calculés dynamiquement
 * vers des titres d'affichage lisibles dans toute l'application.
 * 
 * Source unique de vérité pour l'affichage des positions/titres MLM.
 */

/**
 * Mapping des niveaux techniques vers les titres d'affichage
 * Ces niveaux correspondent aux calculs du backend dans server/routes.ts
 */
export const MLM_LEVELS_MAPPING = {
  conseiller: {
    displayTitle: 'Conseiller',
    shortTitle: 'Conseiller',
    color: 'green',
    pointsRequired: 0,
    description: 'Point de départ du parcours MLM'
  },
  cq: {
    displayTitle: 'Conseiller Qualifié',
    shortTitle: 'CQ',
    color: 'blue',
    pointsRequired: 25,
    description: 'Première qualification MLM'
  },
  ett: {
    displayTitle: 'Executive Team Trainer',
    shortTitle: 'ETT',
    color: 'purple',
    pointsRequired: 50,
    description: 'Développement de votre équipe et compétences de formation'
  },
  etl: {
    displayTitle: 'Expert Terrain Leader',
    shortTitle: 'ETL',
    color: 'indigo',
    pointsRequired: 75,
    description: 'Management avec développement de leaders'
  },
  manager: {
    displayTitle: 'Manager Commercial',
    shortTitle: 'Manager',
    color: 'yellow',
    pointsRequired: 200,
    description: 'Direction commerciale avancée'
  }
} as const;

/**
 * Convertit un niveau technique en titre d'affichage
 */
export function getLevelDisplayTitle(technicalLevel: string): string {
  const level = technicalLevel?.toLowerCase();
  const mapping = MLM_LEVELS_MAPPING[level as keyof typeof MLM_LEVELS_MAPPING];
  
  if (mapping) {
    return mapping.displayTitle;
  }
  
  // Fallback pour les niveaux non reconnus
  return 'Conseiller Commercial';
}

/**
 * Convertit un niveau technique en titre court
 */
export function getLevelShortTitle(technicalLevel: string): string {
  const level = technicalLevel?.toLowerCase();
  const mapping = MLM_LEVELS_MAPPING[level as keyof typeof MLM_LEVELS_MAPPING];
  
  if (mapping) {
    return mapping.shortTitle;
  }
  
  return 'Conseiller';
}

/**
 * Obtient la couleur associée à un niveau
 */
export function getLevelColor(technicalLevel: string): string {
  const level = technicalLevel?.toLowerCase();
  const mapping = MLM_LEVELS_MAPPING[level as keyof typeof MLM_LEVELS_MAPPING];
  
  if (mapping) {
    return mapping.color;
  }
  
  return 'green';
}

/**
 * Obtient les informations complètes d'un niveau
 */
export function getLevelInfo(technicalLevel: string) {
  const level = technicalLevel?.toLowerCase();
  const mapping = MLM_LEVELS_MAPPING[level as keyof typeof MLM_LEVELS_MAPPING];
  
  if (mapping) {
    return {
      technical: level,
      display: mapping.displayTitle,
      short: mapping.shortTitle,
      color: mapping.color,
      pointsRequired: mapping.pointsRequired,
      description: mapping.description
    };
  }
  
  return {
    technical: level,
    display: 'Conseiller Commercial',
    short: 'Conseiller',
    color: 'green',
    pointsRequired: 0,
    description: 'Point de départ du parcours MLM'
  };
}

/**
 * Type pour les niveaux MLM supportés
 */
export type MLMLevel = keyof typeof MLM_LEVELS_MAPPING;