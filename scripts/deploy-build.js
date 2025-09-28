import { build as esbuild } from 'esbuild';
import fs from 'fs';
import path from 'path';

console.log('⚡ Build rapide pour déploiement...');

// Nettoyage
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

try {
  // Build serveur uniquement avec correction des erreurs de déploiement
  await esbuild({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/index.js',
    external: [
      // Tous les modules Node.js built-in
      'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:url', 'node:http', 'node:https',
      'fs', 'path', 'os', 'crypto', 'url', 'http', 'https', 'stream', 'util', 'events', 'buffer',
      'querystring', 'net', 'child_process', 'cluster', 'dgram', 'dns', 'readline', 'tls', 'vm', 'zlib',
      // Dépendances NPM principales
      '@neondatabase/serverless', 'drizzle-orm', 'postgres', 'express', 'passport', 'passport-local',
      'express-session', 'connect-pg-simple', 'multer', 'nodemailer', '@sendgrid/mail', 'crypto-js',
      'ws', 'zod', 'date-fns', 'memoizee'
    ],
    banner: {
      js: `
        import { createRequire } from 'module';
        import { fileURLToPath } from 'url';
        import { dirname } from 'path';
        
        const require = createRequire(import.meta.url);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
      `
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Package.json minimal
  const pkg = {
    type: "module",
    scripts: { start: "node dist/index.js" },
    dependencies: JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));

  // Copier frontend build existant ou créer fallback
  if (fs.existsSync('dist/public')) {
    console.log('✅ Frontend existant détecté');
  } else {
    fs.mkdirSync('dist/public', { recursive: true });
    fs.writeFileSync('dist/public/index.html', `
<!DOCTYPE html>
<html><head><title>Free Sales Management</title></head>
<body><h1>Application en cours de déploiement...</h1></body>
</html>`);
  }

  console.log('✅ Build serveur terminé');
  console.log('🚀 Prêt pour déploiement');

} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}