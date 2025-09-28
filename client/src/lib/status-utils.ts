// Utilitaires pour la gestion des statuts

// Convertir un statut à un label pour l'affichage
export function getStatutLabel(status: string): string {
  switch (status) {
    case 'nouveau':
      return 'Nouveau';
    case 'en-attente':
      return 'En attente';
    case 'signe':
      return 'Signé';
    case 'rendez-vous':
      return 'Rendez-vous';
    case 'refus':
      return 'Refus';
    case 'installation':
      return 'Installation';
    case 'termine':
      return 'Terminé';
    case 'valide_7j':
      return 'Validé 7 jours';
    case 'post-production':
      return 'Post-production';
    default:
      return status || 'Inconnu';
  }
}

// Obtenir la couleur associée à un statut
export function getStatusColor(status: string): string {
  switch (status) {
    case 'rendez-vous':
      return '#a9bd49'; // Couleur personnalisée pour Rendez-vous
    case 'installation':
      return '#6366f1'; // Indigo pour installation
    case 'valide':
    case 'termine':
    case 'signe':
      return '#22c55e'; // Vert pour les statuts positifs
    case 'resiliation':
    case 'refus':
      return '#dc2626'; // Rouge exact selon capture utilisateur
    case 'en-attente':
    case 'abandonne':
      return '#f97316'; // Orange pour les statuts d'attente/abandon
    case 'enregistre':
    case 'nouveau':
      return '#3b82f6'; // Bleu pour les nouveaux/enregistrés
    case 'valide_7j':
      return '#84cc16'; // Vert lime pour validé 7 jours
    case 'post-production':
      return '#14b8a6'; // Teal pour post-production
    default:
      return '#6b7280'; // Gris par défaut
  }
}

// Mapper les statuts text à une valeur pour le système
export function mapStatusValue(status: string): string {
  // Nettoyage du statut
  const cleanStatus = status.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/à/g, 'a')
    .replace(/ç/g, 'c');

  // Cas spéciaux
  if (cleanStatus === 'valide-7-jours' || cleanStatus === 'valide-7j') {
    return 'valide_7j';
  }

  return cleanStatus;
}