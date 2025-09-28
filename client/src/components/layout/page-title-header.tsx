import React, { ReactNode } from "react";
import { SmgLogo } from "@/components/ui/smg-logo";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRole } from "@/hooks/use-role";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageTitleHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  username?: string;
  userInitials?: string;
  userAvatar?: string;
  onLogout?: () => void;
  backLink?: string;
  backIcon?: ReactNode;
}

/**
 * Composant d'en-tête de page qui affiche le logo SMG centré en plein écran
 * comme dans la référence fournie (capture d'écran)
 */
export function PageTitleHeader({
  title,
  subtitle,
  showSearch = false,
  showNotifications = true,
  username = "",
  userInitials = "UN",
  userAvatar,
  onLogout,
  backLink,
  backIcon
}: PageTitleHeaderProps) {
  const { isAdmin } = useRole();
  return (
    <header className="bg-white/90 backdrop-blur-lg w-full shadow-lg border-b border-gray-200/50 mb-4 sticky top-0 z-50">
      {/* Header moderne avec proportions optimisées */}
      <div className="py-1 px-4 md:px-6 flex items-center justify-between">
        <div className="flex-1 flex justify-start">
          {backLink && (
            <Link href={backLink} className="p-2 mr-3 rounded-xl hover:bg-gray-100/80 transition-colors">
              {backIcon}
            </Link>
          )}
        </div>
        
        {/* Logo personnalisé au centre */}
        <div className="flex-1 flex justify-center">
          <SmgLogo variant="header" />
        </div>
        
        {/* Actions à droite avec design moderne */}
        <div className="flex-1 flex justify-end items-center space-x-3">
          {showNotifications && (
            <button className="text-gray-700 relative p-2 rounded-xl hover:bg-gray-100/80 transition-colors">
              <Bell className="h-5 w-5" />
              {/* Point de notification avec animation */}
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
            </button>
          )}
          
          {/* Avatar utilisateur modernisé */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-9 w-9 ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all">
                  <AvatarImage src={userAvatar ? `/uploads/${userAvatar}` : undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-sm font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-xl">
              <DropdownMenuLabel className="text-sm font-medium">Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer">
                  Profil
                </Link>
              </DropdownMenuItem>
              {isAdmin() && (
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full cursor-pointer">
                    Paramètres
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  Se déconnecter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Titre et sous-titre modernisés */}
      {(title || subtitle) && (
        <div className="px-6 pb-4">
          {title && <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{title}</h1>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      
      {/* Barre de recherche moderne */}
      {showSearch && (
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-11 h-12 bg-gray-50/80 border-gray-200/50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" 
              placeholder="Rechercher..." 
            />
          </div>
        </div>
      )}
    </header>
  );
}