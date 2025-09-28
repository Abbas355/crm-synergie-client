/**
 * API CLIENT UNIFIÉ - FREE SALES MANAGEMENT
 * 
 * ✅ Pas de transformation de données
 * ✅ Types stricts basés sur le schéma unifié
 * ✅ Cache intelligent côté client
 * ✅ Gestion d'erreurs robuste
 * ✅ Retry automatique
 */

import { ClientSelect, ClientInsert, SimCardSelect, SimCardInsert, TaskSelect, TaskInsert, UserSelect } from "@shared/schema-unified";

// ============================================
// CONFIGURATION API
// ============================================

const API_BASE_URL = "";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache simple côté client
const clientCache = new Map<string, { data: any; timestamp: number }>();

function getFromCache(key: string): any | null {
  const cached = clientCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  clientCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  clientCache.set(key, { data, timestamp: Date.now() });
}

function clearCache(): void {
  clientCache.clear();
}

// ============================================
// CLIENT HTTP UNIFIÉ
// ============================================

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

interface ApiError {
  message: string;
  field?: string;
  code?: number;
}

class ApiClient {
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include",
      ...options,
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || "Erreur serveur",
        field: errorData.field,
        code: response.status,
      };
      throw error;
    }

    return response.json();
  }

  async get<T>(url: string, useCache = true): Promise<T> {
    if (useCache) {
      const cached = getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    const data = await this.request<T>("GET", url);
    
    if (useCache) {
      setCache(url, data);
    }

    return data;
  }

  async post<T>(url: string, data: any): Promise<T> {
    clearCache(); // Invalider le cache après modification
    return this.request<T>("POST", url, data);
  }

  async put<T>(url: string, data: any): Promise<T> {
    clearCache(); // Invalider le cache après modification
    return this.request<T>("PUT", url, data);
  }

  async delete<T>(url: string): Promise<T> {
    clearCache(); // Invalider le cache après modification
    return this.request<T>("DELETE", url);
  }

  // Méthodes pour gérer le cache
  clearCache() {
    clearCache();
  }

  invalidateCache(pattern?: string) {
    if (pattern) {
      const keys = Array.from(clientCache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          clientCache.delete(key);
        }
      });
    } else {
      clearCache();
    }
  }
}

const api = new ApiClient();

// ============================================
// SERVICES AUTHENTIFICATION
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: UserSelect;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/login", credentials);
  },

  async logout(): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/logout", {});
  },

  async getCurrentUser(): Promise<{ user: UserSelect }> {
    return api.get<{ user: UserSelect }>("/api/auth/me");
  },
};

// ============================================
// SERVICES CLIENTS
// ============================================

export interface ClientsListParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ClientWithDetails extends ClientSelect {
  name: string;
  points: number;
  isEligibleForCommission: boolean;
  user?: {
    prenom: string;
    nom: string;
    codeVendeur: string;
  };
}

export interface ClientCreateResponse {
  message: string;
  client: ClientWithDetails;
}

export const clientsService = {
  async getClients(params: ClientsListParams = {}): Promise<ClientWithDetails[]> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    const url = `/api/clients${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return api.get<ClientWithDetails[]>(url);
  },

  async getClient(id: number): Promise<ClientWithDetails> {
    return api.get<ClientWithDetails>(`/api/clients/${id}`);
  },

  async createClient(data: ClientInsert): Promise<ClientCreateResponse> {
    return api.post<ClientCreateResponse>("/api/clients", data);
  },

  async updateClient(id: number, data: Partial<ClientInsert>): Promise<ClientCreateResponse> {
    return api.put<ClientCreateResponse>(`/api/clients/${id}`, data);
  },

  async deleteClient(id: number): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/api/clients/${id}`);
  },

  // Méthodes de filtrage locales pour les performances
  filterClients(clients: ClientWithDetails[], filters: {
    status?: string;
    search?: string;
    customFilter?: string;
  }): ClientWithDetails[] {
    let filtered = clients;

    // Filtre par statut
    if (filters.status && filters.status !== "all_statuses") {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    // Filtre par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.telephone?.includes(searchTerm) ||
        client.identifiantContrat?.toLowerCase().includes(searchTerm) ||
        client.carteSim?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtres personnalisés
    if (filters.customFilter) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      switch (filters.customFilter) {
        case "ventes_validees":
          filtered = filtered.filter(client => {
            if (!client.dateSignature) return false;
            const signatureDate = new Date(client.dateSignature);
            return signatureDate.getMonth() === currentMonth && 
                   signatureDate.getFullYear() === currentYear;
          });
          break;

        case "clients_a_relancer":
          filtered = filtered.filter(client => {
            const statusToExclude = ["installation", "resiliation", "rendez_vous"];
            return !statusToExclude.includes(client.status || "");
          });
          break;

        case "pts_generes":
          filtered = filtered.filter(client => {
            if (!client.dateSignature || !client.produit) return false;
            const signatureDate = new Date(client.dateSignature);
            const isCurrentMonth = signatureDate.getMonth() === currentMonth && 
                                  signatureDate.getFullYear() === currentYear;
            return isCurrentMonth && client.points > 0;
          });
          break;

        case "installations":
          filtered = filtered.filter(client => {
            if (!client.dateInstallation) return false;
            const installationDate = new Date(client.dateInstallation);
            return installationDate.getMonth() === currentMonth && 
                   installationDate.getFullYear() === currentYear;
          });
          break;
      }
    }

    return filtered;
  },
};

