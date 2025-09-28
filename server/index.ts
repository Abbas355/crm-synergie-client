
import express from "express";
import session from "express-session";
import type { Request, Response, NextFunction } from "express";

const app = express();

// ⚡ CRITICAL: Configuration du trust proxy pour Replit (DOIT être AVANT session)
app.set('trust proxy', 1); // Trust le proxy Replit pour les cookies sécurisés

// ❌ ENDPOINT SUPPRIMÉ - Conflit avec l'endpoint sécurisé dans routes.ts
// L'endpoint /api/total-points-generated avec authentification et filtrage par vendeur 
// est maintenant géré dans server/routes.ts avec le middleware requireAuth

// Middleware critique pour intercepter les routes API AVANT Vite
app.use((req: any, res, next) => {
  // Si c'est une route API, marquer la requete pour eviter l'interception Vite
  if (req.path.startsWith('/api/')) {
    req.isApiRoute = true;
    // Forcer le traitement des routes API
    res.setHeader('X-API-Route', 'true');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware pour recuperer l'utilisateur depuis la session
app.use(async (req: any, res: any, next: any) => {
  if (req.session?.userId) {
    try {
      const { db } = await import("../db");
      const { users } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Erreur recuperation utilisateur session:", error);
    }
  }
  next();
});

// Servir les fichiers statiques pour les uploads
app.use('/uploads', express.static('public/uploads'));
console.log("Configuration des fichiers statiques pour /uploads");

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Server error:", err);
  res.status(status).json({ message });
});

// Configuration Vite apres le demarrage des routes

// Gestion robuste des erreurs pour eviter les crash loops
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturee:', error);
  // Ne pas arreter le processus immediatement pour les erreurs de DB
  if (error.message?.includes('terminating connection') || (error as any).code === '57P01') {
    console.log('Erreur de connexion DB detectee, tentative de recuperation...');
    return;
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise) => {
  console.error('❌ Promesse rejetee non geree:', reason);
  // Ne pas arreter pour les erreurs PostgreSQL specifiques
  if (reason?.code === '57P01' || reason?.message?.includes('terminating connection')) {
    console.log('Erreur PostgreSQL detectee, continuer l execution...');
    return;
  }
  process.exit(1);
});

// Routes API et serveur
(async () => {
  try {
    console.log("Demarrage application...");
    
    // IMPORTANT: Initialiser les sessions avec PostgreSQL store AVANT les routes
    const { storage } = await import("./storage");
    app.use(session({
      store: storage.sessionStore, // Utiliser le PostgreSQL store pour la persistance
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      rolling: true, // Renouvelle la session à chaque requête
      proxy: true, // Trust le proxy pour les cookies sécurisés
      name: 'sessionId', // Nom personnalisé du cookie de session
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Cookies sécurisés en production
        sameSite: 'lax', // 'lax' suffit, pas besoin de 'none' sauf cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours pour éviter les déconnexions
        path: '/', // Disponible sur tout le site
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined // Utiliser variable d'environnement si besoin
      }
    }));
    console.log("✅ Session PostgreSQL store configuré");
    
    // Initialisation de la base de donnees
    console.log("Initialisation connexion base de donnees...");
    
    // ❌ ENDPOINT SPECIAL SUPPRIMÉ - Conflit avec l'endpoint sécurisé dans routes.ts
    // L'endpoint /api/total-points-generated avec authentification et filtrage par vendeur 
    // est maintenant géré dans server/routes.ts avec le middleware requireAuth

    // Test de la connexion DB avec retry
    const { testConnection } = await import("../db");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn("⚠️ Impossible de se connecter a la DB, l'application continuera mais certaines fonctionnalites pourraient etre limitees");
    }

    // IMPORTANT : Monter les routes API directement
    const { registerRoutes } = await import("./routes");
    await registerRoutes(app);
    console.log("Routes API montees directement");
    
    // Configuration Vite APRES les routes API avec middleware de priorite API
    let server;
    if (process.env.NODE_ENV !== "production") {
      try {
        const { setupVite } = await import("./vite");
        const http = await import("http");
        server = http.createServer(app);
        
        // Middleware CRITIQUE pour empecher Vite d'intercepter les routes API  
        app.use((req, res, next) => {
          if (req.path.startsWith('/api/')) {
            // Si on arrive ici, c'est qu'aucune route API n'a matche
            // Renvoyer directement 404 au lieu de laisser Vite intercepter
            return res.status(404).json({ 
              error: 'API route not found', 
              path: req.path,
              method: req.method 
            });
          }
          next();
        });
        
        await setupVite(app, server);
        console.log("Vite configure pour le developpement");
      } catch (error) {
        console.log("Configuration Vite non disponible:", error);
      }
    } else {
      // MODE PRODUCTION : Utiliser la configuration production existante
      console.log("🚀 Configuration mode production");
      const { setupProductionServer } = await import("./production");
      setupProductionServer(app);
      console.log("✅ Configuration production appliquée");
    }
    
    // Port configure pour Replit - utilise 3000 pour deploiement Autoscale
    // Pour le developpement local, utiliser le port 5000 pour correspondre au workflow
    // Pour le deploiement, utiliser le port 3000
    const defaultPort = process.env.NODE_ENV === 'production' ? 3000 : 5000;
    const port = process.env.PORT ? parseInt(process.env.PORT) : defaultPort;
    
    if (server) {
      server.listen(port, "0.0.0.0", () => {
        console.log(`Serveur HTTP demarre sur http://0.0.0.0:${port}`);
      });
    } else {
      app.listen(port, "0.0.0.0", () => {
        console.log(`Application demarree sur http://0.0.0.0:${port}`);
      });
    }
    
  } catch (error) {
    console.error("Erreur lors du demarrage:", error);
    process.exit(1);
  }
})();
