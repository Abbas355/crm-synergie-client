import { db } from "../../db";
import { recruiters } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Récupère ou génère un code vendeur pour un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Le code vendeur au format FR + 8 chiffres
 */
export async function getOrGenerateVendorCode(userId: number): Promise<string> {
  try {
    // Vérifier si l'utilisateur est un recruteur
    const recruteur = await db.query.recruiters.findFirst({
      where: eq(recruiters.userId, userId)
    });

    if (recruteur) {
      // Si c'est un recruteur, utiliser son code vendeur
      // Vérifier le format et le convertir si nécessaire
      if (recruteur.codeVendeur.startsWith('FR') && recruteur.codeVendeur.length === 10) {
        return recruteur.codeVendeur;
      } else if (recruteur.codeVendeur.startsWith('V') && recruteur.codeVendeur.length === 5) {
        // Transformer l'ancien format V001 en FR + 8 chiffres
        // Utiliser les 3 derniers chiffres du V001 et compléter avec des zéros
        const suffix = recruteur.codeVendeur.substring(1).padStart(8, '0');
        return `FR${suffix}`;
      } else {
        // Générer un nouveau code au format correct
        const newCode = generateVendorCode();
        
        // Mettre à jour le code du recruteur dans la base de données
        await db.update(recruiters)
          .set({ codeVendeur: newCode })
          .where(eq(recruiters.id, recruteur.id));
          
        return newCode;
      }
    } else {
      // Si ce n'est pas un recruteur, générer un code unique pour cet utilisateur
      return generateVendorCode();
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du code vendeur:", error);
    // En cas d'erreur, générer un code par défaut
    return generateVendorCode();
  }
}

/**
 * Génère un code vendeur unique au format FR + 8 chiffres
 */
export function generateVendorCode(): string {
  // Générer 8 chiffres aléatoires
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `FR${randomDigits}`;
}