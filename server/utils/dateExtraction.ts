/**
 * Utilitaire pour extraire les dates des commentaires clients
 */

// Expressions régulières pour détecter différents formats de dates
const DATE_PATTERNS = [
  // Format DD/MM/YYYY ou DD-MM-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
  // Format DD/MM/YY ou DD-MM-YY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/g,
  // Format YYYY-MM-DD (ISO)
  /(\d{4})-(\d{1,2})-(\d{1,2})/g,
  // Format textuel français (ex: 15 janvier 2025, 15 jan 2025)
  /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|jun|jul|aoû|sep|oct|nov|déc)\s+(\d{4}|\d{2})/gi,
  // Format "le DD/MM" ou "le DD-MM" (année courante)
  /le\s+(\d{1,2})[\/\-](\d{1,2})/gi,
  // Format "demain", "après-demain", "lundi", "mardi", etc.
  /(demain|après-demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi,
  // Format "dans X jours"
  /dans\s+(\d+)\s+jours?/gi,
  // Format "la semaine prochaine"
  /(la\s+semaine\s+prochaine|semaine\s+prochaine)/gi,
  // Format "le mois prochain"
  /(le\s+mois\s+prochain|mois\s+prochain)/gi
];

// Mois en français
const FRENCH_MONTHS: { [key: string]: number } = {
  'janvier': 0, 'jan': 0,
  'février': 1, 'fév': 1,
  'mars': 2, 'mar': 2,
  'avril': 3, 'avr': 3,
  'mai': 4,
  'juin': 5, 'jun': 5,
  'juillet': 6, 'jul': 6,
  'août': 7, 'aoû': 7,
  'septembre': 8, 'sep': 8,
  'octobre': 9, 'oct': 9,
  'novembre': 10, 'nov': 10,
  'décembre': 11, 'déc': 11
};

// Jours de la semaine
const FRENCH_WEEKDAYS: { [key: string]: number } = {
  'dimanche': 0, 'lundi': 1, 'mardi': 2, 'mercredi': 3,
  'jeudi': 4, 'vendredi': 5, 'samedi': 6
};

/**
 * Extrait toutes les dates d'un commentaire texte
 * @param comment Le commentaire à analyser
 * @returns Array des dates trouvées, triées par ordre chronologique
 */
export function extractDatesFromComment(comment: string): Date[] {
  if (!comment || typeof comment !== 'string') {
    return [];
  }

  const dates: Date[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();

  // Nettoyer le commentaire
  const cleanComment = comment.toLowerCase().trim();

  // 1. Détecter les formats DD/MM/YYYY et DD-MM-YYYY
  const ddmmyyyyMatches = comment.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g);
  if (ddmmyyyyMatches) {
    ddmmyyyyMatches.forEach(match => {
      const parts = match.split(/[\/\-]/);
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
      const year = parseInt(parts[2]);
      
      if (isValidDate(day, month, year)) {
        dates.push(new Date(year, month, day));
      }
    });
  }

  // 2. Détecter les formats DD/MM/YY et DD-MM-YY
  const ddmmyyMatches = comment.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/g);
  if (ddmmyyMatches) {
    ddmmyyMatches.forEach(match => {
      const parts = match.split(/[\/\-]/);
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      
      // Convertir année à 2 chiffres en année complète
      if (year < 50) {
        year += 2000;
      } else if (year < 100) {
        year += 1900;
      }
      
      if (isValidDate(day, month, year)) {
        dates.push(new Date(year, month, day));
      }
    });
  }

  // 3. Détecter les formats textuels français
  const textualMatches = comment.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|jun|jul|aoû|sep|oct|nov|déc)\s+(\d{4}|\d{2})/gi);
  if (textualMatches) {
    textualMatches.forEach(match => {
      const parts = match.toLowerCase().split(/\s+/);
      const day = parseInt(parts[0]);
      const monthName = parts[1];
      let year = parseInt(parts[2]);
      
      if (year < 50) {
        year += 2000;
      } else if (year < 100) {
        year += 1900;
      }
      
      const month = FRENCH_MONTHS[monthName];
      if (month !== undefined && isValidDate(day, month, year)) {
        dates.push(new Date(year, month, day));
      }
    });
  }

  // 4. Détecter "le DD/MM" (année courante)
  const ddmmMatches = comment.match(/le\s+(\d{1,2})[\/\-](\d{1,2})/gi);
  if (ddmmMatches) {
    ddmmMatches.forEach(match => {
      const parts = match.replace(/le\s+/i, '').split(/[\/\-]/);
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      
      if (isValidDate(day, month, currentYear)) {
        dates.push(new Date(currentYear, month, day));
      }
    });
  }

  // 5. Détecter les expressions relatives
  if (cleanComment.includes('demain')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dates.push(tomorrow);
  }

  if (cleanComment.includes('après-demain')) {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    dates.push(dayAfterTomorrow);
  }

  // 6. Détecter "dans X jours"
  const daysMatches = comment.match(/dans\s+(\d+)\s+jours?/gi);
  if (daysMatches) {
    daysMatches.forEach(match => {
      const daysNumber = parseInt(match.replace(/dans\s+(\d+)\s+jours?/i, '$1'));
      if (daysNumber > 0 && daysNumber <= 365) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + daysNumber);
        dates.push(futureDate);
      }
    });
  }

  // 7. Détecter les jours de la semaine
  Object.keys(FRENCH_WEEKDAYS).forEach(dayName => {
    if (cleanComment.includes(dayName)) {
      const targetDayOfWeek = FRENCH_WEEKDAYS[dayName];
      const currentDayOfWeek = today.getDay();
      let daysToAdd = targetDayOfWeek - currentDayOfWeek;
      
      // Si le jour est déjà passé cette semaine, prendre la semaine suivante
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + daysToAdd);
      dates.push(futureDate);
    }
  });

  // 8. Détecter "la semaine prochaine"
  if (cleanComment.includes('semaine prochaine')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    dates.push(nextWeek);
  }

  // 9. Détecter "le mois prochain"
  if (cleanComment.includes('mois prochain')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    dates.push(nextMonth);
  }

  // Filtrer les dates valides et futures uniquement
  const validDates = dates.filter(date => {
    return date instanceof Date && !isNaN(date.getTime()) && date >= today;
  });

  // Trier par ordre chronologique et supprimer les doublons
  const uniqueDates = Array.from(new Set(validDates.map(d => d.getTime())))
    .map(time => new Date(time))
    .sort((a, b) => a.getTime() - b.getTime());

  return uniqueDates;
}

/**
 * Trouve la date la plus éloignée dans le futur parmi les dates extraites
 * @param comment Le commentaire à analyser
 * @returns La date la plus éloignée ou null si aucune date n'est trouvée
 */
export function getFarthestDateFromComment(comment: string): Date | null {
  const dates = extractDatesFromComment(comment);
  if (dates.length === 0) {
    return null;
  }
  
  // Retourner la dernière date (la plus éloignée) après tri
  return dates[dates.length - 1];
}

/**
 * Génère une date d'échéance par défaut (48h après maintenant)
 * @returns Date d'échéance par défaut
 */
export function getDefaultDueDate(): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2); // 48 heures = 2 jours
  return dueDate;
}

/**
 * Valide si une date est valide
 * @param day Jour
 * @param month Mois (0-11)
 * @param year Année
 * @returns true si la date est valide
 */
function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 0 || month > 11) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  const date = new Date(year, month, day);
  return date.getFullYear() === year && 
         date.getMonth() === month && 
         date.getDate() === day;
}