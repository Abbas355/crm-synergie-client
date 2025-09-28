/**
 * SYSTÈME DE FILTRAGE CENTRALISÉ POUR LES CLIENTS
 * Solution définitive pour éviter les incohérences entre calculs et filtres
 * Toutes les règles de filtrage sont centralisées ici
 */

export interface Client {
  id: number;
  name: string;
  status: string;
  product?: string;
  produit?: string;
  dateSignature?: string;
  dateSignature?: string;
  dateInstallation?: string;
  dateInstallation?: string;
  phone?: string;
  telephone?: string;
  email?: string;
  identifiantContrat?: string;
  [key: string]: any;
}

/**
 * RÈGLES CENTRALES DE FILTRAGE
 * Ces constantes définissent les règles uniques pour tout le système
 */
export const FILTER_RULES = {
  // Statuts exclus pour "clients à relancer" - RÈGLE HARMONISÉE SERVEUR/CLIENT
  CLIENTS_A_RELANCER_EXCLUDED: [
    "installation",      // Clients déjà installés
    "resiliation",       // Clients résiliés
    "rendez-vous",       // Clients avec RDV plannifié (trait d'union)
    "rendez_vous",       // Clients avec RDV plannifié (underscore)
    "resilie"           // Statut résiliation alternative
  ] as const,

  // Produits qui génèrent des points CVD
  POINT_GENERATING_PRODUCTS: [
    "Freebox Pop",
    "Freebox Essentiel", 
    "Freebox Ultra",
    "Forfait 5G"
  ] as const,

  // Statuts considérés comme "rendez-vous"
  RENDEZ_VOUS_STATUSES: [
    "rendez-vous",
    "rendez_vous"
  ] as const
};

/**
 * FONCTIONS DE FILTRAGE CENTRALISÉES
 */
export class ClientFilters {
  
  /**
   * Vérifie si un client est "à relancer"
   * RÈGLE DÉFINITIVE : Exclut les statuts définis dans CLIENTS_A_RELANCER_EXCLUDED
   */
  static isClientARelancer(client: Client): boolean {
    const clientStatus = client?.status || "";
    return !FILTER_RULES.CLIENTS_A_RELANCER_EXCLUDED.includes(clientStatus as any);
  }

