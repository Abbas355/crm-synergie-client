/**
 * SCHÉMA UNIFIÉ - FREE SALES MANAGEMENT
 * 
 * ✅ Noms de colonnes EXACTEMENT identiques à PostgreSQL
 * ✅ Pas de mapping camelCase/snake_case
 * ✅ Structure cohérente dans toute l'application
 * ✅ Types optimisés pour les performances
 */

import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  codeVendeur: text("codeVendeur"),
  niveau: text("niveau").default("CQ"), // CQ, ETT, ETL, Manager
  active: boolean("active").default(true),
  is_admin: boolean("is_admin").default(false),
  avatar: text("avatar"),
  lastLogin: timestamp("lastLogin"),
  updatedAt: timestamp("updatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// CLIENTS TABLE - Noms EXACTEMENT identiques à PostgreSQL
// ============================================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  userid: integer("userid").references(() => users.id),
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
  typeRecommandation: text("typeRecommandation"),
  civiliteProspect: text("civiliteProspect"),
  prenomProspect: text("prenomProspect"),
  nomProspect: text("nomProspect"),
  mobileProspect: text("mobileProspect"),
  codePostalProspect: text("codePostalProspect"),
  villeProspect: text("villeProspect"),
  commentaire: text("commentaire"),
  dateSignature: timestamp("dateSignature"),
  dateRendezVous: timestamp("dateRendezVous"),
  dateInstallation: timestamp("dateInstallation"),
  forfaitType: text("forfaitType"),
  contratSigne: boolean("contratSigne").default(false),
  identiteValidee: boolean("identiteValidee").default(false),
  ribValide: boolean("ribValide").default(false),
  justificatifDomicileValide: boolean("justificatifDomicileValide").default(false),
  deletedAt: timestamp("deletedAt"),
  codeVendeur: text("codeVendeur"),
  telephone: text("telephone"),
});

// ============================================
// SIM_CARDS TABLE - Noms EXACTEMENT identiques à PostgreSQL
// ============================================
export const sim_cards = pgTable("sim_cards", {
  id: serial("id").primaryKey(),
  codeVendeur: text("codeVendeur"),
  numero: text("numero").notNull().unique(),
  statut: text("statut").default("disponible"),
  client_id: integer("client_id").references(() => clients.id),
  dateAttribution: timestamp("dateAttribution"),
  note: text("note"),
  user_id: integer("user_id").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  dateActivation: timestamp("dateActivation"),
  dateInstallation: timestamp("dateInstallation"),
});

// ============================================
// TASKS TABLE - Gestion des tâches
// ============================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, in_progress, completed
  priority: text("priority").default("medium"), // low, medium, high
  category: text("category").default("general"), // general, client, administrative
  client_id: integer("client_id").references(() => clients.id),
  user_id: integer("user_id").references(() => users.id).notNull(),
  assigned_to: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  estimated_duration: integer("estimated_duration"), // en minutes
  actual_duration: integer("actual_duration"), // en minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// SETTINGS TABLE - Configuration application
// ============================================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").default("string"), // string, json, file
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// RELATIONS - Définition des relations entre tables
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  tasks: many(tasks),
  sim_cards: many(sim_cards),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userid], references: [users.id] }),
  tasks: many(tasks),
  sim_card: one(sim_cards, { fields: [clients.id], references: [sim_cards.client_id] }),
}));

export const sim_cardsRelations = relations(sim_cards, ({ one }) => ({
  client: one(clients, { fields: [sim_cards.client_id], references: [clients.id] }),
  user: one(users, { fields: [sim_cards.user_id], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  client: one(clients, { fields: [tasks.client_id], references: [clients.id] }),
  user: one(users, { fields: [tasks.user_id], references: [users.id] }),
  assignee: one(users, { fields: [tasks.assigned_to], references: [users.id] }),
}));

// ============================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================

// Schémas pour les clients
export const clientsInsertSchema = createInsertSchema(clients, {
  prenom: (schema) => schema.min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: (schema) => schema.min(2, "Le nom doit contenir au moins 2 caractères"),
  email: (schema) => schema.email("Email invalide").optional(),
  telephone: (schema) => schema.optional(),
  identifiantContrat: (schema) => schema.optional(),
  produit: (schema) => schema.min(1, "Le produit est requis"),
});

export const clientsSelectSchema = createSelectSchema(clients);
export type ClientInsert = z.infer<typeof clientsInsertSchema>;
export type ClientSelect = z.infer<typeof clientsSelectSchema>;

// Schémas pour les cartes SIM
export const sim_cardsInsertSchema = createInsertSchema(sim_cards, {
  numero: (schema) => schema.min(15, "Le numéro doit contenir au moins 15 caractères"),
  statut: (schema) => schema.default("disponible"),
});

export const sim_cardsSelectSchema = createSelectSchema(sim_cards);
export type SimCardInsert = z.infer<typeof sim_cardsInsertSchema>;
export type SimCardSelect = z.infer<typeof sim_cardsSelectSchema>;

// Schémas pour les tâches
export const tasksInsertSchema = createInsertSchema(tasks, {
  title: (schema) => schema.min(5, "Le titre doit contenir au moins 5 caractères"),
  description: (schema) => schema.optional(),
  status: (schema) => schema.default("pending"),
  priority: (schema) => schema.default("medium"),
});

export const tasksSelectSchema = createSelectSchema(tasks);
export type TaskInsert = z.infer<typeof tasksInsertSchema>;
export type TaskSelect = z.infer<typeof tasksSelectSchema>;

// Schémas pour les utilisateurs
export const usersInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: (schema) => schema.min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  email: (schema) => schema.email("Email invalide").optional(),
});

