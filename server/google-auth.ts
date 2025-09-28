/**
 * Configuration Google OAuth2 pour authentification vendeur
 * Permet aux vendeurs de se connecter avec leur compte Google
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Configuration OAuth2
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Variables d\'environnement Google OAuth manquantes');
}

// Client OAuth2
const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes nécessaires
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar', // Pour intégration calendrier
];

/**
 * Générer l'URL d'autorisation Google
 */
export function getGoogleAuthUrl(): string {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  return authUrl;
}

/**
 * Échanger le code d'autorisation contre des tokens
 */
export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Erreur échange code:', error);
    throw new Error('Impossible d\'échanger le code d\'autorisation');
  }
}

/**
 * Récupérer les informations utilisateur Google
 */
export async function getGoogleUserInfo(accessToken: string) {
  try {
    const oauth2 = google.oauth2('v2');
    const response = await oauth2.userinfo.get({
      access_token: accessToken
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur récupération user info:', error);
    throw new Error('Impossible de récupérer les informations utilisateur');
  }
}

/**
 * Vérifier si les tokens sont valides
 */
export async function verifyTokens(tokens: any) {
  try {
    oauth2Client.setCredentials(tokens);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });
    
    return ticket.getPayload();
  } catch (error) {
    console.error('Erreur vérification tokens:', error);
    throw new Error('Tokens invalides');
  }
}

/**
 * Rafraîchir les tokens d'accès
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Erreur refresh token:', error);
    throw new Error('Impossible de rafraîchir les tokens');
  }
}

/**
 * Créer un client calendrier avec les tokens utilisateur
 */
export function createCalendarClient(tokens: any) {
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
  
  auth.setCredentials(tokens);
  
  return google.calendar({ version: 'v3', auth });
}

export { oauth2Client };