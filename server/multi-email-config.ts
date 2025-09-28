// Configuration multi-emails pour Free Sales Management
import { EmailServiceSimple, EmailSettings } from './email-service-simple';

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  smtpSettings: EmailSettings;
  isDefault: boolean;
  isActive: boolean;
  department: 'commercial' | 'support' | 'direction' | 'recrutement';
  description: string;
}

// Comptes emails configurés
export const emailAccounts: EmailAccount[] = [
  {
    id: 'recrutement-principal',
    name: 'Équipe Recrutement',
    email: 'recrutement@synergiemarketingroup.fr',
    smtpSettings: {
      smtpHost: 'smtp.hostinger.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'recrutement@synergiemarketingroup.fr',
      smtpPassword: process.env.HOSTINGER_EMAIL_PASSWORD || 'Eric_1234.',
      fromEmail: 'recrutement@synergiemarketingroup.fr',
      fromName: 'Synergie Marketing Group - Recrutement',
      replyTo: 'recrutement@synergiemarketingroup.fr',
      signature: '\n\n--\nÉquipe Recrutement\nSynergie Marketing Group\n📧 recrutement@synergiemarketingroup.fr',
      isActive: true
    },
    isDefault: true,
    isActive: true,
    department: 'recrutement',
    description: 'Compte principal pour le recrutement et la prospection vendeurs'
  },
  
  {
    id: 'commercial-ventes',
    name: 'Équipe Commerciale',
    email: 'commercial@synergiemarketingroup.fr',
    smtpSettings: {
      smtpHost: 'smtp.hostinger.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'commercial@synergiemarketingroup.fr',
      smtpPassword: process.env.COMMERCIAL_EMAIL_PASSWORD || 'Commercial_123.',
      fromEmail: 'commercial@synergiemarketingroup.fr',
      fromName: 'Synergie Marketing Group - Commercial',
      replyTo: 'commercial@synergiemarketingroup.fr',
      signature: '\n\n--\nÉquipe Commerciale\nSynergie Marketing Group\n📧 commercial@synergiemarketingroup.fr\n📞 Numéro commercial',
      isActive: true
    },
    isDefault: false,
    isActive: false, // À activer quand les credentials seront fournis
    department: 'commercial',
    description: 'Compte dédié aux communications commerciales et suivi clients'
  },
  
  {
    id: 'support-technique',
    name: 'Support Technique',
    email: 'support@synergiemarketingroup.fr',
    smtpSettings: {
      smtpHost: 'smtp.hostinger.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'support@synergiemarketingroup.fr',
      smtpPassword: process.env.SUPPORT_EMAIL_PASSWORD || 'Support_123.',
      fromEmail: 'support@synergiemarketingroup.fr',
      fromName: 'Synergie Marketing Group - Support',
      replyTo: 'support@synergiemarketingroup.fr',
      signature: '\n\n--\nSupport Technique\nSynergie Marketing Group\n📧 support@synergiemarketingroup.fr',
      isActive: true
    },
    isDefault: false,
    isActive: false, // À activer quand les credentials seront fournis
    department: 'support',
    description: 'Compte pour le support technique et assistance utilisateurs'
  },
  
  {
    id: 'direction-generale',
    name: 'Direction Générale',
    email: 'direction@synergiemarketingroup.fr',
    smtpSettings: {
      smtpHost: 'smtp.hostinger.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'direction@synergiemarketingroup.fr',
      smtpPassword: process.env.DIRECTION_EMAIL_PASSWORD || 'Direction_123.',
      fromEmail: 'direction@synergiemarketingroup.fr',
      fromName: 'Synergie Marketing Group - Direction',
      replyTo: 'direction@synergiemarketingroup.fr',
      signature: '\n\n--\nDirection Générale\nSynergie Marketing Group\n📧 direction@synergiemarketingroup.fr',
      isActive: true
    },
    isDefault: false,
    isActive: false, // À activer quand les credentials seront fournis
    department: 'direction',
    description: 'Compte direction pour communications officielles et management'
  }
];

// Service de gestion multi-emails
export class MultiEmailService {
  private accounts: EmailAccount[] = emailAccounts;
  private emailServices: Map<string, EmailServiceSimple> = new Map();

  constructor() {
    // Initialiser les services email pour chaque compte actif
    this.accounts.forEach(account => {
      if (account.isActive) {
        this.emailServices.set(account.id, new EmailServiceSimple(account.smtpSettings));
      }
    });
  }

  getActiveAccounts(): EmailAccount[] {
    return this.accounts.filter(account => account.isActive);
  }

  getAccountsByDepartment(department: EmailAccount['department']): EmailAccount[] {
    return this.accounts.filter(account => account.department === department && account.isActive);
  }

  getDefaultAccount(): EmailAccount | undefined {
    return this.accounts.find(account => account.isDefault && account.isActive);
  }

  getAccount(accountId: string): EmailAccount | undefined {
    return this.accounts.find(account => account.id === accountId);
  }

  getEmailService(accountId?: string): EmailServiceSimple | undefined {
    // Si aucun accountId spécifié, utiliser le compte par défaut
    if (!accountId) {
      const defaultAccount = this.getDefaultAccount();
      accountId = defaultAccount?.id;
    }
    
    if (!accountId) return undefined;
    
    return this.emailServices.get(accountId);
  }

  async sendEmail(options: {
    accountId?: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string[];
    bcc?: string[];
  }) {
    const emailService = this.getEmailService(options.accountId);
    if (!emailService) {
      throw new Error(`Service email non disponible pour le compte ${options.accountId || 'par défaut'}`);
    }

    return await emailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc
    });
  }

  // Activer un compte email (après fourniture des credentials)
  activateAccount(accountId: string, password: string): boolean {
    const account = this.getAccount(accountId);
    if (!account) return false;

    account.smtpSettings.smtpPassword = password;
    account.isActive = true;
    
    // Créer le service email
    this.emailServices.set(accountId, new EmailServiceSimple(account.smtpSettings));
    
    return true;
  }

  // Tester la connexion d'un compte
  async testAccountConnection(accountId: string): Promise<boolean> {
    const emailService = this.emailServices.get(accountId);
    if (!emailService) return false;
    
    return await emailService.testConnection();
  }

  // Obtenir les statistiques des comptes
  getAccountsStats() {
    return {
      total: this.accounts.length,
      active: this.accounts.filter(a => a.isActive).length,
      byDepartment: {
        recrutement: this.accounts.filter(a => a.department === 'recrutement').length,
        commercial: this.accounts.filter(a => a.department === 'commercial').length,
        support: this.accounts.filter(a => a.department === 'support').length,
        direction: this.accounts.filter(a => a.department === 'direction').length
      }
    };
  }
}

export const multiEmailService = new MultiEmailService();