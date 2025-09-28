/**
 * SCHÉMA UNIFIÉ FINAL - FREE SALES MANAGEMENT
 * 
 * ✅ Noms de colonnes EXACTEMENT identiques à PostgreSQL
 * ✅ Pas de mapping camelCase/snake_case
 * ✅ Structure cohérente dans toute l'application
 * ✅ Types optimisés pour les performances
 * ✅ Version finale et stable
 */

import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================
// FACTURE COUNTERS TABLE - Numérotation légale unique
// ============================================
export const facture_counters = pgTable("facture_counters", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  counter: integer("counter").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// FACTURES TABLE - Facturation CVD avec numérotation fiscale permanente
// ============================================
export const factures = pgTable("factures", {
  id: serial("id").primaryKey(),
  numeroFacture: text("numeroFacture").notNull().unique(), // Format: FA YYYY MM 00000001
  periode: text("periode").notNull(), // Ex: "juin 2025"
  mois: integer("mois").notNull(),
  annee: integer("annee").notNull(),
  vendeurId: integer("vendeurId").references(() => users.id).notNull(),
  vendeurNom: text("vendeurNom").notNull(),
  vendeurPrenom: text("vendeurPrenom").notNull(),
  vendeurEmail: text("vendeurEmail").notNull(),
  montantCommission: decimal("montantCommission", { precision: 10, scale: 2 }).notNull(),
  pointsTotal: integer("pointsTotal").notNull(),
  nombreInstallations: integer("nombreInstallations").notNull(),
  dateFacturation: timestamp("dateFacturation").notNull(), // Dernier jour du mois
  dateEcheance: timestamp("dateEcheance").notNull(), // +15 jours
  statut: text("statut").default("emise"), // emise, payee, annulee
  detailsVentes: json("detailsVentes"), // Détails des installations facturées
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// USERS TABLE - Utilisateurs et vendeurs
// ============================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  prenom: text("prenom"),
  nom: text("nom"),
  phone: text("phone"),
  codePostal: text("codePostal"), // Code postal du vendeur
  ville: text("ville"), // Ville de résidence du vendeur  
  codeVendeur: text("codeVendeur"),
  codeParrainage: text("codeParrainage"), // Code vendeur du parrain pour hiérarchie MLM
  niveau: text("niveau").default("CQ"), // CQ, ETT, ETL, Manager
  active: boolean("active").default(true),
  isAdmin: boolean("isAdmin").default(false),
  avatar: text("avatar"),
  lastLogin: timestamp("lastLogin"),
  // updatedAt: timestamp("updatedAt"), // Colonne non disponible en base
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  
  // Documents vendeur - Object Storage (noms exact DB PostgreSQL)
  photoProfile: text("photoprofile"), // Photo de profil
  attestationHonneur: text("attestationhonneur"), // Attestation sur l'honneur
  pieceIdentite: text("pieceidentite"), // Pièce d'identité
  rib: text("rib"), // RIB
  carteVitale: text("cartevitale"), // Carte vitale
  justificatifDomicile: text("justificatifdomicile"), // Justificatif de domicile
  
  // Métadonnées documents
  documentsComplets: boolean("documentscomplets").default(false),
  derniereMajDocuments: timestamp("dernieremajdocuments"),
  
  // Signature électronique (base64)
  signatureElectronique: text("signatureElectronique"),
  
  // Colonnes optionnelles pour futur usage Google
  // google_tokens: text("google_tokens"), // JSON des tokens Google OAuth (désactivé temporairement)
  // profile_image_url: text("profile_image_url"), // URL de l'image de profil Google (désactivé temporairement)
});

// ============================================
// CLIENTS TABLE - CamelCase unifié (sans mapping)
// ============================================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  userId: integer("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  status: text("status").default("enregistre"),
  identifiant: text("identifiant"),
  date: timestamp("date"),
  type: text("type"),
  civilite: text("civilite"),
  prenom: text("prenom"),
  nom: text("nom"),
  dateNaissance: text("dateNaissance"),
  adresse: text("adresse"),
  codePostal: text("codePostal"),
  ville: text("ville"),
  produit: text("produit"),
  fixe: text("fixe"),
  identifiantContrat: text("identifiantContrat"),
  carteSim: text("carteSim"),
  portabilite: text("portabilite"),
  numeroPorter: text("numeroPorter"),
  source: text("source"),
  civiliteProspect: text("civiliteProspect"),
  prenomProspect: text("prenomProspect"),
  nomProspect: text("nomProspect"),
  mobileProspect: text("mobileProspect"),
  codePostalProspect: text("codePostalProspect"),
  villeProspect: text("villeProspect"),
  commentaire: text("commentaire"),
  dateSignature: timestamp("dateSignature"),
  contratSigne: boolean("contratSigne").default(false),
  identiteValidee: boolean("identiteValidee").default(false),
  ribValide: boolean("ribValide").default(false),
  justificatifDomicileValide: boolean("justificatifDomicileValide").default(false),
  deletedAt: timestamp("deletedAt"),
  codeVendeur: text("codeVendeur").notNull(), // 🎯 OBLIGATOIRE - Toujours assigné automatiquement
  dateRendezVous: timestamp("dateRendezVous"),
  dateInstallation: timestamp("dateInstallation"),
  telephone: text("telephone"),
});

