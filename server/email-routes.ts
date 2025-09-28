import { Express, Request, Response } from 'express';
import { db } from '@db';
import { emails, emailTemplates, clients, users } from '@shared/schema';
import { eq, desc, and, or, like, count } from 'drizzle-orm';
import { EmailService, EmailSettings } from './email-service';
import { isAuthenticated } from './auth';

// Configuration email Hostinger par défaut
const defaultEmailSettings: EmailSettings = {
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: 'recrutement@synergiemarketingroup.fr',
  smtpPassword: process.env.SMTP_PASS || 'Eric_1234.',
  fromEmail: 'recrutement@synergiemarketingroup.fr',
  fromName: 'Synergie Marketing Group',
  replyTo: 'recrutement@synergiemarketingroup.fr',
  signature: '\n\n--\nSynergie Marketing Group\nrecrutement@synergiemarketingroup.fr',
  isActive: true,
};

const emailService = new EmailService(defaultEmailSettings);

export function setupEmailRoutes(app: Express) {
  // GET /api/emails - Récupérer tous les emails de l'utilisateur
  app.get('/api/emails', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { direction, status, search, page = 1, limit = 50 } = req.query;
      
      let query = db.query.emails.findMany({
        where: and(
          eq(emails.userId, userId),
          eq(emails.isDeleted, false),
          direction ? eq(emails.direction, direction as string) : undefined,
          status ? eq(emails.status, status as string) : undefined,
          search ? or(
            like(emails.subject, `%${search}%`),
            like(emails.fromEmail, `%${search}%`),
            like(emails.toEmail, `%${search}%`)
          ) : undefined
        ),
        orderBy: desc(emails.createdAt),
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        with: {
          client: true,
          user: {
            columns: {
              id: true,
              prenom: true,
              nom: true,
              email: true
            }
          }
        }
      });

      const emailsList = await query;
      
      // Compter le total pour la pagination
      const totalQuery = await db.select({ count: count() })
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          eq(emails.isDeleted, false)
        ));
      
      const total = totalQuery[0]?.count || 0;

      res.json({
        emails: emailsList,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Erreur récupération emails:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/emails/stats - Statistiques des emails
  app.get('/api/emails/stats', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      const stats = await db.query.emails.findMany({
        where: and(
          eq(emails.userId, userId),
          eq(emails.isDeleted, false)
        ),
        columns: {
          id: true,
          direction: true,
          isRead: true,
          isStarred: true,
          isImportant: true,
          status: true
        }
      });

      const calculations = {
        total: stats.length,
        nonLus: stats.filter(e => e.direction === 'inbound' && !e.isRead).length,
        favoris: stats.filter(e => e.isStarred).length,
        important: stats.filter(e => e.isImportant).length,
        recus: stats.filter(e => e.direction === 'inbound').length,
        envoyes: stats.filter(e => e.direction === 'outbound').length
      };

      res.json(calculations);
    } catch (error) {
      console.error('Erreur statistiques emails:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/emails/:id - Récupérer un email spécifique
  app.get('/api/emails/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const emailId = parseInt(req.params.id);

      const email = await db.query.emails.findFirst({
        where: and(
          eq(emails.id, emailId),
          eq(emails.userId, userId)
        ),
        with: {
          client: true,
          user: {
            columns: {
              id: true,
              prenom: true,
              nom: true,
              email: true
            }
          },
          replyToEmail: true
        }
      });

      if (!email) {
        return res.status(404).json({ error: 'Email non trouvé' });
      }

      // Marquer comme lu s'il s'agit d'un email entrant
      if (email.direction === 'inbound' && !email.isRead) {
        await db.update(emails)
          .set({ 
            isRead: true, 
            dateRead: new Date(),
            updatedAt: new Date()
          })
          .where(eq(emails.id, emailId));
        
        email.isRead = true;
        email.dateRead = new Date();
      }

      res.json(email);
    } catch (error) {
      console.error('Erreur récupération email:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/emails/send - Envoyer un email
  app.post('/api/emails/send', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { to, subject, htmlContent, textContent, cc, bcc, clientId, inReplyTo } = req.body;

      if (!to || !subject) {
        return res.status(400).json({ error: 'Destinataire et sujet requis' });
      }

      // Envoyer l'email
      const result = await emailService.sendEmail({
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent?.replace(/<[^>]*>/g, ''), // Strip HTML pour le texte
        cc,
        bcc,
        clientId
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Enregistrer l'email en base
      const [savedEmail] = await db.insert(emails).values({
        messageId: result.messageId || `local-${Date.now()}`,
        subject,
        fromEmail: defaultEmailSettings.fromEmail,
        fromName: defaultEmailSettings.fromName,
        toEmail: to,
        toName: to, // On pourrait extraire le nom si format "Nom <email>"
        ccEmails: cc || null,
        bccEmails: bcc || null,
        htmlContent,
        textContent: textContent || htmlContent?.replace(/<[^>]*>/g, ''),
        direction: 'outbound',
        status: 'sent',
        userId,
        clientId: clientId || null,
        inReplyTo: inReplyTo || null,
        dateSent: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.json({ 
        success: true, 
        email: savedEmail,
        messageId: result.messageId 
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
      res.status(500).json({ error: 'Erreur envoi email' });
    }
  });

  // PUT /api/emails/:id - Modifier un email (marquer comme lu/non lu, starred, etc.)
  app.put('/api/emails/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const emailId = parseInt(req.params.id);
      const updates = req.body;

      // Vérifier que l'email appartient à l'utilisateur
      const email = await db.query.emails.findFirst({
        where: and(
          eq(emails.id, emailId),
          eq(emails.userId, userId)
        )
      });

      if (!email) {
        return res.status(404).json({ error: 'Email non trouvé' });
      }

      const [updatedEmail] = await db.update(emails)
        .set({
          ...updates,
          updatedAt: new Date(),
          dateRead: updates.isRead && !email.isRead ? new Date() : email.dateRead
        })
        .where(eq(emails.id, emailId))
        .returning();

      res.json(updatedEmail);
    } catch (error) {
      console.error('Erreur modification email:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // DELETE /api/emails/:id - Supprimer un email (soft delete)
  app.delete('/api/emails/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const emailId = parseInt(req.params.id);

      const [deletedEmail] = await db.update(emails)
        .set({ 
          isDeleted: true, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(emails.id, emailId),
          eq(emails.userId, userId)
        ))
        .returning();

      if (!deletedEmail) {
        return res.status(404).json({ error: 'Email non trouvé' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Erreur suppression email:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/email-templates - Récupérer les templates
  app.get('/api/email-templates', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      const templates = await db.query.emailTemplates.findMany({
        where: or(
          eq(emailTemplates.userId, userId),
          eq(emailTemplates.isGlobal, true)
        ),
        orderBy: desc(emailTemplates.createdAt)
      });

      res.json(templates);
    } catch (error) {
      console.error('Erreur récupération templates:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/email-templates - Créer un template
  app.post('/api/email-templates', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { name, subject, htmlContent, textContent, category, variables } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ error: 'Nom et sujet requis' });
      }

      const [template] = await db.insert(emailTemplates).values({
        name,
        subject,
        htmlContent,
        textContent,
        category,
        variables,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.json(template);
    } catch (error) {
      console.error('Erreur création template:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/emails/test-connection - Tester la connexion email
  app.post('/api/emails/test-connection', isAuthenticated, async (req: any, res: Response) => {
    try {
      const result = await emailService.testConnection();
      res.json({ success: result });
    } catch (error) {
      console.error('Test connexion email échoué:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  });
}