import { db } from '@db';
import { tasks, clients, users } from '@shared/schema';
import { eq, and, lt, isNull, or } from 'drizzle-orm';

// Types pour les événements déclencheurs
export type TriggerEvent = 'signature_contrat' | 'status_change' | 'date_echeance' | 'client_created';

// Interface pour les templates de tâches
export interface TaskTemplate {
  name: string;
  title: string;
  description?: string;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedDuration?: number;
  triggerEvent: TriggerEvent;
  daysOffset: number;
  autoReminderDays?: number;
  syncWithClientStatus?: boolean;
  clientStatusTarget?: string;
}

// Templates prédéfinis pour l'automatisation
export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: "suivi_signature",
    title: "Suivi post-signature",
    description: "Contacter le client pour confirmer la signature et préparer l'installation",
    category: "suivi",
    priority: "high",
    estimatedDuration: 15,
    triggerEvent: "signature_contrat",
    daysOffset: 1,
    autoReminderDays: 2,
    syncWithClientStatus: true,
    clientStatusTarget: "installation"
  },
  {
    name: "preparation_installation",
    title: "Préparation installation",
    description: "Planifier l'installation et vérifier la disponibilité technique",
    category: "installation",
    priority: "high",
    estimatedDuration: 30,
    triggerEvent: "signature_contrat",
    daysOffset: 2,
    autoReminderDays: 1
  },
  {
    name: "relance_rdv",
    title: "Relance rendez-vous",
    description: "Relancer le client pour fixer un rendez-vous",
    category: "appel",
    priority: "medium",
    estimatedDuration: 10,
    triggerEvent: "status_change",
    daysOffset: 3,
    autoReminderDays: 1
  },
  {
    name: "verification_installation",
    title: "Vérification installation",
    description: "Vérifier que l'installation s'est bien déroulée",
    category: "suivi",
    priority: "medium",
    estimatedDuration: 10,
    triggerEvent: "status_change",
    daysOffset: 1,
    autoReminderDays: 2
  }
];

// Service d'automatisation des tâches
export class TaskAutomationService {
  
