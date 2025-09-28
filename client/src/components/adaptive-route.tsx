import React from 'react';
import { Route, RouteComponentProps } from 'wouter';
import { useMobile } from '@/hooks/use-mobile';
import { ProtectedRoute } from '@/lib/protected-route';

interface AdaptiveRouteProps {
  path: string;
  mobileComponent: React.ComponentType<any>;
  desktopComponent: React.ComponentType<any>;
  requireAuth?: boolean;
}

/**
 * Composant qui affiche un composant différent selon la taille de l'écran
 */
export const AdaptiveRoute: React.FC<AdaptiveRouteProps> = ({
  path,
  mobileComponent: MobileComponent,
  desktopComponent: DesktopComponent,
  requireAuth = true
}) => {
  const isMobile = useMobile();
  
  // Crée une fonction qui retourne le composant approprié
  const ComponentFn = () => {
    return isMobile ? <MobileComponent /> : <DesktopComponent />;
  };
  
  return requireAuth ? (
    <ProtectedRoute path={path} component={ComponentFn} />
  ) : (
    <Route path={path} component={isMobile ? MobileComponent : DesktopComponent} />
  );
};