#!/usr/bin/env node
import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import fs from 'fs';
import path from 'path';

console.log('🚀 Préparation déploiement Replit...');

// Configuration de build spécifique pour Replit
const nodeBuiltins = [
  'fs', 'path', 'os', 'crypto', 'url', 'http', 'https', 'stream', 'util', 'events', 'buffer',
  'querystring', 'net', 'child_process', 'cluster', 'dgram', 'dns', 'readline', 'tls', 'vm',
  'zlib', 'assert', 'constants', 'module', 'process', 'punycode', 'string_decoder', 'timers'
];

const npmDependencies = [
  '@neondatabase/serverless', 'drizzle-orm', 'postgres', 'pg', 'express', 'passport',
  'passport-local', 'express-session', 'connect-pg-simple', 'multer', 'nodemailer',
  '@sendgrid/mail', 'crypto-js', 'ws', 'zod', 'date-fns', 'memoizee'
];

try {
  // Nettoyer et préparer
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // 1. Build frontend avec Vite
  console.log('📦 Build frontend...');
  await viteBuild({
    configFile: './vite.config.ts',
    mode: 'production'
  });
  console.log('✅ Frontend prêt');

  // 2. Build serveur optimisé pour Replit
  console.log('🔧 Build serveur pour Replit...');
  await esbuild({
    entryPoints: ['server/index.ts'],
    bundle: true,
    minify: false, // Pas de minification pour éviter les erreurs
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: 'dist/server.js',
    external: [...nodeBuiltins, ...npmDependencies],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    // Résolution des modules pour Replit
    plugins: [{
      name: 'replit-resolver',
      setup(build) {
        build.onResolve({ filter: /^@shared/ }, (args) => {
          return { path: path.resolve('./shared' + args.path.slice(7)) };
        });
        build.onResolve({ filter: /^@db/ }, (args) => {
          return { path: path.resolve('./db' + args.path.slice(3)) };
        });
      }
    }]
  });
  console.log('✅ Serveur compilé');

  // 3. Créer package.json pour déploiement
  const prodPackage = {
    name: "free-sales-management",
    version: "1.0.0",
    type: "module",
    main: "dist/server.js",
    scripts: {
      start: "node dist/server.js"
    },
    dependencies: JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));

  // 4. Créer fichier de démarrage principal
  fs.writeFileSync('dist/index.js', `
import('./server.js').catch(err => {
  console.error('Erreur démarrage serveur:', err);
  process.exit(1);
});
  `.trim());

  // 5. Copier fichiers essentiels
  const essentialFiles = ['drizzle.config.ts'];
  for (const file of essentialFiles) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, `dist/${file}`);
    }
  }

  // 6. Gérer les uploads
  if (fs.existsSync('public/uploads')) {
    const uploadsTarget = 'dist/public/uploads';
    fs.mkdirSync(uploadsTarget, { recursive: true });
    fs.cpSync('public/uploads', uploadsTarget, { recursive: true });
    console.log('✅ Uploads copiés');
  }

  // 7. Créer fichier de vérification déploiement
  fs.writeFileSync('dist/deploy-check.json', JSON.stringify({
    status: 'ready',
    timestamp: new Date().toISOString(),
    build: 'replit-optimized',
    version: '1.0.0'
  }, null, 2));

  // 8. Logs de diagnostic
  console.log('');
  console.log('🎉 Build déploiement Replit terminé !');
  console.log('');
  console.log('📁 Structure créée :');
  console.log('   ├── dist/server.js (serveur principal)');
  console.log('   ├── dist/index.js (point d\'entrée)');
  console.log('   ├── dist/package.json (production)');
  console.log('   └── dist/public/ (frontend)');
  console.log('');
  console.log('🚀 Prêt pour déploiement Replit');
  console.log('');
  console.log('✅ Corrections appliquées :');
  console.log('   - Configuration ESM optimisée');
  console.log('   - Modules externes correctement déclarés');
  console.log('   - Point d\'entrée principal créé');
  console.log('   - Résolution des chemins corrigée');

  // Test de démarrage rapide
  console.log('');
  console.log('🔍 Test de configuration...');
  if (fs.existsSync('dist/server.js') && fs.existsSync('dist/index.js')) {
    console.log('✅ Fichiers de déploiement présents');
  } else {
    throw new Error('Fichiers de déploiement manquants');
  }

} catch (error) {
  console.error('❌ Erreur build déploiement :', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}