  /**
   * Crée automatiquement des tâches basées sur un événement
   */
  static async createAutomaticTasks(
    triggerEvent: TriggerEvent,
    clientId: number,
    userId: number,
    additionalData?: any
  ) {
    try {
      console.log(`[AUTOMATION] Création de tâches automatiques pour l'événement: ${triggerEvent}, client: ${clientId}`);
      
      // Récupérer les templates appropriés
      const applicableTemplates = DEFAULT_TASK_TEMPLATES.filter(
        template => template.triggerEvent === triggerEvent
      );

      const createdTasks = [];

      for (const template of applicableTemplates) {
        // Calculer la date d'échéance
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + template.daysOffset);

        // Créer la tâche
        const [newTask] = await db.insert(tasks).values({
          title: template.title,
          description: template.description || '',
          category: template.category,
          priority: template.priority,
          estimatedDuration: template.estimatedDuration,
          dueDate: dueDate,
          clientId: clientId,
          userId: userId,
          status: 'pending'
        }).returning();

        createdTasks.push(newTask);
        
        console.log(`[AUTOMATION] Tâche créée: ${template.title} (ID: ${newTask.id})`);
      }

      return createdTasks;
    } catch (error) {
      console.error('[AUTOMATION] Erreur lors de la création automatique de tâches:', error);
      throw error;
    }
  }

  /**
   * Vérifie et traite les rappels automatiques
   */
  static async processReminders() {
    try {
      console.log('[AUTOMATION] Vérification des rappels automatiques...');
      
      // Récupérer les tâches qui nécessitent un rappel
      const now = new Date();
      const reminderDate = new Date();
      reminderDate.setDate(now.getDate() + 1); // Rappel 1 jour avant échéance

      const tasksNeedingReminder = await db.query.tasks.findMany({
        where: and(
          eq(tasks.status, 'pending'),
          lt(tasks.dueDate, reminderDate),
          eq(tasks.reminderSent, false)
        ),
        with: {
          client: true,
          user: true
        }
      });

      console.log(`[AUTOMATION] ${tasksNeedingReminder.length} tâches nécessitent un rappel`);

      for (const task of tasksNeedingReminder) {
        // Marquer le rappel comme envoyé
        await db.update(tasks)
          .set({ reminderSent: true })
          .where(eq(tasks.id, task.id));

        console.log(`[AUTOMATION] Rappel traité pour la tâche: ${task.title}`);
      }

      return tasksNeedingReminder;
    } catch (error) {
      console.error('[AUTOMATION] Erreur lors du traitement des rappels:', error);
      throw error;
    }
  }

  /**
   * Gère l'escalade automatique des tâches en retard
   */
  static async processEscalations() {
    try {
      console.log('[AUTOMATION] Vérification des escalades automatiques...');
      
      const now = new Date();
      const escalationDate = new Date();
      escalationDate.setDate(now.getDate() - 2); // Escalade après 2 jours de retard

      // Récupérer les tâches en retard
      const overdueTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.status, 'pending'),
          lt(tasks.dueDate, escalationDate)
        ),
        with: {
          client: true,
          user: true
        }
      });

      console.log(`[AUTOMATION] ${overdueTasks.length} tâches nécessitent une escalade`);

      for (const task of overdueTasks) {
        // Récupérer un manager pour l'escalade (utilisateur admin)
        const managers = await db.query.users.findMany({
          where: eq(users.isAdmin, true)
        });

        if (managers.length > 0) {
          const manager = managers[0];
          
          // Mettre à jour la tâche avec l'escalade
          await db.update(tasks)
            .set({ 
              userId: manager.id, // Réassigner au manager
              priority: 'urgent' // Augmenter la priorité
            })
            .where(eq(tasks.id, task.id));

          console.log(`[AUTOMATION] Tâche escaladée vers ${manager.username}: ${task.title}`);
        }
      }

      return overdueTasks;
    } catch (error) {
      console.error('[AUTOMATION] Erreur lors du traitement des escalades:', error);
      throw error;
    }
  }

  /**
   * Synchronise les statuts clients avec les tâches terminées
   */
  static async syncClientStatuses() {
    try {
      console.log('[AUTOMATION] Synchronisation des statuts clients...');
      
      // Récupérer les tâches terminées récemment
      const completedTasks = await db.query.tasks.findMany({
        where: eq(tasks.status, 'completed'),
        with: {
          client: true
        }
      });

      for (const task of completedTasks) {
        if (task.client) {
          // Logique de mise à jour du statut client basée sur la tâche
          let newStatus = task.client.status;
          
          if (task.category === 'installation' && task.status === 'completed') {
            newStatus = 'installation';
          } else if (task.category === 'suivi' && task.title.includes('post-signature')) {
            newStatus = 'validation';
          }

          if (newStatus !== task.client.status) {
            await db.update(clients)
              .set({ status: newStatus })
              .where(eq(clients.id, task.client.id));
            
            console.log(`[AUTOMATION] Statut client mis à jour: ${task.client.name} -> ${newStatus}`);
          }
        }
      }

      return completedTasks;
    } catch (error) {
      console.error('[AUTOMATION] Erreur lors de la synchronisation des statuts:', error);
      throw error;
    }
  }

  /**
   * Processus principal d'automatisation à exécuter périodiquement
   */
  static async runAutomationProcess() {
    try {
      console.log('[AUTOMATION] Démarrage du processus d\'automatisation...');
      
      const results = {
        reminders: await this.processReminders(),
        escalations: await this.processEscalations(),
        statusSync: await this.syncClientStatuses()
      };

      console.log('[AUTOMATION] Processus d\'automatisation terminé:', {
        remindersProcessed: results.reminders.length,
        escalationsProcessed: results.escalations.length,
        statusUpdates: results.statusSync.length
      });

      return results;
    } catch (error) {
      console.error('[AUTOMATION] Erreur dans le processus d\'automatisation:', error);
      throw error;
    }
  }
}

// Fonction utilitaire pour déclencher les automatisations sur les événements clients
export async function triggerClientEventAutomation(
  event: TriggerEvent,
  clientId: number,
  userId: number,
  eventData?: any
) {
  return await TaskAutomationService.createAutomaticTasks(event, clientId, userId, eventData);
}