export const usersSelectSchema = createSelectSchema(users);
export type UserInsert = z.infer<typeof usersInsertSchema>;
export type UserSelect = z.infer<typeof usersSelectSchema>;

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

// ============================================
// TYPES UTILITAIRES
// ============================================

export type ClientStatus = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];
export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];
export type TaskPriority = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];
export type SimCardStatus = typeof SIM_CARD_STATUSES[keyof typeof SIM_CARD_STATUSES];

// Interface pour les données enrichies (avec jointures)
export interface ClientWithDetails extends ClientSelect {
  user?: UserSelect;
  sim_card?: SimCardSelect;
  tasks?: TaskSelect[];
}

export interface TaskWithDetails extends TaskSelect {
  client?: ClientSelect;
  user?: UserSelect;
  assignee?: UserSelect;
}

export interface SimCardWithDetails extends SimCardSelect {
  client?: ClientSelect;
  user?: UserSelect;
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
export type SimCard = SimCardSelect;
export type Client = ClientSelect;
export type Task = TaskSelect;
export type User = UserSelect;
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // created, assigned, status_changed, completed, etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  taskId: integer("task_id").references(() => tasks.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Cartes SIM table
export const simCards = pgTable("sim_cards", {
  id: serial("id").primaryKey(),
  codeVendeur: text("codeVendeur").notNull(),
  numero: text("numero").notNull().unique(),
  statut: text("statut").notNull().default("disponible"),
  clientId: integer("client_id").references(() => clients.id),
  dateAttribution: timestamp("dateAttribution"),
  dateActivation: timestamp("dateActivation"),
  dateInstallation: timestamp("dateInstallation"),
  note: text("note"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  contacts: many(contacts),
  campaigns: many(campaigns),
  tasks: many(tasks),
  activities: many(activities),
  simCards: many(simCards),
  taskComments: many(taskComments),
  taskHistory: many(taskHistory),
  escalatedTasks: many(tasks),
  originallyAssignedTasks: many(tasks),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userid], references: [users.id] }),
  contacts: many(contacts),
  tasks: many(tasks),
  activities: many(activities),
  simCards: many(simCards),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, { fields: [contacts.userId], references: [users.id] }),
  client: one(clients, { fields: [contacts.clientId], references: [clients.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  tasks: many(tasks),
  activities: many(activities),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  campaign: one(campaigns, { fields: [tasks.campaignId], references: [campaigns.id] }),
  activities: many(activities),
  comments: many(taskComments),
  history: many(taskHistory),
  escalationUser: one(users, { fields: [tasks.escalationUserId], references: [users.id] }),
  originalAssignee: one(users, { fields: [tasks.originalAssigneeId], references: [users.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  subTasks: many(tasks),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({ many }) => ({
  // Relation pour tracer les tâches générées depuis ce template
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, { fields: [taskComments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskComments.userId], references: [users.id] }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, { fields: [taskHistory.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskHistory.userId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  client: one(clients, { fields: [activities.clientId], references: [clients.id] }),
  campaign: one(campaigns, { fields: [activities.campaignId], references: [campaigns.id] }),
  task: one(tasks, { fields: [activities.taskId], references: [tasks.id] }),
}));

export const simCardsRelations = relations(simCards, ({ one }) => ({
  user: one(users, { fields: [simCards.userId], references: [users.id] }),
  client: one(clients, { fields: [simCards.clientId], references: [clients.id] }),
}));

// Create schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const customClientSchema = z.object({
  civilite: z.string().min(1, "La civilité est requise"),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Merci de fournir un email valide"),
  telephone: z.string().min(8, "Numéro de téléphone invalide"),
  dateNaissance: z.string().refine((val) => {
    if (!val) return false;
    const [day, month, year] = val.split('/').map(Number);
    const dateOfBirth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age >= 18;
  }, "Le client doit avoir au moins 18 ans"),
  adresse: z.string().min(1, "L'adresse est requise"),
  codePostal: z.string().min(5, "Code postal invalide"),
  ville: z.string().min(1, "La ville est requise"),
  produit: z.string().min(1, "Le produit est requis"),
  identifiantContrat: z.string().optional(),
  codeVendeur: z.string().regex(/^FR\d{8}$/, "Le code vendeur doit être au format FR suivi de 8 chiffres").optional(),
  carteSIM: z.string().optional(),
  portabilite: z.string().optional(),
  numeroPorter: z.string().optional(),
  source: z.string().min(1, "La source est requise"),
  typeRecommandation: z.string().optional(),
  civiliteProspect: z.string().optional(),
  prenomProspect: z.string().optional(),
  nomProspect: z.string().optional(),
  mobileProspect: z.string().optional(),
  codePostalProspect: z.string().optional(),
  villeProspect: z.string().optional(),
  commentaire: z.string().optional(),
  dateSignature: z.union([z.date(), z.string()]).optional(),
  userId: z.number(),
  status: z.string().optional().default("enregistre"),
});

// Validation schemas pour les tâches améliorées
export const taskSchema = createInsertSchema(tasks, {
  title: (schema) => schema.min(3, "Le titre doit contenir au moins 3 caractères"),
  description: (schema) => schema.optional(),
  status: (schema) => schema.default("pending"),
  priority: (schema) => schema.default("medium"),
  category: (schema) => schema.default("general"),
  estimatedDuration: (schema) => schema.positive("La durée doit être positive").optional(),
});

export const updateTaskSchema = taskSchema.partial();

export type TaskEnhanced = typeof tasks.$inferSelect;
export type InsertTaskEnhanced = z.infer<typeof taskSchema>;
export type UpdateTaskEnhanced = z.infer<typeof updateTaskSchema>;

// Schéma spécifique pour les formulaires clients avec champ phone standardisé
export const clientFormSchema = z.object({
  civilite: z.string().min(1, "La civilité est requise"),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Merci de fournir un email valide"),
  telephone: z.string().min(8, "Numéro de téléphone invalide"),
  dateNaissance: z.string()
    .min(1, "La date de naissance est requise")
    .refine((val) => {
      // Vérifier le format jj/mm/aaaa
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(val)) return false;
      
      const [day, month, year] = val.split('/').map(Number);
      
      // Vérifier la validité de la date
      const dateOfBirth = new Date(year, month - 1, day);
      if (dateOfBirth.getDate() !== day || 
          dateOfBirth.getMonth() !== month - 1 || 
          dateOfBirth.getFullYear() !== year) {
        return false;
      }
      
      // Vérifier l'âge (18 ans minimum)
      const today = new Date();
      let age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
      }
      return age >= 18;
    }, "Format invalide (jj/mm/aaaa) ou client mineur (18 ans minimum)"),
  adresse: z.string().min(1, "L'adresse est requise"),
  codePostal: z.string().min(5, "Code postal invalide"),
  ville: z.string().min(1, "La ville est requise"),
  produit: z.string().min(1, "Le produit est requis"),
  identifiantContrat: z.string()
    .min(1, "L'identifiant contrat est requis"),
  codeVendeur: z.string().regex(/^FR\d{8}$/, "Le code vendeur doit être au format FR suivi de 8 chiffres").optional(),
  carteSIM: z.string().optional(),
  portabilite: z.string().optional(),
  numeroPorter: z.string().optional(),
  source: z.string().min(1, "La source est requise"),
  typeRecommandation: z.string().optional(),
  civiliteProspect: z.string().optional(),
  prenomProspect: z.string().optional(),
  nomProspect: z.string().optional(),
  mobileProspect: z.string().optional(),
  codePostalProspect: z.string().optional(),
  villeProspect: z.string().optional(),
  commentaire: z.string().optional(),
  dateSignature: z.union([z.date(), z.string()]).optional(),
  dateRendezVous: z.string().optional(),
  dateInstallation: z.string().optional(),
  userId: z.number(),
  status: z.string().optional().default("enregistre"),
  mandatSepa: z.boolean().default(false),
  contratSigne: z.boolean().default(false),
  bonCommande: z.boolean().default(false),
  ribClient: z.boolean().default(false),
  copiePieceIdentite: z.boolean().default(false),
  attestationHonneur: z.boolean().default(false),
  clientRecommandation: z.number().optional(),
  prospectCivilite: z.string().optional(),
  prospectPrenom: z.string().optional(),
  prospectNom: z.string().optional(),
  prospectMobile: z.string().optional(),
  prospectCodePostal: z.string().optional(),
  prospectVille: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const insertClientSchema = customClientSchema.refine((data) => {
  // Vérifier format identifiant contrat selon produit choisi
  if (data.produit) {
    if (["Freebox Pop", "Freebox Essentiel", "Freebox Ultra"].includes(data.produit)) {
      if (!data.identifiantContrat || !/^FO\d{8}$/.test(data.identifiantContrat)) {
        return false;
      }
    } else if (data.produit === "Forfait 5G") {
      if (!data.identifiantContrat || !/^\d{8}$/.test(data.identifiantContrat)) {
        return false;
      }
    }
  }
  
  // Vérifier la portabilité
  if (data.portabilite === "Portabilité" && !data.numeroPorter) {
    return false;
  }
  
  // Pour source = Recommandation, vérifier les champs prospects
  if (data.source === "Recommandation" && data.typeRecommandation === "Prospect") {
    const hasProspectName = data.prenomProspect || data.nomProspect;
    return hasProspectName && !!data.mobileProspect && !!data.codePostalProspect && !!data.villeProspect;
  }
  
  return true;
}, {
  message: "Veuillez remplir tous les champs requis selon les règles spécifiques",
  path: ["form"]
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  phone: true,
  position: true,
  clientId: true,
  userId: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  userId: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  clientId: true,
  campaignId: true,
  userId: true,
  assignedTo: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  title: true,
  type: true,
  userId: true,
  clientId: true,
  campaignId: true,
  taskId: true,
});

export const insertSimCardSchema = createInsertSchema(simCards).pick({
  codeVendeur: true,
  numero: true,
  statut: true,
  clientId: true,
  dateAttribution: true,
  dateActivation: true,
  note: true,
  userId: true,
}).superRefine((data, ctx) => {
  // Vérifier format numéro de carte SIM (19 chiffres commençant par 893315022201)
  if (data.numero && !/^893315022201\d{7}$/.test(data.numero)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le numéro de carte SIM doit être au format 893315022201 suivi de 7 chiffres",
      path: ["numero"]
    });
  }
  
  // Vérifier que le statut est valide
  if (data.statut && !["disponible", "affecte"].includes(data.statut)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le statut doit être 'disponible' ou 'affecte'",
      path: ["statut"]
    });
  }

  // Si la carte est affectée, elle doit avoir un client
  if (data.statut === "affecte" && !data.clientId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une carte SIM affectée doit être liée à un client",
      path: ["clientId"]
    });
  }

  // Si la carte est affectée, elle doit avoir une date d'attribution
  if (data.statut === "affecte" && !data.dateAttribution) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une carte SIM affectée doit avoir une date d'attribution",
      path: ["dateAttribution"]
    });
  }
});

