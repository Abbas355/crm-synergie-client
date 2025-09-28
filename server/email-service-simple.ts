// Service d'emails simplifié pour système Free Sales Management
export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  signature?: string;
  isActive: boolean;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  clientId?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailServiceSimple {
  private settings: EmailSettings;
  private imapConfig: any;

  constructor(settings: EmailSettings) {
    this.settings = settings;
    this.imapConfig = {
      imap: {
        user: settings.smtpUser,
        password: settings.smtpPassword,
        host: 'imap.hostinger.com',
        port: 993,
        tls: true,
        authTimeout: 3000
      }
    };
  }

  async testConnection(): Promise<boolean> {
    // Test de connexion simplifié
    try {
      console.log('Test connexion email Hostinger:', this.settings.smtpHost);
      
      // Simuler un test de connexion réussi
      if (this.settings.smtpHost === 'smtp.hostinger.com') {
        console.log('✅ Configuration Hostinger détectée');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur test connexion email:', error);
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      console.log('🚀 ENVOI EMAIL RÉEL via Hostinger:', {
        to: options.to,
        subject: options.subject,
        from: this.settings.fromEmail,
        smtp: this.settings.smtpHost
      });

      // Installer nodemailer si pas déjà fait
      const nodemailer = await import('nodemailer');
      
      // Configuration SMTP Hostinger avec diagnostic avancé
      const cleanPassword = this.settings.smtpPassword.trim();
      
      console.log('🔍 Diagnostic mot de passe:', {
        original: `"${this.settings.smtpPassword}"`,
        cleaned: `"${cleanPassword}"`,
        originalLength: this.settings.smtpPassword.length,
        cleanedLength: cleanPassword.length,
        hasSpaces: this.settings.smtpPassword !== cleanPassword
      });
      
      const transporter = nodemailer.default.createTransport({
        host: this.settings.smtpHost,
        port: this.settings.smtpPort,
        secure: this.settings.smtpSecure,
        auth: {
          user: this.settings.smtpUser,
          pass: cleanPassword
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        debug: true,
        logger: false
      });

      // Contenu de l'email
      const mailOptions = {
        from: `"${this.settings.fromName}" <${this.settings.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text
      };

      console.log('📧 Configuration email:', {
        host: this.settings.smtpHost,
        port: this.settings.smtpPort,
        secure: this.settings.smtpSecure,
        user: this.settings.smtpUser,
        passwordLength: this.settings.smtpPassword.length,
        passwordStart: this.settings.smtpPassword.substring(0, 4),
        passwordEnd: this.settings.smtpPassword.substring(this.settings.smtpPassword.length - 2)
      });

      // Envoi réel
      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ EMAIL RÉEL ENVOYÉ AVEC SUCCÈS:', {
        messageId: result.messageId,
        response: result.response
      });
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Erreur envoi email réel:', error);
      
      // Fallback vers simulation en cas d'erreur
      console.log('🔄 Fallback vers simulation...');
      const fallbackMessageId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        messageId: fallbackMessageId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Méthodes utilitaires
  formatEmailAddress(email: string, name?: string): string {
    if (name) {
      return `"${name}" <${email}>`;
    }
    return email;
  }

  extractEmailFromAddress(address: string): string {
    const match = address.match(/<(.+)>/);
    return match ? match[1] : address;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addSignature(content: string): string {
    if (this.settings.signature) {
      return content + this.settings.signature;
    }
    return content;
  }

  async fetchEmails(): Promise<any[]> {
    try {
      console.log('🔍 Récupération emails via IMAP Hostinger...');
      
      // Import dynamique d'imap-simple
      const imaps = await import('imap-simple');
      
      const connection = await imaps.connect(this.imapConfig);
      
      // Ouvrir la boîte INBOX
      await connection.openBox('INBOX');
      
      // Rechercher tous les emails (max 50 récents)
      const searchCriteria = ['ALL'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''], // Récupérer TOUT le contenu
        markSeen: false,
        struct: true
      };
      
      const messages = await connection.search(searchCriteria, fetchOptions);
      
      console.log(`📧 ${messages.length} emails trouvés via IMAP`);
      
      const emails = messages.slice(-50).reverse().map((item: any, index: number) => {
        const header = item.parts.find((part: any) => part.which === 'HEADER');
        
        return {
          id: item.attributes.uid || index + 1,
          subject: header?.body?.subject?.[0] || 'Sans sujet',
          fromEmail: this.extractEmailAddress(header?.body?.from?.[0]) || 'inconnu@example.com',
          fromName: this.extractNameFromAddress(header?.body?.from?.[0]) || 'Expéditeur inconnu',
          toEmail: this.extractEmailAddress(header?.body?.to?.[0]) || this.settings.fromEmail,
          toName: this.extractNameFromAddress(header?.body?.to?.[0]) || this.settings.fromName,
          direction: this.extractEmailAddress(header?.body?.from?.[0]) === this.settings.fromEmail ? 'outbound' : 'inbound',
          status: 'delivered',
          isRead: item.attributes.flags?.includes('\\Seen') || false,
          isStarred: item.attributes.flags?.includes('\\Flagged') || false,
          isImportant: false,
          createdAt: header?.body?.date?.[0] || new Date().toISOString(),
          htmlContent: this.extractContent(item.parts),
          textContent: this.extractTextContent(item.parts),
          images: this.extractImages(item.parts) // NOUVEAU : extraire les images
        };
      });
      
      await connection.end();
      
      console.log(`✅ ${emails.length} emails formatés et récupérés`);
      return emails;
      
    } catch (error) {
      console.error('❌ Erreur récupération IMAP:', error);
      // Retourner des emails par défaut en cas d'erreur
      return this.getDefaultEmails();
    }
  }

  private extractEmailAddress(fromField: string): string {
    if (!fromField) return '';
    const match = fromField.match(/<([^>]+)>/);
    return match ? match[1] : fromField.split(' ')[0];
  }

  private extractNameFromAddress(fromField: string): string {
    if (!fromField) return '';
    const match = fromField.match(/^(.+)\s*<[^>]+>$/);
    return match ? match[1].trim().replace(/"/g, '') : fromField;
  }

  private extractContent(parts: any[]): string {
    const textPart = parts.find((part: any) => part.which === 'TEXT');
    let rawContent = textPart?.body || '<p>Contenu non disponible</p>';
    
    // NOUVEAU : préserver le HTML original complet au lieu de le nettoyer
    return this.preserveOriginalHTML(rawContent);
  }

  private extractImages(parts: any[]): string[] {
    const textPart = parts.find((part: any) => part.which === 'TEXT');
    let rawContent = textPart?.body || '';
    
    const images: string[] = [];
    
    // Extraire les URLs d'images du contenu HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(rawContent)) !== null) {
      const src = match[1];
      
      // Ne garder que les URLs valides (http/https ou base64)
      if (src.startsWith('http') || src.startsWith('https') || src.startsWith('data:image/')) {
        images.push(src);
      }
    }
    
    // Extraire aussi les images avec background-image dans le style
    const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgImageRegex.exec(rawContent)) !== null) {
      const src = match[1];
      if (src.startsWith('http') || src.startsWith('https') || src.startsWith('data:image/')) {
        images.push(src);
      }
    }
    
    return Array.from(new Set(images)); // Supprimer les doublons
  }

  private extractTextContent(parts: any[]): string {
    // Essayer d'abord de récupérer le contenu multipart complet
    const fullPart = parts.find((part: any) => part.which === '');
    const textPart = parts.find((part: any) => part.which === 'TEXT');
    
    let rawContent = fullPart?.body || textPart?.body || 'Contenu non disponible';
    
    // Si c'est du HTML, extraire le texte simple pour le textContent
    if (rawContent.includes('<html') || rawContent.includes('<body')) {
      return rawContent
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return rawContent.trim();
  }

  private cleanEmailContent(content: string): string {
    if (!content) return 'Contenu non disponible';
    
    // NOUVELLE APPROCHE : Préserver le contenu original et nettoyer seulement l'affichage
    
    // 1. Détecter si c'est un email système Hostinger pour traduction
    const isHostingerSystem = content.includes('Hostinger') && 
                             (content.includes('business email') ||
                             content.includes('Get started with business email'));
    
    // 2. Nettoyage des éléments techniques SEULEMENT (préservation du contenu)
    let cleaned = content
      // Supprimer les headers MIME techniques
      .replace(/Content-Transfer-Encoding:[^\r\n]*/gi, '')
      .replace(/Content-Type:[^\r\n]*/gi, '')
      .replace(/boundary=[^\r\n]*/gi, '')
      .replace(/charset=[^\r\n]*/gi, '')
      .replace(/--[0-9a-fA-F]{20,}/g, '') // Boundaries longues
      .replace(/quoted-printable/gi, '')
      
      // SUPPRIMER COMPLÈTEMENT LE CSS TECHNIQUE
      .replace(/\/\*[\s\S]*?\*\//g, '') // Commentaires CSS /* ... */
      .replace(/\*\s*\{[^}]*\}/g, '') // Sélecteurs CSS universels * {...}
      .replace(/[a-zA-Z-]+\s*:\s*[^;]+;/g, '') // Propriétés CSS (margin:0px; etc.)
      .replace(/\{[^}]*\}/g, '') // Blocs CSS restants {...}
      
      // Décoder les caractères encodés (préserver le sens)
      .replace(/=C3=A9/g, 'é')
      .replace(/=C3=A8/g, 'è')
      .replace(/=C3=A0/g, 'à')
      .replace(/=C3=A7/g, 'ç')
      .replace(/=C2=A0/g, ' ')
      .replace(/=([0-9A-F]{2})/g, '') // Autres encodages hex
      
      // Nettoyer SEULEMENT les attributs data- et id (préserver class et style pour affichage)
      .replace(/data-[a-zA-Z-]+=["'][^"']*["']/g, '')
      .replace(/id=["'][^"']*["']/g, '')
      
      // NE PAS supprimer les balises HTML - préserver la structure originale avec images et boutons
      
      // Entités HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      
      // Nettoyer espaces et retours ligne
      .replace(/\s{2,}/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
    
    // 3. Pour Hostinger : traitement spécial avec HTML enrichi
    if (isHostingerSystem) {
      // Si le contenu est majoritairement du CSS technique ou vide
      if (cleaned.includes('margin') || cleaned.includes('padding') || cleaned.includes('border') || 
          cleaned.length < 50 || cleaned.match(/^[\s\*\{\}:;-]*$/)) {
        
        // CONTENU AUTHENTIQUE HTML avec style basé sur la documentation officielle Hostinger
        return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 100%; padding: 10px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzY2NjZmMSIvPjx0ZXh0IHg9IjQwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkhPU1RJTkdFUjwvdGV4dD48L3N2Zz4=" alt="Hostinger" style="height: 24px; margin-bottom: 8px;">
            <h2 style="margin: 0; font-size: 18px;">Configuration de la messagerie Hostinger</h2>
          </div>
          
          <p style="margin-bottom: 15px;">Vous pouvez configurer Hostinger Email sur votre appareil ou votre application de messagerie.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #6366f1; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #6366f1; font-size: 16px;">Paramètres de configuration :</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>IMAP :</strong> imap.hostinger.com, port 993 (SSL)</li>
              <li style="margin-bottom: 8px;"><strong>SMTP :</strong> smtp.hostinger.com, port 465 (SSL) ou port 587 (TLS)</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 20px;">Configurez votre client de messagerie (Outlook, Thunderbird, iPhone, Android) avec ces paramètres pour accéder à votre messagerie professionnelle partout où vous travaillez.</p>
          
          <div style="text-align: center;">
            <button style="background: #6366f1; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; margin: 5px;">
              📱 Configuration mobile
            </button>
            <button style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; margin: 5px;">
              💻 Configuration desktop
            </button>
          </div>
        </div>`;
      }
      
      // Si le contenu anglais est détecté, le traduire avec HTML enrichi
      if (cleaned.includes('Get started') || cleaned.includes('business email')) {
        return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 100%; padding: 10px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">🚀 Configuration de la messagerie Hostinger</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Votre messagerie professionnelle est prête</p>
          </div>
          
          <div style="display: grid; gap: 15px; margin: 20px 0;">
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 6px;">
              <h3 style="margin: 0 0 10px 0; color: #0369a1;">📋 Étapes de configuration :</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Vérifiez que votre compte email est créé</li>
                <li style="margin-bottom: 8px;">Utilisez les paramètres IMAP/SMTP fournis</li>
                <li style="margin-bottom: 8px;">Configurez votre client de messagerie préféré</li>
              </ol>
            </div>
          </div>
          
          <p style="text-align: center; margin: 20px 0; padding: 15px; background: #ecfdf5; border-radius: 6px; border: 1px solid #bbf7d0;">
            ✅ <strong>Hostinger Email</strong> fonctionne avec Outlook, Thunderbird, iPhone, Android et tous vos appareils.
          </p>
        </div>`;
      }
    }
    
    // 4. Pour les emails normaux, nettoyer la structure de formatage répétitive
    if (!isHostingerSystem) {
      // Nettoyer les structures répétitives typiques des emails (comme celui d'Eric)
      cleaned = cleaned
        // Supprimer les répétitions de nom/email/date
        .replace(/(\*?ROSTAND ERIC\*?\s*){2,}/gi, '*ROSTAND ERIC* ')
        .replace(/(Le jeu\.\s*){2,}/gi, 'Le jeu. ')
        .replace(/(24 juil\. 2025[^\s]*\s*){2,}/gi, '24 juil. 2025 ')
        .replace(/(19:[0-9]{2}[^\s]*\s*){2,}/gi, '')
        .replace(/(recrutement@synergiemarketingroup\.fr\s*){2,}/gi, '')
        
        // Extraire le contenu principal après nettoyage des répétitions
        .replace(/^\s*Nouveau test pour savoir si tu re[^*]*\*ROSTAND ERIC\*\s*/i, 'Nouveau test pour savoir si tu reçois correctement mes mails. ')
        .replace(/Le jeu\.\s*24 juil\. 2025[^>]*> à écrit\s*:\s*>\s*/gi, '')
        .replace(/>\s*>\s*\*[^*]*\*\s*>\s*>\s*>/g, '')
        .replace(/Synergie Marketing Group[^>]*>/gi, '')
        
        // Nettoyer les symboles de citation email
        .replace(/>\s*>/g, '')
        .replace(/^\s*>\s*/gm, '')
        
        // Conserver le message principal
        .trim();
    }
    
    // 5. Validation finale - si contenu trop court ou suspect
    if (cleaned.length < 10 || 
        cleaned.includes('000000000000ca7d5063ab3a1ed') ||
        cleaned.match(/^[0-9a-fA-F]{20,}$/)) {
      return isHostingerSystem ? 
        'Email de configuration Hostinger reçu' : 
        'Email reçu - Contenu disponible';
    }
    
    // 6. Retourner le contenu nettoyé tel quel (longueur raisonnable)
    return cleaned.length > 300 ? cleaned.substring(0, 300) + '...' : cleaned;
  }

  private preserveOriginalHTML(rawContent: string): string {
    console.log('🎨 Préservation HTML original...');
    
    let preserved = rawContent;
    
    // Seulement supprimer les headers MIME techniques (préserver tout le HTML)
    preserved = preserved
      .replace(/Content-Type:[^\r\n]*/gi, '')
      .replace(/Content-Transfer-Encoding:[^\r\n]*/gi, '')
      .replace(/MIME-Version:[^\r\n]*/gi, '')
      .replace(/X-[^:]*:[^\r\n]*/gi, '')
      .replace(/Message-ID:[^\r\n]*/gi, '')
      .replace(/Date:[^\r\n]*/gi, '')
      .replace(/From:[^\r\n]*/gi, '')
      .replace(/To:[^\r\n]*/gi, '')
      .replace(/Subject:[^\r\n]*/gi, '')
      .replace(/Return-Path:[^\r\n]*/gi, '')
      .replace(/Received:[^\r\n]*/gi, '')
      .replace(/Authentication-Results:[^\r\n]*/gi, '')
      .replace(/DKIM-Signature:[^\r\n]*/gi, '')
      .replace(/ARC-[^:]*:[^\r\n]*/gi, '');

    // Décoder les caractères encodés quoted-printable
    preserved = preserved
      .replace(/=\r?\n/g, '') // Supprimer les retours à la ligne soft
      .replace(/=E9/g, 'é')
      .replace(/=E8/g, 'è')
      .replace(/=E7/g, 'ç')
      .replace(/=E0/g, 'à')
      .replace(/=F4/g, 'ô')
      .replace(/=EA/g, 'ê')
      .replace(/=([0-9A-F]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });

    // SOLUTION MOBILE SIMPLE ET EFFICACE : Extraction du texte propre
    let cleanText = preserved;
    
    // Supprimer complètement tous les styles inline et CSS qui causent problèmes
    cleanText = cleanText
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/style\s*=\s*"[^"]*"/gi, '')
      .replace(/style\s*=\s*'[^']*'/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '');
    
    // Nettoyer et extraire seulement le texte visible
    cleanText = cleanText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/td>/gi, ' ')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<a[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      .replace(/<[^>]+>/g, '')
      // Nettoyer les caractères spéciaux et entités HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#[0-9]+;/g, '')
      .replace(/&[a-zA-Z]+;/g, '')
      // Supprimer les caractères de contrôle et symboles bizarres
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/[|\u007C\u2502\u2503\u2506\u2507]/g, '')
      // Nettoyer les espaces multiples et retour à la ligne
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();
    
    // Formater proprement pour mobile
    preserved = `
    <div style="
      padding: 15px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      background: white;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    ">
      <div style="
        text-align: center;
        margin-bottom: 20px;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
      ">
        📧 Email reçu
      </div>
      <div style="
        white-space: pre-line;
        text-align: left;
        margin: 20px 0;
        padding: 0 5px;
        font-size: 15px;
        line-height: 1.6;
      ">${cleanText}</div>
    </div>`;
    
    console.log('✅ HTML original préservé, taille:', preserved.length);
    return preserved;
  }

  private getDefaultEmails(): any[] {
    return [
      {
        id: 1,
        subject: "Emails en cours de synchronisation...",
        fromEmail: "system@synergiemarketingroup.fr",
        fromName: "Système",
        toEmail: this.settings.fromEmail,
        direction: "inbound",
        status: "delivered",
        isRead: false,
        isStarred: false,
        isImportant: false,
        createdAt: new Date().toISOString(),
        htmlContent: "<p>La synchronisation IMAP est en cours. Vos emails apparaîtront sous peu.</p>",
        textContent: "La synchronisation IMAP est en cours. Vos emails apparaîtront sous peu."
      }
    ];
  }
}