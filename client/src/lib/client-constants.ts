/**
 * CONSTANTES CLIENT - IMPORTÉES DEPUIS SOURCES CENTRALISÉES
 * Ce fichier réexporte les sources depuis shared/sources.ts pour compatibilité
 */

import { getSourcesForSelect } from "@shared/sources";

// Réexport des sources officielles centralisées
export const CLIENT_SOURCES = getSourcesForSelect();

export const TYPE_RECOMMANDATION_OPTIONS = [
  { value: "famille", label: "Famille" },
  { value: "ami", label: "Ami" },
  { value: "collegue", label: "Collègue" },
  { value: "voisin", label: "Voisin" },
  { value: "autre", label: "Autre" }
] as const;

/**
 * Types TypeScript pour la sécurité de type
 */
export type ClientSource = typeof CLIENT_SOURCES[number]['value'];
export type TypeRecommandation = typeof TYPE_RECOMMANDATION_OPTIONS[number]['value'];