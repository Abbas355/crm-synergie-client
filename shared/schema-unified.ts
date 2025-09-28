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
  forfaitType: text("forfaitType"),
  contratSigne: boolean("contratSigne").default(false),
  identiteValidee: boolean("identiteValidee").default(false),
  ribValide: boolean("ribValide").default(false),
  justificatifDomicileValide: boolean("justificatifDomicileValide").default(false),
  deletedAt: timestamp("deletedAt"),
  codeVendeur: text("codeVendeur"),
  dateRendezVous: timestamp("dateRendezVous"),
  dateInstallation: timestamp("dateInstallation"),
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