// Schéma de mise à jour partielle pour les cartes SIM
export const updateSimCardSchema = z.object({
  codeVendeur: z.string().optional(),
  numero: z.string().optional(),
  statut: z.string().optional(),
  clientId: z.number().nullable().optional(),
  dateAttribution: z.union([z.date(), z.string()]).nullable().optional(),
  dateActivation: z.union([z.date(), z.string()]).nullable().optional(),
  dateInstallation: z.union([z.date(), z.string()]).nullable().optional(),
  note: z.string().nullable().optional(),
});

// Tables pour le module Recrutement de Vendeurs
export const recruiters = pgTable("recruiters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  codeVendeur: text("codeVendeur").notNull().unique(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  dateNaissance: text("dateNaissance"),
  adresse: text("adresse"),
  codePostal: text("code_postal"),
  ville: text("ville"),
  niveauExperience: text("niveau_experience"), // débutant, intermédiaire, expert
  statut: text("statut").notNull().default("actif"), // actif, inactif, suspendu
  niveau: integer("niveau").default(1), // Niveau dans la hiérarchie
  commissionBase: decimal("commission_base", { precision: 10, scale: 2 }).default("0"),
  dateActivation: timestamp("dateActivation").defaultNow(),
  avatar: text("avatar"),
  description: text("description"),
  competences: json("competences").$type<string[]>().default([]),
  recruteurId: integer("recruteur_id"), // Traitons cette référence séparément pour éviter la référence circulaire
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const recruitmentProspects = pgTable("recruitment_prospects", {
  id: serial("id").primaryKey(),
  prenom: text("prenom").notNull(),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  adresse: text("adresse"),
  codePostal: text("code_postal"),
  ville: text("ville"),
  nomSociete: text("nom_societe"), // Ajout: nom de la société (facultatif)
  siret: text("siret"), // Ajout: numéro SIRET (facultatif)
  codeVendeur: text("codeVendeur"), // Ajout: code vendeur pour le parrainage au format FR+8 chiffres
  source: text("source").notNull(), // site web, réseaux sociaux, recommandation, autre
  motivation: text("motivation"),
  experiencePrecedente: text("experience_precedente"), // oui, non
  disponibilite: text("disponibilite"), // immédiate, 1 mois, 3 mois
  stade: text("stade").notNull().default("nouveau"), // nouveau, contacté, entretien, formation, actif, refusé
  notes: text("notes"),
  
  // Champs spécifiques pour la formation
  formationCompletee: boolean("formation_completee").default(false),
  attestationSurHonneur: boolean("attestation_sur_honneur").default(false), // Ajout: attestation sur l'honneur au lieu du score
  scoreQuiz: integer("score_quiz"), // Score en pourcentage (maintenu pour compatibilité)
  dateFormation: timestamp("date_formation"),
  
  // Champs pour le formulaire/contrat
  formulaireComplete: boolean("formulaire_complete").default(false),
  pieceIdentiteDeposee: boolean("piece_identite_deposee").default(false),
  ribDepose: boolean("rib_depose").default(false),
  contratGenere: boolean("contrat_genere").default(false),
  contratSigne: boolean("contratSigne").default(false),
  dateSignatureContrat: timestamp("date_signature_contrat"),
  
  recruteurId: integer("recruteur_id").references(() => recruiters.id).notNull(), // Qui a enregistré ce prospect
  assigneA: integer("assigne_a").references(() => recruiters.id), // Assigné à quel recruteur
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const recruitmentStages = pgTable("recruitment_stages", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  description: text("description"),
  ordre: integer("ordre").notNull(), // L'ordre d'affichage/progression
  dureeEstimee: integer("duree_estimee"), // En jours
  actif: boolean("actif").default(true),
  couleur: text("couleur").default("#3b82f6"), // Code couleur pour l'affichage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recruitmentActivities = pgTable("recruitment_activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, appel, entretien, formation, etc.
  titre: text("titre").notNull(),
  description: text("description"),
  dateActivite: timestamp("date_activite").notNull(),
  duree: integer("duree"), // En minutes
  resultat: text("resultat"), // positif, négatif, à suivre
  notes: text("notes"),
  prospectId: integer("prospect_id").references(() => recruitmentProspects.id).notNull(),
  stadeId: integer("stade_id").references(() => recruitmentStages.id),
  recruteurId: integer("recruteur_id").references(() => recruiters.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recruitmentNetworkStructure = pgTable("recruitment_network_structure", {
  id: serial("id").primaryKey(),
  recruteurId: integer("recruteur_id").references(() => recruiters.id).notNull(),
  recruteParId: integer("recrute_par_id").references(() => recruiters.id).notNull(),
  niveauHierarchique: integer("niveau_hierarchique").notNull(), // 1 = direct, 2 = 2ème niveau, etc.
  dateRecrutement: timestamp("date_recrutement").notNull(),
  tauxCommission: decimal("taux_commission", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Types de documents de recrutement
export const DOCUMENT_TYPES = {
  PIECE_IDENTITE: "piece_identite",
  RIB: "rib",
  JUSTIFICATIF_DOMICILE: "justificatif_domicile",
  CONTRAT_VIERGE: "contrat_vierge",
  CONTRAT_SIGNE: "contratSigne",
  ATTESTATION_FORMATION: "attestationFormation",
  ATTESTATION_SUR_HONNEUR: "attestation_sur_honneur",
  AUTRE: "autre"
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const recruitmentDocuments = pgTable("recruitment_documents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  nomFichier: text("nom_fichier").notNull(),
  cheminFichier: text("chemin_fichier").notNull(),
  tailleFichier: integer("taille_fichier"), // en octets
  dateUpload: timestamp("date_upload").defaultNow().notNull(),
  prospectId: integer("prospect_id").references(() => recruitmentProspects.id).notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id).notNull(),
  contenuDocument: text("contenu_document"), // Contenu JSON ou HTML du document
  estSigne: boolean("est_signe").default(false),
  signatureData: json("signature_data"), // Données de signature (timestamp, IP, méthode, etc.)
  dateSignature: timestamp("dateSignature"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations pour les tables de recrutement
// Définir d'abord la relation pour recruiters.recruteurId
export const recruitersRelations = relations(recruiters, ({ one, many }) => ({
  user: one(users, { fields: [recruiters.userId], references: [users.id] }),
  prospects: many(recruitmentProspects, { relationName: "recruteurProspectsRelation" }),
  prospectsAssignes: many(recruitmentProspects, { relationName: "recruteurProspectsAssignesRelation" }),
  activites: many(recruitmentActivities),
  recrutesDirects: many(recruitmentNetworkStructure, { relationName: "recruteurRecrutesDirectsRelation" }),
  recrutePar: many(recruitmentNetworkStructure, { relationName: "recruteurRecruteParRelation" }),
}));

// Note: La référence circulaire est gérée au niveau de la base de données
// Cette contrainte est ajoutée séparément dans le script apply-schema.ts

export const recruitmentProspectsRelations = relations(recruitmentProspects, ({ one, many }) => ({
  recruteur: one(recruiters, { fields: [recruitmentProspects.recruteurId], references: [recruiters.id], relationName: "recruteurProspectsRelation" }),
  assigneA: one(recruiters, { fields: [recruitmentProspects.assigneA], references: [recruiters.id], relationName: "recruteurProspectsAssignesRelation" }),
  activites: many(recruitmentActivities),
  documents: many(recruitmentDocuments),
}));

export const recruitmentDocumentsRelations = relations(recruitmentDocuments, ({ one }) => ({
  prospect: one(recruitmentProspects, { fields: [recruitmentDocuments.prospectId], references: [recruitmentProspects.id] }),
  uploadedBy: one(users, { fields: [recruitmentDocuments.uploadedById], references: [users.id] }),
}));

// Tables pour le système de messagerie
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").unique(), // ID unique de l'email (pour éviter les doublons)
  subject: text("subject").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  ccEmails: json("cc_emails"), // Array d'emails en copie
  bccEmails: json("bcc_emails"), // Array d'emails en copie cachée
  replyTo: text("reply_to"),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  attachments: json("attachments"), // Array des pièces jointes
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  isImportant: boolean("is_important").default(false),
  isSpam: boolean("is_spam").default(false),
  isDeleted: boolean("is_deleted").default(false),
  direction: text("direction").notNull(), // 'inbound' ou 'outbound'
  status: text("status").default("delivered"), // 'sent', 'delivered', 'read', 'failed'
  clientId: integer("client_id").references(() => clients.id), // Lié à un client si applicable
  userId: integer("user_id").references(() => users.id).notNull(), // Utilisateur propriétaire
  threadId: integer("thread_id"), // Pour grouper les conversations
  inReplyTo: integer("in_reply_to").references(() => emails.id), // Email parent si c'est une réponse
  dateReceived: timestamp("date_received"),
  dateSent: timestamp("date_sent"),
  dateRead: timestamp("date_read"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  category: text("category"), // 'prospection', 'suivi', 'support', etc.
  isActive: boolean("is_active").default(true),
  variables: json("variables"), // Variables disponibles dans le template
  userId: integer("user_id").references(() => users.id).notNull(), // Créateur du template
  isGlobal: boolean("is_global").default(false), // Template accessible à tous
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const emailTracking = pgTable("email_tracking", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => emails.id).notNull(),
  eventType: text("event_type").notNull(), // 'sent', 'delivered', 'opened', 'clicked', 'bounced'
  eventData: json("event_data"), // Données supplémentaires de l'événement
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const emailReminders = pgTable("email_reminders", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => emails.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderType: text("reminder_type").notNull(), // 'follow_up', 'no_response', 'custom'
  message: text("message"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailFolders = pgTable("email_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#3b82f6"),
  userId: integer("user_id").references(() => users.id).notNull(),
  isSystem: boolean("is_system").default(false), // Dossiers système (Inbox, Sent, etc.)
  parentId: integer("parent_id").references(() => emailFolders.id), // Pour les sous-dossiers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailFolderItems = pgTable("email_folder_items", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => emails.id).notNull(),
  folderId: integer("folder_id").references(() => emailFolders.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Relations pour les emails
export const emailsRelations = relations(emails, ({ one, many }) => ({
  client: one(clients, { fields: [emails.clientId], references: [clients.id] }),
  user: one(users, { fields: [emails.userId], references: [users.id] }),
  inReplyToEmail: one(emails, { fields: [emails.inReplyTo], references: [emails.id], relationName: "emailReplies" }),
  replies: many(emails, { relationName: "emailReplies" }),
  tracking: many(emailTracking),
  reminders: many(emailReminders),
  folderItems: many(emailFolderItems),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, { fields: [emailTemplates.userId], references: [users.id] }),
}));

export const emailTrackingRelations = relations(emailTracking, ({ one }) => ({
  email: one(emails, { fields: [emailTracking.emailId], references: [emails.id] }),
}));

export const emailRemindersRelations = relations(emailReminders, ({ one }) => ({
  email: one(emails, { fields: [emailReminders.emailId], references: [emails.id] }),
  user: one(users, { fields: [emailReminders.userId], references: [users.id] }),
}));

export const emailFoldersRelations = relations(emailFolders, ({ one, many }) => ({
  user: one(users, { fields: [emailFolders.userId], references: [users.id] }),
  parent: one(emailFolders, { fields: [emailFolders.parentId], references: [emailFolders.id], relationName: "folderHierarchy" }),
  children: many(emailFolders, { relationName: "folderHierarchy" }),
  items: many(emailFolderItems),
}));

export const emailFolderItemsRelations = relations(emailFolderItems, ({ one }) => ({
  email: one(emails, { fields: [emailFolderItems.emailId], references: [emails.id] }),
  folder: one(emailFolders, { fields: [emailFolderItems.folderId], references: [emailFolders.id] }),
}));

export const recruitmentStagesRelations = relations(recruitmentStages, ({ many }) => ({
  activites: many(recruitmentActivities),
}));

// Schémas de validation pour les emails
export const emailInsertSchema = createInsertSchema(emails, {
  subject: (schema) => schema.min(1, "Le sujet est obligatoire"),
  fromEmail: (schema) => schema.email("Adresse email invalide"),
  toEmail: (schema) => schema.email("Adresse email invalide"),
  direction: (schema) => schema.refine(val => ['inbound', 'outbound'].includes(val), "Direction invalide"),
});

export const emailSelectSchema = z.object({
  id: z.number(),
  messageId: z.string().nullable(),
  subject: z.string(),
  fromEmail: z.string(),
  fromName: z.string().nullable(),
  toEmail: z.string(),
  toName: z.string().nullable(),
  ccEmails: z.any().nullable(),
  bccEmails: z.any().nullable(),
  replyTo: z.string().nullable(),
  htmlContent: z.string().nullable(),
  textContent: z.string().nullable(),
  attachments: z.any().nullable(),
  isRead: z.boolean(),
  isStarred: z.boolean(),
  isImportant: z.boolean(),
  isSpam: z.boolean(),
  isDeleted: z.boolean(),
  direction: z.string(),
  status: z.string(),
  clientId: z.number().nullable(),
  userId: z.number(),
  threadId: z.number().nullable(),
  inReplyTo: z.number().nullable(),
  dateReceived: z.date().nullable(),
  dateSent: z.date().nullable(),
  dateRead: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const emailTemplateInsertSchema = createInsertSchema(emailTemplates, {
  name: (schema) => schema.min(1, "Le nom est obligatoire"),
  subject: (schema) => schema.min(1, "Le sujet est obligatoire"),
});

export const emailTemplateSelectSchema = z.object({
  id: z.number(),
  name: z.string(),
  subject: z.string(),
  htmlContent: z.string().nullable(),
  textContent: z.string().nullable(),
  category: z.string().nullable(),
  isActive: z.boolean(),
  variables: z.any().nullable(),
  userId: z.number(),
  isGlobal: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Email = z.infer<typeof emailSelectSchema>;
export type EmailInsert = z.infer<typeof emailInsertSchema>;
export type EmailTemplate = z.infer<typeof emailTemplateSelectSchema>;
export type EmailTemplateInsert = z.infer<typeof emailTemplateInsertSchema>;

// Relations pour les informations de groupe
export const groupInfoRelations = relations(groupInfo, ({ one }) => ({
  author: one(users, { fields: [groupInfo.authorId], references: [users.id] }),
}));

// Schémas de validation pour les informations de groupe
export const groupInfoInsertSchema = createInsertSchema(groupInfo, {
  title: (schema) => schema.min(1, "Le titre est obligatoire"),
  content: (schema) => schema.min(1, "Le contenu est obligatoire"),
  category: (schema) => schema.min(1, "La catégorie est obligatoire"),
});

export const groupInfoSelectSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  category: z.string(),
  priority: z.string(),
  isPublished: z.boolean(),
  isPinned: z.boolean(),
  targetAudience: z.string(),
  authorId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GroupInfo = z.infer<typeof groupInfoSelectSchema>;
export type GroupInfoInsert = z.infer<typeof groupInfoInsertSchema>;

export const recruitmentActivitiesRelations = relations(recruitmentActivities, ({ one }) => ({
  prospect: one(recruitmentProspects, { fields: [recruitmentActivities.prospectId], references: [recruitmentProspects.id] }),
  stade: one(recruitmentStages, { fields: [recruitmentActivities.stadeId], references: [recruitmentStages.id] }),
  recruteur: one(recruiters, { fields: [recruitmentActivities.recruteurId], references: [recruiters.id] }),
}));

export const recruitmentNetworkStructureRelations = relations(recruitmentNetworkStructure, ({ one }) => ({
  recruteur: one(recruiters, { fields: [recruitmentNetworkStructure.recruteurId], references: [recruiters.id], relationName: "recruteurRecrutesDirectsRelation" }),
  recrutePar: one(recruiters, { fields: [recruitmentNetworkStructure.recruteParId], references: [recruiters.id], relationName: "recruteurRecruteParRelation" }),
}));

// Schémas de validation pour les nouvelles tables
export const insertRecruiterSchema = createInsertSchema(recruiters).pick({
  userId: true,
  nom: true,
  prenom: true,
  codeVendeur: true,
  email: true,
  telephone: true,
  dateNaissance: true,
  adresse: true,
  codePostal: true,
  ville: true,
  niveauExperience: true,
  statut: true,
  niveau: true,
  commissionBase: true,
  avatar: true,
  description: true,
  competences: true,
  recruteurId: true,
});

export const insertRecruitmentProspectSchema = createInsertSchema(recruitmentProspects).pick({
  prenom: true,
  nom: true,
  email: true,
  telephone: true,
  adresse: true,
  codePostal: true,
  ville: true,
  nomSociete: true, // Nouveaux champs
  siret: true,      // Nouveaux champs
  codeVendeur: true, // Nouveau champ pour le parrainage
  source: true,
  motivation: true,
  experiencePrecedente: true,
  disponibilite: true,
  stade: true,
  notes: true,
  
  // Champs pour la formation
  formationCompletee: true,
  attestationSurHonneur: true, // Nouveau champ pour l'attestation
  scoreQuiz: true,
  dateFormation: true,
  
  // Champs pour le formulaire
  formulaireComplete: true,
  pieceIdentiteDeposee: true,
  ribDepose: true,
  contratGenere: true,
  contratSigne: true,
  dateSignatureContrat: true,
  
  recruteurId: true,
  assigneA: true,
});

export const insertRecruitmentStageSchema = createInsertSchema(recruitmentStages).pick({
  nom: true,
  description: true,
  ordre: true,
  dureeEstimee: true,
  actif: true,
  couleur: true,
});

export const insertRecruitmentActivitySchema = createInsertSchema(recruitmentActivities).pick({
  type: true,
  titre: true,
  description: true,
  dateActivite: true,
  duree: true,
  resultat: true,
  notes: true,
  prospectId: true,
  stadeId: true,
  recruteurId: true,
});

export const insertRecruitmentNetworkStructureSchema = createInsertSchema(recruitmentNetworkStructure).pick({
  recruteurId: true,
  recruteParId: true,
  niveauHierarchique: true,
  dateRecrutement: true,
  tauxCommission: true,
});

export const insertRecruitmentDocumentSchema = createInsertSchema(recruitmentDocuments).pick({
  type: true,
  nomFichier: true,
  cheminFichier: true,
  tailleFichier: true,
  dateUpload: true,
  prospectId: true,
  uploadedById: true,
  contenuDocument: true,
  estSigne: true,
  signatureData: true,
  dateSignature: true,
});

// Export des types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertSimCard = z.infer<typeof insertSimCardSchema>;
export type SimCard = typeof simCards.$inferSelect & {
  clientNom?: string;
};

// Types pour le module de recrutement
export type InsertRecruiter = z.infer<typeof insertRecruiterSchema>;
export type Recruiter = typeof recruiters.$inferSelect;

export type InsertRecruitmentProspect = z.infer<typeof insertRecruitmentProspectSchema>;
export type RecruitmentProspect = typeof recruitmentProspects.$inferSelect;

export type InsertRecruitmentStage = z.infer<typeof insertRecruitmentStageSchema>;
export type RecruitmentStage = typeof recruitmentStages.$inferSelect;

export type InsertRecruitmentActivity = z.infer<typeof insertRecruitmentActivitySchema>;
export type RecruitmentActivity = typeof recruitmentActivities.$inferSelect;

export type InsertRecruitmentNetworkStructure = z.infer<typeof insertRecruitmentNetworkStructureSchema>;
export type RecruitmentNetworkStructure = typeof recruitmentNetworkStructure.$inferSelect;

export type InsertRecruitmentDocument = z.infer<typeof insertRecruitmentDocumentSchema>;
export type RecruitmentDocument = typeof recruitmentDocuments.$inferSelect;

// Tables pour le système MLM
export const mlmDistributeurs = pgTable("mlm_distributeurs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  codeVendeur: text("codeVendeur").notNull().unique(),
  parentId: integer("parent_id").references(() => mlmDistributeurs.id),
  niveau: integer("niveau").notNull().default(1),
  dateRecrutement: timestamp("date_recrutement").defaultNow(),
  actif: boolean("actif").default(true),
  tauxCommission: decimal("taux_commission", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const mlmReglesCommission = pgTable("mlm_regles_commission", {
  id: serial("id").primaryKey(),
  niveau: integer("niveau").notNull(),
  produitType: text("produit_type").notNull(),
  tauxCommission: decimal("taux_commission", { precision: 5, scale: 2 }).notNull(),
  volumeMinimum: integer("volume_minimum").default(0),
  actif: boolean("actif").default(true),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const mlmTransactionsCommission = pgTable("mlm_transactions_commission", {
  id: serial("id").primaryKey(),
  distributeurId: integer("distributeur_id").references(() => mlmDistributeurs.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  montant: decimal("montant", { precision: 10, scale: 2 }).notNull(),
  taux: decimal("taux", { precision: 5, scale: 2 }).notNull(),
  niveau: integer("niveau").notNull(),
  produitType: text("produit_type").notNull(),
  statut: text("statut").default("calculee"),
  moisCalcul: text("mois_calcul").notNull(), // Format YYYY-MM
  dateValidation: timestamp("date_validation"),
  dateVersement: timestamp("date_versement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations pour le système MLM
export const mlmDistributeursRelations = relations(mlmDistributeurs, ({ one, many }) => ({
  parent: one(mlmDistributeurs, {
    fields: [mlmDistributeurs.parentId],
    references: [mlmDistributeurs.id],
    relationName: "distributeurParentRelation"
  }),
  enfants: many(mlmDistributeurs, { relationName: "distributeurParentRelation" }),
  user: one(users, {
    fields: [mlmDistributeurs.userId],
    references: [users.id],
  }),
  commissionsRecues: many(mlmTransactionsCommission),
}));

export const mlmTransactionsCommissionRelations = relations(mlmTransactionsCommission, ({ one }) => ({
  distributeur: one(mlmDistributeurs, {
    fields: [mlmTransactionsCommission.distributeurId],
    references: [mlmDistributeurs.id],
  }),
  client: one(clients, {
    fields: [mlmTransactionsCommission.clientId],
    references: [clients.id],
  }),
}));



// Schémas de validation pour le système MLM
export const insertMlmDistributeurSchema = createInsertSchema(mlmDistributeurs).pick({
  userId: true,
  codeVendeur: true,
  parentId: true,
  niveau: true,
  dateRecrutement: true,
  actif: true,
  tauxCommission: true,
});

export const insertMlmRegleCommissionSchema = createInsertSchema(mlmReglesCommission).pick({
  niveau: true,
  produitType: true,
  tauxCommission: true,
  volumeMinimum: true,
  actif: true,
  description: true,
});

export const insertMlmTransactionCommissionSchema = createInsertSchema(mlmTransactionsCommission).pick({
  distributeurId: true,
  clientId: true,
  montant: true,
  taux: true,
  niveau: true,
  produitType: true,
  statut: true,
  moisCalcul: true,
  dateValidation: true,
  dateVersement: true,
});



// Types pour le système MLM
export type InsertMlmDistributeur = z.infer<typeof insertMlmDistributeurSchema>;
export type MlmDistributeur = typeof mlmDistributeurs.$inferSelect;

export type InsertMlmRegleCommission = z.infer<typeof insertMlmRegleCommissionSchema>;
export type MlmRegleCommission = typeof mlmReglesCommission.$inferSelect;

export type InsertMlmTransactionCommission = z.infer<typeof insertMlmTransactionCommissionSchema>;
export type MlmTransactionCommission = typeof mlmTransactionsCommission.$inferSelect;

// Table des commissions Réseaux
export const mlmCommissionsReseaux = pgTable("mlm_commissions_reseaux", {
  id: serial("id").primaryKey(),
  distributeurId: integer("distributeur_id").references(() => mlmDistributeurs.id).notNull(),
  distributeurSourceId: integer("distributeur_source_id").references(() => mlmDistributeurs.id).notNull(),
  typeCommission: text("type_commission").notNull(), // "recrutement", "activation", "performance", "bonus_equipe", "prime_leadership"
  montant: decimal("montant", { precision: 10, scale: 2 }).notNull(),
  taux: decimal("taux", { precision: 5, scale: 2 }).notNull(),
  niveau: integer("niveau").notNull(),
  description: text("description"),
  moisCalcul: text("mois_calcul").notNull(), // Format YYYY-MM
  statut: text("statut").default("calculee"), // "calculee", "validee", "payee"
  dateValidation: timestamp("date_validation"),
  dateVersement: timestamp("date_versement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertMlmCommissionReseauSchema = createInsertSchema(mlmCommissionsReseaux).pick({
  distributeurId: true,
  distributeurSourceId: true,
  typeCommission: true,
  montant: true,
  taux: true,
  niveau: true,
  description: true,
  moisCalcul: true,
  statut: true,
  dateValidation: true,
  dateVersement: true,
});

export type InsertMlmCommissionReseau = z.infer<typeof insertMlmCommissionReseauSchema>;
export type MlmCommissionReseau = typeof mlmCommissionsReseaux.$inferSelect;

// Relations pour les commissions Réseaux
export const mlmCommissionsReseauxRelations = relations(mlmCommissionsReseaux, ({ one }) => ({
  distributeur: one(mlmDistributeurs, {
    fields: [mlmCommissionsReseaux.distributeurId],
    references: [mlmDistributeurs.id],
    relationName: "distributeurCommissionsReseaux"
  }),
  distributeurSource: one(mlmDistributeurs, {
    fields: [mlmCommissionsReseaux.distributeurSourceId],
    references: [mlmDistributeurs.id],
    relationName: "distributeurSourceCommissionsReseaux"
  }),
}));

// Table des paramètres de l'application
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Schéma pour les paramètres
export const insertAppSettingSchema = createInsertSchema(appSettings);
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
