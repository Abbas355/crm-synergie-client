/**
 * GÉNÉRATEUR DE CONTRATS AUTOMATISÉ
 * Utilise le document réel de 24 pages avec remplacement des balises dynamiques
 */

import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';

export class ContractGenerator {
  private templatePath: string;

  constructor() {
    // Utilisation du contrat réel fourni par l'utilisateur
    this.templatePath = path.join(process.cwd(), 'attached_assets', 'Contrat de Distribution Indépendant_1755251305252.docx');
  }

  /**
   * Génère un contrat avec les données fournies
   * @param contractData Données à injecter dans le template
   * @returns Buffer du document Word généré
   */
  async generateContract(contractData: Record<string, any>): Promise<Buffer> {
    try {
      console.log("📄 GÉNÉRATION CONTRAT - Début avec données:", Object.keys(contractData));

      // Vérifier que le template existe
      if (!fs.existsSync(this.templatePath)) {
        throw new Error(`Template de contrat non trouvé: ${this.templatePath}`);
      }

      // Lire le template
      const templateContent = fs.readFileSync(this.templatePath, 'binary');
      const zip = new PizZip(templateContent);
      
      // Créer l'instance Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Préparer les données avec mappage des balises existantes
      const templateData = this.mapContractData(contractData);
      
      console.log("📄 Données mappées pour template:", Object.keys(templateData));

      // Rendre le document avec les données
      doc.render(templateData);

      // Obtenir le buffer du document généré
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log("✅ Contrat généré avec succès, taille:", buffer.length, "octets");
      return buffer;

    } catch (error) {
      console.error("❌ Erreur lors de la génération du contrat:", error);
      if (error.properties && error.properties.errors) {
        console.error("Détails des erreurs:", error.properties.errors);
      }
      throw new Error(`Erreur de génération de contrat: ${error.message}`);
    }
  }

