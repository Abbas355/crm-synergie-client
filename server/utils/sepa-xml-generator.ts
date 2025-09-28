import { format } from 'date-fns';

interface VirementDetail {
  id: string;
  beneficiaire: {
    nom: string;
    iban: string;
    bic?: string;
    adresse?: {
      rue: string;
      ville: string;
      codePostal: string;
      pays: string;
    };
  };
  montant: number;
  reference: string;
  motif: string;
  factureId: string;
}

interface ParametresEmetteur {
  nom: string;
  iban: string;
  bic: string;
  identifiant: string; // SIRET ou identifiant unique
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
}

interface BordereauSepa {
  id: string;
  numeroBordereau: string;
  dateCreation: Date;
  dateExecution: Date;
  emetteur: ParametresEmetteur;
  virements: VirementDetail[];
  motifGlobal: string;
}

/**
 * Générateur de fichiers XML SEPA ISO20022 pain.001.001.03
 * Conforme aux réglementations européennes pour les virements bancaires
 */
export class SepaXmlGenerator {
  private static readonly SCHEMA_LOCATION = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
  private static readonly VERSION = '1.03';

  /**
   * Génère un fichier XML SEPA complet pour un bordereau de virements
   */
  static generateSepaXml(bordereau: BordereauSepa): string {
    const xmlHeader = this.generateXmlHeader();
    const groupHeader = this.generateGroupHeader(bordereau);
    const paymentInfo = this.generatePaymentInfo(bordereau);
    const xmlFooter = this.generateXmlFooter();

    return `${xmlHeader}${groupHeader}${paymentInfo}${xmlFooter}`;
  }

