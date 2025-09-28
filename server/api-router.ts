import { Router } from "express";
import { registerRoutes } from "./routes";

/**
 * Routeur API dédié qui s'exécute en priorité absolue
 * Empêche l'interception par Vite en créant un sous-routeur spécifique
 */
export async function createApiRouter() {
  const apiRouter = Router();
  
  // Appliquer toutes les routes API sur ce routeur
  await registerRoutes(apiRouter as any);
  
  return apiRouter;
}

export function setupApiRouting(app: any) {
  // Créer un middleware qui force l'exécution des routes API
  app.use('/api', async (req: any, res: any, next: any) => {
    const apiRouter = await createApiRouter();
    apiRouter(req, res, next);
  });
}