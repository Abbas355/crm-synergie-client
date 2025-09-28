import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type StatusBadgeProps = {
  status: string;
  className?: string;
  date?: string | Date | null;
};

export function StatusBadge({ status, date, className }: StatusBadgeProps) {

  // Fonction mise à jour selon les spécifications
  // Enregistré (Blanc)
  // Validé (Jaune foncé)
  // Validé 7 jours (Gris clair)
  // Rendez-vous (vert-Brun)
  // Installation (Vert très clair)
  // Post-production (Rouge clair)
  // Résiliation (Rouge foncé)
  // Abandonné (Gris foncé)
  // Couleurs et styles selon votre capture d'écran
  const getStatusStyle = (status: string) => {
    if (!status || typeof status !== 'string') {
      return { bg: 'white', text: 'black', border: '1px solid #ccc' };
    }
    const statusLower = status.toLowerCase();
    
    // Retourne un objet avec les propriétés de style CSS
    if (statusLower === 'enregistre' || statusLower === 'enregistré')
      return { bg: 'white', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower === 'valide' || statusLower === 'validé')
      return { bg: '#facc15', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower.includes('7 jour') || statusLower === 'valide_7j' || statusLower === 'valide_7_jours')
      return { bg: '#E6E6E6', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower.includes('rendez') || statusLower === 'rdv')
      return { bg: '#a0905a', text: 'white', border: '1px solid #ccc' };
      
    if (statusLower.includes('install'))
      return { bg: '#d8f0ca', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower.includes('production'))
      return { bg: '#ffcccc', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower.includes('resil') || statusLower.includes('résil'))
      return { bg: '#dc2626', text: 'white', border: '1px solid #ccc' };
      
    if (statusLower.includes('aban'))
      return { bg: '#666666', text: 'white', border: '1px solid #ccc' };
      
    // Statuts carte SIM
    if (statusLower === 'disponible')
      return { bg: '#e6f0ff', text: 'black', border: '1px solid #ccc' };
      
    if (statusLower === 'active' || statusLower === 'activé' || 
        statusLower === 'affecte' || statusLower === 'affecté')
      return { bg: '#d8f0ca', text: 'black', border: '1px solid #ccc' };
    
    // Défaut
    return { bg: 'white', text: 'black', border: '1px solid #ccc' };
  };

  // Formatter la date si elle existe
  const formatDateString = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return null;
    try {
      const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return format(dateObj, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return null;
    }
  };

  // Vérifier si on doit afficher la date selon le statut
  const shouldShowDate = (status: string) => {
    if (!status || typeof status !== 'string') return false;
    const statusLower = status.toLowerCase();
    return statusLower === 'rendez-vous' || statusLower === 'rdv' || statusLower === 'installation';
  };

  const formattedDate = formatDateString(date);
  const showDate = shouldShowDate(status) && formattedDate;

  // Style mis à jour pour correspondre exactement à votre capture d'écran
  const styles = getStatusStyle(status);
  
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block text-xs px-3 py-1 rounded-full font-medium text-center whitespace-nowrap",
          className
        )}
        style={{
          backgroundColor: styles.bg,
          color: styles.text,
          border: styles.border
        }}
      >
        {status === 'enregistre' ? 'Enregistré' :
         status === 'valide' ? 'Validé' :
         status === 'valide_7_jours' ? 'Validé 7 jours' :
         status === 'rendez_vous' ? 'RDV' :
         status === 'rendez-vous' ? 'RDV' :
         status === 'installation' ? 'Installation' :
         status === 'post_production' ? 'Post-production' :
         status === 'resiliation' ? 'Résiliation' :
         status === 'abandonne' ? 'Abandonné' :
         status === 'disponible' ? 'Disponible' :
         status === 'affecte' || status === 'affecté' ? 'Affectée' :
         status === 'active' || status === 'activé' ? 'Activée' : status}
      </span>
      {showDate && (
        <span className="text-xs text-gray-600">
          {formattedDate}
        </span>
      )}
    </div>
  );
}