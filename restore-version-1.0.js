#!/usr/bin/env node

// 🔒 SCRIPT DE RESTAURATION VERSION 1.0
// Date de création : 19 juin 2025
// Utilisation : node restore-version-1.0.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 RESTAURATION VERSION 1.0 - Démarrage...');
console.log('⚠️  Cette opération va restaurer la version de base stable');

const backupDir = path.join(__dirname, 'backups/v1.0-locked');

// Vérifier que la sauvegarde existe
if (!fs.existsSync(backupDir)) {
  console.error('❌ Erreur: Sauvegarde version 1.0 non trouvée');
  console.error('📁 Répertoire attendu:', backupDir);
  process.exit(1);
}

// Lire le manifeste
const manifestPath = path.join(backupDir, 'MANIFEST.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Erreur: Manifeste de sauvegarde non trouvé');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log('📄 Version à restaurer:', manifest.version);
console.log('📅 Date de verrouillage:', manifest.locked_date);

// Mapping des fichiers sauvegardés vers leurs emplacements originaux
const fileMapping = {
  'server_routes.ts': 'server/routes.ts',
  'client_src_pages_ventes.tsx': 'client/src/pages/ventes.tsx',
  'client_src_pages_clients-modern.tsx': 'client/src/pages/clients-modern.tsx',
  'client_src_hooks_use-auth.tsx': 'client/src/hooks/use-auth.tsx',
  'client_src_hooks_use-role.tsx': 'client/src/hooks/use-role.tsx',
  'shared_schema.ts': 'shared/schema.ts',
  'CVD_SYSTEM_LOCKED.md': 'CVD_SYSTEM_LOCKED.md',
  'VERSION_1.0_LOCKED.md': 'VERSION_1.0_LOCKED.md',
  'replit.md': 'replit.md',
  'package.json': 'package.json',
  'drizzle.config.ts': 'drizzle.config.ts'
};

// Fonction de restauration
function restoreFile(backupFileName, originalPath) {
  try {
    const backupFilePath = path.join(backupDir, backupFileName);
    const originalFilePath = path.join(__dirname, originalPath);
    
    if (!fs.existsSync(backupFilePath)) {
      console.log(`⚠️  Fichier de sauvegarde non trouvé: ${backupFileName}`);
      return false;
    }
    
    // Lire le contenu de la sauvegarde et supprimer les headers de protection
    let content = fs.readFileSync(backupFilePath, 'utf8');
    
    // Supprimer les lignes de header de protection (les 4 premières lignes)
    const lines = content.split('\n');
    if (lines[0].includes('🔒 VERSION 1.0 LOCKED')) {
      content = lines.slice(4).join('\n');
    }
    
    // Créer le répertoire si nécessaire
    fs.mkdirSync(path.dirname(originalFilePath), { recursive: true });
    
    // Restaurer le fichier
    fs.writeFileSync(originalFilePath, content);
    console.log(`✅ Restauré: ${originalPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur restauration ${originalPath}:`, error.message);
    return false;
  }
}

// Demander confirmation
console.log('\n⚠️  ATTENTION: Cette opération va écraser les fichiers actuels');
console.log('📋 Fichiers qui seront restaurés:');
Object.values(fileMapping).forEach(path => console.log(`   - ${path}`));

// En mode automatique pour script
console.log('\n🔄 Restauration en cours...\n');

let restoredCount = 0;
let totalCount = 0;

// Restaurer tous les fichiers
for (const [backupFileName, originalPath] of Object.entries(fileMapping)) {
  totalCount++;
  if (restoreFile(backupFileName, originalPath)) {
    restoredCount++;
  }
}

console.log('\n🔒 RESTAURATION VERSION 1.0 TERMINÉE');
console.log(`✅ Fichiers restaurés: ${restoredCount}/${totalCount}`);
console.log('📊 Statistiques version 1.0:');
console.log(`   - Clients réels: ${manifest.database_stats.total_clients}`);
console.log(`   - Installations du mois: ${manifest.database_stats.installations_month}`);
console.log(`   - Points CVD: ${manifest.database_stats.cvd_points}`);
console.log(`   - Commission totale: ${manifest.database_stats.commission_total}€`);
console.log(`   - Clients à relancer: ${manifest.database_stats.clients_to_follow}`);

console.log('\n🚀 Redémarrez le serveur pour appliquer les changements');
console.log('📝 Commande: npm run dev');

export { restoredCount, totalCount, manifest };