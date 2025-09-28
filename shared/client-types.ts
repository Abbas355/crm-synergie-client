/**
 * Types et utilitaires pour normaliser les données clients
 * Solution définitive pour éviter les incohérences d'affichage
 */

export interface ClientData {
  id: number;
  civilite?: string | null;
  prenom?: string | null;
  nom?: string | null;
  name?: string | null;
  email?: string | null;
  telephone?: string | null;
  dateNaissance?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  produit?: string | null;
  identifiantContrat?: string | null;
  carteSim?: string | null;
  portabilite?: string | null;
  numeroPorter?: string | null;
  dateSignature?: string | Date | null;
  status?: string | null;
  codeVendeur?: string | null;
  dateRendezVous?: string | Date | null;
  dateInstallation?: string | Date | null;
  createdAt?: string | Date | null;
  [key: string]: any;
}

export interface NormalizedClient {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  codePostal: string;
  produit: string;
  portabilite: string;
  identifiantContrat: string;
  codeVendeur: string;
  status: string;
  dateSignature: string;
  dateRendezVous: string;
  dateInstallation: string;
}

/**
 * Normalise les données client pour un affichage cohérent
 */
export function normalizeClientData(client: ClientData): NormalizedClient {
  return {
    id: client.id,
    nom: client.nom || "",
    prenom: client.prenom || "",
    telephone: client.telephone || "-",
    email: client.email || "-",
    adresse: client.adresse || "-",
    ville: client.ville || "-",
    codePostal: client.codePostal || "-",
    produit: client.produit || "-",
    portabilite: getPortabiliteDisplay(client.portabilite),
    identifiantContrat: client.identifiantContrat || "-",
    codeVendeur: client.codeVendeur || "-",
    status: client.status || "nouveau",
    dateSignature: formatDateDisplay(client.dateSignature),
    dateRendezVous: formatDateDisplay(client.dateRendezVous),
    dateInstallation: formatDateDisplay(client.dateInstallation)
  };
}

/**
 * Formate l'affichage de la portabilité
 */
function getPortabiliteDisplay(portabilite: string | null | undefined): string {
  if (!portabilite) return "-";
  
  const value = String(portabilite).toLowerCase();
  if (value === "true" || value === "1" || value === "portabilite") {
    return "Portabilité";
  } else if (value === "false" || value === "0" || value === "creation") {
    return "Création";
  }
  return "-";
}

/**
 * Formate l'affichage des dates
 */
function formatDateDisplay(date: string | Date | null | undefined): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return "-";
  }
}

/**
 * Obtient le nom complet du client
 */
export function getClientFullName(client: ClientData): string {
  if (client.name) return client.name;
  if (client.prenom && client.nom) return `${client.prenom} ${client.nom}`;
  if (client.prenom) return client.prenom;
  if (client.nom) return client.nom;
  return "Nom inconnu";
}