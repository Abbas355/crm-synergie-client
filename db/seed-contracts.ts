/**
 * SEED DATA POUR LES CONTRATS
 * Insertion des données de base pour les contrats et templates
 */

import { db } from "./index";
import { contracts, contractTemplates } from "../shared/schema";

async function seedContracts() {
  try {
    console.log("🌱 Insertion des templates de contrats...");
    
    // Template de contrat de distribution indépendant
    const template = await db.insert(contractTemplates).values({
      name: "Contrat de Distribution Indépendant Free",
      type: "distribution",
      version: "1.0",
      description: "Template standard pour contrat de distribution indépendant Free Mobile",
      templateFields: [
        "PRENOM_VENDEUR",
        "NOM_VENDEUR", 
        "EMAIL_VENDEUR",
        "PRENOM_DISTRIBUTEUR",
        "NOM_DISTRIBUTEUR",
        "SIRET_DISTRIBUTEUR",
        "ADRESSE_DISTRIBUTEUR",
        "TAUX_COMMISSION",
        "SALAIRE_BASE",
        "TERRITOIRE",
        "DATE_DEBUT",
        "DATE_FIN",
        "DATE_SIGNATURE",
        "ID_CONTRAT",
        "TYPE_CONTRAT"
      ],
      legalRequirements: [
        "Commission Rate Validation",
        "Territory Assignment",
        "Legal Compliance Check"
      ],
      documentPath: "/templates/contrat-distribution-independant.docx",
      isActive: true
    }).returning();

    console.log("✅ Template de contrat inséré:", template[0]?.name);

    console.log("🌱 Insertion d'un contrat d'exemple...");

    // Contrat d'exemple
    const exampleContract = await db.insert(contracts).values({
      type: "distribution",
      status: "draft", 
      vendorName: "Eric Bat-I-Charrel",
      distributorName: "Er Conseil",
      distributorSiret: "12345678901234",
      distributorAddress: "123 Avenue de la République, 83000 Toulon",
      commissionRate: "8.5",
      salaryBase: "SMIC",
      territoryAssigned: "VAR (83)",
      startDate: new Date("2025-08-15"),
      endDate: new Date("2026-08-15"),
      contractTerms: {
        renewable: true,
        notificationPeriod: "30 days",
        exclusivity: false
      },
      legalCompliance: {
        isCompliant: false,
        lastReview: new Date().toISOString(),
        issues: ["En attente de signature", "Validation territoire requise"]
      }
    }).returning();

    console.log("✅ Contrat d'exemple inséré:", exampleContract[0]?.id);
    
    console.log("🎉 Seed des contrats terminé avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur lors du seed des contrats:", error);
    throw error;
  }
}

// Exécution automatique
seedContracts()
  .then(() => {
    console.log("✅ Seed terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });

export { seedContracts };