// ============================================
// SIM_CARDS TABLE - CamelCase unifié
// ============================================
export const sim_cards = pgTable("sim_cards", {
  id: serial("id").primaryKey(),
  codeVendeur: text("codeVendeur"), // ✅ PRÉSENT dans la base - Attribution lors affectation client
  numero: text("numero").notNull().unique(),
  statut: text("statut").default("disponible"),
  clientId: integer("clientId").references(() => clients.id),
  dateAttribution: timestamp("dateAttribution"),
  note: text("note"),
  userId: integer("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // updatedAt: timestamp("updatedAt").defaultNow(), // Colonne non disponible en base
  dateActivation: timestamp("dateActivation"),
  dateInstallation: timestamp("dateInstallation"), // ✅ PRÉSENT dans la base 
});

// ============================================
// PROSPECTS TABLE - Gestion pré-signature
// ============================================
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "client" | "vendeur"
  
  // Informations de base
  prenom: text("prenom").notNull(),
  nom: text("nom").notNull(),
  email: text("email"),
  telephone: text("telephone").notNull(),
  ville: text("ville"),
  codePostal: text("codePostal"),
  adresse: text("adresse"),
  
  // États pré-signature uniquement
  stade: text("stade").default("nouveau"), // nouveau, contacté, qualifié, prêt_signature
  source: text("source"), // site, recommandation, salon, etc.
  interet: text("interet"), // produit/service d'intérêt
  
  // Gestion des contacts et suivi
  dernierContact: timestamp("dernierContact"),
  prochainContact: timestamp("prochainContact"),
  nombreContacts: integer("nombreContacts").default(0),
  
  // Notes et historique - Unifié vers "commentaire"
  commentaire: text("commentaire"),
  historiqueContacts: json("historiqueContacts").$type<{
    date: string;
    type: "appel" | "email" | "sms" | "rencontre";
    commentaire: string;
    resultat: "positif" | "neutre" | "negatif";
  }[]>(),
  
  // Assignation et gestion
  userId: integer("userId").references(() => users.id), // Nullable car les prospects peuvent être créés sans assignation
  assignePar: integer("assignePar").references(() => users.id),
  
  // Simulateur d'économie (remplace scoreInteret) - uniquement pour prospects clients
  economyData: json("economyData").$type<{
    currentCost: number;
    freeCost: number;
    monthlySavings: number;
    annualSavings: number;
    products: string[];
    details: string;
  }>(),
  potentielEstime: text("potentielEstime"), // "faible", "moyen", "fort"
  
  // Champs spécifiques aux prospects vendeurs
  experienceCommerciale: text("experienceCommerciale"), // "debutant", "intermediaire", "experimente"
  secteurActuel: text("secteurActuel"),
  motivationPrincipale: text("motivationPrincipale"), // "revenus_complementaires", "reconversion", etc.
  disponibilite: text("disponibilite"), // "temps_partiel", "temps_plein", "weekends", "flexible"
  experienceVenteDirecte: text("experienceVenteDirecte"), // "oui_expert", "oui_debutant", "non_motive", "non_hesitant"
  objectifRevenus: text("objectifRevenus"), // "500-1000", "1000-2000", etc.
  zoneGeographique: text("zoneGeographique"),
  moyensTransport: text("moyensTransport"), // "vehicule_personnel", "transports_commun", etc.
  etapeProcessus: text("etapeProcessus"), // "premier_contact", "entretien_prevu", etc.
  documentsEnvoyes: text("documentsEnvoyes"), // "aucun", "cv_seulement", etc.
  parrainReferent: text("parrainReferent"),
  dateFormationPrevue: timestamp("dateFormationPrevue"),
  
  // Transition vers systèmes existants
  convertiEnClientId: integer("convertiEnClientId").references(() => clients.id),
  convertiEnVendeurId: integer("convertiEnVendeurId").references(() => users.id),
  dateConversion: timestamp("dateConversion"),
  
  // Métadonnées
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  deletedAt: timestamp("deletedAt"),
});

// ============================================
// TASKS TABLE - CamelCase unifié
// ============================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"), // ⚡ CORRIGÉ : utiliser description au lieu de commentaire  
  status: text("status").default("pending"), // pending, in_progress, completed
  priority: text("priority").default("medium"), // low, medium, high
  category: text("category").default("general"), // general, client, administrative
  clientId: integer("clientId").references(() => clients.id),
  userId: integer("userId").references(() => users.id).notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  estimatedDuration: integer("estimatedDuration"), // en minutes
  actualDuration: integer("actualDuration"), // en minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(), // ⚡ AJOUTÉ : colonne manquante
  deletedAt: timestamp("deletedAt"), // Pour la suppression logique des tâches
});

