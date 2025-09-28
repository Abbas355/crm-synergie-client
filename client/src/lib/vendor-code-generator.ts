/**
 * Utilitaire pour la gestion des codes vendeurs
 * Permet de générer et valider des codes vendeurs au format FR+8 chiffres
 */

/**
 * Génère un code vendeur unique au format FR + 8 chiffres aléatoires
 * Exclut la plage réservée à l'entreprise (FR00000001 à FR99999999)
 * @returns Code vendeur généré
 */
export function generateVendorCode(): string {
  // Générer un nombre aléatoire en dehors de la plage réservée
  const min = 10000000; // 10 millions
  const max = 99999999; // 99 millions
  
  // Générer un nombre entre min et max
  const randomNum = Math.floor(min + Math.random() * (max - min + 1));
  
  // Formater avec des zéros en tête si nécessaire pour garantir 8 chiffres
  const numStr = randomNum.toString().padStart(8, '0');
  
  // Retourner le code complet
  return `FR${numStr}`;
}

/**
 * Vérifie si un code vendeur est au format FR+8 chiffres
 * @param code - Code vendeur à vérifier
 * @returns true si le format est valide, false sinon
 */
export function validateVendorCode(code: string): boolean {
  return /^FR\d{8}$/.test(code);
}

/**
 * Vérifie si un code vendeur est dans la plage réservée à l'entreprise (FR00000001 à FR99999999)
 * @param code - Code vendeur à vérifier
 * @returns true si le code est réservé, false sinon
 */
export function isReservedVendorCode(code: string): boolean {
  if (!validateVendorCode(code)) return false;
  
  const numPart = code.substring(2);
  const numValue = parseInt(numPart, 10);
  
  return numValue >= 1 && numValue <= 99999999;
}