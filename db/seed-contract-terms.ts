/**
 * SEED DATA POUR LES TERMES DE CONTRATS - VERSION FRANÇAISE
 * Insertion des termes contractuels avec balises françaises
 */

import { db } from "./index";
import { contractTerms, contractTags } from "../shared/schema";

export async function seedContractTerms() {
  try {
    console.log("🏷️ Insertion des balises françaises...");
    
    // Insertion des balises françaises
    const frenchTags = await db.insert(contractTags).values([
      {
        name: "PRENOM_VENDEUR",
        description: "Prénom du vendeur",
        category: "identite",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "NOM_VENDEUR", 
        description: "Nom de famille du vendeur",
        category: "identite",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "EMAIL_VENDEUR",
        description: "Adresse email du vendeur",
        category: "contact",
        dataType: "email",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "PRENOM_DISTRIBUTEUR",
        description: "Prénom du distributeur",
        category: "distributeur",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "NOM_DISTRIBUTEUR",
        description: "Nom du distributeur",
        category: "distributeur", 
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "SIRET_DISTRIBUTEUR",
        description: "Numéro SIRET du distributeur",
        category: "legal",
        dataType: "text",
        isRequired: true,
        defaultValue: "",
        validationPattern: "^\\d{14}$"
      },
      {
        name: "ADRESSE_DISTRIBUTEUR",
        description: "Adresse complète du distributeur",
        category: "contact",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "TAUX_COMMISSION",
        description: "Taux de commission en pourcentage",
        category: "financier",
        dataType: "number",
        isRequired: true,
        defaultValue: "8.5",
        validationPattern: "^\\d+(\\.\\d{1,2})?$"
      },
      {
        name: "SALAIRE_BASE",
        description: "Salaire de base ou type de rémunération",
        category: "financier",
        dataType: "text", 
        isRequired: false,
        defaultValue: "Commission uniquement"
      },
      {
        name: "TERRITOIRE",
        description: "Territoire d'activité assigné",
        category: "commercial",
        dataType: "text",
        isRequired: true,
        defaultValue: "France entière"
      },
      {
        name: "DATE_DEBUT",
        description: "Date de début du contrat",
        category: "temporel",
        dataType: "date",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "DATE_FIN",
        description: "Date de fin du contrat",
        category: "temporel",
        dataType: "date",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "DATE_SIGNATURE",
        description: "Date de signature du contrat",
        category: "temporel",
        dataType: "date",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "ID_CONTRAT",
        description: "Identifiant unique du contrat",
        category: "systeme",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      },
      {
        name: "TYPE_CONTRAT",
        description: "Type de contrat (Distribution, etc.)",
        category: "systeme",
        dataType: "text",
        isRequired: true,
        defaultValue: "Distribution Indépendante"
      },
      {
        name: "Code Postal",
        description: "Code postal du vendeur",
        category: "vendeur",
        dataType: "text",
        isRequired: true,
        defaultValue: "",
        validationPattern: "^\\d{5}$"
      },
      {
        name: "Ville", 
        description: "Ville de résidence du vendeur",
        category: "vendeur",
        dataType: "text",
        isRequired: true,
        defaultValue: ""
      }
    ]).returning();

    console.log(`✅ ${frenchTags.length} balises françaises insérées`);

    console.log("📄 Insertion des termes contractuels français...");

    // Termes contractuels en français avec nouvelles balises
    const frenchTerms = await db.insert(contractTerms).values([
      {
        templateId: 1, // Référence au template principal
        sectionName: "Identification du Vendeur",
        content: "Le vendeur, {{PRENOM_VENDEUR}} {{NOM_VENDEUR}}, domicilié à l'adresse ci-dessous mentionnée, exerçant sous le statut d'auto-entrepreneur, s'engage dans le cadre de ce contrat de distribution.",
        position: 1,
        isRequired: true
      },
      {
        templateId: 1,
        sectionName: "Informations du Distributeur",
        content: "Le distributeur {{PRENOM_DISTRIBUTEUR}} {{NOM_DISTRIBUTEUR}}, immatriculé sous le numéro SIRET {{SIRET_DISTRIBUTEUR}}, dont le siège social est situé {{ADRESSE_DISTRIBUTEUR}}, agit en tant que distributeur indépendant.",
        position: 2,
        isRequired: true
      },
      {
        templateId: 1,
        sectionName: "Commission et Rémunération", 
        content: "Le taux de commission applicable est fixé à {{TAUX_COMMISSION}}% sur les ventes réalisées. Le salaire de base est défini comme suit : {{SALAIRE_BASE}}.",
        position: 3,
        isRequired: true
      },
      {
        templateId: 1,
        sectionName: "Territoire d'Activité",
        content: "Le territoire d'activité exclusif assigné au distributeur couvre la zone géographique suivante : {{TERRITOIRE}}. Cette attribution est exclusive pendant la durée du contrat.",
        position: 4,
        isRequired: true
      },
      {
        templateId: 1,
        sectionName: "Durée du Contrat",
        content: "Le présent contrat entre en vigueur le {{DATE_DEBUT}} et se termine le {{DATE_FIN}}, sauf résiliation anticipée dans les conditions prévues aux présentes.",
        position: 5,
        isRequired: true
      },
      {
        templateId: 1,
        sectionName: "Signature et Validation",
        content: "Le présent contrat, portant le numéro {{ID_CONTRAT}} de type {{TYPE_CONTRAT}}, a été signé le {{DATE_SIGNATURE}} par les deux parties.",
        position: 6,
        isRequired: true
      }
    ]).returning();

    console.log(`✅ ${frenchTerms.length} termes contractuels français insérés`);
    
    console.log("🎉 Seed des termes français terminé avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur lors du seed des termes français:", error);
    throw error;
  }
}