// Système de templates d'emails personnalisés pour Free Sales Management
export interface EmailTemplate {
  id: string;
  name: string;
  category: 'prospection' | 'suivi' | 'commercial' | 'support' | 'notification';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Variables disponibles comme {{nom}}, {{produit}}
  description: string;
  isActive: boolean;
  createdAt: string;
}

// Templates prédéfinis pour Free Sales Management
export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'prospection-free-initial',
    name: 'Prospection Free - Contact Initial',
    category: 'prospection',
    subject: 'Offre Free Exclusive - Économisez jusqu\'à {{economie}}€/mois',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚀 Offre Free Exclusive</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Bonjour {{nom}},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            J'espère que vous allez bien. Je me permets de vous contacter concernant une offre exceptionnelle Free qui pourrait vous intéresser.
          </p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2d5d31; margin-top: 0;">💰 Économies Garanties</h3>
            <p style="color: #2d5d31; margin-bottom: 0;">
              <strong>Jusqu'à {{economie}}€ d'économies par mois</strong> sur votre abonnement actuel !
            </p>
          </div>
          
          <h3 style="color: #333;">🎯 Notre Offre {{produit}}</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>Internet Très Haut Débit jusqu'à 8 Gb/s</li>
            <li>TV avec +220 chaînes incluses</li>
            <li>Téléphonie fixe illimitée</li>
            <li>{{forfait_mobile}} inclus</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:{{telephone}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              📞 Appelez-moi au {{telephone}}
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Je reste à votre disposition pour toute question et vous propose un rendez-vous téléphonique à votre convenance.
          </p>
          
          <p style="color: #555;">
            Cordialement,<br>
            <strong>{{vendeur_nom}}</strong><br>
            Conseiller Free - Synergie Marketing Group<br>
            📧 {{vendeur_email}} | 📱 {{vendeur_tel}}
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          Synergie Marketing Group - Partenaire Officiel Free<br>
          Si vous ne souhaitez plus recevoir nos communications, 
          <a href="#" style="color: #667eea;">cliquez ici</a>
        </div>
      </div>
    `,
    textContent: `
Bonjour {{nom}},

J'espère que vous allez bien. Je me permets de vous contacter concernant une offre exceptionnelle Free qui pourrait vous intéresser.

💰 ÉCONOMIES GARANTIES
Jusqu'à {{economie}}€ d'économies par mois sur votre abonnement actuel !

🎯 NOTRE OFFRE {{produit}}
- Internet Très Haut Débit jusqu'à 8 Gb/s
- TV avec +220 chaînes incluses  
- Téléphonie fixe illimitée
- {{forfait_mobile}} inclus

Je reste à votre disposition pour toute question et vous propose un rendez-vous téléphonique à votre convenance.

Cordialement,
{{vendeur_nom}}
Conseiller Free - Synergie Marketing Group
📧 {{vendeur_email}} | 📱 {{vendeur_tel}}

Synergie Marketing Group - Partenaire Officiel Free
    `,
    variables: ['nom', 'economie', 'produit', 'forfait_mobile', 'telephone', 'vendeur_nom', 'vendeur_email', 'vendeur_tel'],
    description: 'Template de prospection initiale pour présenter les offres Free avec calcul d\'économies personnalisé',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  
  {
    id: 'suivi-rdv-commercial',
    name: 'Suivi Rendez-vous Commercial',
    category: 'suivi',
    subject: 'Suivi de notre rendez-vous - Offre Free {{produit}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Suivi de notre échange</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333;">Bonjour {{nom}},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Je vous remercie pour le temps que vous m'avez accordé lors de notre rendez-vous du {{date_rdv}}.
          </p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">📋 Récapitulatif de votre offre</h3>
            <p style="color: #1976d2;"><strong>Produit :</strong> {{produit}}</p>
            <p style="color: #1976d2;"><strong>Économies mensuelles :</strong> {{economie}}€</p>
            <p style="color: #1976d2;"><strong>Date d'installation prévue :</strong> {{date_installation}}</p>
          </div>
          
          <h3 style="color: #333;">📝 Prochaines étapes</h3>
          <ol style="color: #555; line-height: 1.8;">
            <li>Validation de votre dossier par nos services (sous 48h)</li>
            <li>Prise de rendez-vous technique avec Free</li>
            <li>Installation et mise en service</li>
          </ol>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #f57c00; margin: 0;">
              <strong>⚠️ Important :</strong> Si vous avez des questions avant l'installation, 
              n'hésitez pas à me contacter directement.
            </p>
          </div>
          
          <p style="color: #555;">
            Cordialement,<br>
            <strong>{{vendeur_nom}}</strong><br>
            Votre conseiller Free<br>
            📧 {{vendeur_email}} | 📱 {{vendeur_tel}}
          </p>
        </div>
      </div>
    `,
    textContent: `
Bonjour {{nom}},

Je vous remercie pour le temps que vous m'avez accordé lors de notre rendez-vous du {{date_rdv}}.

📋 RÉCAPITULATIF DE VOTRE OFFRE
- Produit : {{produit}}
- Économies mensuelles : {{economie}}€  
- Date d'installation prévue : {{date_installation}}

📝 PROCHAINES ÉTAPES
1. Validation de votre dossier par nos services (sous 48h)
2. Prise de rendez-vous technique avec Free
3. Installation et mise en service

⚠️ Important : Si vous avez des questions avant l'installation, n'hésitez pas à me contacter directement.

Cordialement,
{{vendeur_nom}}
Votre conseiller Free
📧 {{vendeur_email}} | 📱 {{vendeur_tel}}
    `,
    variables: ['nom', 'date_rdv', 'produit', 'economie', 'date_installation', 'vendeur_nom', 'vendeur_email', 'vendeur_tel'],
    description: 'Template de suivi après un rendez-vous commercial avec récapitulatif de l\'offre',
    isActive: true,
    createdAt: new Date().toISOString()
  },

  {
    id: 'relance-prospect-chaud',
    name: 'Relance Prospect Intéressé',
    category: 'commercial',
    subject: 'Dernière chance - Offre Free {{produit}} expire bientôt',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Offre à durée limitée</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333;">Bonjour {{nom}},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Suite à notre dernier échange, je reviens vers vous concernant l'offre Free {{produit}} 
            qui vous permettrait d'économiser {{economie}}€ par mois.
          </p>
          
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3 style="color: #c62828; margin-top: 0;">🚨 Attention : Offre limitée</h3>
            <p style="color: #c62828; margin-bottom: 0;">
              Cette promotion exceptionnelle expire le <strong>{{date_expiration}}</strong>
            </p>
          </div>
          
          <h3 style="color: #333;">💡 Pourquoi choisir Free maintenant ?</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li><strong>Prix bloqué</strong> pendant 12 mois</li>
            <li><strong>Installation gratuite</strong> sous 15 jours</li>
            <li><strong>Résiliation</strong> de votre ancien opérateur prise en charge</li>
            <li><strong>{{economie}}€ d'économies</strong> dès le premier mois</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:{{telephone}}" style="background: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px;">
              📞 Je rappelle maintenant
            </a>
            <br><br>
            <a href="#" style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              ✅ Je valide mon offre
            </a>
          </div>
          
          <p style="color: #555;">
            Cordialement,<br>
            <strong>{{vendeur_nom}}</strong><br>
            📧 {{vendeur_email}} | 📱 {{vendeur_tel}}
          </p>
        </div>
      </div>
    `,
    textContent: `
Bonjour {{nom}},

Suite à notre dernier échange, je reviens vers vous concernant l'offre Free {{produit}} qui vous permettrait d'économiser {{economie}}€ par mois.

🚨 ATTENTION : OFFRE LIMITÉE
Cette promotion exceptionnelle expire le {{date_expiration}}

💡 POURQUOI CHOISIR FREE MAINTENANT ?
- Prix bloqué pendant 12 mois
- Installation gratuite sous 15 jours  
- Résiliation de votre ancien opérateur prise en charge
- {{economie}}€ d'économies dès le premier mois

Cordialement,
{{vendeur_nom}}
📧 {{vendeur_email}} | 📱 {{vendeur_tel}}
    `,
    variables: ['nom', 'produit', 'economie', 'date_expiration', 'telephone', 'vendeur_nom', 'vendeur_email', 'vendeur_tel'],
    description: 'Template de relance pour prospects intéressés avec notion d\'urgence',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Service de gestion des templates
export class EmailTemplateService {
  private templates: EmailTemplate[] = [...defaultEmailTemplates];

  getAllTemplates(category?: string): EmailTemplate[] {
    if (category) {
      return this.templates.filter(t => t.category === category && t.isActive);
    }
    return this.templates.filter(t => t.isActive);
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  processTemplate(templateId: string, variables: Record<string, string>): { subject: string; htmlContent: string; textContent: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // Remplacer toutes les variables {{variable}} par leurs valeurs
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, htmlContent, textContent };
  }

  getTemplateCategories(): string[] {
    return ['prospection', 'suivi', 'commercial', 'support', 'notification'];
  }
}

export const templateService = new EmailTemplateService();