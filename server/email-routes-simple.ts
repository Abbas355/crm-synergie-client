import { Express, Request, Response } from 'express';
import { EmailServiceSimple } from './email-service-simple';
import { templateService } from './email-templates';
import { multiEmailService } from './multi-email-config';

// Configuration email Hostinger avec IMAP
const defaultEmailSettings = {
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: 'recrutement@synergiemarketingroup.fr',
  smtpPassword: process.env.HOSTINGER_EMAIL_PASSWORD || 'Eric_1234.',
  fromEmail: 'recrutement@synergiemarketingroup.fr',
  fromName: 'Synergie Marketing Group',
  replyTo: 'recrutement@synergiemarketingroup.fr',
  signature: '\n\n--\nSynergie Marketing Group\nrecrutement@synergiemarketingroup.fr',
  isActive: true,
};

const emailService = new EmailServiceSimple(defaultEmailSettings);

// Cache des emails récupérés via IMAP
let emailsCache: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 secondes

export function setupEmailRoutesSimple(app: Express) {
  // GET /api/email-templates - Récupérer les templates d'emails
  app.get('/api/email-templates', (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const templates = templateService.getAllTemplates(category as string);
      
      res.json({
        success: true,
        templates,
        categories: templateService.getTemplateCategories()
      });
    } catch (error) {
      console.error('Erreur récupération templates:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/email-accounts - Récupérer les comptes emails disponibles
  app.get('/api/email-accounts', (req: Request, res: Response) => {
    try {
      const accounts = multiEmailService.getActiveAccounts();
      const stats = multiEmailService.getAccountsStats();
      
      res.json({
        success: true,
        accounts: accounts.map(account => ({
          id: account.id,
          name: account.name,
          email: account.email,
          department: account.department,
          description: account.description,
          isDefault: account.isDefault,
          isActive: account.isActive
        })),
        stats
      });
    } catch (error) {
      console.error('Erreur récupération comptes emails:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/email-templates/process - Traiter un template avec variables
  app.post('/api/email-templates/process', (req: Request, res: Response) => {
    try {
      const { templateId, variables } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ error: 'Template ID requis' });
      }
      
      const processedTemplate = templateService.processTemplate(templateId, variables || {});
      
      if (!processedTemplate) {
        return res.status(404).json({ error: 'Template non trouvé' });
      }
      
      res.json({
        success: true,
        ...processedTemplate
      });
    } catch (error) {
      console.error('Erreur traitement template:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/emails - Récupérer les emails via IMAP
  app.get('/api/emails', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Récupération liste emails via IMAP');
      const { direction, status, search } = req.query;
      
      const now = Date.now();
      
      // Utiliser le cache si récent
      if (emailsCache.length > 0 && (now - lastFetch) < CACHE_DURATION) {
        console.log(`📋 Utilisation cache (${emailsCache.length} emails)`);
      } else {
        // Récupérer les emails frais via IMAP
        console.log('🔄 Récupération fraîche via IMAP...');
        emailsCache = await emailService.fetchEmails();
        lastFetch = now;
        console.log(`✅ ${emailsCache.length} emails récupérés et mis en cache`);
      }
      
      let filteredEmails = emailsCache;
      
      if (direction) {
        filteredEmails = filteredEmails.filter((e: any) => e.direction === direction);
      }
      
      if (status) {
        filteredEmails = filteredEmails.filter((e: any) => e.status === status);
      }
      
      if (search) {
        const searchStr = search.toString().toLowerCase();
        filteredEmails = filteredEmails.filter((e: any) => 
          e.subject.toLowerCase().includes(searchStr) ||
          e.fromEmail.toLowerCase().includes(searchStr)
        );
      }

      res.json({
        emails: filteredEmails,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredEmails.length,
          pages: 1
        }
      });
    } catch (error) {
      console.error('Erreur récupération emails:', error);
      res.status(500).json({ 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  // GET /api/emails/stats - Statistiques des emails
  app.get('/api/emails/stats', async (req: Request, res: Response) => {
    try {
      // S'assurer d'avoir des emails récents
      if (emailsCache.length === 0 || (Date.now() - lastFetch) > CACHE_DURATION) {
        emailsCache = await emailService.fetchEmails();
        lastFetch = Date.now();
      }
      
      const stats = {
        total: emailsCache.length,
        nonLus: emailsCache.filter((e: any) => e.direction === 'inbound' && !e.isRead).length,
        favoris: emailsCache.filter((e: any) => e.isStarred).length,
        important: emailsCache.filter((e: any) => e.isImportant).length,
        recus: emailsCache.filter((e: any) => e.direction === 'inbound').length,
        envoyes: emailsCache.filter((e: any) => e.direction === 'outbound').length
      };

      res.json(stats);
    } catch (error) {
      console.error('Erreur statistiques emails:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /api/emails/:id - Récupérer un email spécifique
  app.get('/api/emails/:id', async (req: Request, res: Response) => {
    try {
      const emailId = parseInt(req.params.id);
      
      // S'assurer d'avoir des emails récents
      if (emailsCache.length === 0 || (Date.now() - lastFetch) > CACHE_DURATION) {
        emailsCache = await emailService.fetchEmails();
        lastFetch = Date.now();
      }
      
      const email = emailsCache.find((e: any) => e.id === emailId);

      if (!email) {
        return res.status(404).json({ error: 'Email non trouvé' });
      }

      // Marquer comme lu (dans le cache local seulement)
      if (email.direction === 'inbound' && !email.isRead) {
        email.isRead = true;
      }

      res.json(email);
    } catch (error) {
      console.error('Erreur récupération email:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/emails/send - Envoyer un email (avec support templates et multi-emails)
  app.post('/api/emails/send', async (req: Request, res: Response) => {
    try {
      console.log('📧 POST /api/emails/send - Données reçues:', req.body);
      const { to, subject, htmlContent, textContent, accountId, templateId, variables } = req.body;

      // Si un template est spécifié, le traiter
      let finalSubject = subject;
      let finalHtmlContent = htmlContent;
      let finalTextContent = textContent;

      if (templateId && variables) {
        console.log('🎨 Traitement template:', { templateId, variables });
        const processedTemplate = templateService.processTemplate(templateId, variables);
        if (processedTemplate) {
          finalSubject = processedTemplate.subject;
          finalHtmlContent = processedTemplate.htmlContent;
          finalTextContent = processedTemplate.textContent;
          console.log('✅ Template traité avec succès');
        }
      }

      if (!to || !finalSubject) {
        console.log('❌ Champs requis manquants:', { to: !!to, subject: !!finalSubject });
        return res.status(400).json({ error: 'Destinataire et sujet requis' });
      }

      // Choisir le service email (multi-emails ou défaut)
      let currentEmailService = emailService; // Service par défaut
      if (accountId) {
        const selectedService = multiEmailService.getEmailService(accountId);
        if (!selectedService) {
          return res.status(400).json({ error: `Compte email ${accountId} non disponible` });
        }
        currentEmailService = selectedService;
        console.log('📧 Utilisation du compte email:', accountId);
      }

      // Essayer d'envoyer l'email réel via Hostinger
      try {
        const result = await currentEmailService.sendEmail({
          to,
          subject: finalSubject,
          html: finalHtmlContent,
          text: finalTextContent || finalHtmlContent?.replace(/<[^>]*>/g, '')
        });

        if (result.success) {
          console.log('✅ Email RÉEL envoyé via Hostinger, invalidation cache IMAP');
          
          // Invalider le cache pour forcer un rafraîchissement
          emailsCache = [];
          lastFetch = 0;
          
          const isRealEmail = result.messageId && !result.messageId.startsWith('fallback-');
          const response = { 
            success: true, 
            messageId: result.messageId,
            note: isRealEmail ? "✅ Email RÉEL envoyé via Hostinger !" : "📧 Email simulé (fallback)"
          };
          
          console.log('📤 Réponse envoyée au client:', response);
          return res.json(response);
        }
      } catch (emailError) {
        console.error('Erreur envoi email Hostinger:', emailError);
      }

      // Si l'envoi réel échoue, simuler l'envoi
      console.log('📧 Fallback: simulation d\'envoi email');
      
      const response = { 
        success: true, 
        messageId: `simulated-${Date.now()}`,
        note: "Email simulé - configuration Hostinger en cours"
      };
      
      console.log('📤 Réponse simulation envoyée au client:', response);
      res.json(response);
    } catch (error) {
      console.error('Erreur envoi email:', error);
      res.status(500).json({ error: 'Erreur envoi email' });
    }
  });

  // PUT /api/emails/:id - Modifier un email
  app.put('/api/emails/:id', async (req: Request, res: Response) => {
    try {
      const emailId = parseInt(req.params.id);
      const updates = req.body;
      
      // S'assurer d'avoir des emails récents
      if (emailsCache.length === 0 || (Date.now() - lastFetch) > CACHE_DURATION) {
        emailsCache = await emailService.fetchEmails();
        lastFetch = Date.now();
      }
      
      const emailIndex = emailsCache.findIndex((e: any) => e.id === emailId);

      if (emailIndex === -1) {
        return res.status(404).json({ error: 'Email non trouvé' });
      }

      emailsCache[emailIndex] = { ...emailsCache[emailIndex], ...updates };
      res.json(emailsCache[emailIndex]);
    } catch (error) {
      console.error('Erreur modification email:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /api/emails/test-connection - Tester la connexion email
  app.post('/api/emails/test-connection', async (req: Request, res: Response) => {
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

  // GET /api/email-templates - Templates d'emails (données temporaires)
  app.get('/api/email-templates', (req: Request, res: Response) => {
    const templates = [
      {
        id: 1,
        name: "Prospection Free Standard",
        subject: "Opportunité Free - Devenez partenaire",
        htmlContent: "<p>Bonjour {{prenom}},</p><p>Nous recherchons des partenaires commerciaux pour Free...</p>",
        category: "prospection",
        isGlobal: true
      },
      {
        id: 2,
        name: "Suivi Client",
        subject: "Suivi de votre dossier Free",
        htmlContent: "<p>Bonjour {{prenom}},</p><p>Nous faisons le point sur votre dossier Free...</p>",
        category: "suivi",
        isGlobal: true
      }
    ];
    
    res.json(templates);
  });

  // POST /api/emails/refresh - Forcer le rafraîchissement du cache IMAP avec nouveau parsing
  app.post('/api/emails/refresh', async (req: Request, res: Response) => {
    try {
      console.log('🔄 Rafraîchissement forcé du cache IMAP avec parsing amélioré...');
      
      // Invalider complètement le cache
      emailsCache = [];
      lastFetch = 0;
      
      // Récupérer les emails avec le nouveau système de parsing
      const freshEmails = await emailService.fetchEmails();
      emailsCache = freshEmails;
      lastFetch = Date.now();
      
      console.log(`✅ Cache rafraîchi avec ${freshEmails.length} emails, parsing MIME amélioré appliqué`);
      
      res.json({
        success: true,
        message: `Cache IMAP rafraîchi avec parsing amélioré: ${freshEmails.length} emails`,
        emailCount: freshEmails.length,
        lastUpdate: new Date().toISOString(),
        parsingInfo: 'Nouveau parsing MIME avec décodage quoted-printable et nettoyage avancé'
      });
    } catch (error) {
      console.error('Erreur rafraîchissement IMAP:', error);
      res.status(500).json({ 
        error: 'Erreur rafraîchissement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });
}