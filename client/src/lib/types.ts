// Types pour les clients
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  status: string;
  identifiant?: string | null;
  date?: string | null;
  type?: string | null;
  civilite?: string | null;
  prenom?: string | null;
  nom?: string | null;
  dateNaissance?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  produit?: string | null;
  fixe?: string | null;
  identifiantContrat?: string | null;
  carteSim?: string | null;
  portabilite?: string | null;
  numeroPorter?: string | null;
  source?: string | null;
  typeRecommandation?: string | null;
  commentaire?: string | null;
  dateSignature?: string | null;
  codeVendeur?: string | null;
  dateRendezVous?: string | null;
  dateInstallation?: string | null;
  forfaitType?: string | null;
  contratSigne?: boolean;
  identiteValidee?: boolean;
  ribValide?: boolean;
  justificatifDomicileValide?: boolean;
}

// Types pour les sélecteurs de statut
export interface ClientStatusSelectProps {
  clientId: number;
  currentStatus: string;
  className?: string;
  onSuccess?: () => void;
}

export interface StatusOption {
  value: string;
  label: string;
}

// Types pour les cartes SIM
export interface SimCard {
  id: number;
  iccid: string;
  numero: string;
  statut: string;
  clientId?: number | null;
  dateAttribution?: string | null;
  dateActivation?: string | null;
  note?: string | null;
  codeVendeur?: string | null;
}

// Types pour les tâches
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  clientId?: number | null;
  campaignId?: number | null;
  assignedTo?: string | null;
}

// Types pour les activités
export interface Activity {
  id: number;
  title: string;
  type: string;
  timestamp?: string;
  userId?: number;
}

// Types pour les recruteurs
export interface Recruiter {
  id: number;
  codeVendeur: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  niveau: number;
  statut: string;
}

// Types pour les prospects de recrutement
export interface RecruitmentProspect {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  recruteurId: number;
}