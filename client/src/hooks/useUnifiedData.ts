/**
 * HOOKS UNIFIÉS POUR LA GESTION DES DONNÉES
 * 
 * ✅ Cache intelligent avec React Query
 * ✅ Pas de transformation de données
 * ✅ Types stricts du schéma unifié
 * ✅ Optimisations de performance
 * ✅ Synchronisation en temps réel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import apiUnified, { 
  type ClientWithDetails, 
  type SimCardWithDetails, 
  type DashboardStats,
  type ClientsListParams,
  type LoginRequest,
  type ApiError 
} from '@/lib/api-unified';
import { ClientInsert, SimCardInsert, UserSelect } from '@shared/schema-unified';

// ============================================
// CONFIGURATION REACT QUERY
// ============================================

const QUERY_KEYS = {
  AUTH: ['auth'],
  CLIENTS: ['clients'],
  SIM_CARDS: ['sim-cards'],
  STATS: ['stats'],
  DASHBOARD: ['dashboard'],
} as const;

// Options par défaut pour les requêtes
const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  refetchOnWindowFocus: false,
};

// ============================================
// HOOKS AUTHENTIFICATION
// ============================================

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.AUTH,
    queryFn: async () => {
      try {
        const response = await apiUnified.auth.getCurrentUser();
        return response.user;
      } catch (error) {
        return null;
      }
    },
    ...DEFAULT_QUERY_OPTIONS,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      return apiUnified.auth.login(credentials);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH, data.user);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.prenom} ${data.user.nom}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiUnified.auth.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.AUTH, null);
      queryClient.clear();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt!",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    error,
  };
}

// ============================================
// HOOKS CLIENTS
// ============================================

export function useClients(params: ClientsListParams = {}) {
  const queryKey = [...QUERY_KEYS.CLIENTS, params];

  return useQuery({
    queryKey,
    queryFn: () => apiUnified.clients.getClients(params),
    ...DEFAULT_QUERY_OPTIONS,
  });
}

export function useClient(id: number, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLIENTS, id],
    queryFn: () => apiUnified.clients.getClient(id),
    enabled: enabled && !!id,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

export function useClientMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: ClientInsert) => apiUnified.clients.createClient(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Client créé",
        description: `Client ${data.client.name} créé avec succès`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClientInsert> }) => 
      apiUnified.clients.updateClient(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Client modifié",
        description: `Client ${data.client.name} modifié avec succès`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiUnified.clients.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Client supprimé",
        description: "Client supprimé avec succès",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================
// HOOKS CARTES SIM
// ============================================

export function useSimCards() {
  return useQuery({
    queryKey: QUERY_KEYS.SIM_CARDS,
    queryFn: () => apiUnified.simCards.getSimCards(),
    ...DEFAULT_QUERY_OPTIONS,
  });
}

export function useSimCard(id: number, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.SIM_CARDS, id],
    queryFn: () => apiUnified.simCards.getSimCard(id),
    enabled: enabled && !!id,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

export function useSimCardMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: SimCardInsert) => apiUnified.simCards.createSimCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIM_CARDS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Carte SIM créée",
        description: "Carte SIM créée avec succès",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SimCardInsert> }) => 
      apiUnified.simCards.updateSimCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIM_CARDS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Carte SIM modifiée",
        description: "Carte SIM modifiée avec succès",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiUnified.simCards.deleteSimCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIM_CARDS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
      toast({
        title: "Carte SIM supprimée",
        description: "Carte SIM supprimée avec succès",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createSimCard: createMutation.mutate,
    updateSimCard: updateMutation.mutate,
    deleteSimCard: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================
// HOOKS STATISTIQUES
// ============================================

export function useStats() {
  return useQuery({
    queryKey: QUERY_KEYS.STATS,
    queryFn: () => apiUnified.stats.getDashboardStats(),
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
  });
}

// ============================================
// HOOKS FILTRAGE LOCAL
// ============================================

export function useClientFilters(clients: ClientWithDetails[], filters: {
  status?: string;
  search?: string;
  customFilter?: string;
}) {
  const filteredClients = apiUnified.clients.filterClients(clients, filters);
  
  return {
    filteredClients,
    totalCount: clients.length,
    filteredCount: filteredClients.length,
    hasActiveFilters: !!(filters.status !== "all_statuses" || filters.search || filters.customFilter),
  };
}

export function useLocalStats(clients: ClientWithDetails[]) {
  const stats = apiUnified.stats.calculateLocalStats(clients);
  
  return {
    stats,
    isLoading: false,
    error: null,
  };
}

// ============================================
// HOOKS OPTIMISATIONS
// ============================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateClients: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS }),
    invalidateSimCards: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIM_CARDS }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS }),
    invalidateAll: () => queryClient.invalidateQueries(),
    clearCache: () => queryClient.clear(),
  };
}

// Hook pour le prefetch des données
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchClients = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTS,
      queryFn: () => apiUnified.clients.getClients(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchSimCards = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.SIM_CARDS,
      queryFn: () => apiUnified.simCards.getSimCards(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchStats = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.STATS,
      queryFn: () => apiUnified.stats.getDashboardStats(),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchClients,
    prefetchSimCards,
    prefetchStats,
    prefetchAll: () => {
      prefetchClients();
      prefetchSimCards();
      prefetchStats();
    },
  };
}

// ============================================
// EXPORT TYPES
// ============================================

export type {
  ClientWithDetails,
  SimCardWithDetails,
  DashboardStats,
  ClientsListParams,
  LoginRequest,
  ApiError,
};