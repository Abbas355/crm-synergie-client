import { RecruitmentProspect } from "@shared/schema";
import crypto from 'crypto-js';

/**
 * Génère un token public pour accéder au tunnel de recrutement sans authentification
 * Ce token utilise les mêmes règles que celles du backend pour vérifier l'accès
 */
export function generatePublicToken(prospect: RecruitmentProspect): string {
  // Créer un token basé sur l'ID, l'email et la date de création
  const dateCreation = new Date(prospect.createdAt).toISOString().split('T')[0];
  const data = `${prospect.id}-${prospect.email}-${dateCreation}`;
  
  // Utiliser la bibliothèque crypto-js pour le frontend (équivalent à crypto côté serveur)
  return crypto.SHA256(data).toString(crypto.enc.Hex);
}

/**
 * Génère une URL publique pour le tunnel de recrutement
 */
export function generatePublicTunnelUrl(prospect: RecruitmentProspect): string {
  const token = generatePublicToken(prospect);
  return `/recruitment/public-tunnel?id=${prospect.id}&token=${token}`;
}