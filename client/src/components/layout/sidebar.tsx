import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  Building2,
  Megaphone,
  ListChecks,
  BarChart3,
  Settings,
  Menu,
  X,
  CreditCard,
  Network,
  UserPlus,
  PieChart,
  RefreshCw,
  MapPin,
  FileText,
  Calculator,
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMobile();
  const { isAdmin, isVendeur } = useRole();
  


  useEffect(() => {
    // Fermer le menu mobile lors d'un changement de route
    setMobileOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Menu pour les administrateurs - uniquement éléments non présents dans navbar
  const renderAdminMenu = () => {
    const adminItems = [
      {
        href: "/prospection",
        label: "Prospection",
        icon: <MapPin className="h-6 w-6" />,
      },
      {
        href: "/contacts",
        label: "Contacts",
        icon: <Users className="h-6 w-6" />,
      },
      {
        href: "/recruitment/prospects",
        label: "Prospects",
        icon: <UserPlus className="h-6 w-6" />,
      },
      {
        href: "/recruitment/analytics",
        label: "Analyses",
        icon: <PieChart className="h-6 w-6" />,
      },
      {
        href: "/campaigns",
        label: "Campagnes",
        icon: <Megaphone className="h-6 w-6" />,
      },
      {
        href: "/contracts",
        label: "Contrats",
        icon: <FileText className="h-6 w-6" />,
      },
      {
        href: "/reports",
        label: "Rapports",
        icon: <BarChart3 className="h-6 w-6" />,
      },
      {
        href: "/comptabilite",
        label: "Comptabilité",
        icon: <Calculator className="h-6 w-6" />,
      },
      // ACCÈS PARAMÈTRES SUPPRIMÉ POUR SÉCURITÉ ENTREPRISE
      {
        href: "/mlm-admin",
        label: "Admin MLM",
        icon: <BarChart3 className="h-6 w-6" />,
      },
      {
        href: "/cvd",
        label: "CVD",
        icon: <PieChart className="h-6 w-6" />,
      },
      {
        href: "/clients/deduplication",
        label: "Déduplication",
        icon: <RefreshCw className="h-6 w-6" />,
      },
    ];

    return adminItems.map((item) => {
      const isActive = location === item.href;
      return (
        <Link key={item.href} href={item.href}>
          <div
            className={cn(
              "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
            )}
          >
            <div
              className={cn(
                "mr-3 flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
              )}
            >
              {item.icon}
            </div>
            <span className="truncate">{item.label}</span>
          </div>
        </Link>
      );
    });
  };

  // Menu limité pour les vendeurs - Éléments non présents dans la navbar
  const renderVendorMenu = () => {
    const vendorItems = [
      {
        href: "/prospection",
        label: "Prospection",
        icon: <MapPin className="h-6 w-6" />,
      },
      {
        href: "/recruitment/prospects",
        label: "Prospects",
        icon: <UserPlus className="h-6 w-6" />,
      },
      {
        href: "/ventes",
        label: "Ventes",
        icon: <PieChart className="h-6 w-6" />,
      },
      // ACCÈS PARAMÈTRES BLOQUÉ POUR VENDEURS - SÉCURITÉ JURIDIQUE
    ];

    return vendorItems.map((item) => {
      const isActive = location === item.href;
      return (
        <Link key={item.href} href={item.href}>
          <div
            className={cn(
              "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
            )}
          >
            <div
              className={cn(
                "mr-3 flex-shrink-0",
                isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"
              )}
            >
              {item.icon}
            </div>
            <span className="truncate">{item.label}</span>
          </div>
        </Link>
      );
    });
  };

  return (
    <>


      {/* Mobile sidebar - Optimisé pour mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[110] flex md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-80 w-full bg-white shadow-2xl rounded-r-xl">
            {/* Header de la sidebar mobile */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">SMG CRM</h2>
                <div className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white rounded-full border">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isAdmin() ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  {isAdmin() ? "Admin" : "Vendeur"}
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Navigation mobile */}
            <div className="flex-1 pt-4 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              <nav className="px-3 space-y-1">
                {isAdmin() ? renderAdminMenu() : renderVendorMenu()}
              </nav>
            </div>
            
            {/* Footer de la sidebar mobile */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                Version mobile optimisée
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="px-4 py-2 text-xs bg-gray-100 rounded">
              Rôle: {isAdmin() ? "Admin" : "Vendeur"}
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {isAdmin() ? renderAdminMenu() : renderVendorMenu()}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
