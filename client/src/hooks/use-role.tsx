import { useAuth } from "@/hooks/use-auth";

// Types de rôles disponibles dans l'application
export type UserRole = "admin" | "vendeur";

// Hook personnalisé pour vérifier les rôles de l'utilisateur
export function useRole() {
  const { user } = useAuth();
  
  // Détermine si l'utilisateur est administrateur
  const isAdmin = (): boolean => {
    // Liste des IDs d'administrateurs (même logique que côté serveur)
    const adminIds = [1, 15];
    return user ? adminIds.includes(user.id) : false;
  };
  
  // Détermine si l'utilisateur est vendeur
  const isVendeur = (): boolean => {
    // Par défaut, tous les utilisateurs non admin sont vendeurs
    return user ? !isAdmin() : false;
  };
  
  // Obtient le rôle de l'utilisateur actuel
  const getUserRole = (): UserRole | null => {
    if (!user) return null;
    
    // Utilisation explicite de l'ID pour déterminer le rôle
    const isUserAdmin = isAdmin();
    
    return isUserAdmin ? "admin" : "vendeur";
  };
  
  // Vérifie si l'utilisateur a les droits pour une action spécifique
  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    
    const role = getUserRole();
    if (!role) return false;
    
    // Définition des permissions par rôle
    const permissions: Record<UserRole, string[]> = {
      admin: [
        "view_all_clients",
        "edit_all_clients", 
        "delete_clients",
        "view_all_sim_cards",
        "edit_all_sim_cards",
        "view_admin_tasks",
        "view_all_vendors",
        "view_vendor_codes",
        "view_all_prospects"
      ],
      vendeur: [
        "view_own_clients",
        "create_clients",
        "edit_own_clients",
        "view_own_prospects",
        "create_prospects",
        "edit_own_prospects",
        "delete_own_prospects",
        "view_own_vendors",
        "view_own_tasks",
        "create_tasks",
        "edit_own_tasks",
        "delete_own_tasks"
      ]
    };
    
    return permissions[role].includes(action);
  };
  
  // Récupérer le code vendeur de l'utilisateur connecté
  const getUserVendorCode = (): string => {
    if (!user) return "";
    
    // Mapping des utilisateurs et leurs codes vendeur (à remplacer par une logique de BDD)
    const vendorCodes: Record<number, string> = {
      2: "FR12345678", // Exemple: Vendeur 1
      3: "FR87654321", // Exemple: Vendeur 2
      4: "FR52796953", // Exemple: Nicolas
      5: "FR98765432", // Exemple: Pierre
      6: "FR12398765", // Exemple: Marie
      7: "FR45678901", // Exemple: Jean
    };
    
    return vendorCodes[user.id] || "";
  };

  // Récupérer l'ID de l'utilisateur connecté
  const getUserId = (): number | null => {
    return user ? user.id : null;
  };

  return {
    isAdmin,
    isVendeur,
    getUserRole,
    hasPermission,
    getUserVendorCode,
    getUserId
  };
}