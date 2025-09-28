import { Express } from "express";

/**
 * Middleware critique pour intercepter les routes API avant Vite
 * Force le traitement des routes API en bloquant l'interception Vite
 */
export function setupApiMiddleware(app: Express) {
  // Middleware pour marquer les routes API et empêcher l'interception Vite
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      // Marquer comme route API
      req.isApiRoute = true;
      
      // Empêcher l'interception par Vite en définissant un handler spécial
      const originalSend = res.send;
      res.send = function(data) {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
        }
        return originalSend.call(this, data);
      };
    }
    next();
  });
}