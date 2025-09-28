import { db } from '../db/index.js';
import { tasks } from '../shared/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Système de fusion automatique des doublons de tâches
 * Free Sales Management - v2.0
 * 
 * Détecte et fusionne automatiquement les tâches en doublon selon plusieurs critères :
 * - Même titre exactement
 * - Même utilisateur assigné
 * - Créées dans un délai de 5 minutes
 * - Les deux sont non terminées
 */

interface DuplicateTaskGroup {
  title: string;
  userId: number;
  tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    userId: number;
    createdAt: Date;
    dueDate: Date | null;
    priority: string | null;
    clientId: number | null;
  }>;
}

export class DuplicateTaskMerger {
  
  /**
   * Détecte les tâches en doublon selon les critères définis
   */
  async detectDuplicateTasks(): Promise<DuplicateTaskGroup[]> {
    console.log('🔍 DÉTECTION DOUBLONS - Recherche des tâches en doublon...');
    
    try {
      // Récupérer toutes les tâches non supprimées et non terminées
      const allTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        userId: tasks.userId,
        createdAt: tasks.createdAt,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        clientId: tasks.clientId
      })
      .from(tasks)
      .where(
        and(
          isNull(tasks.deletedAt),
          isNull(tasks.completedAt)
        )
      )
      .orderBy(tasks.createdAt);

      console.log(`📊 ANALYSE: ${allTasks.length} tâches actives récupérées`);

      // Grouper par titre et utilisateur
      const taskGroups = new Map<string, Array<typeof allTasks[0]>>();
      
      for (const task of allTasks) {
        const key = `${task.title.trim()}|${task.userId}`;
        if (!taskGroups.has(key)) {
          taskGroups.set(key, []);
        }
        taskGroups.get(key)!.push(task);
      }

      // Identifier les groupes avec doublons
      const duplicateGroups: DuplicateTaskGroup[] = [];
      
      for (const [key, taskList] of Array.from(taskGroups.entries())) {
        if (taskList.length > 1) {
          // Vérifier si les tâches sont créées dans un délai de 5 minutes
          const sortedTasks = taskList.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          const timeDiffMinutes = (
            new Date(sortedTasks[sortedTasks.length - 1].createdAt).getTime() - 
            new Date(sortedTasks[0].createdAt).getTime()
          ) / (1000 * 60);
          
          if (timeDiffMinutes <= 5) {
            const [title, userId] = key.split('|');
            duplicateGroups.push({
              title,
              userId: parseInt(userId),
              tasks: sortedTasks
            });
            
            console.log(`🚨 DOUBLON DÉTECTÉ: "${title}" pour user ${userId} (${sortedTasks.length} tâches, créées en ${timeDiffMinutes.toFixed(1)} min)`);
          }
        }
      }

