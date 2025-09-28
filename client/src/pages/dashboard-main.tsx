import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCards } from "@/components/dashboard-cards";
import { useAuth } from '@/hooks/use-auth';
import { MobileNavbar } from '@/components/layout/mobile-navbar';

export default function DashboardMain() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug: États des cartes */}
      <div className="bg-yellow-200 p-2 text-xs">
        <div className="max-w-md mx-auto">
          <div className="font-mono text-center">
            DEBUG: États des cartes
          </div>
        </div>
      </div>
      
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.prenom?.[0] || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cartes du tableau de bord */}
        <DashboardCards />

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un client..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Boutons d'actions */}
        <div className="flex items-center justify-center space-x-4">
          <Button 
            variant="outline" 
            size="icon"
            className="w-12 h-12"
          >
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            Liste
          </Button>
        </div>
      </main>

      {/* Navigation mobile */}
      <MobileNavbar />
    </div>
  );
}