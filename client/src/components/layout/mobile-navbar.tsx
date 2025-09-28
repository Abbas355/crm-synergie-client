import React, { useState } from "react";
import { Link, useLocation, useRouter } from "wouter";
import { 
  Home, 
  CreditCard, 
  Users, 
  UserPlus,
  Menu,
  X,
  BarChart2,
  FileText,
  Inbox,
  Mail,
  Settings,
  Calendar,
  CheckSquare,
  Network,
  User,
  Trash2,
  ShoppingCart,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { SmgLogo } from "@/components/ui/smg-logo";
import { useQuery } from "@tanstack/react-query";

export function MobileNavbar() {
  const [location] = useLocation();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isVendeur } = useRole();
  const [open, setOpen] = useState(false);
  
  // Récupérer le logo personnalisé
  const { data: logoData } = useQuery<string>({
    queryKey: ["/api/settings/logo"],
    queryFn: async () => {
      const response = await fetch("/api/settings/logo");
      if (!response.ok) return null;
      return response.json();
    }
  });
  
  if (!user) return null;

  // Rôle déterminé silencieusement

  // Définir les éléments de navigation de base
  const baseNavItems = [
    { 
      label: "Accueil", 
      href: "/", 
      icon: <Home className="h-5 w-5" />,
      visible: true, // Visible pour tous
      adminOnly: false
    },
    { 
      label: "Tâches", 
      href: "/tasks", 
      icon: <CheckSquare className="h-5 w-5" />,
      visible: true,
      adminOnly: false, // Visible uniquement pour les vendeurs
      vendorOnly: true
    },
    { 
      label: "SIM", 
      href: "/sim-cards", 
      icon: <CreditCard className="h-5 w-5" />,
      visible: true,
      adminOnly: true // Visible uniquement pour les admins
    },
    { 
      label: "Vendeurs", 
      href: "/recruitment/vendors", 
      icon: <Users className="h-5 w-5" />,
      visible: true,
      adminOnly: false // Visible pour tous
    },
    { 
      label: "Clients", 
      href: "/clients", 
      icon: <UserPlus className="h-5 w-5" />,
      visible: true,
      adminOnly: false // Visible pour tous
    },
    { 
      label: "MLM", 
      href: "/mlm", 
      icon: <Network className="h-5 w-5" />,
      visible: true,
      adminOnly: false // Visible pour tous
    },
    { 
      label: "Ventes", 
      href: "/ventes", 
      icon: <ShoppingCart className="h-5 w-5" />,
      visible: true,
      adminOnly: false // Visible pour tous
    },

  ];
  
  // Filtrer les éléments de navigation selon le rôle
  const navItems = baseNavItems.filter(item => {
    // Si l'item est réservé aux admins, vérifier si l'utilisateur est admin
    if (item.adminOnly && !isAdmin()) return false;
    
    // Si l'item est réservé aux vendeurs, vérifier si l'utilisateur n'est PAS admin
    if (item.vendorOnly && isAdmin()) return false;
    
    return true;
  });

  // Définir les éléments du menu complet
  const baseMenuItems = [
    {
      label: "Recrutement",
      href: "/recruitment/tunnel",
      icon: <Network className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Prospection",
      href: "/prospection",
      icon: <MapPin className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Prospects",
      href: "/recruitment/prospects",
      icon: <UserPlus className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Analytics",
      href: "/recruitment/analytics",
      icon: <BarChart2 className="h-6 w-6" />,
      adminOnly: true // Réservé aux administrateurs
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: <Inbox className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: <Mail className="h-6 w-6" />,
      adminOnly: true // Réservé aux administrateurs
    },
    {
      label: "Campagnes",
      href: "/campaigns",
      icon: <Calendar className="h-6 w-6" />,
      adminOnly: true // Réservé aux administrateurs
    },
    {
      label: "MLM",
      href: "/mlm",
      icon: <Network className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Profil",
      href: "/profile",
      icon: <User className="h-6 w-6" />,
      adminOnly: false
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: <Settings className="h-6 w-6" />,
      adminOnly: true // Réservé aux administrateurs
    },
    {
      label: "Corbeille",
      href: "/trash",
      icon: <Trash2 className="h-6 w-6" />,
      adminOnly: true // Réservé aux administrateurs
    }
  ];
  
  // Filtrer les éléments du menu selon le rôle
  const menuItems = baseMenuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin())
  );

  // Optimiser l'espacement et insérer le bouton Menu entre Vendeurs et Clients
  const renderNavigationItems = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    navItems.forEach((item, index) => {
      // Ajouter l'élément de navigation
      result.push(
        <Link key={item.href} href={item.href}>
          <div 
            className={cn(
              "flex flex-col items-center justify-center h-full w-12",
              location === item.href 
                ? "text-primary" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <div className="h-5 w-5 mb-1">
              {item.icon}
            </div>
            <span className="text-xs leading-tight">{item.label}</span>
          </div>
        </Link>
      );
      
      // Insérer le bouton Menu après Vendeurs (avant Clients) - Redirection directe vers /hub
      if (item.label === "Vendeurs") {
        result.push(
          <Link key="menu-button" href="/hub">
            <div className="flex flex-col items-center justify-center h-full w-12">
              <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mb-1 shadow-lg">
                <Menu className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs leading-tight text-gray-500">Menu</span>
            </div>
          </Link>
        );
      }
    });
    
    return result;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center z-50 shadow-lg">
        <div className="flex justify-evenly items-center w-full">
          {renderNavigationItems()}
        </div>
      </div>
      
      <div className="pb-16">
        {/* Ajouter un padding-bottom pour éviter que le contenu soit caché sous la navbar */}
      </div>
    </>
  );
}