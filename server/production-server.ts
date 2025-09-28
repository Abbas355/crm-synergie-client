/**
 * Serveur de production standalone
 * Sert l'application React buildée et les API
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuration des sessions
import session from 'express-session';
app.use(session({
  secret: 'synergie-marketing-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

console.log('🚀 Serveur de production démarré');
console.log('📁 Répertoire de travail:', process.cwd());

// Chemins importants
const distPath = path.join(process.cwd(), 'dist', 'public');
const indexPath = path.join(distPath, 'index.html');

console.log('📦 Chemin des assets:', distPath);
console.log('📄 Chemin index.html:', indexPath);

// Vérifier que les fichiers existent
if (!fs.existsSync(distPath)) {
  console.error('❌ ERREUR: Le dossier dist/public n\'existe pas!');
  console.error('   Exécutez "npm run build" pour créer le build de production');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERREUR: index.html n\'existe pas dans dist/public!');
  process.exit(1);
}

console.log('✅ Fichiers de production trouvés');

// Import des routes API
async function setupRoutes() {
  try {
    const { registerRoutes } = await import('./routes');
    await registerRoutes(app);
    console.log('✅ Routes API configurées');
  } catch (error) {
    console.error('❌ Erreur lors du montage des routes:', error);
  }
}

// Setup des routes
await setupRoutes();

// IMPORTANT: Servir les fichiers statiques APRÈS les routes API
// Cela permet aux routes API de prendre la priorité
app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // Cache plus long pour les assets avec hash
    if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

console.log('✅ Fichiers statiques configurés depuis:', distPath);

// Servir les uploads
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('✅ Dossier uploads configuré');
}

// Route catch-all pour le SPA React Router
// DOIT être APRÈS express.static pour ne pas intercepter les assets
app.get('*', (req, res) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route API non trouvée' });
  }
  
  console.log('📄 Serving index.html pour:', req.path);
  res.sendFile(indexPath);
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎉 SERVEUR DE PRODUCTION ACTIF
═══════════════════════════════
📍 URL: http://0.0.0.0:${PORT}
📦 Assets: ${distPath}
🔧 Mode: PRODUCTION
═══════════════════════════════
  `);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  if (!error.message?.includes('terminating connection')) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesse rejetée:', reason);
});