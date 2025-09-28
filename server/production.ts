import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration serveur de production
 * Résout le problème de page blanche en déploiement
 */
export function setupProductionServer(app: express.Application) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPLIT_DEPLOYMENT === 'true';
  
  console.log('🔧 Configuration serveur production:', { isProduction, isReplit });

  if (isProduction || isReplit) {
    // Servir les fichiers statiques depuis le bon répertoire
    const staticPath = join(process.cwd(), 'dist', 'public');
    
    console.log('📁 Chemin fichiers statiques:', staticPath);
    
    // Vérifier si le répertoire existe
    if (fs.existsSync(staticPath)) {
      console.log('✅ Répertoire statique trouvé');
      
      // Servir les fichiers statiques avec cache
      app.use(express.static(staticPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true,
        setHeaders: (res: Response, path: string) => {
          // Cache plus long pour les assets
          if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h
          }
        }
      }));
    } else {
      console.log('⚠️ Répertoire statique non trouvé:', staticPath);
    }

    // Servir les uploads
    const uploadsPath = join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsPath)) {
      app.use('/uploads', express.static(uploadsPath));
      console.log('✅ Répertoire uploads configuré:', uploadsPath);
    }

    // Middleware pour servir index.html pour toutes les routes SPA
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Ignorer les routes API
      if (req.path.startsWith('/api/')) {
        return next();
      }

      // Ignorer les fichiers statiques
      if (req.path.includes('.')) {
        return next();
      }

      // Servir index.html pour les routes SPA
      const indexPath = join(staticPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        console.log('📄 Servir index.html pour:', req.path);
        res.sendFile(indexPath);
      } else {
        console.log('❌ index.html non trouvé:', indexPath);
        res.status(404).send(`
          <html>
            <head><title>Application Non Trouvée</title></head>
            <body>
              <h1>Erreur de Déploiement</h1>
              <p>L'application n'a pas été correctement déployée.</p>
              <p>Chemin recherché: ${indexPath}</p>
              <p>Répertoire courant: ${__dirname}</p>
            </body>
          </html>
        `);
      }
    });
  }

  // Endpoint de santé pour vérifier le déploiement
  app.get('/health', (req: Request, res: Response) => {
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      replit: process.env.REPLIT_DEPLOYMENT,
      port: process.env.PORT,
      version: '1.0.0'
    };
    
    console.log('❤️ Health check:', healthInfo);
    res.json(healthInfo);
  });

  // Middleware d'erreur global
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Erreur serveur:', err);
    
    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Configuration serveur production terminée');
}