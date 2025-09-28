/**
 * AUDIT ET RESTAURATION DES DATES
 * Système pour identifier et corriger les modifications automatiques non voulues
 */

import { db } from "./db";

export interface DateAuditResult {
  clientId: number;
  prenom: string;
  nom: string;
  suspiciousChanges: {
    field: string;
    currentValue: any;
    shouldBe: any;
    reason: string;
  }[];
}

/**
 * Analyse les dates suspectes qui ont pu être modifiées automatiquement
 */
export async function auditSuspiciousDates(): Promise<DateAuditResult[]> {
  const results: DateAuditResult[] = [];
  
  try {
    // Récupérer tous les clients avec leurs dates
    const clients = await db.execute(`
      SELECT id, prenom, nom, email, telephone,
             dateSignature, dateRendezVous, dateInstallation,
             createdAt, status, produit
      FROM clients 
      WHERE deletedAt IS NULL
      ORDER BY id
    `);

    for (const client of clients.rows) {
      const suspiciousChanges = [];
      
      // Vérifier les patterns suspects
      
      // 1. Dates de signature identiques à 2025-06-08 12:00:00 (mes tests)
      if (client.dateSignature && 
          client.dateSignature.toString().includes('2025-06-08')) {
        suspiciousChanges.push({
          field: 'dateSignature',
          currentValue: client.dateSignature,
          shouldBe: null,
          reason: 'Date générée par tests automatiques du 13/06'
        });
      }
      
      // 2. Dates avec heure exacte 12:00:00 (ma normalisation)
      if (client.dateSignature && 
          client.dateSignature.toString().includes('12:00:00')) {
        suspiciousChanges.push({
          field: 'dateSignature',
          currentValue: client.dateSignature,
          shouldBe: 'À vérifier manuellement',
          reason: 'Date normalisée automatiquement'
        });
      }
      
      if (client.dateRendezVous && 
          client.dateRendezVous.toString().includes('12:00:00')) {
        suspiciousChanges.push({
          field: 'dateRendezVous',
          currentValue: client.dateRendezVous,
          shouldBe: 'À vérifier manuellement',
          reason: 'Date normalisée automatiquement'
        });
      }
      
      if (client.dateInstallation && 
          client.dateInstallation.toString().includes('12:00:00')) {
        suspiciousChanges.push({
          field: 'dateInstallation',
          currentValue: client.dateInstallation,
          shouldBe: 'À vérifier manuellement',
          reason: 'Date normalisée automatiquement'
        });
      }
      
      // 3. Clients avec statut installation mais sans date d'installation
      if (client.status === 'installation' && !client.dateInstallation) {
        suspiciousChanges.push({
          field: 'dateInstallation',
          currentValue: null,
          shouldBe: 'Date requise pour statut installation',
          reason: 'Incohérence statut/date'
        });
      }
      
      // 4. Clients avec statut rendez-vous mais sans date de rendez-vous
      if (client.status === 'rendez-vous' && !client.dateRendezVous) {
        suspiciousChanges.push({
          field: 'dateRendezVous',
          currentValue: null,
          shouldBe: 'Date requise pour statut rendez-vous',
          reason: 'Incohérence statut/date'
        });
      }

      if (suspiciousChanges.length > 0) {
        results.push({
          clientId: client.id,
          prenom: client.prenom,
          nom: client.nom,
          suspiciousChanges
        });
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'audit des dates:', error);
  }
  
  return results;
}

/**
 * Restaure les dates NULL pour les clients spécifiés
 */
export async function restoreNullDates(clientIds: number[]): Promise<void> {
  for (const clientId of clientIds) {
    try {
      await db.execute(`
        UPDATE clients 
        SET dateSignature = NULL,
            dateRendezVous = NULL,
            dateInstallation = NULL
        WHERE id = $1 AND deletedAt IS NULL
      `, [clientId]);
      
      console.log(`✅ Dates NULL restaurées pour client ID ${clientId}`);
    } catch (error) {
      console.error(`❌ Erreur restauration client ${clientId}:`, error);
    }
  }
}

/**
 * Génère un rapport d'audit complet
 */
export async function generateAuditReport(): Promise<string> {
  const suspiciousClients = await auditSuspiciousDates();
  
  let report = `
=== RAPPORT D'AUDIT DES DATES ===
Date du rapport: ${new Date().toISOString()}

Nombre de clients avec anomalies: ${suspiciousClients.length}

`;

  for (const client of suspiciousClients) {
    report += `
CLIENT: ${client.prenom} ${client.nom} (ID: ${client.clientId})
`;
    for (const change of client.suspiciousChanges) {
      report += `  - ${change.field}: ${change.currentValue} | ${change.reason}
`;
    }
  }
  
  report += `
=== RECOMMANDATIONS ===
1. Vérifier manuellement les dates avec heure 12:00:00
2. Restaurer les dates NULL pour les clients de test
3. Implémenter la protection contre modifications automatiques
4. Corriger les incohérences statut/date
`;

  return report;
}