  /**
   * Vérifie si un client a signé ce mois
   */
  static hasSignatureThisMonth(client: Client): boolean {
    if (!client.dateSignature) return false;
    
    try {
      const signatureDate = new Date(client.dateSignature);
      const now = new Date();
      return signatureDate.getMonth() === now.getMonth() && 
             signatureDate.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un client génère des points ce mois (installé ce mois)
   */
  static generatesPointsThisMonth(client: Client): boolean {
    if (client.status !== "installation" || !client.dateInstallation) return false;
    
    try {
      const installationDate = new Date(client.dateInstallation);
      const now = new Date();
      return installationDate.getMonth() === now.getMonth() && 
             installationDate.getFullYear() === now.getFullYear() &&
             FILTER_RULES.POINT_GENERATING_PRODUCTS.includes(client.product as any);
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un client a un rendez-vous
   */
  static hasRendezVous(client: Client): boolean {
    return FILTER_RULES.RENDEZ_VOUS_STATUSES.includes(client.status as any);
  }

  /**
   * Vérifie si un client a un produit Freebox
   */
  static isFreebox(client: Client): boolean {
    const produit = client.produit || client.product || "";
    return produit.toLowerCase().includes("freebox") || 
           produit.toLowerCase().includes("pop") || 
           produit.toLowerCase().includes("essentiel") || 
           produit.toLowerCase().includes("ultra");
  }

  /**
   * Vérifie si un client a un produit Forfait 5G
   */
  static isForfait5G(client: Client): boolean {
    const produit = client.produit || client.product || "";
    return produit.toLowerCase().includes("forfait") || 
           produit.toLowerCase().includes("5g");
  }

  /**
   * Normalise le texte en supprimant les accents et la casse
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Supprime les accents
  }

  /**
   * Filtre principal qui applique tous les critères
   */
  static filterClients(
    clients: Client[], 
    searchQuery: string = "",
    statusFilter: string = "all_statuses",
    customFilter: string = "none"
  ): Client[] {
    return clients.filter(client => {
      // 1. Filtre par recherche - insensible aux accents et à la casse
      const normalizedSearch = ClientFilters.normalizeText(searchQuery);
      const matchesSearch = searchQuery === "" || 
        ClientFilters.normalizeText(client.name).includes(normalizedSearch) ||
        ClientFilters.normalizeText(client.telephone || "").includes(normalizedSearch) ||
        ClientFilters.normalizeText(client.phone || "").includes(normalizedSearch) ||
        ClientFilters.normalizeText(client.email || "").includes(normalizedSearch) ||
        ClientFilters.normalizeText(client.identifiantContrat || "").includes(normalizedSearch) ||
        ClientFilters.normalizeText(client.carteSim || "").includes(normalizedSearch);

      // 2. Filtre par statut
      const matchesStatus = statusFilter === "all_statuses" || client.status === statusFilter;

      // 3. Filtre personnalisé avec règles centralisées
      let matchesCustomFilter = true;
      
      switch (customFilter) {
        case "signatures":
        case "signatures_mois":
          matchesCustomFilter = ClientFilters.hasSignatureThisMonth(client);
          break;
          
        case "points":
          matchesCustomFilter = ClientFilters.generatesPointsThisMonth(client);
          break;
          
        case "tofollow":
        case "clients_a_relancer":
          // RÈGLE UNIFIÉE : Les deux utilisent la même logique
          matchesCustomFilter = ClientFilters.isClientARelancer(client);
          break;
          
        case "rendez_vous":
          matchesCustomFilter = ClientFilters.hasRendezVous(client);
          break;
          
        case "freebox":
          // Filtre Freebox ce mois uniquement
          matchesCustomFilter = ClientFilters.hasSignatureThisMonth(client) && 
                               ClientFilters.isFreebox(client);
          break;
          
        case "forfait5g":
          // Filtre Forfait 5G ce mois uniquement  
          matchesCustomFilter = ClientFilters.hasSignatureThisMonth(client) && 
                               ClientFilters.isForfait5G(client);
          break;
          
        default:
          matchesCustomFilter = true;
      }

      return matchesSearch && matchesStatus && matchesCustomFilter;
    });
  }

  /**
   * Calcul des statistiques avec les mêmes règles que le filtrage
   * GARANTIT LA COHÉRENCE entre affichage statistiques et filtrage
   */
  static calculateStats(clients: Client[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      // Signatures ce mois
      signaturesThisMonth: clients.filter(client => 
        ClientFilters.hasSignatureThisMonth(client)
      ).length,

      // Points générés ce mois (installations)
      pointsThisMonth: clients.filter(client => 
        ClientFilters.generatesPointsThisMonth(client)
      ).length,

      // Clients à relancer - MÊME RÈGLE QUE LE FILTRAGE
      clientsARelancer: clients.filter(client => 
        ClientFilters.isClientARelancer(client)
      ).length,

      // Clients avec rendez-vous
      clientsRendezVous: clients.filter(client => 
        ClientFilters.hasRendezVous(client)
      ).length
    };
  }
}

/**
 * VALIDATION DES RÈGLES
 * Fonction pour vérifier la cohérence du système
 */
export function validateFilterConsistency(clients: Client[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Vérifier que les calculs et filtres donnent les mêmes résultats
  const stats = ClientFilters.calculateStats(clients);
  const filteredClientsARelancer = ClientFilters.filterClients(clients, "", "all_statuses", "clients_a_relancer");
  
  if (stats.clientsARelancer !== filteredClientsARelancer.length) {
    errors.push(`Incohérence détectée: Stats (${stats.clientsARelancer}) != Filtre (${filteredClientsARelancer.length})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}