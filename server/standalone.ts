import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS pour le développement
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Server error:", err);
  res.status(status).json({ message });
});

// Importation et démarrage des routes
(async () => {
  try {
    console.log("Démarrage serveur API standalone...");
    
    const { registerFinalRoutes } = await import("./routes-final");
    await registerFinalRoutes(app);
    
    const port = 3001;
    
    app.listen(port, "0.0.0.0", () => {
      console.log(`Serveur API démarré sur le port ${port}`);
    });

  } catch (error) {
    console.error("Erreur démarrage serveur API:", error);
  }
})();