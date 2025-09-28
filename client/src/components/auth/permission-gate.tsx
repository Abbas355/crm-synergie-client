import { ReactNode } from "react";
import { useRole } from "@/hooks/use-role";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  fallback?: ReactNode;
  requiresAuth?: boolean;
}

/**
 * Composant qui vérifie les permissions d'un utilisateur avant d'afficher son contenu
 * @param children Contenu à afficher si l'utilisateur a la permission
 * @param permission Permission unique requise
 * @param permissions Liste de permissions (ANY - l'une d'entre elles suffit)
 * @param fallback Contenu alternatif à afficher si l'utilisateur n'a pas la permission
 * @param requiresAuth Si vrai, vérifie que l'utilisateur est authentifié
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  fallback = null,
  requiresAuth = true,
}: PermissionGateProps) {
  const { hasPermission, isAdmin } = useRole();

  // Si l'administrateur a tous les droits, court-circuiter la vérification
  if (isAdmin()) {
    return <>{children}</>;
  }

  // Vérifier si l'utilisateur a au moins une des permissions requises
  if (permission && hasPermission(permission)) {
    return <>{children}</>;
  }

  if (permissions.length > 0 && permissions.some((p) => hasPermission(p))) {
    return <>{children}</>;
  }

  // Afficher le contenu alternatif si l'utilisateur n'a pas les permissions
  return <>{fallback}</>;
}

/**
 * Composant qui n'affiche son contenu que pour les administrateurs
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = useRole();
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
}

/**
 * Composant qui n'affiche son contenu que pour les vendeurs
 */
export function VendeurOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isVendeur } = useRole();
  return isVendeur() ? <>{children}</> : <>{fallback}</>;
}