import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  RefreshCcw,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { StatusFilterButtons } from "@/components/clients/status-filter-buttons";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from "@shared/constants";

// Fonction pour formater les nombres
const formatNumber = (num: number) => {
  return num.toString();
};

// Fonctions d'aide pour les statuts
const getStatusLabel = (status: string): string => {
  return CLIENT_STATUS_LABELS[status as keyof typeof CLIENT_STATUS_LABELS] || 'Enregistré';
};

const getStatusColor = (status: string): string => {
  return CLIENT_STATUS_COLORS[status as keyof typeof CLIENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
};

export default function ClientsListMobile() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Récupération des données des clients
  const { data: clients = [], isLoading, refetch } = useQuery<any[]>({ 
    queryKey: ["/api/clients"],
  });

  // Récupération des statistiques
  const { data: dashboardData } = useQuery<{
    stats: {
      totalClients: number;
      clientsWithForfait: number;
      validationClients: number;
      installationClients: number;
      rendezVousClients?: number;
      totalPoints: number;
    }
  }>({
    queryKey: ["/api/dashboard-global"],
  });

  // Filtrer les clients en fonction du terme de recherche et du filtre de statut
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = searchTerm === "" || 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === "all" || 
      (statusFilter === "valide" && client.status === "valide") ||
      (statusFilter === "rendezvous" && client.status === "rendez-vous") ||
      (statusFilter === "installation" && client.status === "installation");
    
    return matchesSearch && matchesFilter;
  });

  // Statistiques avec logs de débogage
  const stats = {
    totalClients: dashboardData?.stats?.totalClients || 0,
    validationClients: dashboardData?.stats?.validationClients || 0,
    installationClients: dashboardData?.stats?.installationClients || 0,
    rendezVousClients: dashboardData?.stats?.rendezVousClients || 0
  };

  // Debug des statistiques reçues
  console.log("🔥 CLIENTS-LIST-MOBILE - Dashboard data reçue:", dashboardData);
  console.log("🔥 CLIENTS-LIST-MOBILE - Stats calculées:", stats);
  console.log("🔥 CLIENTS-LIST-MOBILE - installationClients final:", stats.installationClients);

  return (
    <AppLayout>
      <div className="max-w-full mx-auto bg-gray-50 min-h-screen">
        {/* Header avec titre et bouton nouveau */}
        <div className="px-4 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Clients</h1>
              <p className="text-sm text-gray-600">{stats.totalClients} clients au total</p>
            </div>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              onClick={() => setLocation("/clients/add-mobile")}
            >
              + Nouveau
            </Button>
          </div>
        </div>

        {/* Statistiques optimisées mobile */}
        <div className="px-4 py-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Validations</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(stats.validationClients)}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Installations</p>
                <p className="text-lg font-bold text-green-600">{formatNumber(stats.installationClients)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et boutons de vue */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un client..."
              className="pl-10 pr-4 py-2.5 w-full rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Boutons de vue et filtres */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600 rounded-md px-3 py-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-200 rounded-md px-3 py-1 ml-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600 border-gray-300"
              onClick={() => setShowFilterSheet(true)}
            >
              Tous les statuts
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="relative">
          {/* Overlay sheet pour les filtres */}
          <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
            <SheetContent side="top" className="mx-auto max-w-md p-5 h-auto bg-white border-t-0 rounded-b-lg">
              <SheetHeader className="text-left mb-5 pb-0">
                <SheetTitle className="text-2xl font-bold">
                  <div>Liste</div>
                  <div>des clients</div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* Boutons d'action */}
                <div className="flex gap-2 justify-between">
                  <Button 
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 flex items-center"
                    onClick={() => setLocation("/clients/add-mobile")}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Nouveau client
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border border-gray-300 text-gray-700 font-medium"
                    onClick={() => {
                      refetch();
                      setShowFilterSheet(false);
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Rafraîchir
                  </Button>
                </div>

                {/* Filtres par statut avec composant optimisé */}
                <StatusFilterButtons 
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  setStatusFilter={setStatusFilter}
                  onClose={() => setShowFilterSheet(false)}
                />
              </div>
              
              <SheetClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetContent>
          </Sheet>

          {/* Liste des clients optimisée mobile */}
          <div className="bg-gray-50 px-4 pt-4 pb-20">
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Aucun client trouvé</p>
                  <p className="text-gray-400 text-sm mt-1">Modifiez vos critères de recherche</p>
                </div>
              ) : (
                filteredClients.map((client: any) => (
                  <div 
                    key={client.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-all"
                    onClick={() => setLocation(`/clients/${client.id}`)}
                  >
                    {/* Header avec nom et statut */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.prenom && client.nom ? `${client.prenom} ${client.nom}` : 
                         client.name || 'Client sans nom'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(client.status)
                      }`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </div>

                    {/* Informations détaillées */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{client.telephone || 'Pas de téléphone'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{client.ville || 'Ville non renseignée'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2M8 7v4a1 1 0 002 0V7" />
                        </svg>
                        <span>{client.dateSignature ? new Date(client.dateSignature).toLocaleDateString('fr-FR') : 'Pas de date'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Composant X pour le bouton de fermeture
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}