import { Request, Response, NextFunction } from 'express';

// Middleware temporaire pour remplacer l'authentification pendant les problèmes de base de données
export function mockAuthentication(req: Request, res: Response, next: NextFunction) {
  // Simuler un utilisateur authentifié pour les besoins de développement
  // Ceci est UNIQUEMENT pour dépanner temporairement pendant la résolution du problème de base de données
  if (req.path === '/api/user') {
    return res.status(200).json({
      id: 1,
      username: "admin@synergie.com",
      isAdmin: true,
      role: "admin"
    });
  }
  
  // Continuer la chaîne de middleware
  next();
}