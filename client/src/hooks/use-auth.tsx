import { createContext, ReactNode, useContext, useMemo } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Imports désactivés temporairement pour éviter les erreurs d'authentification
// import { DailyTasksPopup } from "@/components/tasks/daily-tasks-popup";
// import { useDailyTasksNotification } from "@/hooks/use-daily-tasks-notification";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

type RegisterData = InsertUser & {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  nomSociete?: string;
  siret?: string;
  source: string;
  motivation?: string;
  experiencePrecedente?: "oui" | "non";
  disponibilite?: "immediate" | "1_mois" | "3_mois";
  codeVendeur: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// Composant wrapper désactivé temporairement pour éviter les erreurs d'authentification
function DailyTasksNotificationWrapper() {
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 60 * 60 * 1000, // 1 heure
    gcTime: 2 * 60 * 60 * 1000, // 2 heures
    networkMode: 'always', // Éviter les re-rendus de connectivité
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data.user; // Extraire l'utilisateur de la réponse
    },
    onSuccess: (user: SelectUser) => {
      // Mise à jour immédiate du cache pour éviter les clignotements
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Pas de toast ni de redirection ici - laissons le composant auth gérer
      // La redirection sera gérée par le useEffect dans le composant auth
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Envoyer toutes les données à l'API pour créer à la fois l'utilisateur et le prospect
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur le CRM Synergie Marketing Group",
      });
      
      // Rediriger vers la page d'onboarding spécifique pour les nouvelles recrues
      window.location.href = "/recruitment/onboarding";
    },
    onError: (error: Error) => {
      toast({
        title: "Échec d'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mémoriser la valeur du contexte pour éviter les re-rendus
  const contextValue = useMemo(() => ({
    user: user ?? null,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
  }), [user, isLoading, error, loginMutation, logoutMutation, registerMutation]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {/* Afficher le popup de tâches quotidiennes seulement pour les utilisateurs connectés */}
      {user && <DailyTasksNotificationWrapper />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback sûr au lieu de planter l'application
    console.warn("useAuth appelé hors contexte AuthProvider - utilisation du fallback");
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: { mutate: () => {}, isPending: false },
      logoutMutation: { mutate: () => {}, isPending: false },
      registerMutation: { mutate: () => {}, isPending: false }
    };
  }
  return context;
}
