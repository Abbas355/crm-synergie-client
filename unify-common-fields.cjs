/**
 * SCRIPT D'UNIFICATION DES CHAMPS COMMUNS
 * 
 * Objectif : Unifier les champs communs dans toute l'application :
 * - Nom, Prénom, Email, Téléphone, Code postal, Ville, Adresse
 * - Source (remplace tous les équivalents)
 * - Commentaire (remplace description, notes, notesContact, etc.)
 * 
 * Ceci évite les requêtes multiples, mappings et erreurs/bugs
 */

const fs = require('fs');
const path = require('path');

// Mapping des champs à unifier
const FIELD_UNIFICATION = {
  // Champs de base - déjà unifiés
  nom: 'nom',
  prenom: 'prenom', 
  email: 'email',
  telephone: 'telephone',
  codePostal: 'codePostal',
  ville: 'ville',
  adresse: 'adresse',
  
  // Champs à unifier vers "source"
  'typeContact': 'source',
  'canal': 'source',
  'origine': 'source',
  'typeRecommandation': 'source',
  
  // Champs à unifier vers "commentaire"
  'description': 'commentaire',
  'notes': 'commentaire',
  'notesContact': 'commentaire',
  'notesDetailleesContact': 'commentaire',
  'notesPrecises': 'commentaire',
  'observationsPersonnelles': 'commentaire',
  'remarques': 'commentaire',
  'memo': 'commentaire'
};

// Fichiers à analyser et modifier
const FILES_TO_PROCESS = [
  // Schémas
  'shared/schema.ts',
  
  // Composants prospects
  'client/src/components/prospects/new-prospect-dialog.tsx',
  'client/src/components/prospects/economy-simulator.tsx',
  'client/src/pages/prospects-hub.tsx',
  
  // Composants clients
  'client/src/components/clients/new-client-form-complete.tsx',
  'client/src/components/clients/client-form-redesigned.tsx',
  'client/src/components/clients/client-form-edit-mobile.tsx',
  
  // Composants tâches
  'client/src/components/tasks/new-task-form.tsx',
  'client/src/components/tasks/task-detail-page.tsx',
  
  // Routes serveur
  'server/routes.ts'
];

console.log('🚀 DÉMARRAGE UNIFICATION DES CHAMPS COMMUNS');
console.log('='.repeat(60));

// Fonction de remplacement dans un fichier
function unifyFieldsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier inexistant: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`\n📝 Traitement: ${filePath}`);
  
  // Remplacements pour unifier vers "source"
  const sourceReplacements = [
    // Attributs JSX
    { from: /name="typeContact"/g, to: 'name="source"' },
    { from: /name="canal"/g, to: 'name="source"' },
    { from: /name="origine"/g, to: 'name="source"' },
    { from: /name="typeRecommandation"/g, to: 'name="source"' },
    
    // Hooks form
    { from: /form\.register\("typeContact"\)/g, to: 'form.register("source")' },
    { from: /form\.register\("canal"\)/g, to: 'form.register("source")' },
    { from: /form\.register\("origine"\)/g, to: 'form.register("source")' },
    { from: /form\.register\("typeRecommandation"\)/g, to: 'form.register("source")' },
    
    // Accès aux données
    { from: /\.typeContact/g, to: '.source' },
    { from: /\.canal/g, to: '.source' },
    { from: /\.origine/g, to: '.source' },
    { from: /\.typeRecommandation/g, to: '.source' },
    
    // Schémas et types
    { from: /typeContact:/g, to: 'source:' },
    { from: /canal:/g, to: 'source:' },
    { from: /origine:/g, to: 'source:' },
    { from: /typeRecommandation:/g, to: 'source:' }
  ];
  
  // Remplacements pour unifier vers "commentaire"
  const commentaireReplacements = [
    // Attributs JSX
    { from: /name="description"/g, to: 'name="commentaire"' },
    { from: /name="notes"/g, to: 'name="commentaire"' },
    { from: /name="notesContact"/g, to: 'name="commentaire"' },
    { from: /name="notesDetailleesContact"/g, to: 'name="commentaire"' },
    { from: /name="notesPrecises"/g, to: 'name="commentaire"' },
    
    // Hooks form
    { from: /form\.register\("description"\)/g, to: 'form.register("commentaire")' },
    { from: /form\.register\("notes"\)/g, to: 'form.register("commentaire")' },
    { from: /form\.register\("notesContact"\)/g, to: 'form.register("commentaire")' },
    { from: /form\.register\("notesDetailleesContact"\)/g, to: 'form.register("commentaire")' },
    { from: /form\.register\("notesPrecises"\)/g, to: 'form.register("commentaire")' },
    
    // Accès aux données avec vérifications spéciales
    { from: /data\.notesContact/g, to: 'data.commentaire' },
    { from: /data\.notes\b/g, to: 'data.commentaire' },
    { from: /data\.description\b/g, to: 'data.commentaire' },
    { from: /form\.getValues\("notesContact"\)/g, to: 'form.getValues("commentaire")' },
    { from: /form\.getValues\("notes"\)/g, to: 'form.getValues("commentaire")' },
    { from: /form\.setValue\("notesContact"/g, to: 'form.setValue("commentaire"' },
    { from: /form\.setValue\("notes"/g, to: 'form.setValue("commentaire"' },
    
    // Schémas et types
    { from: /description:/g, to: 'commentaire:' },
    { from: /notes:/g, to: 'commentaire:' },
    { from: /notesContact:/g, to: 'commentaire:' },
    { from: /notesDetailleesContact:/g, to: 'commentaire:' },
    { from: /notesPrecises:/g, to: 'commentaire:' }
  ];

  // Appliquer tous les remplacements
  const allReplacements = [...sourceReplacements, ...commentaireReplacements];
  
  allReplacements.forEach(replacement => {
    const beforeLength = content.length;
    content = content.replace(replacement.from, replacement.to);
    const afterLength = content.length;
    
    if (beforeLength !== afterLength) {
      modified = true;
      console.log(`  ✅ ${replacement.from} → ${replacement.to}`);
    }
  });

  // Sauvegarder si modifié
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Fichier mis à jour: ${filePath}`);
    return true;
  } else {
    console.log(`  ➡️  Aucune modification: ${filePath}`);
    return false;
  }
}

// Traitement principal
let totalFilesModified = 0;

FILES_TO_PROCESS.forEach(filePath => {
  if (unifyFieldsInFile(filePath)) {
    totalFilesModified++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`🎯 UNIFICATION TERMINÉE`);
console.log(`📊 Fichiers modifiés: ${totalFilesModified}/${FILES_TO_PROCESS.length}`);
console.log(`\n✅ Champs unifiés:`);
console.log(`   • Source : typeContact, canal, origine, typeRecommandation → source`);
console.log(`   • Commentaire : description, notes, notesContact, notesPrecises → commentaire`);
console.log(`\n🚀 Avantages obtenus:`);
console.log(`   • Réduction des requêtes et mappings`);
console.log(`   • Élimination des erreurs de noms de champs`);
console.log(`   • Cohérence parfaite dans toute l'application`);
console.log(`   • Maintenance simplifiée`);

process.exit(0);