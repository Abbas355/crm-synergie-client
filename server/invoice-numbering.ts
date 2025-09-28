/**
 * SYSTÈME DE NUMÉROTATION FISCALE DES FACTURES
 * 
 * ✅ CONFORME aux obligations comptables françaises
 * ✅ Numéros uniques et chronologiques par mois
 * ✅ Format: FA YYYY MM 00000001
 * ✅ Persistence en base de données
 */

import { db } from "@db";
import { facture_counters, factures } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Génère le prochain numéro de facture unique pour une période donnée
 * Format: FA YYYY MM 00000001
 */
export async function generateInvoiceNumber(mois: number, annee: number): Promise<string> {
  try {
    // Rechercher ou créer le compteur pour cette période
    let counter = await db.query.facture_counters.findFirst({
      where: and(
        eq(facture_counters.year, annee),
        eq(facture_counters.month, mois)
      )
    });

    let nextNumber: number;

    if (!counter) {
      // Créer un nouveau compteur pour cette période
      const [newCounter] = await db.insert(facture_counters).values({
        year: annee,
        month: mois,
        counter: 1,
        updatedAt: new Date()
      }).returning();
      
      nextNumber = 1;
    } else {
      // Incrémenter le compteur existant
      nextNumber = counter.counter + 1;
      
      await db.update(facture_counters)
        .set({ 
          counter: nextNumber,
          updatedAt: new Date()
        })
        .where(eq(facture_counters.id, counter.id));
    }

    // Formater le numéro selon le format fiscal FA YYYY MM 00000001
    const formattedNumber = `FA ${annee} ${mois.toString().padStart(2, '0')} ${nextNumber.toString().padStart(8, '0')}`;
    
    console.log(`🧾 NUMÉRO FACTURE GÉNÉRÉ: ${formattedNumber} pour période ${mois}/${annee}`);
    
    return formattedNumber;
  } catch (error) {
    console.error('❌ ERREUR génération numéro facture:', error);
    throw new Error('Impossible de générer le numéro de facture');
  }
}

/**
 * Calcule les dates fiscales conformes pour une facture
 * Date de facturation = dernier jour du mois
 * Date d'échéance = date de facturation + 15 jours
 */
export function calculateInvoiceDates(mois: number, annee: number): { dateFacturation: Date; dateEcheance: Date } {
  // Dernier jour du mois spécifié
  const dateFacturation = new Date(annee, mois, 0); // mois sans -1 car on veut le dernier jour
  
  // Date d'échéance : + 15 jours
  const dateEcheance = new Date(dateFacturation);
  dateEcheance.setDate(dateFacturation.getDate() + 15);
  
  return { dateFacturation, dateEcheance };
}

/**
 * Valide qu'un numéro de facture n'existe pas déjà
 */
export async function validateInvoiceNumber(numeroFacture: string): Promise<boolean> {
  try {
    const existingFacture = await db.query.factures.findFirst({
      where: eq(factures.numeroFacture, numeroFacture)
    });
    
    return !existingFacture; // true si le numéro n'existe pas
  } catch (error) {
    console.error('❌ ERREUR validation numéro facture:', error);
    return false;
  }
}

/**
 * Prévisualise le prochain numéro de facture sans l'incrémenter
 */
export async function previewNextInvoiceNumber(mois: number, annee: number): Promise<string> {
  try {
    const counter = await db.query.facture_counters.findFirst({
      where: and(
        eq(facture_counters.year, annee),
        eq(facture_counters.month, mois)
      )
    });

    const nextNumber = counter ? counter.counter + 1 : 1;
    
    return `FA ${annee} ${mois.toString().padStart(2, '0')} ${nextNumber.toString().padStart(8, '0')}`;
  } catch (error) {
    console.error('❌ ERREUR prévisualisation numéro facture:', error);
    throw new Error('Impossible de prévisualiser le numéro');
  }
}



/**
 * Récupère toutes les factures d'une période
 */
export async function getFacturesByPeriod(mois: number, annee: number) {
  return await db.query.factures.findMany({
    where: and(
      eq(factures.mois, mois),
      eq(factures.annee, annee)
    ),
    orderBy: desc(factures.numeroFacture)
  });
}