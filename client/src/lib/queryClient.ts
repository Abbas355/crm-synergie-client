import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Pour les réponses d'erreur, tenter de récupérer le texte d'erreur
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) errorMessage = text;
    } catch (e) {
      // Erreur silencieuse pour éviter les logs excessifs
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Logs allégés - seulement pour les erreurs importantes
  try {
    const headers: Record<string, string> = {};
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    };
    
    const res = await fetch(url, requestOptions);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log uniquement les erreurs réelles, pas les 401/404 normaux
    if (error instanceof Error && !error.message.includes('401') && !error.message.includes('404')) {
      console.error(`💥 Erreur dans apiRequest ${method} ${url}:`, error);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: 'include', // 🔑 CRUCIAL : Inclure les cookies de session
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Heartbeat toutes les 30s pour maintenir session
      refetchOnWindowFocus: true,
      staleTime: 15000, // Cache 15s pour éviter trop de requêtes
      gcTime: 60000, // Garde en mémoire 1 minute
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Invalide le cache de manière complète et ciblée après des opérations sur les clients
 * @param clientId ID du client concerné (optionnel)
 * @param simCardId ID de la carte SIM associée (optionnel)
 */
export function invalidateClientCache(clientId?: number, simCardId?: string) {
  // Invalidation complète du cache
  queryClient.invalidateQueries();
  
  // Invalidation spécifique des endpoints critiques
  queryClient.invalidateQueries({queryKey: ["/api/clients"]});
  queryClient.invalidateQueries({queryKey: ["/api/dashboard"]});
  
  // AJOUT : Invalidation croisée des cartes SIM pour synchronisation
  queryClient.invalidateQueries({queryKey: ["/api/sim-cards"]});
  queryClient.invalidateQueries({queryKey: ["/api/sim-cards/available"]});
  
  // Si un ID client est fourni, invalider aussi sa donnée spécifique
  if (clientId) {
    queryClient.invalidateQueries({queryKey: [`/api/clients/${clientId}`]});
  }
  
  // Si une carte SIM est associée, invalider aussi les données de cartes SIM
  if (simCardId) {
    queryClient.invalidateQueries({queryKey: [`/api/sim-cards/${simCardId}`]});
  }
  
  // Cache invalidé silencieusement
}
