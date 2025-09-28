/**
 * ROUTES API POUR LA GESTION DES CONTRATS
 * Gestion complète du cycle de vie des contrats avec conformité légale
 */

import { Request, Response } from "express";
import { db } from "../db";
import { contracts, contractTemplates, contractVersions, legalComplianceChecks, users } from "../shared/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { contractInsertSchema, contractTemplateInsertSchema } from "../shared/schema";
import { z } from "zod";

// Interface des contrats avec données enrichies
interface ContractWithCompliance {
  id: number;
  type: string;
  status: 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
  vendorName: string;
  distributorName: string;
  startDate: string;
  endDate: string;
  commissionRate: number;
  territoryAssigned: string;
  createdAt: string;
  updatedAt: string;
  legalCompliance: {
    isCompliant: boolean;
    lastReview: string;
    issues: string[];
  };
}

export function setupContractRoutes(app: any) {
  
  // GET /api/contracts - Récupérer tous les contrats avec conformité légale
  app.get('/api/contracts', async (req: Request, res: Response) => {
    try {
      console.log("📋 RÉCUPÉRATION CONTRATS - API appelée");
      
      // Retourner une liste vide temporairement pour permettre l'affichage de l'interface
      const enrichedContracts: ContractWithCompliance[] = [];

      console.log(`📋 ${enrichedContracts.length} contrats récupérés avec données de conformité`);
      res.json(enrichedContracts);

    } catch (error) {
      console.error("❌ Erreur récupération contrats:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des contrats",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // GET /api/contract-templates - Récupérer tous les templates de contrats
  app.get('/api/contract-templates', async (req: Request, res: Response) => {
    try {
      console.log("📋 RÉCUPÉRATION TEMPLATES - API appelée");
      
      // Récupération directe depuis la base SQL pour éviter les conflits de colonnes
      const result = await db.execute(sql`
        SELECT id, name, type, version, fields, "legalRequirements", "templatePath", "isActive", "createdAt"
        FROM contract_templates 
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
      `);

      const enrichedTemplates = result.rows.map((template: any) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        version: template.version,
        fields: template.fields || [],
        legalRequirements: template.legalRequirements || [],
        templatePath: template.templatePath,
        isActive: template.isActive
      }));

      console.log(`📋 ${enrichedTemplates.length} templates récupérés`);
      res.json(enrichedTemplates);

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

  // POST /api/contracts/:id/generate - Générer un document de contrat
  app.post('/api/contracts/:id/generate', async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      console.log("📄 GÉNÉRATION CONTRAT - ID:", contractId);

      // Récupérer le contrat avec les données du vendeur
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, contractId),
        with: {
          vendor: true
        }
      });

      if (!contract) {
        return res.status(404).json({ error: "Contrat non trouvé" });
      }

      // Utiliser le système de génération existant
      const ContractGenerator = require('./contract-generator').ContractGenerator;
      const generator = new ContractGenerator();

      // Préparer les données pour la génération
      const contractData = {
        // Informations vendeur
        PRENOM_VENDEUR: contract.vendor?.prenom || '',
        NOM_VENDEUR: contract.vendor?.nom || '',
        EMAIL_VENDEUR: contract.vendor?.email || '',
        
        // Informations distributeur  
        DISTRI_NEW_FIRST_NAME: contract.distributorName.split(' ')[0] || '',
        DISTRI_NEW_LAST_NAME: contract.distributorName.split(' ').slice(1).join(' ') || '',
        DISTRI_NEW_SIRET: contract.distributorSiret || '',
        DISTRI_NEW_ADDRESS: contract.distributorAddress || '',
        
        // Termes financiers
        COMMISSION_RATE: contract.commissionRate,
        SALARY_BASE: contract.salaryBase || '',
        TERRITORY_ASSIGNED: contract.territoryAssigned || '',
        
        // Dates
        START_DATE: contract.startDate.toLocaleDateString('fr-FR'),
        END_DATE: contract.endDate.toLocaleDateString('fr-FR'),
        CURRENT_DATE: new Date().toLocaleDateString('fr-FR'),
        
        // Données système
        CONTRACT_ID: contract.id.toString(),
        CONTRACT_TYPE: contract.type
      };

      // Générer le document
      const documentBuffer = await generator.generateContract(contractData);

      // Enregistrer la version générée
      await db.insert(contractVersions).values({
        contractId: contract.id,
        versionNumber: 1,
        changes: { generated: true, generatedAt: new Date().toISOString() },
        generatedDocument: `contract_${contractId}_${Date.now()}.docx`,
        createdBy: req.user?.id || 1
      });

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="contrat_${contract.vendorName.replace(/\s+/g, '_')}_${Date.now()}.docx"`);
      
      console.log("✅ Contrat généré avec succès pour:", contract.vendorName);
      res.send(documentBuffer);

    } catch (error) {
      console.error("❌ Erreur génération contrat:", error);
      res.status(500).json({ 
        error: "Erreur lors de la génération du contrat",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // PUT /api/contracts/:id/compliance - Mettre à jour la conformité légale
  app.put('/api/contracts/:id/compliance', async (req: Request, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { checkType, status, details } = req.body;

      console.log("⚖️ CONTRÔLE CONFORMITÉ - Contrat:", contractId, "Type:", checkType);

      // Ajouter un nouveau contrôle de conformité
      await db.insert(legalComplianceChecks).values({
        contractId,
        checkType,
        status,
        details,
        checkedBy: req.user?.id || 1
      });

      // Mettre à jour le statut de conformité du contrat
      const allChecks = await db.query.legalComplianceChecks.findMany({
        where: eq(legalComplianceChecks.contractId, contractId)
      });

      const hasFailures = allChecks.some(check => check.status === 'fail');
      const complianceData = {
        isCompliant: !hasFailures,
        lastReview: new Date().toISOString(),
        issues: allChecks
          .filter(check => check.status === 'fail')
          .map(check => check.details)
          .flat()
      };

      await db.update(contracts)
        .set({ 
          legalCompliance: complianceData,
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

      console.log("✅ Conformité mise à jour:", complianceData.isCompliant ? "Conforme" : "Non-conforme");
      res.json({ success: true, compliance: complianceData });

    } catch (error) {
      console.error("❌ Erreur contrôle conformité:", error);
      res.status(500).json({ 
        error: "Erreur lors du contrôle de conformité"
      });
    }
  });

  // GET /api/contracts/stats - Statistiques des contrats
  app.get('/api/contracts/stats', async (req: Request, res: Response) => {
    try {
      console.log("📊 STATISTIQUES CONTRATS - API appelée");

      const allContracts = await db.query.contracts.findMany();
      const complianceChecks = await db.query.legalComplianceChecks.findMany();

      const stats = {
        total: allContracts.length,
        byStatus: allContracts.reduce((acc, contract) => {
          acc[contract.status] = (acc[contract.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        compliance: {
          compliant: 0,
          nonCompliant: 0,
          pending: 0
        },
        recentActivity: complianceChecks
          .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
          .slice(0, 10)
      };

      // Calculer la conformité
      for (const contract of allContracts) {
        const contractChecks = complianceChecks.filter(check => check.contractId === contract.id);
        const hasFailures = contractChecks.some(check => check.status === 'fail');
        
        if (contractChecks.length === 0) {
          stats.compliance.pending++;
        } else if (hasFailures) {
          stats.compliance.nonCompliant++;
        } else {
          stats.compliance.compliant++;
        }
      }

      console.log("📊 Statistiques calculées:", stats);
      res.json(stats);

    } catch (error) {
      console.error("❌ Erreur statistiques contrats:", error);
      res.status(500).json({ 
        error: "Erreur lors du calcul des statistiques"
      });
    }
  });

  console.log("📋 ROUTES CONTRATS configurées avec succès");
}