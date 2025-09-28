import { db } from "@db";
import { emailTemplates } from "@shared/schema";

export async function seedEmailTemplates() {
  console.log("🌱 Seeding email templates...");
  
  try {
    const templates = [
      {
        name: "Bienvenue nouveau client",
        subject: "Bienvenue chez Synergie Marketing Group !",
        category: "bienvenue",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue {{prenom}} {{nom}} !</h2>
            <p>Nous sommes ravis de vous accueillir parmi nos clients.</p>
            <p>Votre dossier est actuellement en cours de traitement. Nous vous tiendrons informé de l'avancement.</p>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            <br>
            <p>Cordialement,<br>L'équipe Synergie Marketing Group</p>
          </div>
        `,
        textContent: "Bienvenue {{prenom}} {{nom}} !\n\nNous sommes ravis de vous accueillir parmi nos clients.\n\nVotre dossier est actuellement en cours de traitement. Nous vous tiendrons informé de l'avancement.\n\nPour toute question, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe Synergie Marketing Group",
        userId: 1
      },
      {
        name: "Confirmation rendez-vous",
        subject: "Confirmation de votre rendez-vous - {{date}}",
        category: "rdv",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Confirmation de rendez-vous</h2>
            <p>Bonjour {{prenom}} {{nom}},</p>
            <p>Nous confirmons votre rendez-vous le <strong>{{date}}</strong> à <strong>{{heure}}</strong>.</p>
            <p><strong>Lieu :</strong> {{lieu}}</p>
            <p>En cas d'empêchement, merci de nous prévenir au plus tôt.</p>
            <br>
            <p>À bientôt,<br>L'équipe Synergie Marketing Group</p>
          </div>
        `,
        textContent: "Bonjour {{prenom}} {{nom}},\n\nNous confirmons votre rendez-vous le {{date}} à {{heure}}.\n\nLieu : {{lieu}}\n\nEn cas d'empêchement, merci de nous prévenir au plus tôt.\n\nÀ bientôt,\nL'équipe Synergie Marketing Group",
        userId: 1
      },
      {
        name: "Rappel installation",
        subject: "Rappel installation - {{forfait}}",
        category: "installation",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Rappel d'installation</h2>
            <p>Bonjour {{prenom}} {{nom}},</p>
            <p>Nous souhaitons vous rappeler que votre installation {{forfait}} est prévue le <strong>{{dateInstallation}}</strong>.</p>
            <p>Merci de vous assurer d'être disponible à cette date.</p>
            <p>Pour toute modification, contactez-nous rapidement.</p>
            <br>
            <p>Cordialement,<br>L'équipe Synergie Marketing Group</p>
          </div>
        `,
        textContent: "Bonjour {{prenom}} {{nom}},\n\nNous souhaitons vous rappeler que votre installation {{forfait}} est prévue le {{dateInstallation}}.\n\nMerci de vous assurer d'être disponible à cette date.\n\nPour toute modification, contactez-nous rapidement.\n\nCordialement,\nL'équipe Synergie Marketing Group",
        userId: 1
      },
      {
        name: "Suivi post-installation",
        subject: "Comment s'est passée votre installation ?",
        category: "suivi",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Suivi de votre installation</h2>
            <p>Bonjour {{prenom}} {{nom}},</p>
            <p>Nous espérons que votre installation s'est bien déroulée.</p>
            <p>N'hésitez pas à nous faire part de vos impressions ou de toute question.</p>
            <p>Votre satisfaction est notre priorité.</p>
            <br>
            <p>Merci de votre confiance,<br>L'équipe Synergie Marketing Group</p>
          </div>
        `,
        textContent: "Bonjour {{prenom}} {{nom}},\n\nNous espérons que votre installation s'est bien déroulée.\n\nN'hésitez pas à nous faire part de vos impressions ou de toute question.\n\nVotre satisfaction est notre priorité.\n\nMerci de votre confiance,\nL'équipe Synergie Marketing Group",
        userId: 1
      },
      {
        name: "Relance client inactif",
        subject: "Nous aimerions avoir de vos nouvelles",
        category: "relance",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Prise de nouvelles</h2>
            <p>Bonjour {{prenom}} {{nom}},</p>
            <p>Nous n'avons pas eu de vos nouvelles depuis quelque temps.</p>
            <p>Nous souhaitons nous assurer que tout va bien et que vous êtes satisfait de nos services.</p>
            <p>N'hésitez pas à nous contacter si vous avez des questions ou des besoins.</p>
            <br>
            <p>À bientôt,<br>L'équipe Synergie Marketing Group</p>
          </div>
        `,
        textContent: "Bonjour {{prenom}} {{nom}},\n\nNous n'avons pas eu de vos nouvelles depuis quelque temps.\n\nNous souhaitons nous assurer que tout va bien et que vous êtes satisfait de nos services.\n\nN'hésitez pas à nous contacter si vous avez des questions ou des besoins.\n\nÀ bientôt,\nL'équipe Synergie Marketing Group",
        userId: 1
      }
    ];

    // Vérifier si les templates existent déjà
    const existingTemplates = await db.query.emailTemplates.findMany();
    
    if (existingTemplates.length === 0) {
      console.log("Insertion des templates d'emails...");
      await db.insert(emailTemplates).values(templates);
      console.log(`✅ ${templates.length} templates d'emails créés avec succès !`);
    } else {
      console.log(`ℹ️  ${existingTemplates.length} templates d'emails déjà présents dans la base`);
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du seeding des templates d'emails:", error);
    throw error;
  }
}