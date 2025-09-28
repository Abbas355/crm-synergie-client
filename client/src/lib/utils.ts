import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "-";
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getStatusColor(status: string): string {
  // Convertir les variantes d'orthographe à des valeurs standardisées
  const normalizedStatus = normalizeStatus(status);
  
  const statusMap: Record<string, string> = {
    // Statuts originaux
    urgent: "bg-red-100 text-red-800",
    moyen: "bg-yellow-100 text-yellow-800",
    faible: "bg-green-100 text-green-800",
    client: "bg-green-100 text-green-800",
    campagne: "bg-blue-100 text-blue-800",
    tâche: "bg-yellow-100 text-yellow-800",
    
    // Nouveaux statuts avec couleurs demandées
    enregistre: "bg-white text-gray-800 border border-gray-200", // Blanc
    valide: "bg-amber-200 text-amber-800", // Jaune foncé
    valide_7j: "bg-gray-200 text-gray-800", // Gris clair
    rendez_vous: "text-white", // Vert-brun avec couleur personnalisée
    installation: "bg-green-100 text-green-800", // Vert très clair
    post_production: "bg-red-200 text-red-800", // Rouge clair
    resiliation: "bg-red-600 text-white", // Rouge exact selon capture
    abandonne: "bg-gray-700 text-white", // Gris foncé
  };

  return statusMap[normalizedStatus] || "bg-gray-100 text-gray-800";
}

// Fonction qui normalise les statuts pour gérer différentes orthographes/formats
export function normalizeStatus(status: string): string {
  if (!status) return "enregistre";
  
  // Conversion vers format standardisé pour la correspondance des couleurs
  const statusLower = status.toLowerCase().trim();
  
  if (statusLower.includes("validé") && statusLower.includes("7") && statusLower.includes("jour")) {
    return "valide_7j";
  }
  if (statusLower === "validé 7 jours" || statusLower === "valide 7 jours") {
    return "valide_7j";
  }
  if (statusLower === "validé" || statusLower === "valide") {
    return "valide";
  }
  if (statusLower === "enregistré" || statusLower === "enregistre") {
    return "enregistre";
  }
  if (statusLower.includes("rendez-vous") || statusLower.includes("rendez vous")) {
    return "rendez_vous";
  }
  if (statusLower.includes("install")) {
    return "installation";
  }
  if (statusLower.includes("post") && statusLower.includes("prod")) {
    return "post_production";
  }
  if (statusLower.includes("post-production")) {
    return "post_production";
  }
  if (statusLower.includes("résil") || statusLower.includes("resil")) {
    return "resiliation";
  }
  if (statusLower.includes("abandon")) {
    return "abandonne";
  }
  
  // Par défaut, retourner le statut tel quel
  return statusLower.replace(/[^a-z0-9_]/g, "_");
}

/**
 * Convertit un code vendeur du format V1001 au format FR12345678
 * @param code Code vendeur au format V + 4 chiffres
 * @returns Code vendeur au format FR + 8 chiffres ou le code original si non reconnu
 */
export function formatVendorCode(code: string | null | undefined): string {
  if (!code) return '';
  
  // Si c'est déjà au format FR12345678, le retourner tel quel
  if (code.startsWith('FR') && code.length === 10) {
    return code;
  }
  
  // Si c'est au format V1001, le convertir en FR12345678
  if (code.startsWith('V') && code.length <= 5) {
    try {
      // Extraire les chiffres après le "V" et les convertir en nombre
      const digits = parseInt(code.substring(1));
      
      // Formater comme FR + 8 chiffres
      return `FR${digits.toString().padStart(8, '0')}`;
    } catch (error) {
      console.error('Erreur de conversion du code vendeur:', error);
    }
  }
  
  // En cas d'erreur ou si le format n'est pas reconnu, retourner le code tel quel
  return code;
}
