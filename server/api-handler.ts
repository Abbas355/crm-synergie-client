import { Router } from "express";
import { registerRoutes } from "./routes";
import express from "express";

/**
 * Gestionnaire API prioritaire qui empêche l'interception par Vite
 * Crée un sous-application Express dédiée aux routes API
 */
export async function createApiHandler() {
  // Créer une sous-application Express pour les API
  const apiApp = express();
  
  // Copier les middlewares essentiels
  apiApp.use(express.json());
  apiApp.use(express.urlencoded({ extended: false }));
  
  // Enregistrer toutes les routes API
  await registerRoutes(apiApp);
  
  return apiApp;
}

/**
 * Setup du routeur API complet pour éviter l'interception Vite
 */
export async function setupApiRoutes(app: express.Express) {
  // Créer le routeur API
  const apiRouter = Router();
  
  // Enregistrer toutes les routes sur le routeur
  await registerRoutes(apiRouter);
  
  // Monter le routeur API avec préfixe
  app.use('/api', apiRouter);
  
  return apiRouter;
}