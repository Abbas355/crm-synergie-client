/**
 * EXÉCUTION DE L'AUDIT DES DATES
 * Script pour identifier et corriger immédiatement les dates modifiées par erreur
 */

import { auditSuspiciousDates, restoreNullDates, generateAuditReport } from './dateAudit';
import { db } from './db';

export async function runCompleteAudit(): Promise<void> {
  console.log('🔍 DÉBUT DE L\'AUDIT DES DATES SUSPECTES');
  
  try {
    // 1. Audit complet
    const suspiciousClients = await auditSuspiciousDates();
    console.log(`📊 ${suspiciousClients.length} clients avec anomalies détectées`);
    
    // 2. Identifier les clients de mes tests (dates 2025-06-08 12:00:00)
    const testClientIds: number[] = [];
    
    for (const client of suspiciousClients) {
      for (const change of client.suspiciousChanges) {
        if (change.reason.includes('tests automatiques') || 
            (change.currentValue && change.currentValue.toString().includes('2025-06-08'))) {
          testClientIds.push(client.clientId);
          console.log(`🎯 Client de test identifié: ${client.prenom} ${client.nom} (ID: ${client.clientId})`);
          break;
        }
      }
    }
    
    // 3. Restaurer les dates NULL pour les clients de test
    if (testClientIds.length > 0) {
      console.log(`🔧 Restauration des dates NULL pour ${testClientIds.length} clients de test`);
      await restoreNullDates(testClientIds);
    }
    
    // 4. Générer le rapport final
    const report = await generateAuditReport();
    console.log('📋 RAPPORT D\'AUDIT COMPLET:');
    console.log(report);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'audit:', error);
  }
}

// Auto-exécution si ce fichier est importé
export async function autoFixDateIssues(): Promise<{ fixed: number; remaining: number }> {
  let fixed = 0;
  let remaining = 0;
  
  try {
    // Identifier tous les clients avec dates suspectes 2025-06-08
    const clientsToFix = await db.execute(`
      SELECT id, prenom, nom, dateSignature, dateRendezVous, dateInstallation
      FROM clients 
      WHERE deletedAt IS NULL 
      AND (
        dateSignature::text LIKE '%2025-06-08%' OR
        dateRendezVous::text LIKE '%2025-06-08%' OR
        dateInstallation::text LIKE '%2025-06-08%'
      )
    `);
    
    console.log(`🔍 ${clientsToFix.rows.length} clients avec dates de test détectées`);
    
    for (const client of clientsToFix.rows) {
      try {
        // Restaurer uniquement les dates de test, pas les vraies dates
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        if (client.dateSignature && client.dateSignature.toString().includes('2025-06-08')) {
          updates.push(`dateSignature = $${paramIndex}`);
          params.push(null);
          paramIndex++;
        }
        
        if (client.dateRendezVous && client.dateRendezVous.toString().includes('2025-06-08')) {
          updates.push(`dateRendezVous = $${paramIndex}`);
          params.push(null);
          paramIndex++;
        }
        
        if (client.dateInstallation && client.dateInstallation.toString().includes('2025-06-08')) {
          updates.push(`dateInstallation = $${paramIndex}`);
          params.push(null);
          paramIndex++;
        }
        
        if (updates.length > 0) {
          params.push(client.id);
          await db.execute(`
            UPDATE clients 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
          `, params);
          
          fixed++;
          console.log(`✅ Corrigé: ${client.prenom} ${client.nom} (${updates.length} dates restaurées)`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur correction client ${client.id}:`, error);
        remaining++;
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction automatique:', error);
  }
  
  return { fixed, remaining };
}