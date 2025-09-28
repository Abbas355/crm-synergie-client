import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration optimisée pour éviter les déconnexions Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Réduction du nombre de connexions maximum
  idleTimeoutMillis: 20000, // Timeout plus court pour éviter les déconnexions
  connectionTimeoutMillis: 10000, // Timeout de connexion plus long
  maxUses: 1000, // Réduction du nombre d'utilisations par connexion
  allowExitOnIdle: false // Empêche la fermeture automatique
});

export const db = drizzle({ client: pool, schema });

// Fonction de test de connexion avec retry
export async function testConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Test de connexion DB (tentative ${i + 1}/${retries})...`);
      await db.execute(sql`SELECT 1`);
      console.log('✅ Connexion DB réussie');
      return true;
    } catch (error: any) {
      console.warn(`⚠️ Échec connexion DB (tentative ${i + 1}):`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Délai croissant
      }
    }
  }
  console.error('❌ Impossible de se connecter à la DB après plusieurs tentatives');
  return false;
}

// Gestionnaire d'erreur pour le pool
pool.on('error', (err) => {
  console.warn('Erreur du pool de connexions:', err.message);
  // Ne pas faire crasher l'application pour les erreurs de pool
});

// Graceful shutdown handler avec gestion d'erreur
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, fermeture des connexions DB...');
  try {
    await pool.end();
  } catch (error) {
    console.warn('Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT reçu, fermeture des connexions DB...');
  try {
    await pool.end();
  } catch (error) {
    console.warn('Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});