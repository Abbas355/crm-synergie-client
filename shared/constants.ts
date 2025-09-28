// Constantes pour les statuts clients
export const CLIENT_STATUSES = {
  ENREGISTRE: 'enregistre',
  VALIDE: 'valide', 
  VALIDATION_7_JOURS: 'validation_7_jours',
  RENDEZ_VOUS: 'rendez-vous',
  POST_PRODUCTION: 'post_production',
  INSTALLATION: 'installation',
  RESILIATION: 'resiliation',
  ABANDONNE: 'abandonne'
} as const;

export type ClientStatus = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];

// Labels d'affichage pour les statuts
export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUSES.ENREGISTRE]: 'Enregistré',
  [CLIENT_STATUSES.VALIDE]: 'Validé',
  [CLIENT_STATUSES.VALIDATION_7_JOURS]: 'Validation + 7 jours',
  [CLIENT_STATUSES.RENDEZ_VOUS]: 'Rendez-vous',
  [CLIENT_STATUSES.POST_PRODUCTION]: 'Post-production',
  [CLIENT_STATUSES.INSTALLATION]: 'Installation',
  [CLIENT_STATUSES.RESILIATION]: 'Résiliation',
  [CLIENT_STATUSES.ABANDONNE]: 'Abandonné'
} as const;

// Couleurs pour les statuts
export const CLIENT_STATUS_COLORS = {
  [CLIENT_STATUSES.ENREGISTRE]: 'bg-gray-100 text-gray-800',
  [CLIENT_STATUSES.VALIDE]: 'bg-yellow-400 text-black',
  [CLIENT_STATUSES.VALIDATION_7_JOURS]: 'bg-orange-100 text-orange-800',
  [CLIENT_STATUSES.RENDEZ_VOUS]: 'bg-[#a0905a] text-white',
  [CLIENT_STATUSES.POST_PRODUCTION]: 'bg-red-200 text-red-900',
  [CLIENT_STATUSES.INSTALLATION]: 'bg-green-100 text-green-800',
  [CLIENT_STATUSES.RESILIATION]: 'bg-red-600 text-white',
  [CLIENT_STATUSES.ABANDONNE]: 'bg-gray-100 text-gray-600'
} as const;

// Couleurs hex pour cohérence entre mode liste et grille
export const CLIENT_STATUS_HEX_COLORS = {
  [CLIENT_STATUSES.ENREGISTRE]: { bg: '#f3f4f6', text: '#1f2937' }, // bg-gray-100, text-gray-800
  [CLIENT_STATUSES.VALIDE]: { bg: '#fbbf24', text: '#000000' }, // bg-yellow-400, text-black
  [CLIENT_STATUSES.VALIDATION_7_JOURS]: { bg: '#fed7aa', text: '#ea580c' }, // bg-orange-100, text-orange-800
  [CLIENT_STATUSES.RENDEZ_VOUS]: { bg: '#a0905a', text: '#ffffff' }, // bg-[#a0905a], text-white
  [CLIENT_STATUSES.POST_PRODUCTION]: { bg: '#FF6B6B', text: '#7f1d1d' }, // Rouge-orange comme référence
  [CLIENT_STATUSES.INSTALLATION]: { bg: '#dcfce7', text: '#166534' }, // bg-green-100, text-green-800
  [CLIENT_STATUSES.RESILIATION]: { bg: '#dc2626', text: '#ffffff' }, // bg-red-600, text-white
  [CLIENT_STATUSES.ABANDONNE]: { bg: '#f3f4f6', text: '#4b5563' } // bg-gray-100, text-gray-600
} as const;

// Liste ordonnée des statuts pour les sélecteurs
export const CLIENT_STATUS_LIST = [
  CLIENT_STATUSES.ENREGISTRE,
  CLIENT_STATUSES.VALIDE,
  CLIENT_STATUSES.VALIDATION_7_JOURS,
  CLIENT_STATUSES.RENDEZ_VOUS,
  CLIENT_STATUSES.POST_PRODUCTION,
  CLIENT_STATUSES.INSTALLATION,
  CLIENT_STATUSES.RESILIATION,
  CLIENT_STATUSES.ABANDONNE
] as const;

// Fonction utilitaire pour obtenir les couleurs harmonisées
export function getStatusHexColors(status: string): { bg: string; text: string } {
  // Normaliser le statut pour gérer les variantes
  const normalizedStatus = status?.toLowerCase().replace(/[-_\s]/g, '');
  
  switch (normalizedStatus) {
    case 'enregistre':
    case 'enregistré':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.ENREGISTRE];
    case 'valide':
    case 'validé':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.VALIDE];
    case 'validation7jours':
    case 'valide7jours':
    case 'validation7j':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.VALIDATION_7_JOURS];
    case 'rendezvous':
    case 'rdv':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.RENDEZ_VOUS];
    case 'postproduction':
    case 'postprod':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.POST_PRODUCTION];
    case 'installation':
    case 'installé':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.INSTALLATION];
    case 'resiliation':
    case 'résiliation':
    case 'résilié':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.RESILIATION];
    case 'abandonne':
    case 'abandonné':
      return CLIENT_STATUS_HEX_COLORS[CLIENT_STATUSES.ABANDONNE];
    default:
      return { bg: '#f3f4f6', text: '#1f2937' }; // Gris par défaut
  }
}