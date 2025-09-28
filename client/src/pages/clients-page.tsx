import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClientStatusSelect } from "@/components/clients/client-status-select";
import { StatCard } from "@/components/clients/stat-card";
import { ClientFormNew } from "@/components/clients/client-form-new";
import { ClientFormEditMobile } from "@/components/clients/client-form-edit-mobile";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { Trash2, Plus, Search, Grid, List, UserPlus, Target, TrendingUp, Users, UserCheck, Loader2, Edit3, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Interfaces pour le typage
interface ClientDisplay {
  id: number;
  name: string;
  prenom?: string;
  nom?: string;
  status: string;
  identifiant?: string | null;
  identifiantContrat?: string | null;
  codeVendeur?: string | null;
  dateSignature?: string | null;
  dateRendezVous?: string | null;
  dateInstallation?: string | null;
  produit?: string | null;
  telephone?: string | null;
  codePostal?: string | null;
  adresse?: string | null;
  ville?: string | null;
  email?: string | null;
  civilite?: string | null;
  dateNaissance?: string | null;
  portabilite?: string | null;
  numeroPorter?: string | null;
}

type ViewMode = "tableau" | "grille";
type FilterType = "tous" | "points" | "mobiles" | "recents";

interface CustomStats {
  clientsCeMois: number;
  installation: number;
  ptsGeneresCeMois: number;
  clientsARelancer: number;
}

interface BestMonth {
  bestMonth: string;
  bestCount: number;
  year: number;
}

interface YearlyComparison {
  currentYear: number;
  previousYear: number;
  currentYearClients: number;
  previousYearClients: number;
  evolution: number;
  bestMonth: string;
  bestMonthCount: number;
}

export default function ClientsPage() {
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [viewMode, setViewMode] = useState<ViewMode>("tableau");
  const [filterType, setFilterType] = useState<FilterType>("tous");
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customFilter, setCustomFilter] = useState<((client: Client) => boolean) | null>(null);
  
  // États pour l'édition mobile
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editFormDefaultValues, setEditFormDefaultValues] = useState<any>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsData, setCongratulationsData] = useState<{ clientName: string } | null>(null);
  
  // Récupération du rôle de l'utilisateur
  const { isAdmin, isVendeur } = useRole();
  // Récupération des données utilisateur
  const { user } = useAuth();
  const { toast } = useToast();

  // Mutation pour supprimer un client
  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le client",
        variant: "destructive",
      });
    },
  });

  // Fonction pour gérer la suppression d'un client
  const handleDeleteClient = (clientId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      deleteMutation.mutate(clientId);
    }
  };

  // Récupération des clients
  const { data: clients = [], isLoading, error, refetch } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    enabled: !!user,
  });

  // Récupération des paramètres
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    enabled: !!user
  });

  // Récupération des nouvelles statistiques personnalisées
  const { data: customStats } = useQuery<CustomStats>({
    queryKey: ['/api/clients/custom-stats'],
    enabled: !!user
  });

  // Récupération du meilleur mois
  const { data: bestMonth } = useQuery<BestMonth>({
    queryKey: ['/api/clients/best-month'],
    enabled: !!user
  });

  // Récupération de la comparaison annuelle
  const { data: yearlyComparison } = useQuery<YearlyComparison>({
    queryKey: ['/api/clients/yearly-comparison'],
    enabled: !!user
  });

  console.log("Données brutes reçues de l'API:", clients);
  console.log("Premier client après tri:", clients[0]);
  
  // Vérification spécifique des clients avec statut rendez-vous
  const clientsRendezVousFromAPI = clients.filter(client => client.status === "rendez-vous");
  console.log("CLIENTS RENDEZ-VOUS TROUVÉS CÔTÉ CLIENT:", clientsRendezVousFromAPI);
  console.log("NOMBRE DE CLIENTS AVEC STATUT RENDEZ-VOUS:", clientsRendezVousFromAPI.length);
  
  // Affichage de tous les statuts pour diagnostiquer
  const allStatuses = clients.map(client => ({ 
    id: client.id, 
    name: `${client.prenom || ''} ${client.nom || ''}`.trim(), 
    status: client.status 
  }));
  console.log("TOUS LES STATUTS DES CLIENTS:", allStatuses);
  
  // Vérification spécifique des clients 70 et 46 qui devraient avoir le statut "rendez-vous"
  const client70 = clients.find(c => c.id === 70);
  const client46 = clients.find(c => c.id === 46);
  console.log("CLIENT 70 (Eric Fauriaux) côté client:", client70 ? { 
    id: client70.id, 
    name: `${client70.prenom || ''} ${client70.nom || ''}`.trim(), 
    status: client70.status 
  } : "NON TROUVÉ");
  console.log("CLIENT 46 (Mohamed & Tatiana Fekrache) côté client:", client46 ? { 
    id: client46.id, 
    name: `${client46.prenom || ''} ${client46.nom || ''}`.trim(), 
    status: client46.status 
  } : "NON TROUVÉ");
  
  // Vérifier si ces clients sont présents dans les données brutes
  console.log("NOMBRE TOTAL DE CLIENTS REÇUS:", clients.length);
  console.log("IDs DE TOUS LES CLIENTS:", clients.map(c => c.id));

  // Conversion et nettoyage des données clients
  const clientsDisplay: ClientDisplay[] = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    
    return clients.map(client => {
      // Créer le nom complet à partir de prenom et nom
      const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim();
      
      return {
        id: client.id,
        name: fullName,
        prenom: client.prenom || undefined,
        nom: client.nom || undefined,
        status: client.status || 'inconnu',
        identifiantContrat: client.identifiant_contrat,
        codeVendeur: client.codeVendeur,
        dateSignature: client.dateSignature ? new Date(client.dateSignature).toISOString() : null,
        dateRendezVous: client.dateRendezVous ? new Date(client.dateRendezVous).toISOString() : null,
        dateInstallation: client.dateInstallation ? new Date(client.dateInstallation).toISOString() : null,
        produit: client.produit,
        telephone: client.telephone,
        codePostal: client.code_postal,
        adresse: client.adresse,
        ville: client.ville,
        email: client.email,
        civilite: client.civilite,
        dateNaissance: client.dateNaissance,
        portabilite: client.portabilite,
        numeroPorter: client.numero_porter
      };
    });
  }, [clients]);

  console.log("Premier client après conversion ClientDisplay:", clientsDisplay[0]);

  // Fonction pour déterminer si un client peut être édité
  const canEditClient = (client: Client) => {
    // Les administrateurs peuvent tout éditer
    if (isAdmin()) return true;
    
    // Les vendeurs ne peuvent éditer que leurs propres clients
    if (isVendeur() && user) {
      return client.user_id === user.id;
    }
    
    return false;
  };

  // Fonction pour afficher les clients avec status
  const clientsWithStatus = useMemo(() => {
    return clientsDisplay.map(client => {
      console.log("Détails complets du premier client pour tableau:", {
        id: client.id,
        prenom: client.prenom,
        nom: client.nom,
        telephone: client.telephone,
        codePostal: client.codePostal,
        adresse: client.adresse,
        produit: client.produit,
        portabilite: client.portabilite,
        dateSignature: client.dateSignature,
        dateRendezVous: client.dateRendezVous,
        dateInstallation: client.dateInstallation,
        status: client.status
      });
      return client;
    });
  }, [clientsDisplay]);

  // Log pour vérifier les clients avec statut rendez-vous
  const clientsRendezVous = useMemo(() => {
    const rendezVousClients = clientsDisplay.filter(c => c && c.status === "rendez-vous");
    console.log("Clients avec statut rendez-vous:", rendezVousClients);
    return rendezVousClients;
  }, [clientsDisplay]);

  // Nouvelles statistiques personnalisées selon les spécifications utilisateur
  const clientStats = useMemo((): CustomStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcul direct à partir des clients disponibles
    const directStats = {
      clientsCeMois: clients.filter(client => {
        if (!client.dateSignature) return false;
        const signatureDate = new Date(client.dateSignature);
        return signatureDate.getMonth() === currentMonth && 
               signatureDate.getFullYear() === currentYear;
      }).length,
      
      installation: clients.filter(client => {
        if (client.status !== "installation") return false;
        if (!client.dateInstallation) return false;
        const installationDate = new Date(client.dateInstallation);
        return installationDate.getMonth() === currentMonth && 
               installationDate.getFullYear() === currentYear;
      }).length,
      
      ptsGeneresCeMois: clients.filter(client => {
        if (client.status !== "installation") return false;
        if (!client.dateInstallation) return false;
        const installationDate = new Date(client.dateInstallation);
        return installationDate.getMonth() === currentMonth && 
               installationDate.getFullYear() === currentYear;
      }).reduce((total, client) => {
        // Calcul des points selon le barème Free
        const produit = client.produit || "";
        if (produit.toLowerCase().includes('ultra')) return total + 6;
        if (produit.toLowerCase().includes('essentiel')) return total + 5;
        if (produit.toLowerCase().includes('pop')) return total + 4;
        if (produit.toLowerCase().includes('5g')) return total + 1;
        return total;
      }, 0),
      
      clientsARelancer: clients.filter(client => {
        return !["installation", "resiliation", "rendez-vous"].includes(client.status || "");
      }).length
    };
    
    // Utiliser les données de l'API si disponibles, sinon les calculs directs
    if (customStats && customStats.clientsCeMois !== undefined) {
      return customStats;
    }
    
    return directStats;
  }, [customStats, clients]);

  // Logs de diagnostic pour les nouvelles statistiques
  console.log("Statistiques personnalisées:", clientStats);
  console.log("Données customStats reçues:", customStats);
  console.log("Données bestMonth reçues:", bestMonth);
  console.log("Données yearlyComparison reçues:", yearlyComparison);
  console.log("User connecté:", user);
  console.log("Longueur clients:", clients.length);
  
  // Nous assurons que clients est un tableau valide avant de continuer
  const safeClients = Array.isArray(clients) ? clients : [];
  
  // Filtrage des clients selon le terme de recherche et le statut
  const filteredClients = useMemo(() => {
    let filtered = safeClients;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(client => {
        const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim().toLowerCase();
        const phone = (client.telephone || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               phone.includes(search) || 
               email.includes(search);
      });
    }

    // Filtrage par statut
    if (statusFilter && statusFilter !== "tous") {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Filtrage personnalisé à partir des cartes de métriques
    if (customFilter) {
      filtered = filtered.filter(customFilter);
    }

    return filtered;
  }, [safeClients, searchTerm, statusFilter, customFilter]); 

  // Formatage des dates
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yy", { locale: fr });
  };

  // Pagination
  const itemsPerPage = 20;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des clients...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-red-500">Erreur lors du chargement des clients</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête avec titre et bouton d'ajout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Gérez vos clients et suivez leur évolution
            </p>
          </div>
          <Button onClick={() => setIsClientFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        {/* Grille de 6 métriques cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Ventes validées"
            count={(() => {
              if (!clients || clients.length === 0) return 0;
              
              // Juillet 2025 = mois 6 (0-based)
              const targetMonth = 6; // Juillet
              const targetYear = 2025;
              
              // Compter toutes les signatures de juillet 2025 sauf statut "Enregistré"
              let count = 0;
              clients.forEach(client => {
                if (client.dateSignature) {
                  try {
                    const sigDate = new Date(client.dateSignature);
                    if (!isNaN(sigDate.getTime())) {
                      const isJuly2025 = sigDate.getMonth() === targetMonth && sigDate.getFullYear() === targetYear;
                      const status = (client.status || '').toLowerCase().trim();
                      const isNotEnregistre = status !== 'enregistre' && status !== 'enregistré';
                      
                      if (isJuly2025 && isNotEnregistre) {
                        count++;
                      }
                    }
                  } catch (error) {
                    // Ignorer les erreurs de date
                  }
                }
              });
              
              return count;
            })()}
            icon={<UserCheck />}
            description="Signatures ce mois →"
            variant="primary"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                if (!client.dateSignature) return false;
                
                try {
                  const sigDate = new Date(client.dateSignature);
                  if (isNaN(sigDate.getTime())) return false;
                  
                  // Filtrer pour juillet 2025 sauf statut "Enregistré"
                  const isJuly2025 = sigDate.getMonth() === 6 && sigDate.getFullYear() === 2025;
                  const status = client.status ? client.status.toLowerCase() : '';
                  const isNotEnregistre = status !== 'enregistre' && status !== 'enregistré';
                  
                  return isJuly2025 && isNotEnregistre;
                } catch (error) {
                  return false;
                }
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
          
          <StatCard
            title="Clients à relancer"
            count={(() => {
              return clients.filter(client => {
                const excludedStatuses = ['installation', 'resiliation', 'rendez-vous'];
                return !excludedStatuses.includes(client.status || '');
              }).length;
            })()}
            icon={<Target />}
            description="Pour valider →"
            variant="warning"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                const excludedStatuses = ['installation', 'resiliation', 'rendez-vous'];
                return !excludedStatuses.includes(client.status || '');
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
          
          <StatCard
            title="Pts générés"
            count={(() => {
              return clients.filter(client => {
                if (!client.dateSignature) return false;
                try {
                  const sigDate = new Date(client.dateSignature);
                  return sigDate.getMonth() === 6 && sigDate.getFullYear() === 2025;
                } catch (error) {
                  return false;
                }
              }).reduce((total, client) => {
                const produit = client.produit || "";
                if (produit.toLowerCase().includes('ultra')) return total + 6;
                if (produit.toLowerCase().includes('essentiel')) return total + 5;
                if (produit.toLowerCase().includes('pop')) return total + 4;
                if (produit.toLowerCase().includes('5g')) return total + 1;
                return total;
              }, 0);
            })()}
            icon={<TrendingUp />}
            description="Ce mois →"
            variant="success"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                if (!client.dateSignature) return false;
                try {
                  const sigDate = new Date(client.dateSignature);
                  return sigDate.getMonth() === 6 && sigDate.getFullYear() === 2025;
                } catch (error) {
                  return false;
                }
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
          
          <StatCard
            title="Installations"
            count={(() => {
              return clients.filter(client => {
                if (!client.dateInstallation) return false;
                try {
                  const installDate = new Date(client.dateInstallation);
                  return installDate.getMonth() === 6 && installDate.getFullYear() === 2025;
                } catch (error) {
                  return false;
                }
              }).length;
            })()}
            icon={<Check />}
            description="En cours ce mois →"
            variant="info"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                if (!client.dateInstallation) return false;
                try {
                  const installDate = new Date(client.dateInstallation);
                  return installDate.getMonth() === 6 && installDate.getFullYear() === 2025;
                } catch (error) {
                  return false;
                }
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
          
          <StatCard
            title="Nombre de Box"
            count={clients.filter(c => c.produit && c.produit.toLowerCase().includes('freebox')).length}
            icon={<Users />}
            description="Ce mois →"
            variant="secondary"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                return client.produit && client.produit.toLowerCase().includes('freebox');
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
          
          <StatCard
            title="Nb Forfait 5G"
            count={clients.filter(c => c.produit && c.produit.toLowerCase().includes('5g')).length}
            icon={<Users />}
            description="Ce mois →"
            variant="accent"
            onClick={() => {
              setCustomFilter(() => (client: Client) => {
                return client.produit && client.produit.toLowerCase().includes('5g');
              });
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          />
        </div>



        {/* Barre de recherche et filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtres et recherche</span>
              <span className="text-sm text-gray-500 font-normal">
                {filteredClients.length} client(s) affiché(s)
                {customFilter && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Filtre actif
                  </span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par statut */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="enregistre">Enregistré</SelectItem>
                  <SelectItem value="valider">Valider</SelectItem>
                  <SelectItem value="validation7jours">Validation + 7 jours</SelectItem>
                  <SelectItem value="rendezvous">Rendez-vous</SelectItem>
                  <SelectItem value="postproduction">Post-production</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                  <SelectItem value="abandonne">Abandonné</SelectItem>
                </SelectContent>
              </Select>

              {/* Mode d'affichage */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "tableau" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("tableau")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grille" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grille")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Bouton pour réinitialiser le filtre personnalisé */}
              {customFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomFilter(null)}
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser filtre
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Affichage des clients */}
        {viewMode === "tableau" ? (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Nom</th>
                      <th className="text-left p-3">Téléphone</th>
                      <th className="text-left p-3">Produit</th>
                      <th className="text-left p-3">Statut</th>
                      <th className="text-left p-3">Signature</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{`${client.prenom || ''} ${client.nom || ''}`.trim()}</td>
                        <td className="p-3">{client.telephone || '-'}</td>
                        <td className="p-3">{client.produit || '-'}</td>
                        <td className="p-3">{client.status}</td>
                        <td className="p-3">{client.dateSignature ? new Date(client.dateSignature).toLocaleDateString() : '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Link href={`/clients/${client.id}/edit`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{`${client.prenom || ''} ${client.nom || ''}`.trim()}</CardTitle>
                    <StatusBadge status={client.status || "inconnu"} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Téléphone:</strong> {client.telephone || "-"}</p>
                    <p><strong>Produit:</strong> {client.produit || "-"}</p>
                    <p><strong>Signature:</strong> {client.dateSignature ? new Date(client.dateSignature).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        Modifier
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>

      {/* Modal de nouveau client */}
      {isClientFormOpen && (
        <ClientFormNew 
          onSubmit={(values) => {
            setIsClientFormOpen(false);
            refetch();
          }}
          onReturnToList={() => setIsClientFormOpen(false)}
        />
      )}
    </AppLayout>
  );
}