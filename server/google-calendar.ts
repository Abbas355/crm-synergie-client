import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';

/**
 * Service Google Calendar pour l'intégration des tâches
 * Permet aux vendeurs de synchroniser leurs tâches avec leur calendrier Gmail
 */
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;
  private tokensPath: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.tokensPath = path.join(process.cwd(), 'google-tokens');
  }

  /**
   * Génère l'URL d'authentification Google OAuth2
   */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent'
    });
  }

  /**
   * Échange le code d'autorisation contre des tokens d'accès
   */
  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Sauvegarde les tokens pour un utilisateur
   */
  async saveUserTokens(userId: number, tokens: any): Promise<void> {
    await fs.mkdir(this.tokensPath, { recursive: true });
    const tokenFile = path.join(this.tokensPath, `user_${userId}.json`);
    await fs.writeFile(tokenFile, JSON.stringify(tokens, null, 2));
  }

  /**
   * Charge les tokens d'un utilisateur
   */
  async loadUserTokens(userId: number): Promise<boolean> {
    try {
      const tokenFile = path.join(this.tokensPath, `user_${userId}.json`);
      const content = await fs.readFile(tokenFile, 'utf-8');
      const tokens = JSON.parse(content);
      this.oauth2Client.setCredentials(tokens);
      return true;
    } catch (error) {
      console.log(`Aucun token trouvé pour l'utilisateur ${userId}`);
      return false;
    }
  }

  /**
   * Convertit une tâche en événement calendrier
   */
  private taskToCalendarEvent(task: any): any {
    const startTime = task.dueDate ? new Date(task.dueDate) : new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 heure par défaut

    // Couleurs selon la priorité
    const colorMap = {
      'high': '11',    // Rouge
      'medium': '5',   // Jaune
      'low': '2',      // Vert
      'urgent': '11'   // Rouge
    };

    return {
      summary: task.title,
      description: `${task.description || ''}\n\n📋 Tâche créée depuis l'application Sales Management\n🎯 Priorité: ${task.priority}\n📊 Statut: ${task.status}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Paris'
      },
      colorId: colorMap[task.priority as keyof typeof colorMap] || '1',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ]
      },
      source: {
        title: 'Sales Management App',
        url: process.env.FRONTEND_URL || 'https://sales-management.replit.app'
      }
    };
  }

  /**
   * Crée un événement calendrier depuis une tâche
   */
  async createEventFromTask(userId: number, task: any): Promise<any> {
    const hasTokens = await this.loadUserTokens(userId);
    if (!hasTokens) {
      throw new Error('Utilisateur non authentifié avec Google Calendar');
    }

    const event = this.taskToCalendarEvent(task);
    
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'none'
      });

      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        hangoutLink: response.data.hangoutLink
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw new Error(`Impossible de créer l'événement calendrier: ${error.message}`);
    }
  }

  /**
   * Crée plusieurs événements en lot
   */
  async createEventsFromTasks(userId: number, tasks: any[]): Promise<any[]> {
    const hasTokens = await this.loadUserTokens(userId);
    if (!hasTokens) {
      throw new Error('Utilisateur non authentifié avec Google Calendar');
    }

    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.createEventFromTask(userId, task);
        results.push({ taskId: task.id, ...result });
        
        // Délai pour éviter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({ 
          taskId: task.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Met à jour un événement calendrier existant
   */
  async updateCalendarEvent(userId: number, eventId: string, task: any): Promise<any> {
    const hasTokens = await this.loadUserTokens(userId);
    if (!hasTokens) {
      throw new Error('Utilisateur non authentifié avec Google Calendar');
    }

    const event = this.taskToCalendarEvent(task);
    
    try {
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw new Error(`Impossible de mettre à jour l'événement calendrier: ${error.message}`);
    }
  }

  /**
   * Supprime un événement calendrier
   */
  async deleteCalendarEvent(userId: number, eventId: string): Promise<boolean> {
    const hasTokens = await this.loadUserTokens(userId);
    if (!hasTokens) {
      throw new Error('Utilisateur non authentifié avec Google Calendar');
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      return false;
    }
  }

  /**
   * Récupère les événements à venir du calendrier
   */
  async getUpcomingEvents(userId: number, maxResults: number = 10): Promise<any[]> {
    const hasTokens = await this.loadUserTokens(userId);
    if (!hasTokens) {
      throw new Error('Utilisateur non authentifié avec Google Calendar');
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw new Error(`Impossible de récupérer les événements: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur est connecté à Google Calendar
   */
  async isUserConnected(userId: number): Promise<boolean> {
    return await this.loadUserTokens(userId);
  }

  /**
   * Déconnecte un utilisateur de Google Calendar
   */
  async disconnectUser(userId: number): Promise<void> {
    try {
      const tokenFile = path.join(this.tokensPath, `user_${userId}.json`);
      await fs.unlink(tokenFile);
    } catch (error) {
      // Fichier déjà supprimé ou inexistant
    }
  }
}

// Instance singleton du service
let googleCalendarService: GoogleCalendarService | null = null;

export function getGoogleCalendarService(): GoogleCalendarService {
  if (!googleCalendarService) {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Configuration Google Calendar manquante. Veuillez définir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET.');
    }
    
    googleCalendarService = new GoogleCalendarService(clientId, clientSecret, redirectUri);
  }
  
  return googleCalendarService;
}