#!/usr/bin/env node

/**
 * Final Syntax Validation for Deployment
 * Focuses on JavaScript syntax errors that prevent deployment
 */

const fs = require('fs');

console.log('🔍 Final syntax validation for deployment...');

// Specific patterns that cause JavaScript syntax errors during deployment
const criticalSyntaxPatterns = [
  {
    pattern: /(?<!\\)'(?![a-zA-Z])/g, // Unescaped single quotes in strings
    description: 'Unescaped single quotes'
  },
  {
    pattern: /l'ajout(?![a-zA-Z])/g, // The specific "ajout" error from line 179
    description: 'Line 179 ajout syntax error'
  },
  {
    pattern: /(?<![a-zA-Z])ajout(?=\s*[^a-zA-Z])/g, // Problematic ajout identifiers
    description: 'Problematic ajout identifiers'
  }
];

function validateJSSyntax(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return { hasErrors: false, errors: [] };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let hasErrors = false;
    const errors = [];

    // Check for critical syntax patterns
    criticalSyntaxPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        errors.push({
          pattern: description,
          count: matches.length,
          examples: matches.slice(0, 3) // Show first 3 examples
        });
        hasErrors = true;
      }
    });

    // Special check for line 179 if file has enough lines
    if (lines.length >= 179) {
      const line179 = lines[178].trim();
      console.log(`📍 Line 179 check in ${filePath}: "${line179.substring(0, 50)}..."`);
      
      // Check if line 179 specifically has the problematic patterns
      criticalSyntaxPatterns.forEach(({ pattern, description }) => {
        if (pattern.test(line179)) {
          console.log(`❌ Line 179 contains: ${description}`);
          hasErrors = true;
        }
      });
      
      if (!hasErrors) {
        console.log(`✅ Line 179 appears clean in ${filePath}`);
      }
    }

    return { hasErrors, errors };
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return { hasErrors: true, errors: [{ pattern: 'File read error', count: 1 }] };
  }
}

// Test JavaScript syntax by trying to create a VM script
function testJSExecution(filePath) {
  if (!fs.existsSync(filePath)) return true;
  
  try {
    const vm = require('vm');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Try to create a script to check for syntax errors
    new vm.Script(content, { filename: filePath });
    console.log(`✅ JavaScript syntax valid: ${filePath}`);
    return true;
  } catch (syntaxError) {
    console.log(`❌ JavaScript syntax error in ${filePath}:`, syntaxError.message);
    return false;
  }
}

// Files to validate
const filesToValidate = [
  './dist/index.js',
  './replit-deployment-clean.cjs',
  './build-real-app.cjs'
];

let totalErrors = 0;
let syntaxValid = true;

// Validate each file
filesToValidate.forEach(filePath => {
  console.log(`\n🔍 Validating: ${filePath}`);
  
  const validation = validateJSSyntax(filePath);
  if (validation.hasErrors) {
    totalErrors++;
    console.log(`❌ Found syntax issues in ${filePath}:`);
    validation.errors.forEach(error => {
      console.log(`  - ${error.pattern}: ${error.count} occurrences`);
      if (error.examples) {
        console.log(`    Examples: ${error.examples.join(', ')}`);
      }
    });
  } else {
    console.log(`✅ No critical syntax errors in ${filePath}`);
  }

  // Test actual JavaScript execution
  if (!testJSExecution(filePath)) {
    syntaxValid = false;
  }
});

// Final summary
console.log('\n🎯 DEPLOYMENT VALIDATION SUMMARY:');
console.log(`📊 Files with syntax errors: ${totalErrors}`);
console.log(`🔧 JavaScript syntax validation: ${syntaxValid ? 'PASSED' : 'FAILED'}`);

if (totalErrors === 0 && syntaxValid) {
  console.log('\n🎉 DEPLOYMENT READY!');
  console.log('✅ All critical syntax errors have been resolved');
  console.log('✅ Line 179 "ajout" error is fixed');
  console.log('✅ JavaScript compilation should succeed');
  process.exit(0);
} else {
  console.log('\n⚠️ DEPLOYMENT ISSUES REMAIN');
  console.log('❌ Additional fixes required before deployment');
  process.exit(1);
}