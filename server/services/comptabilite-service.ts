/**
 * SERVICE COMPTABILITÉ - FREE SALES MANAGEMENT
 * 
 * Gestion complète de la comptabilité conforme aux normes françaises
 */

import { db } from "../../db";
import { 
  planComptable,
  journauxComptables,
  exercicesComptables,
  ecrituresComptables,
  tvaDeclarations,
  immobilisations,
  amortissements,
  rapprochementsBancaires,
  cloturesPeriodiques,
  fecExports,
  auditComptable
} from "@shared/schema-comptabilite";
import { eq, and, between, sql, desc, asc, gte, lte } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { fr } from "date-fns/locale";

export class ComptabiliteService {
  
  // ============================================
  // STATISTIQUES ET TABLEAU DE BORD
  // ============================================
  
  async getStatistiquesComptables(periode: string) {
    try {
      const [year, month] = periode.split('-').map(Number);
      const dateDebut = new Date(year, month - 1, 1);
      const dateFin = new Date(year, month, 0, 23, 59, 59);

      // Calculer le chiffre d'affaires (compte 7xxx)
      const chiffreAffaires = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_credit}), 0)`
        })
        .from(ecrituresComptables)
        .where(
          and(
            sql`${ecrituresComptables.compte_numero} LIKE '7%'`,
            between(ecrituresComptables.date_ecriture, 
              format(dateDebut, 'yyyy-MM-dd'),
              format(dateFin, 'yyyy-MM-dd')
            )
          )
        );

      // Calculer les charges (compte 6xxx)
      const charges = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_debit}), 0)`
        })
        .from(ecrituresComptables)
        .where(
          and(
            sql`${ecrituresComptables.compte_numero} LIKE '6%'`,
            between(ecrituresComptables.date_ecriture,
              format(dateDebut, 'yyyy-MM-dd'),
              format(dateFin, 'yyyy-MM-dd')
            )
          )
        );

      // Calculer la TVA
      const tvaPeriode = await db
        .select()
        .from(tvaDeclarations)
        .where(eq(tvaDeclarations.periode, periode))
        .limit(1);

      // Compter les écritures en attente
      const ecrituresEnAttente = await db
        .select({
          count: sql<number>`COUNT(*)`
        })
        .from(ecrituresComptables)
        .where(
          and(
            eq(ecrituresComptables.valide, false),
            between(ecrituresComptables.date_ecriture,
              format(dateDebut, 'yyyy-MM-dd'),
              format(dateFin, 'yyyy-MM-dd')
            )
          )
        );

      // Calculer la trésorerie (comptes 5xxx)
      const tresorerie = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_debit} - ${ecrituresComptables.montant_credit}), 0)`
        })
        .from(ecrituresComptables)
        .where(sql`${ecrituresComptables.compte_numero} LIKE '5%'`);

      // Créances clients (compte 411xxx)
      const creancesClients = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_debit} - ${ecrituresComptables.montant_credit}), 0)`
        })
        .from(ecrituresComptables)
        .where(sql`${ecrituresComptables.compte_numero} LIKE '411%'`);

      // Dettes fournisseurs (compte 401xxx)
      const dettesFournisseurs = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_credit} - ${ecrituresComptables.montant_debit}), 0)`
        })
        .from(ecrituresComptables)
        .where(sql`${ecrituresComptables.compte_numero} LIKE '401%'`);

      const ca = Number(chiffreAffaires[0]?.total || 0);
      const ch = Number(charges[0]?.total || 0);

      return {
        periode,
        chiffreAffaires: ca,
        charges: ch,
        resultat: ca - ch,
        tvaAPayer: Number(tvaPeriode[0]?.tva_a_payer || 0),
        creancesClients: Number(creancesClients[0]?.total || 0),
        dettesFournisseurs: Number(dettesFournisseurs[0]?.total || 0),
        tresorerie: Number(tresorerie[0]?.total || 0),
        ecrituresEnAttente: Number(ecrituresEnAttente[0]?.count || 0),
        alertes: 0 // À implémenter selon les règles métier
      };
    } catch (error) {
      console.error("Erreur calcul statistiques comptables:", error);
      throw error;
    }
  }

  // ============================================
  // PLAN COMPTABLE
  // ============================================

  async getPlanComptable() {
    try {
      return await db
        .select()
        .from(planComptable)
        .where(eq(planComptable.actif, true))
        .orderBy(asc(planComptable.numero));
    } catch (error) {
      console.error("Erreur récupération plan comptable:", error);
      throw error;
    }
  }

  async createCompte(data: any) {
    try {
      const [compte] = await db
        .insert(planComptable)
        .values(data)
        .returning();
      
      // Audit
      await this.logAudit('plan_comptable', compte.id, 'create', null, compte);
      
      return compte;
    } catch (error) {
      console.error("Erreur création compte:", error);
      throw error;
    }
  }

  // ============================================
  // ÉCRITURES COMPTABLES
  // ============================================

  async getEcritures(filters: {
    dateDebut?: string;
    dateFin?: string;
    journal?: number;
    compte?: string;
    valide?: boolean;
  }) {
    try {
      let query = db.select().from(ecrituresComptables);
      const conditions = [];

      if (filters.dateDebut && filters.dateFin) {
        conditions.push(
          between(ecrituresComptables.date_ecriture, filters.dateDebut, filters.dateFin)
        );
      }

      if (filters.journal) {
        conditions.push(eq(ecrituresComptables.journal_id, filters.journal));
      }

      if (filters.compte) {
        conditions.push(eq(ecrituresComptables.compte_numero, filters.compte));
      }

      if (filters.valide !== undefined) {
        conditions.push(eq(ecrituresComptables.valide, filters.valide));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(ecrituresComptables.date_ecriture));
    } catch (error) {
      console.error("Erreur récupération écritures:", error);
      throw error;
    }
  }

  async createEcriture(data: any, userId: number) {
    try {
      // Vérifier l'équilibre débit/crédit
      if (data.montant_debit !== data.montant_credit) {
        // Pour une écriture simple, on doit avoir soit débit soit crédit
        if (data.montant_debit > 0 && data.montant_credit > 0) {
          throw new Error("Une écriture ne peut avoir à la fois un débit et un crédit");
        }
      }

      // Récupérer l'exercice actuel
      const exercice = await this.getExerciceActuel();
      if (!exercice) {
        throw new Error("Aucun exercice comptable actif");
      }

      // Générer le numéro de pièce
      const numeroPiece = await this.genererNumeroPiece(data.journal_id);

      const [ecriture] = await db
        .insert(ecrituresComptables)
        .values({
          ...data,
          exercice_id: exercice.id,
          numero_piece: numeroPiece,
          user_id: userId,
          date_saisie: new Date()
        })
        .returning();

      // Audit
      await this.logAudit('ecritures_comptables', ecriture.id, 'create', null, ecriture);

      return ecriture;
    } catch (error) {
      console.error("Erreur création écriture:", error);
      throw error;
    }
  }

  // ============================================
  // TVA
  // ============================================

  async getDeclarationTVA(periode: string) {
    try {
      const [declaration] = await db
        .select()
        .from(tvaDeclarations)
        .where(eq(tvaDeclarations.periode, periode));

      if (declaration) {
        return declaration;
      }

      // Si pas de déclaration, calculer les montants
      return await this.calculerTVA(periode);
    } catch (error) {
      console.error("Erreur récupération TVA:", error);
      throw error;
    }
  }

  async calculerTVA(periode: string) {
    try {
      const [year, month] = periode.split('-').map(Number);
      const dateDebut = new Date(year, month - 1, 1);
      const dateFin = new Date(year, month, 0, 23, 59, 59);

      // TVA collectée (comptes 4457xx)
      const tvaCollectee = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_credit}), 0)`
        })
        .from(ecrituresComptables)
        .where(
          and(
            sql`${ecrituresComptables.compte_numero} LIKE '4457%'`,
            between(ecrituresComptables.date_ecriture,
              format(dateDebut, 'yyyy-MM-dd'),
              format(dateFin, 'yyyy-MM-dd')
            )
          )
        );

      // TVA déductible (comptes 4456xx)
      const tvaDeductible = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ecrituresComptables.montant_debit}), 0)`
        })
        .from(ecrituresComptables)
        .where(
          and(
            sql`${ecrituresComptables.compte_numero} LIKE '4456%'`,
            between(ecrituresComptables.date_ecriture,
              format(dateDebut, 'yyyy-MM-dd'),
              format(dateFin, 'yyyy-MM-dd')
            )
          )
        );

      const collectee = Number(tvaCollectee[0]?.total || 0);
      const deductible = Number(tvaDeductible[0]?.total || 0);
      const aPayer = Math.max(0, collectee - deductible);
      const creditAReporter = Math.max(0, deductible - collectee);

      return {
        periode,
        regime: 'normal',
        type_declaration: 'CA3',
        tva_collectee: collectee,
        tva_deductible_biens: deductible,
        tva_deductible_services: 0,
        tva_deductible_immobilisations: 0,
        credit_anterieur: 0,
        tva_a_payer: aPayer,
        credit_a_reporter: creditAReporter,
        date_limite: format(new Date(year, month, 14), 'yyyy-MM-dd'),
        statut: 'brouillon'
      };
    } catch (error) {
      console.error("Erreur calcul TVA:", error);
      throw error;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getExerciceActuel() {
    const now = format(new Date(), 'yyyy-MM-dd');
    const [exercice] = await db
      .select()
      .from(exercicesComptables)
      .where(
        and(
          lte(exercicesComptables.date_debut, now),
          gte(exercicesComptables.date_fin, now),
          eq(exercicesComptables.cloture, false)
        )
      )
      .limit(1);
    
    return exercice;
  }

  private async genererNumeroPiece(journalId: number): Promise<string> {
    const [journal] = await db
      .select()
      .from(journauxComptables)
      .where(eq(journauxComptables.id, journalId));

    if (!journal) {
      throw new Error("Journal non trouvé");
    }

    const nouveauNumero = (journal.derniere_piece || 0) + 1;
    
    await db
      .update(journauxComptables)
      .set({ derniere_piece: nouveauNumero })
      .where(eq(journauxComptables.id, journalId));

    const annee = new Date().getFullYear();
    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
    
    return `${journal.code}-${annee}${mois}-${String(nouveauNumero).padStart(6, '0')}`;
  }

  private async logAudit(
    tableName: string,
    recordId: number,
    action: string,
    oldValues: any,
    newValues: any
  ) {
    try {
      await db.insert(auditComptable).values({
        table_name: tableName,
        record_id: recordId,
        action,
        old_values: oldValues,
        new_values: newValues,
        user_id: 1, // À remplacer par l'ID utilisateur réel
        ip_address: '127.0.0.1', // À remplacer par l'IP réelle
        user_agent: 'System'
      });
    } catch (error) {
      console.error("Erreur audit:", error);
    }
  }

  // ============================================
  // INITIALISATION DU SYSTÈME
  // ============================================

  async initializeSystem() {
    try {
      // Vérifier si le système est déjà initialisé
      const comptes = await db.select().from(planComptable).limit(1);
      if (comptes.length > 0) {
        console.log("✅ Système comptable déjà initialisé");
        return;
      }

      console.log("🔧 Initialisation du système comptable...");

      // Créer les comptes de base du PCG
      const comptesBase = [
        // Classe 1 - Capitaux
        { numero: '101000', libelle: 'Capital social', classe: 1, type: 'general', nature: 'credit' },
        { numero: '106000', libelle: 'Réserves', classe: 1, type: 'general', nature: 'credit' },
        { numero: '120000', libelle: 'Résultat de l\'exercice', classe: 1, type: 'general', nature: 'mixte' },
        
        // Classe 2 - Immobilisations
        { numero: '211000', libelle: 'Terrains', classe: 2, type: 'general', nature: 'debit' },
        { numero: '213000', libelle: 'Constructions', classe: 2, type: 'general', nature: 'debit' },
        { numero: '215400', libelle: 'Matériel industriel', classe: 2, type: 'general', nature: 'debit' },
        { numero: '218300', libelle: 'Matériel informatique', classe: 2, type: 'general', nature: 'debit' },
        
        // Classe 4 - Tiers
        { numero: '401000', libelle: 'Fournisseurs', classe: 4, type: 'general', nature: 'credit', collectif: true },
        { numero: '411000', libelle: 'Clients', classe: 4, type: 'general', nature: 'debit', collectif: true },
        { numero: '445660', libelle: 'TVA déductible sur biens et services', classe: 4, type: 'general', nature: 'debit' },
        { numero: '445710', libelle: 'TVA collectée', classe: 4, type: 'general', nature: 'credit' },
        
        // Classe 5 - Financiers
        { numero: '512000', libelle: 'Banque', classe: 5, type: 'general', nature: 'mixte', pointable: true },
        { numero: '530000', libelle: 'Caisse', classe: 5, type: 'general', nature: 'mixte' },
        
        // Classe 6 - Charges
        { numero: '601000', libelle: 'Achats de matières premières', classe: 6, type: 'general', nature: 'debit' },
        { numero: '606400', libelle: 'Fournitures administratives', classe: 6, type: 'general', nature: 'debit' },
        { numero: '613200', libelle: 'Locations immobilières', classe: 6, type: 'general', nature: 'debit' },
        { numero: '621000', libelle: 'Personnel extérieur', classe: 6, type: 'general', nature: 'debit' },
        { numero: '641000', libelle: 'Rémunérations du personnel', classe: 6, type: 'general', nature: 'debit' },
        { numero: '645000', libelle: 'Charges sociales', classe: 6, type: 'general', nature: 'debit' },
        
        // Classe 7 - Produits
        { numero: '701000', libelle: 'Ventes de produits finis', classe: 7, type: 'general', nature: 'credit' },
        { numero: '706000', libelle: 'Prestations de services', classe: 7, type: 'general', nature: 'credit' },
        { numero: '708500', libelle: 'Ports et frais facturés', classe: 7, type: 'general', nature: 'credit' }
      ];

      for (const compte of comptesBase) {
        await db.insert(planComptable).values({
          ...compte,
          actif: true,
          lettrable: ['401000', '411000'].includes(compte.numero),
          tva_applicable: ['601000', '606400', '701000', '706000'].includes(compte.numero),
          taux_tva: ['601000', '606400', '701000', '706000'].includes(compte.numero) ? '20.00' : null
        });
      }

      // Créer les journaux de base
      const journaux = [
        { code: 'ACH', libelle: 'Journal des achats', type: 'achat' },
        { code: 'VTE', libelle: 'Journal des ventes', type: 'vente' },
        { code: 'BQ', libelle: 'Journal de banque', type: 'banque', compte_contrepartie: '512000' },
        { code: 'CAI', libelle: 'Journal de caisse', type: 'caisse', compte_contrepartie: '530000' },
        { code: 'OD', libelle: 'Opérations diverses', type: 'od' }
      ];

      for (const journal of journaux) {
        await db.insert(journauxComptables).values({
          ...journal,
          actif: true,
          derniere_piece: 0
        });
      }

      // Créer l'exercice comptable actuel
      const annee = new Date().getFullYear();
      await db.insert(exercicesComptables).values({
        libelle: `Exercice ${annee}`,
        date_debut: `${annee}-01-01`,
        date_fin: `${annee}-12-31`,
        cloture: false
      });

      console.log("✅ Système comptable initialisé avec succès");
    } catch (error) {
      console.error("❌ Erreur initialisation système comptable:", error);
      throw error;
    }
  }
}

export const comptabiliteService = new ComptabiliteService();