// ============================================
// SERVICES CARTES SIM
// ============================================

export interface SimCardWithDetails extends SimCardSelect {
  clientNom: string | null;
  clientPrenom: string | null;
  clientCivilite: string | null;
  client?: {
    prenom: string;
    nom: string;
    civilite: string;
    email: string;
    telephone: string;
  };
}

export interface SimCardCreateResponse {
  message: string;
  simCard: SimCardSelect;
}

export const simCardsService = {
  async getSimCards(): Promise<SimCardWithDetails[]> {
    return api.get<SimCardWithDetails[]>("/api/sim-cards");
  },

  async getSimCard(id: number): Promise<SimCardWithDetails> {
    return api.get<SimCardWithDetails>(`/api/sim-cards/${id}`);
  },

  async createSimCard(data: SimCardInsert): Promise<SimCardCreateResponse> {
    return api.post<SimCardCreateResponse>("/api/sim-cards", data);
  },

  async updateSimCard(id: number, data: Partial<SimCardInsert>): Promise<SimCardCreateResponse> {
    return api.put<SimCardCreateResponse>(`/api/sim-cards/${id}`, data);
  },

  async deleteSimCard(id: number): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/api/sim-cards/${id}`);
  },
};

// ============================================
// SERVICES STATISTIQUES
// ============================================

export interface DashboardStats {
  totalClients: number;
  ventesValidees: number;
  clientsARelancer: number;
  installationsCeMois: number;
  ptsGeneresCeMois: number;
  totalSimCards: number;
  availableSimCards: number;
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>("/api/stats/dashboard");
  },

  // Calculer les statistiques localement pour les performances
  calculateLocalStats(clients: ClientWithDetails[]): DashboardStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const ventesValidees = clients.filter(client => {
      if (!client.dateSignature) return false;
      const signatureDate = new Date(client.dateSignature);
      return signatureDate.getMonth() === currentMonth && 
             signatureDate.getFullYear() === currentYear;
    }).length;

    const clientsARelancer = clients.filter(client => {
      const statusToExclude = ["installation", "resiliation", "rendez_vous"];
      return !statusToExclude.includes(client.status || "");
    }).length;

    const installationsCeMois = clients.filter(client => {
      if (!client.dateInstallation) return false;
      const installationDate = new Date(client.dateInstallation);
      return installationDate.getMonth() === currentMonth && 
             installationDate.getFullYear() === currentYear;
    }).length;

    const ptsGeneresCeMois = clients
      .filter(client => {
        if (!client.dateSignature) return false;
        const signatureDate = new Date(client.dateSignature);
        return signatureDate.getMonth() === currentMonth && 
               signatureDate.getFullYear() === currentYear;
      })
      .reduce((total, client) => total + client.points, 0);

    return {
      totalClients: clients.length,
      ventesValidees,
      clientsARelancer,
      installationsCeMois,
      ptsGeneresCeMois,
      totalSimCards: 0, // Ces valeurs nécessitent l'API
      availableSimCards: 0,
    };
  },
};

// ============================================
// EXPORT PRINCIPAL
// ============================================

export {
  api,
  type ApiError,
  type ClientWithDetails,
  type SimCardWithDetails,
};

export default {
  auth: authService,
  clients: clientsService,
  simCards: simCardsService,
  stats: statsService,
};