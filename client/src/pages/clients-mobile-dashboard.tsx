import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  PlusCircle,
  User,
  Home,
  Clock,
  Users,
  Package,
  Coins,
  ListFilter,
  Phone,
  LayoutGrid,
  LayoutList
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ClientsMobileDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    validationClients: 0,
    installationClients: 0,
    points: 0,
    monthlyPoints: 0
  });
  
  // Fonction pour calculer les statistiques localement à partir des clients
  const calculateLocalStats = (clientsList: Client[]) => {
    console.log("🔥 MOBILE DEBUG - Calcul des stats locales avec", clientsList.length, "clients");
    
    const stats = {
      totalClients: clientsList.length,
      validationClients: clientsList.filter(c => c.status === 'validation' || c.status === 'valide').length,
      installationClients: clientsList.filter(c => c.status === 'installation').length,
      points: clientsList.length * 2 // Points basiques
    };
    
    console.log("🔥 MOBILE DEBUG - Stats calculées localement:", stats);
    setDashboardStats(stats);
    return stats;
  };
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAdmin } = useRole();

  useEffect(() => {
    console.log("🔥 MOBILE DEBUG - useEffect principal démarré");
    loadClients();
    fetchDashboardStats();
  }, []);

  // Force l'appel de fetchDashboardStats après le montage du composant
  useEffect(() => {
    console.log("🔥 MOBILE DEBUG - useEffect secondaire pour forcer fetchDashboardStats");
    const timer = setTimeout(() => {
      console.log("🔥 MOBILE DEBUG - Timer exécuté, appel de fetchDashboardStats");
      fetchDashboardStats();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const loadClients = async () => {
    try {
      console.log("🔥 MOBILE DEBUG - Début loadClients");
      setIsLoading(true);
      const response = await fetch('/api/clients?vendeurOnly=true&_t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log("🔥 MOBILE DEBUG - Réponse clients:", response.status);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des clients");
      }
      const data = await response.json();
      console.log("🔥 MOBILE DEBUG - Données clients reçues:", data.length, "clients");
      
      // Tri par date de signature décroissante et correction des données
      const sortedClients = [...data]
        .map((client: any) => ({
          ...client,
          name: client.name || `${client.prenom || ''} ${client.nom || ''}`.trim(),
          phone: client.phone || client.mobile || "Non défini",
          produit: client.produit || client.forfait || "Forfait 5G",
          codePostal: client.codePostal || client.code_postal || "00000",
          adresse: client.adresse || "Adresse non renseignée"
        }))
        .sort((a, b) => {
          const dateA = a.dateSignature ? new Date(a.dateSignature).getTime() : 0;
          const dateB = b.dateSignature ? new Date(b.dateSignature).getTime() : 0;
          return dateB - dateA;
        });
      
      console.log("🔥 MOBILE DEBUG - Premier client après traitement:", sortedClients[0]);
      
      setClients(sortedClients);
      setFilteredClients(sortedClients);
      
      // Calculer les statistiques localement
      calculateLocalStats(sortedClients);
      
    } catch (error) {
      console.error("🔥 MOBILE DEBUG - Erreur loadClients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard-global', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newStats = {
          totalClients: parseInt(data.totalClients) || 0,
          validationClients: parseInt(data.ventesValidees) || 0,
          installationClients: parseInt(data.installationsCeMois) || 0,
          points: parseInt(data.ptsGeneresCeMois) || 0,
          monthlyPoints: parseInt(data.ptsGeneresCeMois) || 0
        };
        
        setDashboardStats(newStats);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  };

  useEffect(() => {
    let result = [...clients];
    
    // Filtre par statut
    if (statusFilter && statusFilter !== "all") {
      result = result.filter(client => client.status === statusFilter);
    }
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => {
        return (
          (client.prenom && client.prenom.toLowerCase().includes(query)) ||
          (client.nom && client.nom.toLowerCase().includes(query)) ||
          (client.codeVendeur && client.codeVendeur.toLowerCase().includes(query)) ||
          (client.phone && client.phone.toLowerCase().includes(query)) ||
          (client.carteSim && client.carteSim.toLowerCase().includes(query))
        );
      });
    }
    
    // Filtre par onglet
    if (activeTab === "mobile") {
      result = result.filter(client => 
        client.phone && client.phone.trim() !== "");
    } else if (activeTab === "recent") {
      // Récupère uniquement les clients des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(client => {
        const clientDate = client.dateSignature 
          ? new Date(client.dateSignature) 
          : client.createdAt 
            ? new Date(client.createdAt) 
            : null;
        return clientDate && clientDate > thirtyDaysAgo;
      });
    } else if (activeTab === "points") {
      // Filtre les clients avec des points (forfaits spécifiques)
      result = result.filter(client => 
        client.forfaitType && ["5g", "ultra", "pop"].includes(client.forfaitType.toLowerCase()));
    }
    
    setFilteredClients(result);
  }, [clients, statusFilter, searchQuery, activeTab]);

  const renderClientCards = () => {
    if (filteredClients.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-700">Aucun client trouvé</h3>
          <p className="text-gray-500 mt-1">Modifiez vos critères de recherche</p>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 gap-4">
          {filteredClients.map(client => (
            <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setLocation(`/clients/${client.id}`)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium truncate">
                      {client.prenom} {client.nom}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{client.codeVendeur || "-"}</p>
                  </div>
                  <StatusBadge status={client.status} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredClients.map(client => (
          <div 
            key={client.id}
            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setLocation(`/clients/${client.id}`)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight">
                  {client.prenom} {client.nom}
                </h3>
                <div className="flex flex-wrap items-center text-xs text-gray-500 mt-1 gap-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {client.codeVendeur || "N/A"}
                  </span>
                  {client.produit && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {client.produit}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {client.phone}
                    </span>
                  )}
                </div>
                {(client.dateSignature || client.dateInstallation) && (
                  <div className="flex text-xs text-gray-400 mt-1 gap-3">
                    {client.dateSignature && (
                      <span>✓ {new Date(client.dateSignature).toLocaleDateString('fr-FR')}</span>
                    )}
                    {client.dateInstallation && (
                      <span>📅 {new Date(client.dateInstallation).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end ml-2">
                <StatusBadge status={client.status} size="sm" />
                {client.forfaitType && (
                  <span className="text-xs text-gray-500 mt-1">
                    {client.forfaitType}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-md mx-auto">
        {/* Boutons d'action */}
        <div className="flex gap-2 mb-4">
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={() => setLocation("/clients/add-mobile")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un client
          </Button>
          
          <Button 
            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
            onClick={() => setLocation("/clients-list")}
          >
            <Users className="h-4 w-4 mr-2" />
            Liste des clients
          </Button>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium">Total Clients</h3>
                  <p className="text-3xl font-bold">{dashboardStats.totalClients}</p>
                  <p className="text-xs text-blue-600">Voir tous les clients</p>
                </div>
                <User className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium">En validation</h3>
                  <p className="text-3xl font-bold">{dashboardStats.validationClients}</p>
                  <div className="flex items-center">
                    <span className="block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    <p className="text-xs text-green-600">↑ 10%</p>
                    <p className="text-xs text-gray-500 ml-1">Attendre / valider</p>
                  </div>
                </div>
                <User className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium">Installation en cours</h3>
                  <p className="text-3xl font-bold">{dashboardStats.installationClients}</p>
                  <div className="flex items-center">
                    <span className="block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    <p className="text-xs text-red-600">↓ 5%</p>
                    <p className="text-xs text-gray-500 ml-1">Du mois en cours</p>
                  </div>
                </div>
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setStatusFilter("installation");
              setSearchQuery("");
            }}
          >
            <CardContent className="p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium">Nombre de points</h3>
                  <p className="text-3xl font-bold">{dashboardStats.points}</p>
                  <div className="flex items-center">
                    <span className="block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                    <p className="text-xs text-blue-600">{dashboardStats.monthlyPoints} pts</p>
                    <p className="text-xs text-gray-500 ml-1">générés ce mois</p>
                  </div>
                </div>
                <Coins className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filtre par statut */}
        <div className="mb-4">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <ListFilter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Tous les statuts" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="enregistre">Enregistré</SelectItem>
              <SelectItem value="valide">Validé</SelectItem>
              <SelectItem value="valide_7_jours">Validé 7 jours</SelectItem>
              <SelectItem value="rendez-vous">Rendez-vous</SelectItem>
              <SelectItem value="installation">Installation</SelectItem>
              <SelectItem value="post-production">Post-production</SelectItem>
              <SelectItem value="resiliation">Résiliation</SelectItem>
              <SelectItem value="abandonne">Abandonné</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Onglets */}
        <div className="mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all" className="text-xs">
                <User className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Tous les clients</span>
                <span className="sm:hidden">Tous</span>
              </TabsTrigger>
              <TabsTrigger value="points" className="text-xs">
                <Coins className="h-4 w-4 mr-1" />
                <span>Points</span>
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs">
                <Phone className="h-4 w-4 mr-1" />
                <span>Mobiles</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs">
                <Clock className="h-4 w-4 mr-1" />
                <span>Récents</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Boutons vue liste/grille */}
        <div className="flex justify-center mb-4 border rounded-full overflow-hidden">
          <Button 
            variant={viewMode === "list" ? "default" : "ghost"}
            className={`rounded-none flex-1 px-4 py-1 h-auto ${viewMode === "list" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Tableau
          </Button>
          <Button 
            variant={viewMode === "grid" ? "default" : "ghost"}
            className={`rounded-none flex-1 px-4 py-1 h-auto ${viewMode === "grid" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grille
          </Button>
        </div>
        
        {/* Affichage des clients */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : (
          <div className="mt-4">
            {renderClientCards()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}