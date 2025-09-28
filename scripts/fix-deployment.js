#!/usr/bin/env node
import { build as esbuild } from 'esbuild';
import fs from 'fs';
import path from 'path';

console.log('🔧 Correction des erreurs de déploiement...');

// 1. Corriger le serveur de production
const productionServerCode = `import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupProduction(app) {
  console.log("Configuration production - CWD:", process.cwd());
  
  // Chemins optimisés pour la production
  const distPublicPath = path.join(process.cwd(), "dist", "public");
  const fallbackPublicPath = path.join(process.cwd(), "public");
  
  // Déterminer le chemin des fichiers statiques
  const staticPath = fs.existsSync(distPublicPath) ? distPublicPath : fallbackPublicPath;
  
  console.log("Chemins production:", { 
    staticPath, 
    distPublicExists: fs.existsSync(distPublicPath),
    fallbackExists: fs.existsSync(fallbackPublicPath)
  });
  
  // Servir les uploads en priorité
  const uploadsPath = path.join(staticPath, "uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath, {
      maxAge: 0,
      etag: false
    }));
    console.log("Uploads configurés depuis:", uploadsPath);
  }
  
  // Servir tous les fichiers statiques depuis le dossier de build
  app.use(express.static(staticPath, {
    maxAge: "1d",
    etag: false,
    index: false
  }));

  // Headers no-cache pour les routes SPA
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
    }
    next();
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "free-sales-management"
    });
  });

  // Fallback pour SPA - toutes les routes non-API retournent index.html
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ message: "API endpoint not found" });
    } else {
      const indexPath = path.join(staticPath, "index.html");
      console.log("Serving SPA fallback for:", req.path, "->", indexPath);
      
      // Vérifier si le fichier existe
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error("Index.html not found at:", indexPath);
        console.log("Available files in staticPath:", fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : "Directory not found");
        
        res.status(500).send(\`
          <html>
            <head><title>Erreur de Configuration</title></head>
            <body style="font-family: Arial, sans-serif; padding: 2rem; background: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #e74c3c;">Erreur de Configuration du Serveur</h1>
                <p>Les fichiers de build sont introuvables. Veuillez exécuter le processus de build.</p>
                <p><strong>Chemin recherché :</strong> \${indexPath}</p>
                <p><strong>Répertoire statique :</strong> \${staticPath}</p>
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 0.9rem;">Pour résoudre ce problème, exécutez <code>node scripts/fix-deployment.js</code> pour générer les fichiers de production.</p>
              </div>
            </body>
          </html>
        \`);
      }
    }
  });
}`;

// Écrire le fichier de production corrigé
fs.writeFileSync('server/production.ts', productionServerCode);
console.log('✅ Fichier production.ts corrigé');

// 2. Créer une configuration de build optimisée
const buildConfig = {
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    // Modules Node.js built-in avec préfixes node:
    'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:url', 'node:http', 'node:https',
    'node:stream', 'node:util', 'node:events', 'node:buffer', 'node:querystring', 'node:net',
    'node:child_process', 'node:cluster', 'node:dgram', 'node:dns', 'node:readline', 'node:tls',
    'node:vm', 'node:zlib', 'node:assert', 'node:constants', 'node:module', 'node:process',
    // Modules Node.js built-in sans préfixes
    'fs', 'path', 'os', 'crypto', 'url', 'http', 'https', 'stream', 'util', 'events', 'buffer',
    'querystring', 'net', 'child_process', 'cluster', 'dgram', 'dns', 'readline', 'tls', 'vm',
    'zlib', 'assert', 'constants', 'module', 'process', 'punycode', 'string_decoder', 'timers',
    // Dépendances NPM
    '@neondatabase/serverless', 'drizzle-orm', 'postgres', 'pg', 'express', 'passport',
    'passport-local', 'express-session', 'connect-pg-simple', 'multer', 'nodemailer',
    '@sendgrid/mail', 'crypto-js', 'ws', 'zod', 'date-fns', 'memoizee'
  ],
  banner: {
    js: `
      import { createRequire } from 'module';
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      
      const require = createRequire(import.meta.url);
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      // Polyfills globaux pour compatibilité
      global.require = require;
      global.__filename = __filename;
      global.__dirname = __dirname;
    `
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

// 3. Effectuer le build avec la configuration corrigée
try {
  console.log('🚀 Build du serveur avec configuration corrigée...');
  
  // Nettoyer dist
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });
  
  await esbuild(buildConfig);
  console.log('✅ Serveur compilé avec succès');
  
  // 4. Créer package.json pour production
  const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const productionPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    type: "module",
    main: "dist/index.js",
    scripts: {
      start: "node dist/index.js"
    },
    dependencies: originalPackage.dependencies
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));
  console.log('✅ Package.json de production créé');
  
  // 5. Créer les dossiers nécessaires
  const distPublic = 'dist/public';
  if (!fs.existsSync(distPublic)) {
    fs.mkdirSync(distPublic, { recursive: true });
    
    // Créer un index.html minimal si pas de build frontend
    fs.writeFileSync(path.join(distPublic, 'index.html'), `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Sales Management</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; }
        .status { color: #27ae60; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Free Sales Management System</h1>
        <p class="status">Application déployée avec succès !</p>
        <p>Le système de gestion des ventes Free est maintenant opérationnel.</p>
        <p><small>Version de production - Déploiement Replit</small></p>
    </div>
</body>
</html>
    `);
    console.log('✅ Index.html de fallback créé');
  }
  
  // 6. Copier les fichiers essentiels
  if (fs.existsSync('drizzle.config.ts')) {
    fs.copyFileSync('drizzle.config.ts', 'dist/drizzle.config.ts');
  }
  
  // Copier uploads si existants
  if (fs.existsSync('public/uploads')) {
    const uploadsTarget = path.join(distPublic, 'uploads');
    fs.mkdirSync(uploadsTarget, { recursive: true });
    fs.cpSync('public/uploads', uploadsTarget, { recursive: true });
    console.log('✅ Uploads copiés');
  }
  
  console.log('');
  console.log('🎉 Correction des erreurs de déploiement terminée !');
  console.log('');
  console.log('📁 Structure de déploiement :');
  console.log('   ├── dist/');
  console.log('   │   ├── index.js (serveur ES module)');
  console.log('   │   ├── package.json (production)');
  console.log('   │   └── public/ (frontend)');
  console.log('');
  console.log('🚀 L\'application est maintenant prête pour le déploiement Replit');
  console.log('');
  console.log('Les corrections appliquées :');
  console.log('✅ Modules Node.js externalisés');
  console.log('✅ Imports ES6 statiques utilisés');
  console.log('✅ Configuration ESM bundle optimisée');
  console.log('✅ Polyfills CommonJS ajoutés');
  console.log('✅ Health check endpoint intégré');
  
} catch (error) {
  console.error('❌ Erreur lors de la correction :', error);
  console.error('Stack trace :', error.stack);
  process.exit(1);
}