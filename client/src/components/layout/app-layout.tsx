import { ReactNode, memo } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

// Optimiser avec memo pour éviter les re-rendus inutiles
export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useMobile();
  
  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar pour desktop et mobile */}
        <Sidebar />
        {/* Contenu principal avec espace pour le bouton mobile */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50 pt-4 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
});
