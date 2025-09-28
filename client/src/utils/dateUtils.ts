/**
 * SOLUTION DÉFINITIVE - Utilitaires de gestion des dates
 * Garantit la cohérence et la stabilité des dates dans toute l'application
 */

/**
 * Convertit une date en format YYYY-MM-DD stable
 * Évite tous les problèmes de fuseau horaire et décalages
 */
export function formatDateForAPI(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      // Sinon convertir
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn('[DATE UTILS] Date invalide détectée:', date);
      return "";
    }
    
    // Extraire les composants de date en utilisant les méthodes locales
    // pour éviter les problèmes de fuseau horaire
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log(`[DATE UTILS] Conversion: ${date} -> ${result}`);
    return result;
  } catch (error) {
    console.error('[DATE UTILS] Erreur conversion date:', error, 'pour:', date);
    return "";
  }
}

/**
 * Convertit une date ISO en format d'affichage français DD/MM/YYYY
 */
export function formatDateForDisplay(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('[DATE UTILS] Erreur formatage affichage:', error);
    return "";
  }
}

/**
 * Valide qu'une date est au bon format et cohérente
 */
export function validateDate(date: string): { isValid: boolean; error?: string } {
  if (!date) {
    return { isValid: true }; // Les dates vides sont autorisées
  }
  
  // Vérifier le format YYYY-MM-DD
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { 
      isValid: false, 
      error: 'Format attendu: YYYY-MM-DD' 
    };
  }
  
  // Vérifier que la date est valide
  const dateObj = new Date(date + 'T12:00:00.000Z');
  if (isNaN(dateObj.getTime())) {
    return { 
      isValid: false, 
      error: 'Date invalide' 
    };
  }
  
  // Vérifier que la date n'est pas trop dans le futur (max 5 ans)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  if (dateObj > maxDate) {
    return { 
      isValid: false, 
      error: 'Date trop éloignée dans le futur' 
    };
  }
  
  // Vérifier que la date n'est pas trop dans le passé (min 1900)
  const minDate = new Date('1900-01-01');
  if (dateObj < minDate) {
    return { 
      isValid: false, 
      error: 'Date trop ancienne' 
    };
  }
  
  return { isValid: true };
}

/**
 * Nettoie et normalise toutes les dates d'un objet avant envoi API
 */
export function cleanDatesForAPI(data: Record<string, any>): Record<string, any> {
  const cleanedData = { ...data };
  
  Object.keys(cleanedData).forEach(key => {
    if (key.toLowerCase().includes('date')) {
      const originalValue = cleanedData[key];
      const cleanedValue = formatDateForAPI(originalValue);
      
      if (originalValue !== cleanedValue) {
        console.log(`[DATE UTILS] Nettoyage ${key}: ${originalValue} -> ${cleanedValue}`);
      }
      
      cleanedData[key] = cleanedValue;
    }
  });
  
  return cleanedData;
}