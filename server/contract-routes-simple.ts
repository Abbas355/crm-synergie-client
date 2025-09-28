/**
 * ROUTES API POUR LA GESTION DES CONTRATS - VERSION SIMPLIFIÉE
 * Gestion basique des contrats sans complications
 */

import { Request, Response } from "express";
import { db } from "../db";
import { contracts, contractTemplates, contractTerms, contractTags, users } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { 
  contractInsertSchema, 
  contractTermsInsertSchema, 
  contractTagsInsertSchema,
  contractTermsSelectSchema,
  contractTagsSelectSchema
} from "../shared/schema";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import multer from 'multer';

export function setupContractRoutes(app: any) {
  
  // GET /api/contracts - Récupérer tous les contrats
  app.get('/api/contracts', async (req: Request, res: Response) => {
    try {
      console.log("📋 RÉCUPÉRATION CONTRATS - API appelée");
      
      const allContracts = await db.query.contracts.findMany({
        orderBy: desc(contracts.createdAt)
      });

      console.log(`📋 ${allContracts.length} contrats récupérés`);
      res.json(allContracts);

    } catch (error) {
      console.error("❌ Erreur récupération contrats:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des contrats",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // GET /api/contract-templates - Récupérer tous les templates
  app.get('/api/contract-templates', async (req: Request, res: Response) => {
    try {
      console.log("📋 RÉCUPÉRATION TEMPLATES - API appelée");
      
      const allTemplates = await db.query.contractTemplates.findMany({
        where: eq(contractTemplates.isActive, true),
        orderBy: desc(contractTemplates.createdAt)
      });

      console.log(`📋 ${allTemplates.length} templates récupérés`);
      res.json(allTemplates);

    } catch (error) {
      console.error("❌ Erreur récupération templates:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des templates",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // POST /api/contracts - Créer un nouveau contrat
  app.post('/api/contracts', async (req: Request, res: Response) => {
    try {
      console.log("📋 CRÉATION CONTRAT - Données reçues:", req.body);
      
      // Validation des données
      const validatedData = contractInsertSchema.parse({
        ...req.body,
        commissionRate: req.body.commissionRate.toString(),
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        contractData: {
          legalCompliance: {
            isCompliant: false,
            lastReview: new Date().toISOString(),
            issues: ['Contrat en attente de validation initiale']
          }
        }
      });

      const [newContract] = await db.insert(contracts)
        .values(validatedData)
        .returning();

      console.log("✅ Contrat créé avec succès:", newContract.id);
      res.status(201).json(newContract);

    } catch (error) {
      console.error("❌ Erreur création contrat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Données invalides", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Erreur lors de la création du contrat"
      });
    }
  });

  // DELETE /api/contracts/:id - Supprimer un contrat
  app.delete('/api/contracts/:id', async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      console.log("🗑️ SUPPRESSION CONTRAT - ID:", contractId);

      await db.delete(contracts).where(eq(contracts.id, contractId));

      console.log("✅ Contrat supprimé avec succès:", contractId);
      res.status(200).json({ message: "Contrat supprimé avec succès" });

    } catch (error) {
      console.error("❌ Erreur suppression contrat:", error);
      res.status(500).json({ 
        error: "Erreur lors de la suppression du contrat"
      });
    }
  });

  // GET /api/contract-template-content - Récupérer le contenu du template avec balises
  app.get('/api/contract-template-content', async (req: Request, res: Response) => {
    try {
      console.log("📄 RÉCUPÉRATION CONTENU TEMPLATE - Demandé");
      
      const { templateId } = req.query;
      let content = '';

      // Si un templateId est fourni, essayer de récupérer le contenu modifié depuis la DB
      if (templateId) {
        const template = await db.query.contractTemplates.findFirst({
          where: eq(contractTemplates.id, parseInt(templateId as string))
        });
        
        if (template?.fields && typeof template.fields === 'object' && 'content' in template.fields) {
          content = (template.fields as any).content;
          console.log("📄 Contenu récupéré depuis la base de données");
        }
      }
      
      // Si pas de contenu en DB, utiliser le template principal (ID 1) avec balises françaises
      if (!content) {
        console.log("📄 Tentative de récupération du template principal (ID 1)");
        const mainTemplate = await db.query.contractTemplates.findFirst({
          where: eq(contractTemplates.id, 1)
        });
        
        if (mainTemplate?.fields && typeof mainTemplate.fields === 'object' && 'content' in mainTemplate.fields) {
          content = (mainTemplate.fields as any).content;
          console.log("📄 Contenu récupéré depuis le template principal en DB");
        } else {
          // Fallback sur le fichier Word original seulement si aucun template en DB
          const templatePath = path.join(process.cwd(), 'attached_assets', 'Contrat de Distribution Indépendant_1755251305252.docx');
          
          if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ 
              error: "Template de contrat non trouvé",
              path: templatePath
            });
          }

          const result = await mammoth.extractRawText({ path: templatePath });
          content = result.value;
          console.log("📄 Contenu récupéré depuis le fichier Word original (fallback)");
        }
      }

      console.log("📄 Contenu template récupéré, taille:", content.length, "caractères");
      
      // Identifier les balises présentes dans le document
      const tags: string[] = [];
      const tagRegex = /\{\{([^}]+)\}\}|##([^#]+)##/g;
      let match;
      
      while ((match = tagRegex.exec(content)) !== null) {
        const tagName = match[1] || match[2];
        if (tagName && !tags.includes(tagName)) {
          tags.push(tagName);
        }
      }

      console.log("🏷️ Balises trouvées:", tags.length);

      res.json({
        content,
        tags,
        totalCharacters: content.length
      });

    } catch (error) {
      console.error("❌ Erreur récupération contenu template:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération du contenu du template",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // PUT /api/contract-template-content - Sauvegarder le contenu modifié
  app.put('/api/contract-template-content', async (req: Request, res: Response) => {
    console.log('💾 SAUVEGARDE CONTENU TEMPLATE - Demandé');
    
    try {
      const { content, templateId } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Contenu requis' });
      }
      
      // Validation du contenu
      const tagMatches = content.match(/{{[^}]+}}/g) || [];
      const tags = Array.from(new Set(tagMatches));
      
      console.log(`💾 Template ${templateId} - Contenu: ${content.length} caractères`);
      console.log(`🏷️ Balises détectées: ${tags.length}`);
      
      // Sauvegarder dans la base de données
      if (templateId) {
        // Vérifier si le template existe
        const existingTemplate = await db.query.contractTemplates.findFirst({
          where: eq(contractTemplates.id, templateId)
        });
        
        if (existingTemplate) {
          // Mettre à jour le template existant
          const [updatedTemplate] = await db.update(contractTemplates)
            .set({ 
              fields: { 
                content: content,
                lastModified: new Date().toISOString(),
                tagsCount: tags.length
              },
              updatedAt: new Date()
            })
            .where(eq(contractTemplates.id, templateId))
            .returning();
            
          console.log(`✅ Template ${templateId} mis à jour en base de données`);
        } else {
          // Créer un nouveau template si n'existe pas
          const [newTemplate] = await db.insert(contractTemplates).values({
            id: templateId,
            name: "Contrat de Distribution Indépendant",
            type: "Distribution",
            version: "2.0",
            description: "Template avec balises françaises modifiables",
            fields: { 
              content: content,
              lastModified: new Date().toISOString(),
              tagsCount: tags.length
            },
            legalRequirements: [
              "Conformité au Code de commerce français",
              "Respect des dispositions sur la distribution indépendante", 
              "Clauses de rémunération conformes au droit du travail",
              "Respect du RGPD pour les données personnelles"
            ],
            templatePath: "",
            isActive: true
          }).returning();
          
          console.log(`✅ Nouveau template ${templateId} créé en base de données`);
        }
      } else {
        console.warn("⚠️ Aucun templateId fourni pour la sauvegarde");
      }
      
      res.json({
        success: true,
        message: 'Template sauvegardé avec succès',
        stats: {
          characters: content.length,
          tags: tags.length,
          tagsFound: tags
        }
      });
    } catch (error) {
      console.error('❌ Erreur sauvegarde template:', error);
      res.status(500).json({ 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // POST /api/contract-preview - Générer une prévisualisation du contrat
  app.post('/api/contract-preview', async (req: Request, res: Response) => {
    console.log('👁️ GÉNÉRATION PRÉVISUALISATION CONTRAT - Demandé');
    
    try {
      const { templateId, sampleData } = req.body;
      
      if (!templateId || !sampleData) {
        return res.status(400).json({ 
          error: 'TemplateId et sampleData requis' 
        });
      }
      
      // Récupérer le template
      const template = await db.query.contractTemplates.findFirst({
        where: eq(contractTemplates.id, templateId)
      });
      
      if (!template?.fields || !('content' in template.fields)) {
        return res.status(404).json({ 
          error: 'Template non trouvé ou contenu manquant' 
        });
      }
      
      let content = (template.fields as any).content;
      console.log('📄 Template récupéré, taille:', content.length, 'caractères');
      
      // Remplacer les balises par les données d'exemple
      let replacementCount = 0;
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const matches = content.match(regex);
        if (matches) {
          replacementCount += matches.length;
          content = content.replace(regex, value as string);
          console.log(`  ✅ ${key} → ${value} (${matches.length} occurrences)`);
        }
      });

      // Traitement spécial du logo SMG dans les signatures
      console.log('🔍 Recherche de {{LOGO_SMG}} dans le contenu...');
      const logoSMGRegex = /{{LOGO_SMG}}/g;
      const logoMatches = content.match(logoSMGRegex);
      console.log('🏷️ Balises {{LOGO_SMG}} trouvées:', logoMatches ? logoMatches.length : 0);
      
      content = content.replace(logoSMGRegex, () => {
        const logoPath = './uploads/contract-image-1755275017802-793202.png';
        
        try {
          if (fs.existsSync(logoPath)) {
            const imageBuffer = fs.readFileSync(logoPath);
            const base64Image = imageBuffer.toString('base64');
            console.log(`🏢 Logo SMG intégré dans signature (${imageBuffer.length} bytes)`);
            
            // Affichage spécial pour l'espace signature (entre "Le Président" et "Signature et cachet")
            return `<div style="text-align: center; margin: 10px 0; padding: 15px; min-height: 60px; display: flex; align-items: center; justify-content: center;">
              <img src="data:image/png;base64,${base64Image}" 
                   alt="Logo et cachet Synergie Marketing Group" 
                   style="max-width: 180px; max-height: 80px; width: auto; height: auto; display: block;" />
            </div>`;
          }
        } catch (error) {
          console.error('❌ Erreur chargement logo SMG:', error);
        }
        
        // Zone cliquable pour l'espace signature spécifique
        return `<div onclick="window.parent.postMessage({type: 'ADD_LOGO_SMG', position: 'signature'}, '*')" style="margin: 10px 0; padding: 15px; text-align: center; color: #666; font-size: 11px; border: 1px dashed #007bff; border-radius: 4px; background-color: #f8f9fa; cursor: pointer; min-height: 60px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
          <div>
            <div style="font-weight: bold; color: #007bff; font-size: 12px;">📝 Espace pour logo et cachet</div>
            <div style="font-size: 9px; margin-top: 3px; opacity: 0.7;">Cliquez pour ajouter</div>
          </div>
        </div>`;
      });
      
      // Traitement spécial des balises d'images
      const imageRegex = /{{IMAGE:([^}]+)}}/g;
      content = content.replace(imageRegex, (match, imageId) => {
        console.log(`🖼️ Traitement balise image: ${imageId}`);
        
        // Construire le chemin complet avec le préfixe
        const imagePath = `/uploads/contract-image-${imageId}.png`;
        
        // Vérifier si le fichier existe (avec différentes extensions possibles)
        const possibleExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        let finalImagePath = imagePath;
        let foundFilePath = null;
        
        for (const ext of possibleExtensions) {
          const testPath = `./uploads/contract-image-${imageId}${ext}`;
          if (fs.existsSync(testPath)) {
            finalImagePath = `/uploads/contract-image-${imageId}${ext}`;
            foundFilePath = testPath;
            console.log(`✅ Image trouvée: ${finalImagePath}`);
            break;
          }
        }
        
        // Convertir l'image en base64 pour l'intégration dans le PDF
        if (!foundFilePath) {
          console.error(`❌ Image non trouvée: ${imageId}`);
          return `<div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #ef4444; border-radius: 8px; background-color: #fef2f2;">
            <p style="color: #dc2626; font-weight: bold;">❌ Image non trouvée</p>
            <p style="color: #7f1d1d; font-size: 12px;">Image ${imageId} introuvable</p>
          </div>`;
        }
        
        try {
          const imageBuffer = fs.readFileSync(foundFilePath);
          const base64Image = imageBuffer.toString('base64');
          const imageExtension = path.extname(finalImagePath).toLowerCase().replace('.', '');
          const mimeType = imageExtension === 'jpg' ? 'jpeg' : imageExtension;
          
          console.log(`📷 Image convertie en base64: ${finalImagePath} (${imageBuffer.length} bytes)`);
          
          return `<div style="text-align: center; margin: 20px 0; page-break-inside: avoid;">
            <img src="data:image/${mimeType};base64,${base64Image}" 
                 alt="Image contractuelle" 
                 style="max-width: 100%; max-height: 400px; width: auto; height: auto; border: 2px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); display: block; margin: 0 auto;" />
          </div>`;
        } catch (error) {
          console.error(`❌ Erreur lecture image ${finalImagePath}:`, error);
          return `<div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #ef4444; border-radius: 8px; background-color: #fef2f2;">
            <p style="color: #dc2626; font-weight: bold;">❌ Erreur chargement image</p>
            <p style="color: #7f1d1d; font-size: 12px;">Image ${imageId} introuvable</p>
          </div>`;
        }
      });

      // Traitement des balises génériques d'images
      const genericImageRegex = /{{IMAGE_(\d+)}}/g;
      content = content.replace(genericImageRegex, (match, imageNumber) => {
        return `<div style="margin: 20px 0; text-align: center; padding: 20px; border: 2px dashed #ccc; border-radius: 8px;">
          <p style="color: #666; font-style: italic;">Image ${imageNumber} sera affichée ici</p>
          <p style="font-size: 12px; color: #999;">Utilisez l'outil d'upload pour ajouter une image</p>
        </div>`;
      });
      
      // Formatage HTML professionnel inspiré du contrat original
      let formattedContent = content;
      
      // Logo de l'entreprise réel depuis les fichiers uploadés
      const logoHtml = `<img src="/uploads/logo-1749818858583-382607920.jpg" alt="Logo Entreprise" style="max-width: 150px; max-height: 80px; margin: 0 auto; display: block;" />`;

      // Tableau CVD complet au début du contrat
      const cvdTableHtml = `
        <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; border: 2px solid #3b82f6; border-radius: 8px;">
          <h4 style="text-align: center; font-weight: bold; margin-bottom: 15px; font-size: 18px; color: #1e40af;">COMMISSIONS SUR VENTES DIRECTES (CVD)</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px;">
            <thead>
              <tr style="background-color: #dbeafe;">
                <th style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; text-align: left;">Produit</th>
                <th style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; text-align: center;">0 à 5 ventes/mois</th>
                <th style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; text-align: center;">6 à 10 ventes/mois</th>
                <th style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; text-align: center;">11 à 30 ventes/mois</th>
                <th style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; text-align: center;">31+ ventes/mois</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; background-color: #f9fafb;">Freebox Pop</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">50€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">60€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">70€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">80€</td>
              </tr>
              <tr>
                <td style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; background-color: #f9fafb;">Freebox Essentiel</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">50€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">70€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">80€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">100€</td>
              </tr>
              <tr>
                <td style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; background-color: #f9fafb;">Freebox Ultra</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">50€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">80€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">90€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">120€</td>
              </tr>
              <tr>
                <td style="border: 1px solid #9ca3af; padding: 10px; font-weight: bold; background-color: #f9fafb;">Forfait 5G</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">10€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">10€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">10€</td>
                <td style="border: 1px solid #9ca3af; padding: 10px; text-align: center; font-weight: bold;">10€</td>
              </tr>
            </tbody>
          </table>
          <div style="text-align: center; font-size: 11px; color: #6b7280; margin-top: 10px;">
            <p><strong>Cette grille de rémunération dépend des conditions de paiement de nos partenaires et peut évoluer dans le temps.</strong></p>
            <p><strong>Entre le 10 et le 15 du mois N+1, un virement sera émis après réception de votre facture.</strong></p>
          </div>
        </div>
      `;

      // Header professionnel avec logo d'entreprise
      const contractHeader = `
        <div style="margin-bottom: 30px; text-align: center; border-bottom: 2px solid #d1d5db; padding-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            ${logoHtml}
            <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">S.A.S au capital de 3.000 €</div>
            <div style="font-size: 12px; color: #6b7280;">R.C.S. AVIGNON SIREN 824 562 136</div>
            <div style="font-size: 12px; color: #6b7280;">2, Place Alexandre Farnese - 84000 AVIGNON</div>
          </div>
          <h1 style="font-size: 18px; font-weight: bold; color: #374151; margin-top: 15px;">CONTRAT DE DISTRIBUTION INDÉPENDANT</h1>
        </div>
        ${cvdTableHtml}
      `;
      
      // Footer professionnel
      const contractFooter = `
        <div class="contract-footer mt-8 pt-6 border-t-2 border-gray-300 text-center">
          <div class="signature-section grid grid-cols-2 gap-8 mt-6">
            <div class="signature-box">
              <div class="text-sm font-semibold mb-2">SYNERGIE MARKETING GROUP</div>
              <div class="text-xs text-gray-600 mb-4">Le Président</div>
              <div class="border-b border-gray-400 mb-2" style="height: 50px;"></div>
              <div class="text-xs">Signature et cachet</div>
            </div>
            <div class="signature-box">
              <div class="text-sm font-semibold mb-2">LE DISTRIBUTEUR</div>
              ${sampleData.NOM_ENTREPRISE_VENDEUR ? `<div class="text-xs text-gray-600 mb-1">${sampleData.NOM_ENTREPRISE_VENDEUR}</div>` : ''}
              <div class="text-xs text-gray-600 mb-4">${sampleData.PRENOM_VENDEUR || '[PRÉNOM]'} ${sampleData.NOM_VENDEUR || '[NOM]'}</div>
              <div class="border-b border-gray-400 mb-2" style="height: 50px;"></div>
              <div class="text-xs">Lu et approuvé</div>
            </div>
          </div>
          <div class="legal-notice mt-6 text-xs text-gray-500">
            <div>Document généré automatiquement - ${new Date().toLocaleDateString('fr-FR')}</div>
            <div>Confidentiel - Usage strictement professionnel</div>
          </div>
        </div>
      `;
      
      // Formatage du contenu principal
      formattedContent = formattedContent
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(p => p.length > 0)
        .map(paragraph => {
          // Parties contractantes
          if (paragraph.includes('ENTRE-LES SOUSSIGNES') || paragraph.includes('ENTRE LES SOUSSIGNÉS')) {
            return `<div class="parties-section bg-blue-50 p-4 rounded-lg mb-6">
              <h2 class="text-lg font-bold text-blue-900 mb-4 text-center">ENTRE LES SOUSSIGNÉS :</h2>
            </div>`;
          }
          
          // Sections "D'une part" et "D'autre part"
          if (paragraph.trim() === "D'une part," || paragraph.trim() === "D'autre part,") {
            return `<div class="text-center font-bold text-blue-800 my-4 text-base">${paragraph}</div>`;
          }
          
          // Articles
          if (paragraph.match(/^ARTICLE\s+\d+/i) || paragraph.startsWith('Article')) {
            return `<div class="article-header bg-gray-100 p-3 rounded-lg mt-6 mb-4">
              <h3 class="text-base font-bold text-gray-800">${paragraph}</h3>
            </div>`;
          }
          
          // Titres en majuscules
          if (paragraph.length < 150 && paragraph === paragraph.toUpperCase() && paragraph.length > 10) {
            return `<h4 class="font-bold text-gray-700 mt-4 mb-2 text-sm">${paragraph}</h4>`;
          }
          
          // Préambule
          if (paragraph.startsWith('Préambule') || paragraph.toLowerCase().includes('préambule')) {
            return `<div class="preambule bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="text-base font-bold text-gray-800 mb-3">Préambule</h3>
              <p class="text-sm text-gray-700 leading-relaxed">${paragraph.replace(/^Préambule\s*/i, '')}</p>
            </div>`;
          }
          
          // Section RÉMUNÉRATION - Insérer le tableau des commissions ici
          if (paragraph.includes('REMUNERATION') || paragraph.includes('RÉMUNÉRATION')) {
            return `<div class="remuneration-section">
              <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">RÉMUNÉRATION</h3>
              
              <!-- Tableau des commissions simple et fonctionnel -->
              <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h4 style="text-align: center; font-weight: bold; margin-bottom: 15px; font-size: 16px;">COMMISSIONS SUR VENTES DIRECTES (CVD)</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #dbeafe;">
                      <th style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold;">Produit</th>
                      <th style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold;">0 à 5 ventes/mois</th>
                      <th style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold;">6 à 10 ventes/mois</th>
                      <th style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold;">11 à 30 ventes/mois</th>
                      <th style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold;">31+ ventes/mois</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; background-color: #f9fafb;">Freebox Pop</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">50€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">60€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">70€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">80€</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; background-color: #f9fafb;">Freebox Essentiel</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">50€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">70€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">80€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">100€</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; background-color: #f9fafb;">Freebox Ultra</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">50€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">80€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">90€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">120€</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #9ca3af; padding: 8px; font-weight: bold; background-color: #f9fafb;">Forfait 5G</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">10€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">10€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">10€</td>
                      <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">10€</td>
                    </tr>
                  </tbody>
                </table>
                <div style="text-align: center; font-size: 10px; color: #6b7280;">
                  <p>Cette grille de rémunération dépend des conditions de paiement de nos partenaires et peut évoluer dans le temps.</p>
                  <p>Entre le 10 et le 15 du mois N+1, un virement sera émis après réception de votre facture.</p>
                </div>
              </div>
            </div>`;
          }
          
          // Listes à puces
          if (paragraph.includes('•') || paragraph.includes('-') || paragraph.match(/^\d+\./)) {
            return `<ul class="list-disc ml-6 mb-3">
              <li class="text-sm text-gray-700 leading-relaxed">${paragraph.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}</li>
            </ul>`;
          }
          
          // Paragraphes normaux
          return `<p class="mb-3 text-sm text-gray-700 leading-relaxed text-justify">${paragraph}</p>`;
        })
        .join('\n');
      
      // Assemblage final avec header et footer
      formattedContent = contractHeader + formattedContent + contractFooter;
      
      // Calculer les statistiques
      const stats = {
        pages: Math.ceil(content.length / 2000), // Estimation basée sur la longueur
        characters: content.length,
        replacements: replacementCount,
        sections: (formattedContent.match(/<h[3-4]/g) || []).length,
        articles: (formattedContent.match(/ARTICLE\s+\d+/gi) || []).length,
        wordsCount: content.split(/\s+/).length,
        estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200) + " min"
      };
      
      console.log(`🎯 Prévisualisation générée: ${stats.pages} pages, ${stats.replacements} remplacements`);
      
      res.json({
        success: true,
        formattedContent,
        originalContent: content,
        stats,
        templateInfo: {
          id: template.id,
          name: template.name,
          version: template.version
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur génération prévisualisation:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération de la prévisualisation',
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // ==========================================
  // ROUTES POUR LA GESTION DES TERMES CONTRACTUELS
  // ==========================================

  // GET /api/contract-terms/:templateId - Récupérer tous les termes d'un template
  app.get('/api/contract-terms/:templateId', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.templateId);
      console.log(`📋 RÉCUPÉRATION TERMES - Template ID: ${templateId}`);
      
      const terms = await db.query.contractTerms.findMany({
        where: eq(contractTerms.templateId, templateId),
        orderBy: [contractTerms.position]
      });

      console.log(`📋 ${terms.length} termes récupérés`);
      res.json(terms);

    } catch (error) {
      console.error("❌ Erreur récupération termes:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des termes",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // POST /api/contract-terms - Créer un nouveau terme contractuel
  app.post('/api/contract-terms', async (req: Request, res: Response) => {
    try {
      console.log("📋 CRÉATION TERME - Données reçues:", req.body);
      
      const validatedData = contractTermsInsertSchema.parse(req.body);
      
      const [newTerm] = await db.insert(contractTerms).values(validatedData).returning();
      
      console.log("✅ TERME CRÉÉ:", newTerm.id);
      res.status(201).json(newTerm);

    } catch (error) {
      console.error("❌ Erreur création terme:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Données invalides", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Erreur lors de la création du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // PUT /api/contract-terms/:id - Modifier un terme contractuel
  app.put('/api/contract-terms/:id', async (req: Request, res: Response) => {
    try {
      const termId = parseInt(req.params.id);
      console.log(`📋 MODIFICATION TERME - ID: ${termId}`);
      
      const validatedData = contractTermsInsertSchema.partial().parse(req.body);
      
      const [updatedTerm] = await db.update(contractTerms)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(contractTerms.id, termId))
        .returning();
      
      if (!updatedTerm) {
        return res.status(404).json({ error: "Terme non trouvé" });
      }
      
      console.log("✅ TERME MODIFIÉ:", updatedTerm.id);
      res.json(updatedTerm);

    } catch (error) {
      console.error("❌ Erreur modification terme:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Données invalides", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Erreur lors de la modification du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // GET /api/contract-tags - Récupérer toutes les balises françaises
  app.get('/api/contract-tags', async (req: Request, res: Response) => {
    try {
      console.log("🏷️ RÉCUPÉRATION BALISES FRANÇAISES - API appelée");
      
      // Balises françaises par défaut avec les nouvelles balises
      const frenchTags = [
        { name: "PRENOM_VENDEUR", description: "Prénom du vendeur", category: "identite" },
        { name: "NOM_VENDEUR", description: "Nom de famille du vendeur", category: "identite" },
        { name: "EMAIL_VENDEUR", description: "Adresse email du vendeur", category: "contact" },
        { name: "CODE_POSTAL", description: "Code postal du vendeur", category: "vendeur" },
        { name: "VILLE", description: "Ville de résidence du vendeur", category: "vendeur" },
        { name: "PRENOM_DISTRIBUTEUR", description: "Prénom du distributeur", category: "distributeur" },
        { name: "NOM_DISTRIBUTEUR", description: "Nom du distributeur", category: "distributeur" },
        { name: "SIRET_DISTRIBUTEUR", description: "Numéro SIRET du distributeur", category: "legal" },
        { name: "ADRESSE_DISTRIBUTEUR", description: "Adresse complète du distributeur", category: "contact" },
        { name: "TAUX_COMMISSION", description: "Taux de commission en pourcentage", category: "financier" },
        { name: "SALAIRE_BASE", description: "Salaire de base ou type de rémunération", category: "financier" },
        { name: "TERRITOIRE", description: "Territoire d'activité assigné", category: "commercial" },
        { name: "DATE_DEBUT", description: "Date de début du contrat", category: "temporel" },
        { name: "DATE_FIN", description: "Date de fin du contrat", category: "temporel" },
        { name: "DATE_SIGNATURE", description: "Date de signature du contrat", category: "temporel" },
        { name: "ID_CONTRAT", description: "Identifiant unique du contrat", category: "systeme" },
        { name: "TYPE_CONTRAT", description: "Type de contrat", category: "systeme" }
      ];
      
      console.log(`🏷️ ${frenchTags.length} balises françaises renvoyées`);
      res.json(frenchTags);

    } catch (error) {
      console.error("❌ Erreur récupération balises:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des balises",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // POST /api/generate-contract/:vendorId - Générer un contrat pour un vendeur
  app.post('/api/generate-contract/:vendorId', async (req: Request, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      console.log(`📄 GÉNÉRATION CONTRAT - Vendeur ID: ${vendorId}`);
      
      // Récupérer les données du vendeur
      const vendor = await db.query.users.findFirst({
        where: eq(users.id, vendorId)
      });
      
      if (!vendor) {
        return res.status(404).json({ error: "Vendeur non trouvé" });
      }
      
      console.log(`👤 Vendeur trouvé: ${vendor.prenom} ${vendor.nom}`);
      
      // Préparer les données pour la génération
      const contractData = {
        // Informations vendeur
        PRENOM_VENDEUR: vendor.prenom || '',
        NOM_VENDEUR: vendor.nom || '',
        EMAIL_VENDEUR: vendor.email || '',
        
        // NOUVELLES BALISES FRANÇAISES
        CODE_POSTAL: vendor.codePostal || '',
        VILLE: vendor.ville || '',
        
        // Rétrocompatibilité anciennes balises
        DISTRI_NEW_ZIP: vendor.codePostal || '',
        DISTRI_NEW_CITY: vendor.ville || '',
        DISTRI_NEW_FIRST_NAME: vendor.prenom || '',
        DISTRI_NEW_LAST_NAME: vendor.nom || '',
        
        // Données contractuelles par défaut
        TAUX_COMMISSION: '8.5',
        SALAIRE_BASE: 'Commission uniquement',
        TERRITOIRE: 'France entière',
        
        // Autres données
        ...req.body
      };
      
      console.log(`📊 Données contractuelles préparées - Balises: ${Object.keys(contractData).length}`);
      console.log(`🏷️ CODE_POSTAL: "${contractData.CODE_POSTAL}", VILLE: "${contractData.VILLE}"`);
      
      // Retourner les données pour validation
      res.json({
        success: true,
        message: "Données de contrat préparées",
        vendorInfo: {
          id: vendor.id,
          prenom: vendor.prenom,
          nom: vendor.nom,
          email: vendor.email,
          codePostal: vendor.codePostal,
          ville: vendor.ville
        },
        contractData,
        tagsCount: Object.keys(contractData).length
      });
      
    } catch (error) {
      console.error("❌ Erreur génération contrat:", error);
      res.status(500).json({ 
        error: "Erreur lors de la génération du contrat",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // ==========================================
  // ENDPOINT POUR RÉCUPÉRER LE LOGO DE L'ENTREPRISE
  // ==========================================
  app.get('/api/settings/logo', async (req: Request, res: Response) => {
    try {
      // fs est déjà importé en haut du fichier
      const logoPath = './uploads/logo_entreprise.png';
      
      if (fs.existsSync(logoPath)) {
        res.json({ 
          logoUrl: '/uploads/logo_entreprise.png',
          exists: true 
        });
      } else {
        res.json({ 
          logoUrl: '',
          exists: false 
        });
      }
    } catch (error) {
      console.error('❌ Erreur récupération logo:', error);
      res.status(500).json({ error: 'Erreur récupération logo' });
    }
  });

  // ==========================================
  // ENDPOINT POUR UPLOAD D'IMAGES DE CONTRAT
  // ==========================================
  
  const imageStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, 'uploads/');
    },
    filename: (req: any, file: any, cb: any) => {
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const extension = path.extname(file.originalname);
      cb(null, `contract-image-${timestamp}-${randomId}${extension}`);
    }
  });

  const imageUpload = multer({ 
    storage: imageStorage,
    fileFilter: (req: any, file: any, cb: any) => {
      // Accepter seulement les images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les images sont autorisées'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max
    }
  });

  app.post('/api/contract-images/upload', imageUpload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier image fourni' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      console.log('📷 IMAGE CONTRAT UPLOADÉE:', imageUrl);

      res.json({
        success: true,
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });

    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'upload de l\'image',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  // ==========================================
  // ENDPOINT POUR RÉCUPÉRER LES IMAGES DE CONTRAT
  // ==========================================
  app.get('/api/contract-images', (req: Request, res: Response) => {
    try {
      const uploadsDir = './uploads/';
      const imageFiles = fs.readdirSync(uploadsDir)
        .filter(file => file.startsWith('contract-image-') && /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(filename => ({
          filename,
          url: `/uploads/${filename}`,
          uploadedAt: fs.statSync(path.join(uploadsDir, filename)).mtime
        }))
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // Plus récent en premier

      console.log(`📷 ${imageFiles.length} images de contrat trouvées`);
      res.json(imageFiles);

    } catch (error) {
      console.error('❌ Erreur récupération images:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des images',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  console.log("🎯 ROUTES CONTRATS ET TERMES CONFIGURÉES");
}