  /**
   * En-tête XML avec déclaration et namespace ISO20022
   */
  private static generateXmlHeader(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="${this.SCHEMA_LOCATION}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
`;
  }

  /**
   * Pied de page XML
   */
  private static generateXmlFooter(): string {
    return `  </CstmrCdtTrfInitn>
</Document>`;
  }

  /**
   * En-tête de groupe - informations générales du bordereau
   */
  private static generateGroupHeader(bordereau: BordereauSepa): string {
    const messageId = `MSG-${bordereau.numeroBordereau}-${format(bordereau.dateCreation, 'yyyyMMdd')}`;
    const creationDateTime = bordereau.dateCreation.toISOString();
    const numberOfTransactions = bordereau.virements.length;
    const controlSum = bordereau.virements.reduce((sum, v) => sum + v.montant, 0);

    return `    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(bordereau.emetteur.nom)}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${bordereau.emetteur.identifiant}</Id>
              <SchmeNm>
                <Cd>SIRET</Cd>
              </SchmeNm>
            </Othr>
          </OrgId>
        </Id>
        <PstlAdr>
          <StrtNm>${this.escapeXml(bordereau.emetteur.adresse.rue)}</StrtNm>
          <TwnNm>${this.escapeXml(bordereau.emetteur.adresse.ville)}</TwnNm>
          <PstCd>${bordereau.emetteur.adresse.codePostal}</PstCd>
          <Ctry>${bordereau.emetteur.adresse.pays}</Ctry>
        </PstlAdr>
      </InitgPty>
    </GrpHdr>
`;
  }

  /**
   * Informations de paiement et virements
   */
  private static generatePaymentInfo(bordereau: BordereauSepa): string {
    const paymentId = `PAY-${bordereau.numeroBordereau}`;
    const requestedExecutionDate = format(bordereau.dateExecution, 'yyyy-MM-dd');
    const numberOfTransactions = bordereau.virements.length;
    const controlSum = bordereau.virements.reduce((sum, v) => sum + v.montant, 0);

    let paymentInfo = `    <PmtInf>
      <PmtInfId>${paymentId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${requestedExecutionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escapeXml(bordereau.emetteur.nom)}</Nm>
        <PstlAdr>
          <StrtNm>${this.escapeXml(bordereau.emetteur.adresse.rue)}</StrtNm>
          <TwnNm>${this.escapeXml(bordereau.emetteur.adresse.ville)}</TwnNm>
          <PstCd>${bordereau.emetteur.adresse.codePostal}</PstCd>
          <Ctry>${bordereau.emetteur.adresse.pays}</Ctry>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${bordereau.emetteur.iban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${bordereau.emetteur.bic}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
`;

    // Ajouter chaque virement
    bordereau.virements.forEach((virement, index) => {
      paymentInfo += this.generateCreditTransferTransaction(virement, index + 1);
    });

    paymentInfo += `    </PmtInf>
`;

    return paymentInfo;
  }

  /**
   * Génère une transaction de virement individuelle
   */
  private static generateCreditTransferTransaction(virement: VirementDetail, index: number): string {
    const endToEndId = `E2E-${virement.factureId}-${index.toString().padStart(3, '0')}`;
    
    return `      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${virement.montant.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${this.escapeXml(virement.beneficiaire.nom)}</Nm>
          ${virement.beneficiaire.adresse ? `<PstlAdr>
            <StrtNm>${this.escapeXml(virement.beneficiaire.adresse.rue)}</StrtNm>
            <TwnNm>${this.escapeXml(virement.beneficiaire.adresse.ville)}</TwnNm>
            <PstCd>${virement.beneficiaire.adresse.codePostal}</PstCd>
            <Ctry>${virement.beneficiaire.adresse.pays}</Ctry>
          </PstlAdr>` : ''}
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${virement.beneficiaire.iban}</IBAN>
          </Id>
        </CdtrAcct>
        ${virement.beneficiaire.bic ? `<CdtrAgt>
          <FinInstnId>
            <BIC>${virement.beneficiaire.bic}</BIC>
          </FinInstnId>
        </CdtrAgt>` : ''}
        <RmtInf>
          <Ustrd>${this.escapeXml(virement.motif)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
`;
  }

  /**
   * Échappement des caractères XML spéciaux
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Valide un IBAN selon le standard international
   */
  static validateIban(iban: string): boolean {
    // Supprimer les espaces et convertir en majuscules
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Vérifier la longueur (22 caractères pour la France)
    if (cleanIban.length !== 27 && cleanIban.length !== 22) {
      return false;
    }

    // Vérifier le format français (FR + 2 chiffres + 23 caractères)
    if (cleanIban.startsWith('FR') && cleanIban.length === 27) {
      const regex = /^FR\d{2}[A-Z0-9]{23}$/;
      return regex.test(cleanIban);
    }

    return false;
  }

  /**
   * Valide un BIC selon le standard Swift
   */
  static validateBic(bic: string): boolean {
    // BIC : 8 ou 11 caractères
    // Format : BBBBCCLL ou BBBBCCLLXXX
    // BBBB = code banque, CC = code pays, LL = code lieu, XXX = code filiale (optionnel)
    const regex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return regex.test(bic.toUpperCase());
  }

  /**
   * Génère un nom de fichier XML conforme aux standards bancaires
   */
  static generateFileName(numeroBordereau: string, dateCreation: Date): string {
    const datePart = format(dateCreation, 'yyyyMMdd');
    const timePart = format(dateCreation, 'HHmmss');
    return `SEPA_${numeroBordereau}_${datePart}_${timePart}.xml`;
  }

  /**
   * Valide la structure complète d'un bordereau avant génération XML
   */
  static validateBordereau(bordereau: BordereauSepa): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation de l'émetteur
    if (!bordereau.emetteur.nom || bordereau.emetteur.nom.trim().length === 0) {
      errors.push('Le nom de l\'émetteur est obligatoire');
    }

    if (!this.validateIban(bordereau.emetteur.iban)) {
      errors.push('L\'IBAN de l\'émetteur est invalide');
    }

    if (!this.validateBic(bordereau.emetteur.bic)) {
      errors.push('Le BIC de l\'émetteur est invalide');
    }

    // Validation des virements
    if (!bordereau.virements || bordereau.virements.length === 0) {
      errors.push('Aucun virement à traiter');
    }

    bordereau.virements.forEach((virement, index) => {
      if (!virement.beneficiaire.nom || virement.beneficiaire.nom.trim().length === 0) {
        errors.push(`Virement ${index + 1}: nom du bénéficiaire obligatoire`);
      }

      if (!this.validateIban(virement.beneficiaire.iban)) {
        errors.push(`Virement ${index + 1}: IBAN du bénéficiaire invalide`);
      }

      if (virement.montant <= 0) {
        errors.push(`Virement ${index + 1}: montant doit être positif`);
      }

      if (!virement.motif || virement.motif.trim().length === 0) {
        errors.push(`Virement ${index + 1}: motif obligatoire`);
      }
    });

    // Validation des dates
    if (bordereau.dateExecution < bordereau.dateCreation) {
      errors.push('La date d\'exécution ne peut pas être antérieure à la date de création');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bordereau.dateExecution < today) {
      errors.push('La date d\'exécution ne peut pas être dans le passé');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Configuration par défaut pour les paramètres émetteur (peut être surclassée)
export const DEFAULT_EMETTEUR_CONFIG: ParametresEmetteur = {
  nom: 'SYNERGIE MARKETING GROUP',
  iban: 'FR1420041010050500013M02606', // IBAN d'exemple - à configurer
  bic: 'PSSTFRPPXXX', // BIC d'exemple - à configurer
  identifiant: '12345678901234', // SIRET d'exemple - à configurer
  adresse: {
    rue: '123 Avenue des Entreprises',
    ville: 'Paris',
    codePostal: '75001',
    pays: 'FR'
  }
};

export type { BordereauSepa, VirementDetail, ParametresEmetteur };