// ============================================
// MONTHLY_CVD_RESETS TABLE - Remise à zéro mensuelle
// ============================================
export const monthly_cvd_resets = pgTable("monthly_cvd_resets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  resetMonth: integer("resetMonth").notNull(), // 1-12
  resetYear: integer("resetYear").notNull(),
  previousTranche: integer("previousTranche").notNull(),
  resetToTranche: integer("resetToTranche").default(1),
  resetDate: timestamp("resetDate").defaultNow().notNull(),
  pointsBeforeReset: integer("pointsBeforeReset"),
  commissionBeforeReset: decimal("commissionBeforeReset"),
});

// ============================================
// DELETED_ITEMS TABLE - Corbeille unifiée
// ============================================
export const deleted_items = pgTable("deleted_items", {
  id: serial("id").primaryKey(),
  itemType: text("itemType").notNull(), // "task", "appointment", "client" 
  itemId: integer("itemId").notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  itemData: json("itemData").notNull(), // Données sauvegardées de l'élément supprimé
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
  restoredAt: timestamp("restoredAt"),
  originalTitle: text("originalTitle"),
  originalDescription: text("originalDescription"),
});

// ============================================
// TASK_HISTORY TABLE - Historique des modifications de tâches
// ============================================
export const task_history = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").references(() => tasks.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  action: text("action").notNull(), // "created", "updated", "status_changed", "due_date_changed"
  fieldChanged: text("fieldChanged"), // Nom du champ modifié
  oldValue: text("oldValue"), // Ancienne valeur
  newValue: text("newValue"), // Nouvelle valeur
  description: text("description"), // Description de l'action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// PROSPECTION TABLE - Suivi travail commercial par ville
// ============================================
export const prospection = pgTable("prospection", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  ville: text("ville").notNull(),
  codePostal: text("codePostal"),
  dateProspection: timestamp("dateProspection").defaultNow().notNull(),
  typeActivite: text("typeActivite").notNull(), // "porte_a_porte", "telephonie", "evenement", "recommandation", "digital"
  nombreContacts: integer("nombreContacts").default(0),
  contactsQualifies: integer("contactsQualifies").default(0),
  rendezvousProgrammes: integer("rendezvousProgrammes").default(0),
  signatures: integer("signatures").default(0),
  tempsPasse: integer("tempsPasse").default(0), // en minutes
  secteur: text("secteur"), // zone géographique ou quartier
  commentaires: text("commentaires"), // CONFIDENTIEL - visible seulement par le créateur
  objectifs: json("objectifs"), // objectifs de la session de prospection
  resultats: json("resultats"), // résultats détaillés
  meteo: text("meteo"), // conditions météo
  satisfaction: integer("satisfaction"), // note sur 5
  createdBy: integer("createdBy").references(() => users.id).notNull(), // Vendeur qui a créé la session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// PROSPECTION TERRAIN SESSIONS TABLE - Sessions de prospection terrain
// ============================================
export const prospection_terrain_sessions = pgTable("prospection_terrain_sessions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  commercial: text("commercial").notNull(),
  zone: text("zone").notNull(),
  adresse: text("adresse"),
  codePostal: text("codePostal"),
  ville: text("ville").notNull(),
  codeAcces: text("codeAcces"),
  totalVisites: integer("totalVisites").default(0),
  totalRDV: integer("totalRDV").default(0),
  totalSignatures: integer("totalSignatures").default(0),
  totalRIO: integer("totalRIO").default(0),
  totalAbsents: integer("totalAbsents").default(0),
  totalRefus: integer("totalRefus").default(0),
  statut: text("statut").notNull().default("planifiee"), // "planifiee", "en_cours", "terminee"
  createdBy: integer("createdBy").references(() => users.id).notNull(), // Vendeur qui a créé la session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// ============================================
// PROSPECTION TERRAIN CONTACTS TABLE - Contacts prospectés par session
// ============================================
export const prospection_terrain_contacts = pgTable("prospection_terrain_contacts", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").references(() => prospection_terrain_sessions.id).notNull(),
  numeroBat: text("numeroBat"), // Numéro de bâtiment (A, B, 1, 2, etc.)
  etage: integer("etage").notNull(),
  numeroPorte: text("numeroPorte").notNull(),
  nom: text("nom"), // Optionnel - souvent pas de nom au début
  resultatMatin: text("resultatMatin"),
  resultatMidi: text("resultatMidi"),
  resultatApresMidi: text("resultatApresMidi"),
  resultatSoir: text("resultatSoir"),
  rdvSignature: text("rdvSignature"),
  rdvSignatureType: text("rdvSignatureType"), // 'rdv' ou 'signature'
  produitSignature: text("produitSignature"), // Produit signé (freebox_pop, freebox_essentiel, etc.)
  rendezVousPris: text("rendezVousPris"), // Détails du rendez-vous pris
  observations: text("observations"), // CONFIDENTIEL - visible seulement par le créateur
  mobile: text("mobile"), // CONFIDENTIEL - visible seulement par le créateur
  email: text("email"),
  operateurActuel: text("operateurActuel"),
  statusFinal: text("statusFinal"), // "RDV", "SIGNATURE", "ABS", "REFUS", "PA", "PI", "RO", "CFORG", "CFFREE", "CFSFR", "CFBYG"
  createdBy: integer("createdBy").references(() => users.id).notNull(), // Vendeur qui a créé le contact
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// Settings table temporairement supprimée pour éviter les conflits de migration

// ============================================
// RELATIONS - Définition des relations entre tables
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  tasks: many(tasks),
  sim_cards: many(sim_cards),
  deleted_items: many(deleted_items),
  task_history: many(task_history),
  prospects: many(prospects),
  prospections: many(prospection),
}));

