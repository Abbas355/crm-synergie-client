import { Route, Redirect } from "wouter";
import { useRole } from "@/hooks/use-role";

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireAdmin?: boolean;
}) {
  return (
    <Route path={path}>
      {() => {
        const { isAdmin } = useRole();
        
        // Si requireAdmin est activé et que l'utilisateur n'est pas admin
        if (requireAdmin && !isAdmin) {
          return <Redirect to="/" />;
        }
        
        return <Component />;
      }}
    </Route>
  );
}
