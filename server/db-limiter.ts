/**
 * Utilitaire pour gérer les limites de taux de la base de données
 * et rendre l'application plus résiliente aux erreurs de connexion
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

// Configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Exécute une requête SQL avec gestion d'erreur et de réessai
 * @param queryName Nom de la requête (pour le logging)
 * @param queryFn Fonction exécutant la requête
 * @returns Résultat de la requête ou null en cas d'échec
 */
export async function safeDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T | null> {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      return await queryFn();
    } catch (error: any) {
      attempts++;
      
      // Log l'erreur avec des détails
      const errorMessage = error?.message || 'Unknown error';
      const isRateLimit = errorMessage.includes('rate limit');
      
      console.warn(`[DB:${queryName}] Tentative ${attempts}/${MAX_RETRY_ATTEMPTS} échouée: ${errorMessage}`);
      
      // Si c'est la dernière tentative, on abandonne
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(`[DB:${queryName}] Abandon après ${MAX_RETRY_ATTEMPTS} tentatives`);
        return null;
      }
      
      // Attendre plus longtemps si c'est une erreur de limite de taux
      const delayMs = isRateLimit ? RETRY_DELAY_MS * 2 : RETRY_DELAY_MS;
      console.log(`[DB:${queryName}] Nouvelle tentative dans ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return null;
}

/**
 * Vérifie si la base de données est accessible
 * @returns true si la base de données est accessible, false sinon
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await safeDbQuery('healthcheck', () => 
      db.execute(sql`SELECT 1 as health`)
    );
    
    return result !== null;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
}