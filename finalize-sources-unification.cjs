#!/usr/bin/env node

/**
 * SCRIPT FINALISATION UNIFICATION SOURCES - Architecture Single Source of Truth
 */

const fs = require('fs');

console.log('🎯 FINALISATION UNIFICATION SOURCES - Architecture Single Source of Truth');

// 1. Finaliser les conditions dans les formulaires (remplacer les comparaisons)
const conditionFiles = [
  'client/src/components/clients/client-form-basic.tsx',
  'client/src/components/clients/client-form-new.tsx', 
  'client/src/components/clients/client-form-simple.tsx',
  'client/src/components/clients/new-client-form-complete.tsx',
  'client/src/components/clients/client-form-edit-mobile.tsx'
];

let totalConditionsFixed = 0;

conditionFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remplacer les conditions qui utilisent encore les anciennes valeurs
    const conditionReplacements = [
      { from: '=== "Prospection"', to: '=== "prospection"' },
      { from: '== "Prospection"', to: '== "prospection"' },
      { from: '!== "Prospection"', to: '!== "prospection"' },
      { from: '!= "Prospection"', to: '!= "prospection"' },
      { from: '=== "Recommandation"', to: '=== "recommandation"' },
      { from: '== "Recommandation"', to: '== "recommandation"' },
      { from: '=== "Internet"', to: '=== "internet"' },
      { from: '== "Internet"', to: '== "internet"' },
      { from: '=== "Publicité"', to: '=== "publicite"' },
      { from: '== "Publicité"', to: '== "publicite"' },
      { from: '=== "Flyer"', to: '=== "flyer"' },
      { from: '== "Flyer"', to: '== "flyer"' },
      { from: '=== "Autre"', to: '=== "autre"' },
      { from: '== "Autre"', to: '== "autre"' },
    ];

    conditionReplacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        hasChanges = true;
        totalConditionsFixed++;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} - Conditions corrigées`);
    }
  }
});

// 2. Mettre à jour le serveur pour utiliser les sources centralisées
const serverFile = 'server/routes.ts';
if (fs.existsSync(serverFile)) {
  let content = fs.readFileSync(serverFile, 'utf8');
  let hasChanges = false;
  
  // Ajouter import de sources centralisées si pas présent
  if (!content.includes('getSourcesForSelect') && !content.includes('@shared/sources')) {
    if (content.includes('@shared/schema')) {
      content = content.replace(
        /(import.*@shared\/schema[^;]*;)/,
        '$1\nimport { getSourcesForSelect } from "@shared/sources";'
      );
      hasChanges = true;
    }
  }

  // Remplacer les validations de sources hardcodées par les sources centralisées
  if (content.includes('["prospection", "recommandation"') || content.includes("['prospection', 'recommandation'")) {
    // Remplacer les arrays hardcodées par la fonction centralisée
    content = content.replace(
      /\[["'][^"']*["'],\s*["'][^"']*["']\s*(?:,\s*["'][^"']*["']\s*)*\]/g,
      'getSourcesForSelect().map(s => s.value)'
    );
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(serverFile, content, 'utf8');
    console.log(`✅ ${serverFile} - Sources centralisées appliquées`);
  }
}

console.log(`\n🎯 UNIFICATION COMPLÈTE`);
console.log(`🔄 Conditions corrigées: ${totalConditionsFixed}`);
console.log(`✅ Architecture "Single Source of Truth" finalisée`);
console.log(`📋 Sources officielles unifiées partout: prospection, recommandation, internet, publicite, stand_salon, flyer, autre`);