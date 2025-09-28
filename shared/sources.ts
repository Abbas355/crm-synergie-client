/**
 * SOURCES CLIENTS - SINGLE SOURCE OF TRUTH
 * Ce fichier contient la liste officielle des sources utilisées dans toute l'application
 * Toute modification doit être faite uniquement ici
 */

export const SOURCES_OPTIONS = [
  "prospection",
  "recommandation", 
  "internet",
  "publicite",
  "stand_salon",
  "flyer",
  "autre"
] as const;

export const SOURCES_LABELS = {
  prospection: "Prospection",
  recommandation: "Recommandation",
  internet: "Internet", 
  publicite: "Publicité",
  stand_salon: "Stand & Salons",
  flyer: "Flyer",
  autre: "Autre"
} as const;

export type SourceType = typeof SOURCES_OPTIONS[number];

/**
 * Fonction pour obtenir le libellé d'une source
 */
export function getSourceLabel(source: string): string {
  return SOURCES_LABELS[source as SourceType] || source;
}

/**
 * Fonction pour obtenir toutes les sources avec labels pour les formulaires
 */
export function getSourcesForSelect() {
  return SOURCES_OPTIONS.map(value => ({
    value,
    label: SOURCES_LABELS[value]
  }));
}

/**
 * Valider qu'une source est valide
 */
export function isValidSource(source: string): source is SourceType {
  return SOURCES_OPTIONS.includes(source as SourceType);
}

/**
 * Convertir les anciens labels en valeurs correctes pour le sélecteur
 * Résout le problème des données legacy en base
 */
export function normalizeSourceValue(source: string): string {
  // Mapping des anciens labels vers les vraies valeurs
  const legacyMapping: Record<string, string> = {
    "Stand & Salons": "stand_salon",
    "Prospection": "prospection", 
    "Recommandation": "recommandation",
    "Internet": "internet",
    "Publicité": "publicite",
    "Flyer": "flyer",
    "Autre": "autre"
  };
  
  // Retourner la valeur normalisée si elle existe dans le mapping
  if (legacyMapping[source]) {
    return legacyMapping[source];
  }
  
  // Si c'est déjà une valeur correcte, la retourner telle quelle
  if (isValidSource(source)) {
    return source;
  }
  
  // Valeur par défaut si rien ne correspond
  return "prospection";
}