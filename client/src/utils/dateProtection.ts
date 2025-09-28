/**
 * Module de protection des dates - CORRECTION BUG CRITIQUE
 * Empêche les dates de reculer automatiquement lors des modifications
 * Gère correctement les fuseaux horaires et formats de dates
 */

export interface DateProtectedData {
  [key: string]: any;
  dateSignature?: string | null;
  dateRendezVous?: string | null;
  dateInstallation?: string | null;
  dateNaissance?: string | null;
  dateNaissance?: string | null; // Architecture unifiée
  codePostal?: string | null; // Architecture unifiée
  identifiantContrat?: string | null; // Architecture unifiée
}

/**
 * Convertit une date en format YYYY-MM-DD sans décalage de fuseau horaire
 * SOLUTION CRITIQUE: Évite le décalage automatique d'un jour
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date || date === null || date === undefined) {
    return "";
  }
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Si la date contient déjà un format YYYY-MM-DD, la retourner directement
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.log(`🔒 Date déjà au bon format: ${date}`);
        return date;
      }
      
      // Pour les dates ISO, utiliser une méthode qui préserve la date locale
      if (date.includes('T') || date.includes('Z')) {
        // Extraire uniquement la partie date (YYYY-MM-DD) sans conversion de fuseau
        const datePart = date.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          console.log(`🔒 Date ISO convertie en locale: ${date} -> ${datePart}`);
          return datePart;
        }
      }
      
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn(`⚠️ Date invalide détectée: ${date}`);
      return "";
    }
    
    // SOLUTION CRITIQUE: Utiliser les méthodes locales pour éviter le décalage UTC
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    console.log(`🔒 Date protégée formatée: ${date} -> ${formattedDate}`);
    return formattedDate;
    
  } catch (error) {
    console.error(`❌ Erreur lors du formatage de la date: ${date}`, error);
    return "";
  }
}

/**
 * Nettoie et protège toutes les dates dans un objet de données
 * PROTECTION GLOBALE: Applique la protection à tous les champs de date
 */
export function protectDatesInData<T extends DateProtectedData>(data: T): T {
  const protectedData = { ...data } as any;
  
  // Liste des champs de date à protéger
  const dateFields = ['dateSignature', 'dateRendezVous', 'dateInstallation', 'dateNaissance', 'dateNaissance'];
  
  dateFields.forEach(field => {
    if (field in protectedData) {
      const originalValue = protectedData[field];
      const protectedValue = formatDateForInput(originalValue);
      
      if (originalValue !== protectedValue) {
        console.log(`🛡️ Protection appliquée sur ${field}: ${originalValue} -> ${protectedValue}`);
      }
      
      // Pour les champs de date: préserver les chaînes vides au lieu de les convertir en null
      // Si la valeur formatée est vide, garder null pour les dates (plus correct pour la DB)
      protectedData[field] = protectedValue === "" ? null : protectedValue;
    }
  });
  
  // IMPORTANT: Préserver tous les autres champs tel quel (codePostal, identifiantContrat, source, etc.)
  // Ne pas modifier les champs non-date qui peuvent avoir des valeurs vides légitimes
  
  return protectedData as T;
}

/**
 * Vérifie si une date est valide sans décalage
 */
export function isValidDateWithoutOffset(date: string): boolean {
  if (!date) return false;
  
  // Vérifier le format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Vérifier que la date peut être parsée correctement
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mois base 0
  const day = parseInt(parts[2], 10);
  
  const testDate = new Date(year, month, day);
  return testDate.getFullYear() === year &&
         testDate.getMonth() === month &&
         testDate.getDate() === day;
}

/**
 * Compare deux dates en ignorant les fuseaux horaires
 */
export function areDatesEqual(date1: string | null | undefined, date2: string | null | undefined): boolean {
  const formatted1 = formatDateForInput(date1);
  const formatted2 = formatDateForInput(date2);
  return formatted1 === formatted2;
}

/**
 * Crée des valeurs par défaut sécurisées pour un formulaire
 * CORRECTION BUG: Convertit null en chaînes vides pour l'affichage dans les formulaires
 */
export function createSafeDefaultValues(clientData: any): any {
  const safeDefaults = {
    ...clientData, // Préserver TOUS les champs d'abord
    // Appliquer la protection aux dates ET convertir null vers chaîne vide pour l'affichage
    dateSignature: clientData.dateSignature ? formatDateForInput(clientData.dateSignature) : "",
    dateRendezVous: clientData.dateRendezVous ? formatDateForInput(clientData.dateRendezVous) : "",
    dateInstallation: clientData.dateInstallation ? formatDateForInput(clientData.dateInstallation) : "",
    dateNaissance: clientData.dateNaissance ? formatDateForInput(clientData.dateNaissance) : "",
    
    // CORRECTION BUG CRITIQUE: Convertir null vers chaîne vide pour les champs de saisie
    codePostal: clientData.codePostal || "",
    identifiantContrat: clientData.identifiantContrat || "",
    source: clientData.source || "",
    commentaire: clientData.commentaire || "",
    adresse: clientData.adresse || "",
    ville: clientData.ville || "",
    telephone: clientData.telephone || clientData.phone || "",
    email: clientData.email || "",
    prenom: clientData.prenom || "",
    nom: clientData.nom || "",
    civilite: clientData.civilite || "",
    produit: clientData.produit || "",
    status: clientData.status || "",
    codeVendeur: clientData.codeVendeur || "",
    portabilite: clientData.portabilite || "",
    carteSim: clientData.carteSim || "",
    carteSIM: clientData.carteSim || clientData.carteSIM || "",
    numeroPorter: clientData.numeroPorter || "",
  };
  
  console.log(`🛡️ Valeurs par défaut sécurisées créées:`, {
    original: {
      dateNaissance: clientData.dateNaissance,
      codePostal: clientData.codePostal,
      identifiantContrat: clientData.identifiantContrat,
      source: clientData.source,
    },
    protected: {
      dateNaissance: safeDefaults.dateNaissance,
      codePostal: safeDefaults.codePostal,
      identifiantContrat: safeDefaults.identifiantContrat,
      source: safeDefaults.source,
      dateSignature: safeDefaults.dateSignature,
      dateInstallation: safeDefaults.dateInstallation,
    }
  });
  
  return safeDefaults;
}