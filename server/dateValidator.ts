/**
 * VALIDATION DÉFINITIVE DES DATES CÔTÉ SERVEUR
 * Couche de sécurité supplémentaire pour garantir la cohérence des dates
 */

export interface DateValidationResult {
  isValid: boolean;
  normalizedDate?: Date;
  error?: string;
}

/**
 * Valide et normalise une date pour la base de données
 * Garantit que toutes les dates sont stockées de manière cohérente
 */
export function validateAndNormalizeDate(value: any): DateValidationResult {
  // Dates null/undefined sont autorisées
  if (value === null || value === undefined || value === '') {
    return { isValid: true, normalizedDate: undefined };
  }

  try {
    // Conversion selon le type
    let dateObj: Date;
    
    if (typeof value === 'string') {
      // Format YYYY-MM-DD (le plus courant)
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split('-').map(Number);
        
        // Validation des composants
        if (year < 1900 || year > 2100) {
          return { isValid: false, error: `Année invalide: ${year}` };
        }
        if (month < 1 || month > 12) {
          return { isValid: false, error: `Mois invalide: ${month}` };
        }
        if (day < 1 || day > 31) {
          return { isValid: false, error: `Jour invalide: ${day}` };
        }
        
        // Créer la date normalisée à 12:00 UTC
        dateObj = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`);
      } else {
        // Autres formats: tenter conversion standard
        dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          return { isValid: false, error: `Format de date non reconnu: ${value}` };
        }
        
        // Normaliser à 12:00 UTC pour cohérence
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        dateObj = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`);
      }
    } else if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return { isValid: false, error: 'Objet Date invalide' };
      }
      
      // Normaliser à 12:00 UTC
      const year = value.getFullYear();
      const month = value.getMonth() + 1;
      const day = value.getDate();
      dateObj = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`);
    } else {
      return { isValid: false, error: `Type de date non supporté: ${typeof value}` };
    }

    // Validation finale de la date créée
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Date résultante invalide' };
    }

    // Vérification des limites raisonnables
    const minDate = new Date('1900-01-01T00:00:00.000Z');
    const maxDate = new Date('2100-12-31T00:00:00.000Z');
    
    if (dateObj < minDate || dateObj > maxDate) {
      return { isValid: false, error: 'Date hors limites acceptables (1900-2100)' };
    }

    return { 
      isValid: true, 
      normalizedDate: dateObj 
    };

  } catch (error) {
    return { 
      isValid: false, 
      error: `Erreur de validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
    };
  }
}

/**
 * Valide spécifiquement les dates de signature, rendez-vous et installation
 * Applique des règles métier en plus de la validation technique
 */
export function validateBusinessDate(
  value: any, 
  dateType: 'signature' | 'rendez-vous' | 'installation'
): DateValidationResult {
  const baseValidation = validateAndNormalizeDate(value);
  
  if (!baseValidation.isValid || !baseValidation.normalizedDate) {
    return baseValidation;
  }

  const date = baseValidation.normalizedDate;
  const now = new Date();
  
  // Règles métier selon le type de date
  switch (dateType) {
    case 'signature':
      // Date de signature: pas plus de 1 an dans le futur
      const maxSignatureDate = new Date();
      maxSignatureDate.setFullYear(maxSignatureDate.getFullYear() + 1);
      if (date > maxSignatureDate) {
        return { isValid: false, error: 'Date de signature trop éloignée dans le futur' };
      }
      break;
      
    case 'rendez-vous':
      // Date de rendez-vous: pas dans le passé (sauf pour les modifications)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date < yesterday) {
        return { isValid: false, error: 'Date de rendez-vous trop ancienne' };
      }
      break;
      
    case 'installation':
      // Date d'installation: logique similar au rendez-vous
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (date < weekAgo) {
        return { isValid: false, error: 'Date d\'installation trop ancienne' };
      }
      break;
  }

  return baseValidation;
}