export const prospection_terrain_sessionsRelations = relations(prospection_terrain_sessions, ({ many }) => ({
  contacts: many(prospection_terrain_contacts),
}));

export const prospection_terrain_contactsRelations = relations(prospection_terrain_contacts, ({ one }) => ({
  session: one(prospection_terrain_sessions, { fields: [prospection_terrain_contacts.sessionId], references: [prospection_terrain_sessions.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  tasks: many(tasks),
  sim_card: one(sim_cards, { fields: [clients.id], references: [sim_cards.clientId] }),
}));

export const sim_cardsRelations = relations(sim_cards, ({ one }) => ({
  client: one(clients, { fields: [sim_cards.clientId], references: [clients.id] }),
  user: one(users, { fields: [sim_cards.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  assignee: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
  history: many(task_history),
}));

export const task_historyRelations = relations(task_history, ({ one }) => ({
  task: one(tasks, { fields: [task_history.taskId], references: [tasks.id] }),
  user: one(users, { fields: [task_history.userId], references: [users.id] }),
}));

export const deleted_itemsRelations = relations(deleted_items, ({ one }) => ({
  user: one(users, { fields: [deleted_items.userId], references: [users.id] }),
}));

export const prospectsRelations = relations(prospects, ({ one }) => ({
  user: one(users, { fields: [prospects.userId], references: [users.id] }),
  assigneur: one(users, { fields: [prospects.assignePar], references: [users.id] }),
  clientConverti: one(clients, { fields: [prospects.convertiEnClientId], references: [clients.id] }),
  vendeurConverti: one(users, { fields: [prospects.convertiEnVendeurId], references: [users.id] }),
}));

export const prospectionRelations = relations(prospection, ({ one }) => ({
  user: one(users, { fields: [prospection.userId], references: [users.id] }),
}));

// ============================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================

// Schémas pour les clients
export const clientsInsertSchema = createInsertSchema(clients, {
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional(),
  telephone: z.string().optional(),
  identifiantContrat: z.string().optional(),
  produit: z.string().min(1, "Le produit est requis"),
});

export const clientsSelectSchema = createSelectSchema(clients);
export type ClientInsert = z.infer<typeof clientsInsertSchema>;
export type ClientSelect = z.infer<typeof clientsSelectSchema>;

// Schéma pour les formulaires clients (legacy compatibility)
export const clientFormSchema = z.object({
  // Champs obligatoires
  civilite: z.string().min(1, "La civilité est requise"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional(),
  telephone: z.string().optional(),
  dateNaissance: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  produit: z.string().min(1, "Le produit est requis"),
  identifiantContrat: z.string().optional(),
  carteSIM: z.string().optional(),
  portabilite: z.string().optional(),
  numeroPorter: z.string().optional(),
  source: z.string().optional(),
  commentaire: z.string().optional(),
  
  // Champs pour les dates
  dateSignature: z.string().optional(),
  dateRendezVous: z.string().optional(),
  dateInstallation: z.string().optional(),
  
  // Champs pour les recommandations
  civiliteProspect: z.string().optional(),
  prenomProspect: z.string().optional(),
  nomProspect: z.string().optional(),
  mobileProspect: z.string().optional(),
  codePostalProspect: z.string().optional(),
  villeProspect: z.string().optional(),
  
  // Champs pour les recommandations par client
  clientRecommandation: z.number().optional(),
  prospectCivilite: z.string().optional(),
  prospectPrenom: z.string().optional(),
  prospectNom: z.string().optional(),
  prospectMobile: z.string().optional(),
  prospectCodePostal: z.string().optional(),
  prospectVille: z.string().optional(),
  
  // Champs système
  status: z.string().optional(),
  userId: z.number().optional(),
  
  // Note: Les champs dateNaissance, codePostal, identifiantContrat, carteSim, numeroPorter sont déjà définis ci-dessus
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

// Schémas pour les cartes SIM
export const sim_cardsInsertSchema = createInsertSchema(sim_cards, {
  numero: z.string().min(15, "Le numéro doit contenir au moins 15 caractères"),
  statut: z.string().default("disponible"),
});

export const sim_cardsSelectSchema = createSelectSchema(sim_cards);
export type SimCardInsert = z.infer<typeof sim_cardsInsertSchema>;
export type SimCardSelect = z.infer<typeof sim_cardsSelectSchema>;

// Schémas pour les tâches
export const tasksInsertSchema = createInsertSchema(tasks, {
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  status: z.string().default("pending"),
  priority: z.string().default("medium"),
});

export const tasksSelectSchema = createSelectSchema(tasks);
export type TaskInsert = z.infer<typeof tasksInsertSchema>;
export type TaskSelect = z.infer<typeof tasksSelectSchema>;

// Schémas pour l'historique des tâches
export const taskHistoryInsertSchema = createInsertSchema(task_history);
export const taskHistorySelectSchema = createSelectSchema(task_history);
export type TaskHistoryInsert = z.infer<typeof taskHistoryInsertSchema>;
export type TaskHistorySelect = z.infer<typeof taskHistorySelectSchema>;

// Schémas pour les utilisateurs
export const usersInsertSchema = createInsertSchema(users, {
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  email: z.string().email("Email invalide").optional(),
});

export const usersSelectSchema = createSelectSchema(users);
export type UserInsert = z.infer<typeof usersInsertSchema>;
export type UserSelect = z.infer<typeof usersSelectSchema>;

// Schémas pour les prospects
export const prospectsInsertSchema = createInsertSchema(prospects, {
  prenom: z.string().optional(),
  nom: z.string().optional(),
  email: z.string().nullable().optional(),
  telephone: z.string().min(10, "Le téléphone doit contenir au moins 10 caractères"),
  type: z.string().refine(val => ["client", "vendeur"].includes(val), "Type invalide"),
  stade: z.string().default("nouveau"),
  userId: z.number().min(1, "L'utilisateur est requis"),
  commentaire: z.string().optional(),
  dernierContact: z.date().optional(),
  prochainContact: z.date().optional(),
  // Nouveaux champs pour prospects vendeurs
  experienceCommerciale: z.string().optional(),
  secteurActuel: z.string().optional(),
  motivationPrincipale: z.string().optional(),
  disponibilite: z.string().optional(),
  experienceVenteDirecte: z.string().optional(),
  objectifRevenus: z.string().optional(),
  zoneGeographique: z.string().optional(),
  moyensTransport: z.string().optional(),
  etapeProcessus: z.string().optional(),
  documentsEnvoyes: z.string().optional(),
  parrainReferent: z.string().optional(),
  dateFormationPrevue: z.date().optional(),
  // scoreInteret supprimé, remplacé par economyData
}).refine((data) => {
  // Au moins nom OU prénom doit être renseigné
  return (data.nom && data.nom.trim().length > 0) || (data.prenom && data.prenom.trim().length > 0);
}, {
  message: "Le nom ou le prénom doit être renseigné",
  path: ["nom"], // Affiche l'erreur sur le champ nom
});

export const prospectsSelectSchema = createSelectSchema(prospects);
export type ProspectInsert = z.infer<typeof prospectsInsertSchema>;
export type ProspectSelect = z.infer<typeof prospectsSelectSchema>;

// Schémas pour la prospection
export const prospectionInsertSchema = createInsertSchema(prospection, {
  ville: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  typeActivite: z.string().refine(val => ["porte_a_porte", "telephonie", "evenement", "recommandation", "digital"].includes(val), "Type d'activité invalide"),
  nombreContacts: z.number().min(0, "Le nombre de contacts ne peut pas être négatif"),
  contactsQualifies: z.number().min(0, "Le nombre de contacts qualifiés ne peut pas être négatif"),
  satisfaction: z.number().min(1, "La satisfaction doit être entre 1 et 5").max(5, "La satisfaction doit être entre 1 et 5").optional(),
  tempsPasse: z.number().min(0, "Le temps passé ne peut pas être négatif"),
});

export const prospectionSelectSchema = createSelectSchema(prospection);
export type ProspectionInsert = z.infer<typeof prospectionInsertSchema>;
export type ProspectionSelect = z.infer<typeof prospectionSelectSchema>;

// Schémas pour la prospection terrain
export const prospectionTerrainSessionsInsertSchema = createInsertSchema(prospection_terrain_sessions, {
  commercial: z.string().min(2, "Le nom du commercial doit contenir au moins 2 caractères"),
  zone: z.string().min(1, "La zone doit être renseignée").default("Zone 1"),
  ville: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  statut: z.string().refine(val => ["planifiee", "en_cours", "terminee"].includes(val), "Statut invalide"),
});

export const prospectionTerrainSessionsSelectSchema = createSelectSchema(prospection_terrain_sessions);
export type ProspectionTerrainSessionInsert = z.infer<typeof prospectionTerrainSessionsInsertSchema>;
export type ProspectionTerrainSessionSelect = z.infer<typeof prospectionTerrainSessionsSelectSchema>;

export const prospectionTerrainContactsInsertSchema = createInsertSchema(prospection_terrain_contacts, {
  etage: z.coerce.number().int().min(-10, "L'étage doit être entre -10 et 50 (sous-sols autorisés)").max(50, "L'étage ne peut pas dépasser 50"),
  numeroPorte: z.string().min(1, "Le numéro de porte est requis"),
  nom: z.string().optional().refine(val => !val || val.length >= 2, "Le nom doit contenir au moins 2 caractères si renseigné"),
  mobile: z.string().optional(),
  email: z.string().optional(),
  resultatMatin: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat matin invalide").optional(),
  resultatMidi: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat midi invalide").optional(),
  resultatApresMidi: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat après-midi invalide").optional(),
  resultatSoir: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat soir invalide").optional(),
  statusFinal: z.string().refine(val => !val || val === "" || ["vide", "RDV", "SIGNATURE", "ABS", "REFUS", "PA", "PI", "RO", "CFORG", "CFFREE", "CFSFR", "CFBYG"].includes(val), "Statut final invalide").optional(),
});

export const prospectionTerrainContactsSelectSchema = createSelectSchema(prospection_terrain_contacts);

// Schéma spécial pour la modification (exclut les champs de création obligatoires)
export const prospectionTerrainContactsUpdateSchema = z.object({
  etage: z.coerce.number().int().min(-10, "L'étage doit être entre -10 et 50 (sous-sols autorisés)").max(50, "L'étage ne peut pas dépasser 50"),
  numeroPorte: z.string().min(1, "Le numéro de porte est requis"),
  numeroBat: z.string().optional(),
  nom: z.string().optional().refine(val => !val || val.length >= 2, "Le nom doit contenir au moins 2 caractères si renseigné"),
  mobile: z.string().optional(),
  email: z.string().optional(),
  resultatMatin: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat matin invalide").optional(),
  resultatMidi: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat midi invalide").optional(),
  resultatApresMidi: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat après-midi invalide").optional(),
  resultatSoir: z.string().refine(val => !val || val === "" || ["vide", "absent", "personne_agee", "pas_interesse", "refus_ouvrir", "va_demenager", "a_revoir", "argumentation", "veux_reflechir", "voir_mr", "voir_mme", "voir_parents", "rdv", "signature"].includes(val), "Résultat soir invalide").optional(),
  rdvSignature: z.string().optional(),
  rdvSignatureType: z.string().refine(val => !val || val === "" || ["Rendez-vous", "Signature", "rdv", "signature"].includes(val), "Type RDV/Signature invalide").optional(),
  rdvDate: z.string().optional(),
  produitSignature: z.string().optional(),
  rendezVousPris: z.string().optional(),
  observations: z.string().optional(),
  operateurActuel: z.string().optional(),
  statusFinal: z.string().refine(val => !val || val === "" || ["vide", "RDV", "SIGNATURE", "ABS", "REFUS", "PA", "PI", "RO", "CFORG", "CFFREE", "CFSFR", "CFBYG"].includes(val), "Statut final invalide").optional(),
  updatedAt: z.date().optional(),
  sessionId: z.number().optional(),
  id: z.number().optional(),
});

export type ProspectionTerrainContactInsert = z.infer<typeof prospectionTerrainContactsInsertSchema>;
export type ProspectionTerrainContactSelect = z.infer<typeof prospectionTerrainContactsSelectSchema>;
export type ProspectionTerrainContactUpdate = z.infer<typeof prospectionTerrainContactsUpdateSchema>;

// ============================================
// CONSTANTES MÉTIER
// ============================================

export const CLIENT_STATUSES = {
  ENREGISTRE: "enregistre",
  VALIDER: "valider",
  VALIDATION_7_JOURS: "validation_7_jours",
  RENDEZ_VOUS: "rendez_vous",
  POST_PRODUCTION: "post_production",
  INSTALLATION: "installation",
  RESILIE: "resilie",
  ABANDONNE: "abandonne",
} as const;

export const TASK_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export const SIM_CARD_STATUSES = {
  DISPONIBLE: "disponible",
  ATTRIBUE: "attribue",
  ACTIVE: "active",
  SUSPENDU: "suspendu",
} as const;

export const PRODUCT_POINTS = {
  "Freebox Ultra": 6,
  "Freebox Essentiel": 5,
  "Freebox Pop": 4,
  "Forfait 5G": 1,
} as const;

export const PROSPECT_TYPES = {
  CLIENT: "client",
  VENDEUR: "vendeur",
} as const;

export const PROSPECT_STADES = {
  NOUVEAU: "nouveau",
  CONTACTE: "contacté",
  QUALIFIE: "qualifié",
  PRET_SIGNATURE: "prêt_signature",
  CONVERTI: "converti",
  PERDU: "perdu",
} as const;

export const CONTACT_TYPES = {
  APPEL: "appel",
  EMAIL: "email",
  SMS: "sms",
  RENCONTRE: "rencontre",
} as const;

export const CONTACT_RESULTATS = {
  POSITIF: "positif",
  NEUTRE: "neutre",
  NEGATIF: "negatif",
} as const;

export const PROSPECTION_TYPES = {
  PORTE_A_PORTE: "porte_a_porte",
  TELEPHONIE: "telephonie",
  EVENEMENT: "evenement", 
  RECOMMANDATION: "recommandation",
  DIGITAL: "digital",
} as const;

// ============================================
// TYPES UTILITAIRES
// ============================================

export type ClientStatus = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];
export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];
export type TaskPriority = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];
export type SimCardStatus = typeof SIM_CARD_STATUSES[keyof typeof SIM_CARD_STATUSES];
export type ProspectType = typeof PROSPECT_TYPES[keyof typeof PROSPECT_TYPES];
export type ProspectStade = typeof PROSPECT_STADES[keyof typeof PROSPECT_STADES];
export type ContactType = typeof CONTACT_TYPES[keyof typeof CONTACT_TYPES];
export type ContactResultat = typeof CONTACT_RESULTATS[keyof typeof CONTACT_RESULTATS];
export type ProspectionType = typeof PROSPECTION_TYPES[keyof typeof PROSPECTION_TYPES];

// Interface pour les données enrichies (avec jointures)
export interface ClientWithDetails extends ClientSelect {
  user?: UserSelect;
  sim_card?: SimCardSelect;
  tasks?: TaskSelect[];
  points?: number;
  isEligibleForCommission?: boolean;
}

export interface TaskWithDetails extends TaskSelect {
  client?: ClientSelect;
  user?: UserSelect;
  assignee?: UserSelect;
}

export interface SimCardWithDetails extends SimCardSelect {
  client?: ClientSelect;
  user?: UserSelect;
  clientNom?: string | null;
  clientPrenom?: string | null;
  clientCivilite?: string | null;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Calcule les points générés par un produit
 */
export function calculateProductPoints(produit: string): number {
  const product = produit as keyof typeof PRODUCT_POINTS;
  return PRODUCT_POINTS[product] || 0;
}

/**
 * Formate le nom complet d'un client
 */
export function formatClientName(client: { prenom?: string | null; nom?: string | null; civilite?: string | null }): string {
  const parts = [];
  if (client.civilite) parts.push(client.civilite);
  if (client.prenom) parts.push(client.prenom);
  if (client.nom) parts.push(client.nom);
  return parts.join(" ");
}

/**
 * Vérifie si un client est éligible aux commissions
 */
export function isEligibleForCommission(client: ClientSelect): boolean {
  return client.status === CLIENT_STATUSES.INSTALLATION && 
         client.dateInstallation !== null;
}

// ============================================
// CONTRATS - Tables pour la gestion des contrats
// ============================================

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").references(() => contractTemplates.id),
  type: text("type").notNull(), 
  status: text("status").notNull().default("draft"),
  vendorName: text("vendorName").notNull(),
  vendorId: integer("vendorId").references(() => users.id),
  distributorName: text("distributorName").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  territoryAssigned: text("territoryAssigned"),
  contractData: json("contractData"), // Données flexibles du contrat
  documentPath: text("documentPath"), // Chemin vers le document généré
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  description: text("description"),
  fields: json("fields").notNull(), // Champs disponibles
  legalRequirements: json("legalRequirements").notNull(), // Exigences légales
  templatePath: text("templatePath"), // Chemin vers le template Word
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Table pour les termes contractuels éditables
export const contractTerms = pgTable("contract_terms", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").references(() => contractTemplates.id).notNull(),
  sectionName: text("sectionName").notNull(), // Nom de la section (ex: "Article 1", "Conditions générales")
  content: text("content").notNull(), // Contenu du terme
  position: integer("position").notNull(), // Position dans le document
  isEditable: boolean("isEditable").default(true), // Si le terme peut être modifié
  isRequired: boolean("isRequired").default(true), // Si le terme est obligatoire
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Table pour les balises de substitution globales
export const contractTags = pgTable("contract_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Nom de la balise (ex: "Code Postal", "Ville")
  description: text("description"), // Description de ce que représente la balise
  dataType: text("dataType").notNull().default("text"), // Type de données (text, date, number, etc.)
  isRequired: boolean("isRequired").default(true),
  defaultValue: text("defaultValue"), // Valeur par défaut
  validationPattern: text("validationPattern"), // Pattern de validation regex
  category: text("category"), // Catégorie (vendeur, client, contrat, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  changes: json("changes"), // Changements apportés
  generatedDocument: varchar("generated_document", { length: 500 }), // Chemin vers le document généré
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const legalComplianceChecks = pgTable("legal_compliance_checks", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").references(() => contracts.id).notNull(),
  checkType: text("checkType").notNull(), // signature_validity, terms_compliance, etc.
  status: text("status").notNull(), // pass, fail, warning
  details: json("details"), // Détails du contrôle
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  checkedBy: integer("checkedBy").references(() => users.id),
});

// Relations pour les contrats
export const contractsRelations = relations(contracts, ({ one, many }) => ({
  vendor: one(users, { fields: [contracts.vendorId], references: [users.id] }),
  versions: many(contractVersions),
  complianceChecks: many(legalComplianceChecks),
}));

export const contractTemplatesRelations = relations(contractTemplates, ({ many }) => ({
  // Relations si nécessaire
}));

export const contractVersionsRelations = relations(contractVersions, ({ one }) => ({
  contract: one(contracts, { fields: [contractVersions.contractId], references: [contracts.id] }),
  createdByUser: one(users, { fields: [contractVersions.createdBy], references: [users.id] }),
}));

export const legalComplianceChecksRelations = relations(legalComplianceChecks, ({ one }) => ({
  contract: one(contracts, { fields: [legalComplianceChecks.contractId], references: [contracts.id] }),
  checkedByUser: one(users, { fields: [legalComplianceChecks.checkedBy], references: [users.id] }),
}));

// Schemas de validation pour les contrats
export const contractInsertSchema = createInsertSchema(contracts, {
  vendorName: z.string().min(2, "Le nom du vendeur doit faire au moins 2 caractères"),
  distributorName: z.string().min(2, "Le nom du distributeur doit faire au moins 2 caractères"),
  type: z.string().min(1, "Le type de contrat est obligatoire"),
  status: z.string().min(1, "Le statut est obligatoire"),
});

export const contractSelectSchema = createSelectSchema(contracts);
export const contractTemplateInsertSchema = createInsertSchema(contractTemplates);
export const contractTemplateSelectSchema = createSelectSchema(contractTemplates);

// Schémas pour les termes contractuels
export const contractTermsInsertSchema = createInsertSchema(contractTerms, {
  sectionName: z.string().min(1, "Le nom de la section est obligatoire"),
  content: z.string().min(1, "Le contenu est obligatoire"),
  position: z.number().min(0, "La position doit être positive"),
});

export const contractTermsSelectSchema = createSelectSchema(contractTerms);

// Schémas pour les balises
export const contractTagsInsertSchema = createInsertSchema(contractTags, {
  name: z.string().min(1, "Le nom de la balise est obligatoire"),
  dataType: z.string().min(1, "Le type de données est obligatoire"),
});

export const contractTagsSelectSchema = createSelectSchema(contractTags);

export type ContractTermInsert = z.infer<typeof contractTermsInsertSchema>;
export type ContractTermSelect = z.infer<typeof contractTermsSelectSchema>;
export type ContractTagInsert = z.infer<typeof contractTagsInsertSchema>;
export type ContractTagSelect = z.infer<typeof contractTagsSelectSchema>;

export type Contract = z.infer<typeof contractSelectSchema>;
export type ContractInsert = z.infer<typeof contractInsertSchema>;
export type ContractTemplate = z.infer<typeof contractTemplateSelectSchema>;
export type ContractTemplateInsert = z.infer<typeof contractTemplateInsertSchema>;

/**
 * Calcule l'âge d'un client
 */
export function calculateAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null;
  
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// ============================================
// COMPATIBILITÉ LEGACY - Pour migration progressive
// ============================================

// Alias pour compatibilité avec l'ancien code
export const simCards = sim_cards;

// ============================================
// EMAILS TABLE - Système de messagerie
// ============================================
export const emails: any = pgTable("emails", {
  id: serial("id").primaryKey(),
  messageId: text("messageId").unique(), // ID unique de l'email
  subject: text("subject").notNull(),
  fromEmail: text("fromEmail").notNull(),
  fromName: text("fromName"),
  toEmail: text("toEmail").notNull(),
  toName: text("toName"),
  ccEmails: json("ccEmails"), // Array d'emails en copie
  bccEmails: json("bccEmails"), // Array d'emails en copie cachée
  replyTo: text("replyTo"),
  htmlContent: text("htmlContent"),
  textContent: text("textContent"),
  attachments: json("attachments"), // Array des pièces jointes
  isRead: boolean("isRead").default(false),
  isStarred: boolean("isStarred").default(false),
  isImportant: boolean("isImportant").default(false),
  isSpam: boolean("isSpam").default(false),
  isDeleted: boolean("isDeleted").default(false),
  direction: text("direction").notNull(), // 'inbound' ou 'outbound'
  status: text("status").default("delivered"), // 'sent', 'delivered', 'read', 'failed'
  clientId: integer("clientId").references(() => clients.id), // Lié à un client si applicable
  userId: integer("userId").references(() => users.id).notNull(), // Utilisateur propriétaire
  threadId: integer("threadId"), // Pour grouper les conversations
  inReplyTo: integer("inReplyTo").references(() => emails.id), // Référence email parent
  dateReceived: timestamp("dateReceived"),
  dateSent: timestamp("dateSent"),
  dateRead: timestamp("dateRead"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("htmlContent"),
  textContent: text("textContent"),
  category: text("category"), // 'prospection', 'suivi', 'support', etc.
  isActive: boolean("isActive").default(true),
  variables: json("variables"), // Variables disponibles dans le template
  userId: integer("userId").references(() => users.id).notNull(), // Créateur du template
  isGlobal: boolean("isGlobal").default(false), // Template accessible à tous
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// RELATIONS EMAILS
// ============================================
export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, { fields: [emails.userId], references: [users.id] }),
  client: one(clients, { fields: [emails.clientId], references: [clients.id] }),
  replyToEmail: one(emails, { fields: [emails.inReplyTo], references: [emails.id] }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, { fields: [emailTemplates.userId], references: [users.id] }),
}));

// ============================================
// TYPES & SCHEMAS EXPORTS
// ============================================
export type SimCard = SimCardSelect;
export type Client = ClientSelect;
export type Task = TaskSelect;
export type User = UserSelect;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;