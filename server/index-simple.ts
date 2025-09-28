import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerFinalRoutes } from "./routes-final";

// Démarrage simplifié de l'application pour éviter les timeouts
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Gestion des erreurs simplifiée
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Server error:", err);
  res.status(status).json({ message });
});

// Routes API et serveur Vite
(async () => {
  try {
    console.log("🚀 Démarrage application...");
    
    // Enregistrer les routes
    const server = await registerFinalRoutes(app);
    
    const port = 5000;
    
    if (!server.listening) {
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        console.log(`✅ Serveur démarré sur le port ${port}`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur démarrage:", error);
    process.exit(1);
  }
})();