  /**
   * Mappe les données du contrat vers les balises du template
   * Supporte les formats {{variable}} et ##variable##
   */
  private mapContractData(data: Record<string, any>): Record<string, any> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Mapping des données avec toutes les balises possibles du template
    return {
      // Informations vendeur/distributeur - FRANÇAIS
      PRENOM_VENDEUR: data.PRENOM_VENDEUR || '',
      NOM_VENDEUR: data.NOM_VENDEUR || '',
      EMAIL_VENDEUR: data.EMAIL_VENDEUR || '',
      
      // Nouvelles balises françaises
      PRENOM_DISTRIBUTEUR: data.PRENOM_DISTRIBUTEUR || data.PRENOM_VENDEUR || '',
      NOM_DISTRIBUTEUR: data.NOM_DISTRIBUTEUR || data.NOM_VENDEUR || '',
      SIRET_DISTRIBUTEUR: data.SIRET_DISTRIBUTEUR || '',
      ADRESSE_DISTRIBUTEUR: data.ADRESSE_DISTRIBUTEUR || '',
      
      // NOUVELLES BALISES FRANÇAISES - Code postal et ville du vendeur
      CODE_POSTAL: data.codePostal || data.CODE_POSTAL || '',
      VILLE: data.ville || data.VILLE || '',
      
      // Compatibilité balises anglaises existantes
      DISTRI_NEW_FIRST_NAME: data.DISTRI_NEW_FIRST_NAME || data.PRENOM_VENDEUR || '',
      DISTRI_NEW_LAST_NAME: data.DISTRI_NEW_LAST_NAME || data.NOM_VENDEUR || '',
      DISTRI_NEW_SIRET: data.DISTRI_NEW_SIRET || '',
      DISTRI_NEW_ADDRESS: data.DISTRI_NEW_ADDRESS || '',
      DISTRI_NEW_ZIP: data.codePostal || data.CODE_POSTAL || '', // Ancienne balise vers nouvelle
      DISTRI_NEW_CITY: data.ville || data.VILLE || '', // Ancienne balise vers nouvelle
      
      // Termes financiers - FRANÇAIS
      TAUX_COMMISSION: data.TAUX_COMMISSION || data.COMMISSION_RATE || '8',
      SALAIRE_BASE: data.SALAIRE_BASE || data.SALARY_BASE || 'Commission uniquement',
      TERRITOIRE: data.TERRITOIRE || data.TERRITORY_ASSIGNED || 'France entière',
      
      // Compatibilité balises anglaises
      COMMISSION_RATE: data.COMMISSION_RATE || '8',
      SALARY_BASE: data.SALARY_BASE || 'Commission uniquement',
      TERRITORY_ASSIGNED: data.TERRITORY_ASSIGNED || 'France entière',
      
      // Dates - FRANÇAIS
      DATE_DEBUT: data.DATE_DEBUT || data.START_DATE || currentDate.toLocaleDateString('fr-FR'),
      DATE_FIN: data.DATE_FIN || data.END_DATE || new Date(currentYear + 1, currentDate.getMonth(), currentDate.getDate()).toLocaleDateString('fr-FR'),
      DATE_COURANTE: data.DATE_COURANTE || data.CURRENT_DATE || currentDate.toLocaleDateString('fr-FR'),
      DATE_SIGNATURE: data.DATE_SIGNATURE || data.SIGNATURE_DATE || currentDate.toLocaleDateString('fr-FR'),
      
      // Compatibilité balises anglaises
      START_DATE: data.START_DATE || currentDate.toLocaleDateString('fr-FR'),
      END_DATE: data.END_DATE || new Date(currentYear + 1, currentDate.getMonth(), currentDate.getDate()).toLocaleDateString('fr-FR'),
      CURRENT_DATE: data.CURRENT_DATE || currentDate.toLocaleDateString('fr-FR'),
      SIGNATURE_DATE: data.SIGNATURE_DATE || currentDate.toLocaleDateString('fr-FR'),
      
      // Informations système - FRANÇAIS
      ID_CONTRAT: data.ID_CONTRAT || data.CONTRACT_ID || 'AUTO_' + Date.now(),
      TYPE_CONTRAT: data.TYPE_CONTRAT || data.CONTRACT_TYPE || 'Distribution Indépendante',
      
      // Compatibilité balises anglaises
      CONTRACT_ID: data.CONTRACT_ID || 'AUTO_' + Date.now(),
      CONTRACT_TYPE: data.CONTRACT_TYPE || 'Distribution Indépendante',
      
      // Données légales France
      LEGAL_FRAMEWORK: 'Réglementation française sur la distribution commerciale',
      JURISDICTION: 'Tribunaux de commerce français',
      APPLICABLE_LAW: 'Droit français',
      
      // Informations entreprise (Free)
      COMPANY_NAME: 'Free',
      COMPANY_SIRET: '42193886000067',
      COMPANY_ADDRESS: '16 rue de la Ville l\'Évêque, 75008 Paris',
      
      // Commission CVD (Commission sur Ventes Directes)
      CVD_FREEBOX_ULTRA: '6',
      CVD_FREEBOX_ESSENTIEL: '5', 
      CVD_FREEBOX_POP: '4',
      CVD_FORFAIT_5G: '1',
      
      // Barème progressif
      CVD_TRANCHE_1_MIN: '1',
      CVD_TRANCHE_1_MAX: '19',
      CVD_TRANCHE_1_RATE: '0€',
      
      CVD_TRANCHE_2_MIN: '20',
      CVD_TRANCHE_2_MAX: '39',
      CVD_TRANCHE_2_RATE: '100€',
      
      CVD_TRANCHE_3_MIN: '40',
      CVD_TRANCHE_3_MAX: '59',
      CVD_TRANCHE_3_RATE: '200€',
      
      CVD_TRANCHE_4_MIN: '60',
      CVD_TRANCHE_4_MAX: '99',
      CVD_TRANCHE_4_RATE: '300€',
      
      CVD_TRANCHE_5_MIN: '100',
      CVD_TRANCHE_5_RATE: '500€',
      
      // Conditions particulières
      TRIAL_PERIOD: '3 mois',
      NOTICE_PERIOD: '30 jours',
      CONFIDENTIALITY_PERIOD: '24 mois',
      
      // Formation et certification
      FORMATION_REQUIRED: 'Formation initiale obligatoire',
      CERTIFICATION_VALIDITY: '12 mois',
      
      // Support technique
      TECHNICAL_SUPPORT: 'Support technique 7j/7',
      CUSTOMER_SERVICE: 'Service client dédié distributeurs',
      
      // Objectifs et performance
      MONTHLY_OBJECTIVE: data.MONTHLY_OBJECTIVE || '20 installations',
      PERFORMANCE_REVIEW: 'Évaluation trimestrielle',
      
      // Données de personnalisation supplémentaires
      ...Object.keys(data)
        .filter(key => !['PRENOM_VENDEUR', 'NOM_VENDEUR', 'EMAIL_VENDEUR'].includes(key))
        .reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {} as Record<string, any>)
    };
  }

  /**
   * Valide les données obligatoires avant génération
   */
  validateContractData(data: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = [
      'PRENOM_VENDEUR',
      'NOM_VENDEUR',
      'EMAIL_VENDEUR',
      'DISTRI_NEW_FIRST_NAME',
      'DISTRI_NEW_LAST_NAME'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`Le champ ${field} est obligatoire`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtient les champs disponibles dans le template
   */
  getAvailableFields(): string[] {
    return [
      'PRENOM_VENDEUR', 'NOM_VENDEUR', 'EMAIL_VENDEUR',
      'CODE_POSTAL', 'VILLE', // NOUVELLES BALISES FRANÇAISES
      'DISTRI_NEW_FIRST_NAME', 'DISTRI_NEW_LAST_NAME', 'DISTRI_NEW_SIRET', 'DISTRI_NEW_ADDRESS',
      'DISTRI_NEW_ZIP', 'DISTRI_NEW_CITY', // Balises anciennes supportées pour rétrocompatibilité
      'COMMISSION_RATE', 'SALARY_BASE', 'TERRITORY_ASSIGNED',
      'START_DATE', 'END_DATE', 'CURRENT_DATE', 'SIGNATURE_DATE',
      'CONTRACT_ID', 'CONTRACT_TYPE',
      'CVD_FREEBOX_ULTRA', 'CVD_FREEBOX_ESSENTIEL', 'CVD_FREEBOX_POP', 'CVD_FORFAIT_5G',
      'MONTHLY_OBJECTIVE', 'TRIAL_PERIOD', 'NOTICE_PERIOD'
    ];
  }
}