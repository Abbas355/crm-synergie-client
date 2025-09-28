/**
 * UNIFICATION COMPLÈTE DES CHAMPS DE DATE
 * Principe "Single Source of Truth" - Juillet 2025
 * 
 * Objectif : S'assurer que TOUS les champs de date utilisent uniquement
 * les noms standardisés dans toute l'application
 */

import fs from 'fs';
import path from 'path';

// Mapping officiel des champs de date unifiés
const DATE_FIELD_MAPPING = {
  // Sources possibles → Nom unifié
  'date_signature': 'dateSignature',
  'date_installation': 'dateInstallation', 
  'date_rendez_vous': 'dateRendezVous',
  'date_naissance': 'dateNaissance',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt',
  'date_attribution': 'dateAttribution',
  'date_activation': 'dateActivation',
  'due_date': 'dueDate',
  'completed_at': 'completedAt',
  'last_login': 'lastLogin'
};

// Extensions de fichiers à traiter
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql'];

// Dossiers à analyser
const FOLDERS_TO_SCAN = [
  'client/src',
  'server',
  'shared',
  'db',
  'scripts'
];

/**
 * Analyse un fichier et trouve les champs de date non-unifiés
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Chercher les champs non-unifiés
    Object.keys(DATE_FIELD_MAPPING).forEach(oldField => {
      const unifiedField = DATE_FIELD_MAPPING[oldField];
      
      // Patterns à chercher
      const patterns = [
        new RegExp(`["']${oldField}["']`, 'g'), // "dateSignature"
        new RegExp(`\\.${oldField}\\b`, 'g'),   // .dateSignature
        new RegExp(`${oldField}:`, 'g'),        // dateSignature:
        new RegExp(`${oldField}\\s*=`, 'g'),    // date_signature =
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          issues.push({
            oldField,
            unifiedField,
            occurrences: matches.length,
            pattern: pattern.toString()
          });
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error(`❌ Erreur lecture ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Scanne récursivement un dossier
 */
function scanDirectory(dirPath, results = []) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath, results);
      } else if (stat.isFile() && EXTENSIONS.some(ext => item.endsWith(ext))) {
        const issues = analyzeFile(fullPath);
        if (issues.length > 0) {
          results.push({
            file: fullPath,
            issues
          });
        }
      }
    });
  } catch (error) {
    console.error(`❌ Erreur scan ${dirPath}:`, error.message);
  }
  
  return results;
}

/**
 * Génère un rapport de conformité
 */
function generateReport() {
  console.log('🔍 ANALYSE DE CONFORMITÉ DES CHAMPS DE DATE');
  console.log('==============================================\n');
  
  const allIssues = [];
  
  FOLDERS_TO_SCAN.forEach(folder => {
    if (fs.existsSync(folder)) {
      console.log(`📂 Analyse du dossier: ${folder}`);
      const folderIssues = scanDirectory(folder);
      allIssues.push(...folderIssues);
    } else {
      console.log(`⚠️  Dossier non trouvé: ${folder}`);
    }
  });
  
  console.log('\n📋 RÉSULTATS D\'ANALYSE');
  console.log('========================');
  
  if (allIssues.length === 0) {
    console.log('✅ PARFAIT ! Tous les champs de date sont unifiés');
    console.log('✅ Application conforme au principe "Single Source of Truth"');
    return;
  }
  
  console.log(`❌ ${allIssues.length} fichiers avec des champs non-unifiés détectés :\n`);
  
  allIssues.forEach((fileIssue, index) => {
    console.log(`${index + 1}. 📄 ${fileIssue.file}`);
    
    fileIssue.issues.forEach(issue => {
      console.log(`   • ${issue.oldField} → ${issue.unifiedField} (${issue.occurrences} occurrences)`);
    });
    
    console.log('');
  });
  
  // Génération d'un script de correction automatique
  generateFixScript(allIssues);
}

/**
 * Génère un script de correction automatique
 */
function generateFixScript(issues) {
  if (issues.length === 0) return;
  
  let fixScript = `#!/bin/bash
# Script de correction automatique des champs de date
# Généré automatiquement le ${new Date().toISOString()}

echo "🔧 CORRECTION AUTOMATIQUE DES CHAMPS DE DATE"
echo "=============================================="

`;

  // Génération des commandes sed pour chaque fichier
  issues.forEach(fileIssue => {
    fixScript += `\n# Correction de ${fileIssue.file}\n`;
    
    fileIssue.issues.forEach(issue => {
      // Commande sed pour remplacer les patterns
      fixScript += `sed -i 's/"${issue.oldField}"/"${issue.unifiedField}"/g' "${fileIssue.file}"\n`;
      fixScript += `sed -i 's/\\.${issue.oldField}\\b/.${issue.unifiedField}/g' "${fileIssue.file}"\n`;
      fixScript += `sed -i 's/${issue.oldField}:/${issue.unifiedField}:/g' "${fileIssue.file}"\n`;
    });
  });
  
  fixScript += `\necho "✅ Correction terminée - Vérifiez les modifications avec git diff"`;
  
  // Sauvegarde du script
  fs.writeFileSync('fix-date-fields.sh', fixScript);
  console.log('📝 Script de correction généré: fix-date-fields.sh');
  console.log('   Pour appliquer les corrections: chmod +x fix-date-fields.sh && ./fix-date-fields.sh');
}

/**
 * Vérification de conformité spécifique aux tables de base de données
 */
function checkDatabaseSchema() {
  console.log('\n🗄️  VÉRIFICATION SCHÉMA BASE DE DONNÉES');
  console.log('=====================================');
  
  const schemaFile = 'shared/schema.ts';
  if (!fs.existsSync(schemaFile)) {
    console.log('❌ Fichier schema.ts non trouvé');
    return;
  }
  
  const content = fs.readFileSync(schemaFile, 'utf8');
  const conformeFields = [];
  const nonConformeFields = [];
  
  Object.values(DATE_FIELD_MAPPING).forEach(unifiedField => {
    if (content.includes(`timestamp("${unifiedField}")`)) {
      conformeFields.push(unifiedField);
    }
  });
  
  Object.keys(DATE_FIELD_MAPPING).forEach(oldField => {
    if (content.includes(`timestamp("${oldField}")`)) {
      nonConformeFields.push(oldField);
    }
  });
  
  console.log(`✅ Champs conformes (${conformeFields.length}):`, conformeFields);
  if (nonConformeFields.length > 0) {
    console.log(`❌ Champs non-conformes (${nonConformeFields.length}):`, nonConformeFields);
  } else {
    console.log('✅ Schéma de base de données entièrement conforme');
  }
}

// Exécution principale
generateReport();
checkDatabaseSchema();

console.log('\n🎯 CONFORMITÉ "SINGLE SOURCE OF TRUTH"');
console.log('=====================================');
console.log('• dateSignature : Table clients uniquement');
console.log('• dateInstallation : Table clients uniquement');
console.log('• dateRendezVous : Table clients uniquement');
console.log('• Autres tables récupèrent via JOIN');
console.log('• Zéro duplication de données');

export {
  analyzeFile,
  scanDirectory,
  generateReport,
  DATE_FIELD_MAPPING
};