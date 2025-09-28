import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  signature: string;
  isActive: boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
  clientId?: number;
}

export class EmailService {
  private transporter?: nodemailer.Transporter;
  private sendGridService?: MailService;
  private settings: EmailSettings;
  private useProvider: 'smtp' | 'sendgrid';

  constructor(settings: EmailSettings) {
    this.settings = settings;
    this.useProvider = process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp';
    this.initializeServices();
  }

  private initializeServices() {
    if (this.useProvider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      this.sendGridService = new MailService();
      this.sendGridService.setApiKey(process.env.SENDGRID_API_KEY);
    }

    if (this.useProvider === 'smtp' || !process.env.SENDGRID_API_KEY) {
      this.initializeSmtpTransporter();
    }
  }

  private initializeSmtpTransporter() {
    if (!this.settings.isActive) {
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: this.settings.smtpHost,
        port: this.settings.smtpPort,
        secure: this.settings.smtpSecure,
        auth: {
          user: this.settings.smtpUser,
          pass: this.settings.smtpPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.error('Erreur initialisation transporter SMTP:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Service email non configuré');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Test de connexion SMTP échoué:', error);
      throw error;
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (this.useProvider === 'sendgrid' && this.sendGridService) {
        return await this.sendWithSendGrid(emailData);
      } else {
        return await this.sendWithSmtp(emailData);
      }
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  private async sendWithSendGrid(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sendGridService) {
      throw new Error('SendGrid non configuré');
    }

    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.settings.fromEmail,
          name: this.settings.fromName
        },
        subject: emailData.subject,
        html: emailData.html || emailData.text,
        text: emailData.text,
        replyTo: this.settings.replyTo,
        cc: emailData.cc,
        bcc: emailData.bcc,
        attachments: emailData.attachments
      };

      const [response] = await this.sendGridService.send(msg);
      return { 
        success: true, 
        messageId: response.headers['x-message-id'] as string 
      };
    } catch (error) {
      console.error('Erreur SendGrid:', error);
      throw error;
    }
  }

  private async sendWithSmtp(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      throw new Error('Service SMTP non configuré');
    }

    try {
      const mailOptions = {
        from: `"${this.settings.fromName}" <${this.settings.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html || emailData.text,
        text: emailData.text,
        replyTo: this.settings.replyTo,
        cc: emailData.cc,
        bcc: emailData.bcc,
        attachments: emailData.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { 
        success: true, 
        messageId: info.messageId 
      };
    } catch (error) {
      console.error('Erreur SMTP:', error);
      throw error;
    }
  }
}

// Fonction utilitaire pour créer une instance du service email
export async function createEmailService(settings: EmailSettings): Promise<EmailService> {
  return new EmailService(settings);
}