      console.log(`🎯 RÉSULTAT: ${duplicateGroups.length} groupes de doublons détectés`);
      return duplicateGroups;

    } catch (error) {
      console.error('❌ ERREUR DÉTECTION DOUBLONS:', error);
      return [];
    }
  }

  /**
   * Fusionne automatiquement les tâches en doublon
   */
  async mergeDuplicateTasks(dryRun: boolean = false): Promise<{
    merged: number;
    groups: DuplicateTaskGroup[];
    details: Array<{
      title: string;
      kept: number;
      removed: number[];
      reason: string;
    }>;
  }> {
    console.log(`🔄 FUSION DOUBLONS - Mode: ${dryRun ? 'SIMULATION' : 'RÉEL'}`);
    
    const duplicateGroups = await this.detectDuplicateTasks();
    const mergeDetails: Array<{
      title: string;
      kept: number;
      removed: number[];
      reason: string;
    }> = [];
    
    let totalMerged = 0;

    for (const group of duplicateGroups) {
      try {
        // Stratégie de fusion : garder la plus ancienne avec le plus d'informations
        const sortedTasks = group.tasks.sort((a, b) => {
          // Priorité 1: Tâche avec description
          const aHasDesc = a.description && a.description.trim().length > 0;
          const bHasDesc = b.description && b.description.trim().length > 0;
          if (aHasDesc && !bHasDesc) return -1;
          if (!aHasDesc && bHasDesc) return 1;
          
          // Priorité 2: Tâche avec date d'échéance
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // Priorité 3: Plus ancienne
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        const taskToKeep = sortedTasks[0];
        const tasksToRemove = sortedTasks.slice(1);
        
        let reason = 'Plus ancienne';
        if (taskToKeep.description) reason += ' + description';
        if (taskToKeep.dueDate) reason += ' + échéance';

        mergeDetails.push({
          title: group.title,
          kept: taskToKeep.id,
          removed: tasksToRemove.map(t => t.id),
          reason
        });

        console.log(`📝 FUSION: "${group.title}" - Garder ID:${taskToKeep.id}, Supprimer IDs:[${tasksToRemove.map(t => t.id).join(', ')}]`);

        if (!dryRun) {
          // Marquer les doublons comme supprimés (soft delete)
          for (const task of tasksToRemove) {
            await db.update(tasks)
              .set({ 
                deletedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(tasks.id, task.id));
            
            console.log(`✅ Tâche ID:${task.id} marquée comme supprimée`);
          }
          
          // FORCER L'INVALIDATION DU CACHE TÂCHES
          // Invalider le cache pour tous les utilisateurs concernés
          const affectedUserIds = tasksToRemove.map(t => t.userId);
          for (const userId of [...new Set(affectedUserIds)]) {
            // Invalider le cache pour admin et non-admin
            try {
              // Nous devons importer le cache depuis routes.ts
              // Forcer l'invalidation du cache en mettant à jour les timestamps
              await db.update(tasks)
                .set({ updatedAt: new Date() })
                .where(eq(tasks.userId, userId));
            } catch (cacheError) {
              console.log('🔄 Cache invalidation - Force par UPDATE timestamp');
            }
          }
          
          // Optionnel : enrichir la tâche conservée avec les infos des doublons
          const combinedDescription = [
            taskToKeep.description || '',
            ...tasksToRemove
              .filter(t => t.description && t.description.trim() !== taskToKeep.description?.trim())
              .map(t => t.description)
          ].filter(d => d).join(' | ');

          if (combinedDescription !== (taskToKeep.description || '')) {
            await db.update(tasks)
              .set({ 
                description: combinedDescription,
                updatedAt: new Date()
              })
              .where(eq(tasks.id, taskToKeep.id));
            
            console.log(`📝 Description enrichie pour tâche ID:${taskToKeep.id}`);
          }
        }

        totalMerged += tasksToRemove.length;
        
      } catch (error) {
        console.error(`❌ ERREUR FUSION pour "${group.title}":`, error);
      }
    }

    console.log(`✅ FUSION TERMINÉE: ${totalMerged} doublons ${dryRun ? 'identifiés' : 'supprimés'}`);
    
    return {
      merged: totalMerged,
      groups: duplicateGroups,
      details: mergeDetails
    };
  }

  /**
   * Rapport détaillé des doublons détectés
   */
  async generateDuplicateReport(): Promise<string> {
    const duplicates = await this.detectDuplicateTasks();
    
    if (duplicates.length === 0) {
      return '✅ Aucun doublon de tâche détecté dans le système';
    }

    let report = `🚨 RAPPORT DOUBLONS DE TÂCHES - ${duplicates.length} groupes détectés\n`;
    report += '=' .repeat(60) + '\n\n';

    for (const group of duplicates) {
      report += `📋 TITRE: "${group.title}"\n`;
      report += `👤 UTILISATEUR: ${group.userId}\n`;
      report += `📊 NOMBRE DE DOUBLONS: ${group.tasks.length}\n\n`;
      
      group.tasks.forEach((task, index) => {
        report += `   ${index + 1}. ID:${task.id} - ${task.createdAt}\n`;
        if (task.description) report += `      Description: ${task.description}\n`;
        if (task.dueDate) report += `      Échéance: ${task.dueDate}\n`;
        report += `      Priorité: ${task.priority || 'N/A'}\n\n`;
      });
      
      report += '-'.repeat(40) + '\n\n';
    }

    return report;
  }
}

// Endpoint API pour la gestion des doublons
export const duplicateTaskMerger = new DuplicateTaskMerger();