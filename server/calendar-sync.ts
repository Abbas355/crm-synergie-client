/**
 * SYNCHRONISATION GOOGLE CALENDAR
 * Synchronise les tâches de l'application avec l'agenda Google du vendeur
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db';
import { users, tasks } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Configuration OAuth2
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';

/**
 * Créer un client Google Calendar avec les tokens utilisateur
 */
function createCalendarClient(tokens: any) {
  const auth = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
  
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
}

/**
 * Synchroniser une tâche avec Google Calendar
 */
export async function syncTaskToCalendar(taskId: number, userId: number) {
  try {
    // Récupérer l'utilisateur et ses tokens Google
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.google_tokens) {
      throw new Error('Utilisateur non connecté à Google');
    }
    
    // Récupérer la tâche
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        client: true,
        user: true
      }
    });
    
    if (!task) {
      throw new Error('Tâche non trouvée');
    }
    
    const tokens = JSON.parse(user.google_tokens);
    const calendar = createCalendarClient(tokens);
    
    // Créer l'événement Google Calendar
    const event = {
      summary: task.title,
      description: `${task.description}\n\n` +
                  `Priorité: ${task.priority}\n` +
                  `Catégorie: ${task.category}\n` +
                  (task.client ? `Client: ${task.client.prenom} ${task.client.nom}` : ''),
      start: {
        dateTime: task.dueDate ? new Date(task.dueDate).toISOString() : new Date().toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: task.dueDate ? 
          new Date(new Date(task.dueDate).getTime() + (task.estimated_duration || 60) * 60000).toISOString() :
          new Date(Date.now() + 60 * 60000).toISOString(),
        timeZone: 'Europe/Paris',
      },
      attendees: task.client && task.client.email ? [
        { email: task.client.email }
      ] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24h avant
          { method: 'popup', minutes: 30 }, // 30 min avant
        ],
      },
      colorId: task.priority === 'urgent' ? '11' : // Rouge
               task.priority === 'high' ? '6' : // Orange
               task.priority === 'medium' ? '5' : // Jaune
               '1', // Bleu par défaut
    };
    
    // Créer l'événement
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    
    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink
    };
    
  } catch (error) {
    console.error('Erreur synchronisation Calendar:', error);
    throw error;
  }
}

/**
 * Synchroniser toutes les tâches d'un utilisateur
 */
export async function syncAllTasksToCalendar(userId: number) {
  try {
    // Récupérer toutes les tâches de l'utilisateur
    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.user_id, userId),
      with: {
        client: true,
        user: true
      }
    });
    
    const results = [];
    
    for (const task of userTasks) {
      try {
        const result = await syncTaskToCalendar(task.id, userId);
        results.push({ taskId: task.id, success: true, ...result });
      } catch (error) {
        results.push({ 
          taskId: task.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Erreur synchronisation complète:', error);
    throw error;
  }
}

/**
 * Mettre à jour un événement Google Calendar
 */
export async function updateCalendarEvent(taskId: number, userId: number, eventId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.google_tokens) {
      throw new Error('Utilisateur non connecté à Google');
    }
    
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        client: true,
        user: true
      }
    });
    
    if (!task) {
      throw new Error('Tâche non trouvée');
    }
    
    const tokens = JSON.parse(user.google_tokens);
    const calendar = createCalendarClient(tokens);
    
    const event = {
      summary: task.title,
      description: `${task.description}\n\n` +
                  `Priorité: ${task.priority}\n` +
                  `Catégorie: ${task.category}\n` +
                  `Statut: ${task.status}\n` +
                  (task.client ? `Client: ${task.client.prenom} ${task.client.nom}` : ''),
      start: {
        dateTime: task.dueDate ? new Date(task.dueDate).toISOString() : new Date().toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: task.dueDate ? 
          new Date(new Date(task.dueDate).getTime() + (task.estimated_duration || 60) * 60000).toISOString() :
          new Date(Date.now() + 60 * 60000).toISOString(),
        timeZone: 'Europe/Paris',
      },
      colorId: task.priority === 'urgent' ? '11' : // Rouge
               task.priority === 'high' ? '6' : // Orange
               task.priority === 'medium' ? '5' : // Jaune
               '1', // Bleu par défaut
    };
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });
    
    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink
    };
    
  } catch (error) {
    console.error('Erreur mise à jour Calendar:', error);
    throw error;
  }
}

/**
 * Supprimer un événement Google Calendar
 */
export async function deleteCalendarEvent(userId: number, eventId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.google_tokens) {
      throw new Error('Utilisateur non connecté à Google');
    }
    
    const tokens = JSON.parse(user.google_tokens);
    const calendar = createCalendarClient(tokens);
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Erreur suppression Calendar:', error);
    throw error;
  }
}

/**
 * Obtenir les événements du calendrier
 */
export async function getCalendarEvents(userId: number, timeMin?: string, timeMax?: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.google_tokens) {
      throw new Error('Utilisateur non connecté à Google');
    }
    
    const tokens = JSON.parse(user.google_tokens);
    const calendar = createCalendarClient(tokens);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
    
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    throw error;
  }
}