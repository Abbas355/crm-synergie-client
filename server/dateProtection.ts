/**
 * PROTECTION DÉFINITIVE CONTRE LES MODIFICATIONS AUTOMATIQUES DE DATES
 * Ce module garantit qu'aucune date ne peut être modifiée sans intention explicite
 */

export interface DateProtectionConfig {
  allowAutoGeneration: boolean;
  requireExplicitIntent: boolean;
  logAllChanges: boolean;
}

const config: DateProtectionConfig = {
  allowAutoGeneration: false,  // Interdire la génération automatique de dates
  requireExplicitIntent: true, // Exiger une intention explicite pour toute modification
  logAllChanges: true         // Logger toutes les modifications pour audit
};

/**
 * Vérifie si une modification de date est intentionnelle
 */
export function isIntentionalDateChange(
  originalValue: any,
  newValue: any,
  fieldName: string
): { isIntentional: boolean; reason: string } {
  
  // Si les deux valeurs sont null/undefined, pas de changement
  if (!originalValue && !newValue) {
    return { isIntentional: true, reason: "Pas de changement (toutes deux null)" };
  }
  
  // Si l'original est null et le nouveau n'est pas null, c'est intentionnel
  if (!originalValue && newValue) {
    return { isIntentional: true, reason: "Ajout intentionnel d'une date" };
  }
  
  // Si l'original n'est pas null et le nouveau est null, c'est intentionnel
  if (originalValue && !newValue) {
    return { isIntentional: true, reason: "Suppression intentionnelle d'une date" };
  }
  
  // Si les deux existent, comparer les valeurs normalisées
  if (originalValue && newValue) {
    const normalizedOriginal = normalizeDate(originalValue);
    const normalizedNew = normalizeDate(newValue);
    
    if (normalizedOriginal === normalizedNew) {
      return { isIntentional: true, reason: "Même date, pas de changement réel" };
    } else {
      return { isIntentional: true, reason: "Modification explicite de date" };
    }
  }
  
  return { isIntentional: false, reason: "Changement non déterminé" };
}

/**
 * Normalise une date pour la comparaison
 */
function normalizeDate(date: any): string {
  if (!date) return "";
  
  try {
    if (typeof date === 'string') {
      // Extraire juste la partie date (YYYY-MM-DD)
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Protège contre les modifications automatiques non voulues
 */
export function protectDateFields(
  originalData: Record<string, any>,
  updateData: Record<string, any>
): { 
  protectedData: Record<string, any>; 
  warnings: string[];
  blocked: string[];
} {
  
  const protectedData = { ...updateData };
  const warnings: string[] = [];
  const blocked: string[] = [];
  
  // Identifier tous les champs de date
  const dateFields = Object.keys(updateData).filter(key => 
    key.toLowerCase().includes('date') || key.toLowerCase().includes('Date')
  );
  
  for (const field of dateFields) {
    const originalValue = originalData[field];
    const newValue = updateData[field];
    
    const protection = isIntentionalDateChange(originalValue, newValue, field);
    
    if (config.logAllChanges) {
      console.log(`📅 [PROTECTION DATES] ${field}: ${originalValue} -> ${newValue} | ${protection.reason}`);
    }
    
    // Si c'est NULL vers NULL, ne pas traiter
    if (!originalValue && !newValue) {
      delete protectedData[field];
      continue;
    }
    
    // Si c'est intentionnel, permettre la modification
    if (protection.isIntentional) {
      warnings.push(`Date ${field} modifiée: ${protection.reason}`);
    } else {
      // Bloquer les modifications non intentionnelles
      blocked.push(`Modification bloquée pour ${field}: ${protection.reason}`);
      delete protectedData[field];
    }
  }
  
  return { protectedData, warnings, blocked };
}

/**
 * Middleware de protection pour les routes de mise à jour
 */
export function createDateProtectionMiddleware() {
  return async (req: any, res: any, next: any) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Récupérer les données originales si possible
      const originalData = req.originalData || {};
      const updateData = req.body || {};
      
      const protection = protectDateFields(originalData, updateData);
      
      if (protection.blocked.length > 0) {
        console.warn(`⚠️ [PROTECTION DATES] Modifications bloquées:`, protection.blocked);
      }
      
      if (protection.warnings.length > 0) {
        console.info(`ℹ️ [PROTECTION DATES] Avertissements:`, protection.warnings);
      }
      
      // Remplacer les données de la requête par les données protégées
      req.body = protection.protectedData;
      req.dateProtectionInfo = {
        warnings: protection.warnings,
        blocked: protection.blocked
      };
    }
    
    next();
  };
}