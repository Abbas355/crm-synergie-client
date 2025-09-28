/**
 * SCHÉMA COMPTABILITÉ - FREE SALES MANAGEMENT
 * 
 * ✅ Conformité PCG français
 * ✅ Respect normes fiscales
 * ✅ Traçabilité complète
 * ✅ Sécurité et verrouillage
 */

import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, varchar, date, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// ============================================
// PLAN COMPTABLE - PCG Français
// ============================================
export const planComptable = pgTable("plan_comptable", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull().unique(), // Ex: 401000, 60100
  libelle: text("libelle").notNull(),
  classe: integer("classe").notNull(), // 1-7 selon PCG
  type: varchar("type", { length: 20 }).notNull(), // 'general', 'auxiliaire'
  nature: varchar("nature", { length: 20 }), // 'debit', 'credit', 'mixte'
  actif: boolean("actif").default(true),
  lettrable: boolean("lettrable").default(false), // Pour lettrage
  pointable: boolean("pointable").default(false), // Pour rapprochement
  collectif: boolean("collectif").default(false), // Compte collectif
  tva_applicable: boolean("tva_applicable").default(false),
  taux_tva: decimal("taux_tva", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => [
  index("idx_plan_comptable_numero").on(table.numero),
  index("idx_plan_comptable_classe").on(table.classe)
]);

// ============================================
// JOURNAUX COMPTABLES
// ============================================
export const journauxComptables = pgTable("journaux_comptables", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // ACH, VTE, BQ, OD
  libelle: text("libelle").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'achat', 'vente', 'banque', 'od', 'caisse'
  compte_contrepartie: varchar("compte_contrepartie", { length: 20 }), // Pour journaux de trésorerie
  actif: boolean("actif").default(true),
  derniere_piece: integer("derniere_piece").default(0), // Dernier numéro de pièce
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// EXERCICES COMPTABLES
// ============================================
export const exercicesComptables = pgTable("exercices_comptables", {
  id: serial("id").primaryKey(),
  libelle: text("libelle").notNull(),
  date_debut: date("date_debut").notNull(),
  date_fin: date("date_fin").notNull(),
  cloture: boolean("cloture").default(false),
  date_cloture: timestamp("date_cloture"),
  resultat_net: decimal("resultat_net", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => [
  index("idx_exercice_dates").on(table.date_debut, table.date_fin)
]);

// ============================================
// ÉCRITURES COMPTABLES
// ============================================
export const ecrituresComptables = pgTable("ecritures_comptables", {
  id: serial("id").primaryKey(),
  exercice_id: integer("exercice_id").references(() => exercicesComptables.id).notNull(),
  journal_id: integer("journal_id").references(() => journauxComptables.id).notNull(),
  numero_piece: varchar("numero_piece", { length: 30 }).notNull(),
  date_ecriture: date("date_ecriture").notNull(),
  date_saisie: timestamp("date_saisie").defaultNow().notNull(),
  libelle: text("libelle").notNull(),
  reference: varchar("reference", { length: 50 }), // Référence externe
  montant_debit: decimal("montant_debit", { precision: 15, scale: 2 }).default("0"),
  montant_credit: decimal("montant_credit", { precision: 15, scale: 2 }).default("0"),
  compte_numero: varchar("compte_numero", { length: 20 }).notNull(),
  compte_auxiliaire: varchar("compte_auxiliaire", { length: 20 }), // Pour comptes tiers
  lettrage: varchar("lettrage", { length: 10 }), // Code lettrage
  pointage: varchar("pointage", { length: 10 }), // Code pointage
  rapproche: boolean("rapproche").default(false),
  valide: boolean("valide").default(false),
  verrouille: boolean("verrouille").default(false), // Écriture non modifiable
  user_id: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => [
  index("idx_ecritures_date").on(table.date_ecriture),
  index("idx_ecritures_compte").on(table.compte_numero),
  index("idx_ecritures_journal").on(table.journal_id),
  index("idx_ecritures_exercice").on(table.exercice_id),
  index("idx_ecritures_lettrage").on(table.lettrage)
]);

// ============================================
// TVA - Gestion complète
// ============================================
export const tvaDeclarations = pgTable("tva_declarations", {
  id: serial("id").primaryKey(),
  periode: varchar("periode", { length: 7 }).notNull(), // Format: YYYY-MM
  regime: varchar("regime", { length: 20 }).notNull(), // 'normal', 'simplifie', 'franchise'
  type_declaration: varchar("type_declaration", { length: 10 }).notNull(), // 'CA3', 'CA12'
  tva_collectee: decimal("tva_collectee", { precision: 15, scale: 2 }).default("0"),
  tva_deductible_biens: decimal("tva_deductible_biens", { precision: 15, scale: 2 }).default("0"),
  tva_deductible_services: decimal("tva_deductible_services", { precision: 15, scale: 2 }).default("0"),
  tva_deductible_immobilisations: decimal("tva_deductible_immobilisations", { precision: 15, scale: 2 }).default("0"),
  credit_anterieur: decimal("credit_anterieur", { precision: 15, scale: 2 }).default("0"),
  tva_a_payer: decimal("tva_a_payer", { precision: 15, scale: 2 }).default("0"),
  credit_a_reporter: decimal("credit_a_reporter", { precision: 15, scale: 2 }).default("0"),
  date_limite: date("date_limite").notNull(),
  date_depot: timestamp("date_depot"),
  numero_declaration: varchar("numero_declaration", { length: 50 }),
  statut: varchar("statut", { length: 20 }).default("brouillon"), // 'brouillon', 'validee', 'teledeclaree'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => [
  unique("unique_tva_periode").on(table.periode)
]);

// ============================================
// IMMOBILISATIONS
// ============================================
export const immobilisations = pgTable("immobilisations", {
  id: serial("id").primaryKey(),
  numero_immo: varchar("numero_immo", { length: 20 }).notNull().unique(),
  libelle: text("libelle").notNull(),
  date_acquisition: date("date_acquisition").notNull(),
  date_mise_service: date("date_mise_service").notNull(),
  montant_ht: decimal("montant_ht", { precision: 15, scale: 2 }).notNull(),
  tva: decimal("tva", { precision: 15, scale: 2 }).default("0"),
  montant_ttc: decimal("montant_ttc", { precision: 15, scale: 2 }).notNull(),
  duree_amortissement: integer("duree_amortissement").notNull(), // En mois
  type_amortissement: varchar("type_amortissement", { length: 20 }).notNull(), // 'lineaire', 'degressif'
  taux_amortissement: decimal("taux_amortissement", { precision: 5, scale: 2 }).notNull(),
  compte_immo: varchar("compte_immo", { length: 20 }).notNull(),
  compte_amortissement: varchar("compte_amortissement", { length: 20 }).notNull(),
  compte_dotation: varchar("compte_dotation", { length: 20 }).notNull(),
  valeur_residuelle: decimal("valeur_residuelle", { precision: 15, scale: 2 }).default("0"),
  cede: boolean("cede").default(false),
  date_cession: date("date_cession"),
  prix_cession: decimal("prix_cession", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// AMORTISSEMENTS
// ============================================
export const amortissements = pgTable("amortissements", {
  id: serial("id").primaryKey(),
  immobilisation_id: integer("immobilisation_id").references(() => immobilisations.id).notNull(),
  exercice_id: integer("exercice_id").references(() => exercicesComptables.id).notNull(),
  date_debut: date("date_debut").notNull(),
  date_fin: date("date_fin").notNull(),
  base_amortissable: decimal("base_amortissable", { precision: 15, scale: 2 }).notNull(),
  dotation: decimal("dotation", { precision: 15, scale: 2 }).notNull(),
  cumul_anterieur: decimal("cumul_anterieur", { precision: 15, scale: 2 }).default("0"),
  cumul_fin: decimal("cumul_fin", { precision: 15, scale: 2 }).notNull(),
  valeur_nette: decimal("valeur_nette", { precision: 15, scale: 2 }).notNull(),
  ecriture_id: integer("ecriture_id").references(() => ecrituresComptables.id),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("idx_amortissements_immo").on(table.immobilisation_id),
  index("idx_amortissements_exercice").on(table.exercice_id)
]);

// ============================================
// RAPPROCHEMENT BANCAIRE
// ============================================
export const rapprochementsBancaires = pgTable("rapprochements_bancaires", {
  id: serial("id").primaryKey(),
  compte_bancaire: varchar("compte_bancaire", { length: 20 }).notNull(),
  date_rapprochement: date("date_rapprochement").notNull(),
  solde_comptable: decimal("solde_comptable", { precision: 15, scale: 2 }).notNull(),
  solde_bancaire: decimal("solde_bancaire", { precision: 15, scale: 2 }).notNull(),
  ecart: decimal("ecart", { precision: 15, scale: 2 }).notNull(),
  valide: boolean("valide").default(false),
  user_id: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// ============================================
// CLÔTURES PÉRIODIQUES
// ============================================
export const cloturesPeriodiques = pgTable("clotures_periodiques", {
  id: serial("id").primaryKey(),
  type_cloture: varchar("type_cloture", { length: 20 }).notNull(), // 'mensuelle', 'annuelle'
  periode: varchar("periode", { length: 7 }).notNull(), // YYYY-MM ou YYYY
  date_cloture: timestamp("date_cloture").notNull(),
  chiffre_affaires: decimal("chiffre_affaires", { precision: 15, scale: 2 }),
  charges: decimal("charges", { precision: 15, scale: 2 }),
  resultat: decimal("resultat", { precision: 15, scale: 2 }),
  hash_validation: text("hash_validation"), // Hash de validation pour intégrité
  user_id: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  unique("unique_cloture_periode").on(table.type_cloture, table.periode)
]);

// ============================================
// FEC - Fichier des Écritures Comptables
// ============================================
export const fecExports = pgTable("fec_exports", {
  id: serial("id").primaryKey(),
  exercice_id: integer("exercice_id").references(() => exercicesComptables.id).notNull(),
  date_debut: date("date_debut").notNull(),
  date_fin: date("date_fin").notNull(),
  nom_fichier: text("nom_fichier").notNull(),
  chemin_fichier: text("chemin_fichier"),
  taille_fichier: integer("taille_fichier"),
  nombre_ecritures: integer("nombre_ecritures"),
  hash_fichier: text("hash_fichier"), // SHA256 du fichier
  user_id: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// ============================================
// TAUX TVA
// ============================================
export const tauxTVA = pgTable("taux_tva", {
  id: serial("id").primaryKey(),
  taux: decimal("taux", { precision: 5, scale: 2 }).notNull(),
  libelle: varchar("libelle", { length: 100 }).notNull(),
  typeOperation: varchar("type_operation", { length: 50 }).notNull(), // NORMAL, INTERMEDIAIRE, REDUIT, etc.
  dateDebut: date("date_debut").notNull(),
  dateFin: date("date_fin"),
  defaut: boolean("defaut").default(false),
  actif: boolean("actif").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// LIGNES D'ECRITURE COMPTABLE
// ============================================
export const lignesEcritures = pgTable("lignes_ecritures", {
  id: serial("id").primaryKey(),
  ecriture_id: integer("ecriture_id").references(() => ecrituresComptables.id).notNull(),
  numero_compte: varchar("numero_compte", { length: 10 }).notNull(),
  libelle: text("libelle").notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0"),
  tva_applicable: boolean("tva_applicable").default(false),
  taux_tva_id: integer("taux_tva_id").references(() => tauxTVA.id),
  montant_tva: decimal("montant_tva", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("idx_lignes_ecriture").on(table.ecriture_id),
  index("idx_lignes_compte").on(table.numero_compte)
]);

// ============================================
// PARAMETRES COMPTABLES
// ============================================
export const parametresComptables = pgTable("parametres_comptables", {
  id: serial("id").primaryKey(),
  cle: varchar("cle", { length: 100 }).notNull().unique(),
  valeur: text("valeur").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// PISTE D'AUDIT
// ============================================
export const auditComptable = pgTable("audit_comptable", {
  id: serial("id").primaryKey(),
  table_name: varchar("table_name", { length: 50 }).notNull(),
  record_id: integer("record_id").notNull(),
  action: varchar("action", { length: 20 }).notNull(), // 'create', 'update', 'delete'
  old_values: json("old_values"),
  new_values: json("new_values"),
  user_id: integer("user_id").references(() => users.id).notNull(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("idx_audit_table_record").on(table.table_name, table.record_id),
  index("idx_audit_date").on(table.createdAt)
]);

// ============================================
// TYPES EXPORTS
// ============================================
export type PlanComptable = typeof planComptable.$inferSelect;
export type PlanComptableInsert = typeof planComptable.$inferInsert;
export type JournalComptable = typeof journauxComptables.$inferSelect;
export type JournalComptableInsert = typeof journauxComptables.$inferInsert;
export type ExerciceComptable = typeof exercicesComptables.$inferSelect;
export type ExerciceComptableInsert = typeof exercicesComptables.$inferInsert;
export type EcritureComptable = typeof ecrituresComptables.$inferSelect;
export type EcritureComptableInsert = typeof ecrituresComptables.$inferInsert;
export type TvaDeclaration = typeof tvaDeclarations.$inferSelect;
export type TvaDeclarationInsert = typeof tvaDeclarations.$inferInsert;
export type Immobilisation = typeof immobilisations.$inferSelect;
export type ImmobilisationInsert = typeof immobilisations.$inferInsert;
export type Amortissement = typeof amortissements.$inferSelect;
export type AmortissementInsert = typeof amortissements.$inferInsert;
export type RapprochementBancaire = typeof rapprochementsBancaires.$inferSelect;
export type RapprochementBancaireInsert = typeof rapprochementsBancaires.$inferInsert;
export type CloturePeriodique = typeof cloturesPeriodiques.$inferSelect;
export type CloturePeriodiqueInsert = typeof cloturesPeriodiques.$inferInsert;
export type FecExport = typeof fecExports.$inferSelect;
export type FecExportInsert = typeof fecExports.$inferInsert;
export type AuditComptable = typeof auditComptable.$inferSelect;
export type AuditComptableInsert = typeof auditComptable.$inferInsert;