import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { simCardDataManager, type SimCardData } from "@/utils/simCardDataManager";
import { Plus, Search, RotateCw, Download, Grid, List, Users, AlertTriangle, XCircle } from "lucide-react";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { SimCardStat } from "@/components/sim-cards/sim-card-stat";
import { SimCardFormModern } from "@/components/sim-cards/sim-card-form-modern";
import { SimCardDetail } from "@/components/sim-cards/sim-card-detail";
import { StatusBadge } from "@/components/ui/status-badge";
import { CompactCard } from "@/components/ui/compact-card";
import { SimCard } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
// import { useSimCardSync } from "@/hooks/useSimCardSync";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  return isMobile;
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return "-";
  }
};

const formatVendorCode = (code: string | null) => {
  if (!code) return null;
  return code;
};

// Define stats type interface
interface SimStats {
  total: number;
  disponibles: number;
  actives: number;
  affectees: number;
}

export default function SimCardsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedSimCard, setSelectedSimCard] = useState<SimCard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grille" | "tableau">("tableau");
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fonction pour gérer le clic sur les cartes statistiques avec filtrage
  const handleStatCardClick = (filterType: string) => {
    // Appliquer le filtre
    setStatusFilter(filterType);
    setCurrentPage(1); // Remettre à la page 1
    
    // Scroll automatique vers la liste des cartes
    setTimeout(() => {
      const cardsList = document.getElementById('sim-cards-list');
      if (cardsList) {
        cardsList.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Fonction pour déterminer la couleur selon le nombre de cartes disponibles
  const getAvailableCardsColor = (disponibles: number): "green" | "orange" | "red" => {
    if (disponibles <= 5) return "red";
    if (disponibles < 10) return "orange";
    return "green";
  };
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Désactiver le hook de synchronisation qui peut causer des problèmes
  // const { invalidateSimCards } = useSimCardSync();

  // État local pour les données SIM Cards avec gestionnaire personnalisé
  const [simCards, setSimCards] = useState<SimCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // S'abonner au gestionnaire de synchronisation centralisé
  useEffect(() => {
    const setupSync = async () => {
      const { simCardSync } = await import('@/utils/simCardSync');
      const unsubscribe = simCardSync.subscribe(() => {
        refetch();
      });
      
      // Cleanup à l'unmount
      return unsubscribe;
    };
    
    let cleanup: (() => void) | undefined;
    setupSync().then(fn => cleanup = fn);
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Fonction de rechargement des données
  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await simCardDataManager.forceRefresh();
      setSimCards(data);
    } catch (err) {
      setError(err as Error);
      console.error("🚨 Erreur rechargement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial et synchronisation
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await simCardDataManager.fetchSimCards();
        setSimCards(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // S'abonner aux mises à jour
    const unsubscribe = simCardDataManager.subscribe((data) => {
      console.log("🔄 [SUBSCRIPTION] Données mises à jour:", data.length);
      setSimCards(data);
    });

    return unsubscribe;
  }, []);


  
  if (error) {
    console.error("❌ ERREUR QUERY SIM-CARDS:", error);
  }

  const createSimCardMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/sim-cards", data);
    },
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
      setSelectedSimCard(null);
      toast({
        title: "Carte SIM créée",
        description: "La carte SIM a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la carte SIM",
        variant: "destructive",
      });
    },
  });

  const updateSimCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/sim-cards/${id}`, data);
    },
    onSuccess: () => {
      // Simple rechargement des données via notre gestionnaire
      refetch();
      setIsFormOpen(false);
      setSelectedSimCard(null);
      toast({
        title: "Carte SIM modifiée",
        description: "La carte SIM a été modifiée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la carte SIM",
        variant: "destructive",
      });
    },
  });

  const deleteSimCardMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`🗑️ SUPPRESSION CARTE SIM - ID: ${id} - Début requête DELETE`);
      try {
        const result = await apiRequest("DELETE", `/api/sim-cards/${id}`);
        console.log(`✅ SUPPRESSION CARTE SIM - ID: ${id} - Succès:`, result);
        return result;
      } catch (error) {
        console.error(`❌ SUPPRESSION CARTE SIM - ID: ${id} - Erreur:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`🎯 SUPPRESSION CARTE SIM - Callback Success:`, data);
      refetch();
      toast({
        title: "Carte SIM supprimée",
        description: "La carte SIM a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      console.error(`💥 SUPPRESSION CARTE SIM - Callback Error:`, error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la carte SIM",
        variant: "destructive",
      });
    },
  });

  // Mutation pour synchroniser les cartes SIM
  const syncSimCardsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sim-cards/sync", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      refetch(); // Forcer le rechargement
      toast({
        title: "Synchronisation réussie",
        description: `${data.syncCount} cartes SIM synchronisées`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Erreur lors de la synchronisation",
        variant: "destructive",
      });
    },
  });

  // Mutation pour restaurer une carte SIM supprimée - FINALISÉE
  const restoreSimCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sim-cards/${id}/restore`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la restauration');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux cartes SIM
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards/stats"] });
      
      // Recharger les données
      refetch();
      refetchDeleted();
      
      toast({
        title: "Restauration réussie",
        description: "La carte SIM a été restaurée avec succès.",
      });

      // Fermer le dialogue après un court délai
      setTimeout(() => {
        setRestoreDialog({ isOpen: false, simCards: [] });
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de restauration",
        description: error.message || "Impossible de restaurer la carte SIM",
        variant: "destructive",
      });
    },
  });

  // États pour les popups modernes
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    step: 1 | 2;
    simCard: any | null;
  }>({ isOpen: false, step: 1, simCard: null });

  // État pour le dialogue de restauration
  const [restoreDialog, setRestoreDialog] = useState<{
    isOpen: boolean;
    simCards: any[];
  }>({ isOpen: false, simCards: [] });

  const handleDeleteSimCard = (simCard: any) => {
    setDeleteDialog({ isOpen: true, step: 1, simCard });
  };

  const handleFirstConfirm = () => {
    setDeleteDialog(prev => ({ ...prev, step: 2 }));
  };

  const handleFinalConfirm = () => {
    if (deleteDialog.simCard) {
      console.log(`✅ DOUBLE CONFIRMATION VALIDÉE - Début suppression carte SIM ID: ${deleteDialog.simCard.id}`);
      deleteSimCardMutation.mutate(deleteDialog.simCard.id);
    }
    setDeleteDialog({ isOpen: false, step: 1, simCard: null });
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, step: 1, simCard: null });
  };



  const handleFormSubmit = (data: any) => {
    if (selectedSimCard) {
      updateSimCardMutation.mutate({ id: selectedSimCard.id, data });
    } else {
      createSimCardMutation.mutate(data);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!simCards || simCards.length === 0) return;
    
    const csvData = simCards.map((sim: any) => ({
      numero: sim.numero,
      statut: sim.statut,
      client: sim.clientNom || '',
      codeVendeur: sim.codeVendeur || '',
      dateAttribution: sim.dateAttribution ? formatDate(sim.dateAttribution) : '',
    }));

    const headers = ['Numéro', 'Statut', 'Client', 'Code Vendeur', 'Date Attribution'];
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cartes-sim.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanupDuplicatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sim-cards/cleanup-duplicates");
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      toast({
        title: "Nettoyage terminé",
        description: `${data?.message || "Doublons supprimés avec succès"}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors du nettoyage",
        description: error.message || "Impossible de nettoyer les doublons",
        variant: "destructive",
      });
    },
  });

  const handleCleanupDuplicates = () => {
    if (confirm("Voulez-vous vraiment nettoyer les doublons ? Cette action est irréversible.")) {
      cleanupDuplicatesMutation.mutate();
    }
  };

  const handleAddSimCard = () => {
    setSelectedSimCard(null);
    setIsFormOpen(true);
  };

  const handleEditSimCard = (simCard: any) => {
    setSelectedSimCard(simCard);
    setIsFormOpen(true);
  };

  const handleViewSimCard = (simCard: any) => {
    setSelectedSimCard(simCard);
    setIsDetailOpen(true);
  };



  // Charger les statistiques depuis l'API (sans cache)
  const { data: simStats, isLoading: statsLoading } = useQuery<SimStats>({
    queryKey: ["/api/sim-cards/stats", Date.now()], // Force refresh avec timestamp
    staleTime: 0, // Données toujours considérées comme obsolètes
    gcTime: 0, // Pas de cache
    retry: false,
  });

  // Charger les cartes SIM supprimées
  const { data: deletedSimCards, isLoading: deletedLoading, refetch: refetchDeleted } = useQuery({
    queryKey: ["/api/sim-cards/deleted"],
    queryFn: async () => {
      const response = await fetch('/api/sim-cards/deleted', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des cartes supprimées');
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // Calculer les statistiques (fallback si l'API n'est pas disponible)
  const stats: SimStats = simStats || (simCards ? {
    total: simCards.length,
    disponibles: simCards.filter((sim: any) => sim.statut === "disponible").length,
    actives: simCards.filter((sim: any) => sim.statut === "affecte" || sim.statut === "active").length,
    affectees: simCards.filter((sim: any) => sim.statut === "affecte").length,
  } : { total: 0, disponibles: 0, actives: 0, affectees: 0 });

  const filteredSimCards = simCards?.filter((simCard: any) => {
    const matchesSearch = simCard.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (simCard.clientNom && simCard.clientNom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "tous" || 
                         (statusFilter === "disponible" && simCard.statut === "disponible") ||
                         (statusFilter === "affecte" && simCard.statut === "affecte");
    

    
    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    // Tri intelligent : cartes activées avec date d'installation en premier, puis disponibles
    const aHasInstallation = a.dateInstallation && a.statut === 'affecte';
    const bHasInstallation = b.dateInstallation && b.statut === 'affecte';
    
    // Si une carte est disponible, elle va à la fin
    if (a.statut === 'disponible' && b.statut !== 'disponible') return 1;
    if (b.statut === 'disponible' && a.statut !== 'disponible') return -1;
    
    // Si les deux sont disponibles, tri par numéro
    if (a.statut === 'disponible' && b.statut === 'disponible') {
      return a.numero.localeCompare(b.numero);
    }
    
    // Pour les cartes activées, tri par date d'installation décroissante
    if (aHasInstallation && bHasInstallation) {
      return new Date(b.dateInstallation).getTime() - new Date(a.dateInstallation).getTime();
    }
    
    // Cartes activées avec installation avant celles sans
    if (aHasInstallation && !bHasInstallation) return -1;
    if (!aHasInstallation && bHasInstallation) return 1;
    
    // Par défaut, tri par date de création
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredSimCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSimCards = filteredSimCards.slice(startIndex, endIndex);

  // Fonctions de navigation de page
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <AppLayout>
        <div className="container px-3 sm:px-4 py-4 sm:py-6 mx-auto max-w-7xl pb-32 sm:pb-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Header moderne optimisé mobile */}
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Cartes SIM
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                    Gestion de vos cartes SIM
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() => syncSimCardsMutation.mutate()}
                    disabled={syncSimCardsMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    size={isMobile ? "sm" : "lg"}
                  >
                    {syncSimCardsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="mr-2 h-4 w-4" />
                    )}
                    Synchroniser
                  </Button>
                  <Button 
                    onClick={handleAddSimCard} 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    size={isMobile ? "sm" : "lg"}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle carte SIM
                  </Button>
                  <Button 
                    onClick={() => window.open('https://cfe.mob.proxad.net/login', '_blank')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    size={isMobile ? "sm" : "lg"}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Activation SIM
                  </Button>
                </div>
              </div>
            </div>

            {/* Cartes statistiques optimisées mobile - Grille 2x2 CLIQUABLES */}
            {!isLoading && simCards && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Total cartes SIM - CLIQUABLE */}
                <div 
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => {
                    const newFilter = statusFilter === "tous" ? "tous" : "tous";
                    setStatusFilter(newFilter);
                    setCurrentPage(1);
                    setTimeout(() => {
                      const simCardsSection = document.getElementById('sim-cards-list');
                      if (simCardsSection) {
                        simCardsSection.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start',
                          inline: 'nearest'
                        });
                      }
                    }, 300);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">Total cartes SIM</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                    Cliquez pour filtrer
                  </div>
                </div>

                {/* Disponibles - CLIQUABLE */}
                <div 
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => {
                    const newFilter = statusFilter === "disponible" ? "tous" : "disponible";
                    setStatusFilter(newFilter);
                    setCurrentPage(1);
                    setTimeout(() => {
                      const simCardsSection = document.getElementById('sim-cards-list');
                      if (simCardsSection) {
                        simCardsSection.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start',
                          inline: 'nearest'
                        });
                      }
                    }, 300);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">Disponibles</p>
                      <p className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 ${
                        getAvailableCardsColor(stats.disponibles) === 'green' ? 'text-green-600' :
                        getAvailableCardsColor(stats.disponibles) === 'orange' ? 'text-orange-600' : 'text-red-600'
                      }`}>{stats.disponibles}</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg ${
                      getAvailableCardsColor(stats.disponibles) === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      getAvailableCardsColor(stats.disponibles) === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                    Cliquez pour filtrer
                  </div>
                </div>

                {/* Cartes activées - CLIQUABLE */}
                <div 
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => {
                    const newFilter = statusFilter === "affecte" ? "tous" : "affecte";
                    setStatusFilter(newFilter);
                    setCurrentPage(1);
                    setTimeout(() => {
                      const simCardsSection = document.getElementById('sim-cards-list');
                      if (simCardsSection) {
                        simCardsSection.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start',
                          inline: 'nearest'
                        });
                      }
                    }, 300);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">Cartes activées</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mt-1">{stats.actives || stats.affectees}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                    Cliquez pour filtrer
                  </div>
                </div>

                {/* NOUVELLE CARTE : Cartes supprimées - CLIQUABLE */}
                <div 
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => setRestoreDialog({ isOpen: true, simCards: deletedSimCards || [] })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">Supprimées</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 mt-1">
                        {(deletedSimCards && Array.isArray(deletedSimCards)) ? deletedSimCards.length : 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  {deletedSimCards && Array.isArray(deletedSimCards) && deletedSimCards.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                      Cliquez pour restaurer
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filtres et recherche modernisés */}
            <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par numéro ou client..."
                    className="pl-9 bg-white/50 dark:bg-slate-700/50 border-white/20 focus:border-blue-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-700/50 border-white/20">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="affecte">Activé</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRefresh}
                    className="bg-white/50 dark:bg-slate-700/50 border-white/20 hover:bg-white/80"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleExport}
                    className="bg-white/50 dark:bg-slate-700/50 border-white/20 hover:bg-white/80"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Contrôle du mode d'affichage */}
              <div className="flex justify-center mt-4">
                <div className="bg-slate-100/50 dark:bg-slate-700/50 rounded-xl p-1 flex">
                  <Button
                    variant="ghost"
                    className={`rounded-lg px-4 py-2 transition-all ${
                      viewMode === "tableau" 
                        ? "bg-white dark:bg-slate-600 shadow-md text-blue-600 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
                    }`}
                    onClick={() => setViewMode("tableau")}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Liste
                  </Button>
                  <Button
                    variant="ghost"
                    className={`rounded-lg px-4 py-2 transition-all ${
                      viewMode === "grille" 
                        ? "bg-white dark:bg-slate-600 shadow-md text-blue-600 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
                    }`}
                    onClick={() => setViewMode("grille")}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Cartes
                  </Button>
                </div>
              </div>
            </div>

            {/* Affichage des cartes SIM avec ID pour scroll */}
            <div id="sim-cards-list">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredSimCards.length === 0 ? (
              <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl p-12 border border-white/20 shadow-xl text-center">
                <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Aucune carte SIM trouvée
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {searchTerm || statusFilter !== "tous" 
                    ? "Aucune carte ne correspond à vos critères de recherche."
                    : "Commencez par ajouter une nouvelle carte SIM."}
                </p>
              </div>
            ) : (
              <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl p-6 border border-white/20 shadow-xl">
                {viewMode === "grille" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedSimCards.map((simCard: any) => (
                      <div 
                        key={simCard.id} 
                        className="bg-white/80 dark:bg-slate-700/80 rounded-xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                        onClick={() => handleViewSimCard(simCard)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <StatusBadge status={simCard.statut} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSimCard(simCard);
                            }}
                          >
                            Modifier
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                            {simCard.numero}
                          </h3>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Client:</p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {simCard.statut === "affecte" && simCard.clientNom
                                  ? simCard.clientNom
                                  : simCard.statut === "affecte" && simCard.clientPrenom
                                  ? `${simCard.clientCivilite || ''} ${simCard.clientPrenom}`.trim()
                                  : simCard.statut === "affecte" ? (simCard.clientNom || "Client non identifié") : "-"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Code Vendeur:</p>
                              <p className="text-sm font-mono text-slate-700 dark:text-slate-200">
                                {simCard.codeVendeur || "FR98445061"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attribution:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                {formatDate(simCard.dateAttribution)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-600">
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Numéro</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Statut</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Client</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm hidden md:table-cell">Code Vendeur</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm hidden lg:table-cell">Attribution</th>
                          <th className="text-left py-3 px-2 md:px-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSimCards.map((simCard: any) => (
                          <tr 
                            key={simCard.id} 
                            className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-600/30 transition-colors cursor-pointer"
                            onClick={() => handleViewSimCard(simCard)}
                          >
                            <td className="py-4 px-2 md:px-4">
                              <span className="font-mono text-xs md:text-sm font-medium text-slate-800 dark:text-white">
                                {simCard.numero}
                              </span>
                            </td>
                            <td className="py-4 px-2 md:px-4">
                              <StatusBadge status={simCard.statut} />

                            </td>
                            <td className="py-4 px-2 md:px-4 text-xs md:text-sm text-slate-700 dark:text-slate-200">
                              <div className="max-w-32 md:max-w-none">
                                {simCard.statut === "affecte" && simCard.clientNom
                                  ? (
                                    <div>
                                      <div className="font-medium">{simCard.clientNom}</div>
                                      <div className="text-xs text-slate-500 md:hidden">{simCard.codeVendeur || "FR98445061"}</div>
                                    </div>
                                  )
                                  : simCard.statut === "affecte" && simCard.clientPrenom
                                  ? (
                                    <div>
                                      <div className="font-medium">{`${simCard.clientCivilite || ''} ${simCard.clientPrenom}`.trim()}</div>
                                      <div className="text-xs text-slate-500 md:hidden">{simCard.codeVendeur || "FR98445061"}</div>
                                    </div>
                                  )
                                  : simCard.statut === "affecte" ? (simCard.clientNom || "Client non identifié") : "-"}
                              </div>
                            </td>
                            <td className="py-4 px-2 md:px-4 text-sm font-mono text-slate-700 dark:text-slate-200 hidden md:table-cell">
                              {simCard.codeVendeur || "FR98445061"}
                            </td>
                            <td className="py-4 px-2 md:px-4 text-sm text-slate-700 dark:text-slate-200 hidden lg:table-cell">
                              {formatDate(simCard.dateAttribution)}
                            </td>
                            <td className="py-4 px-2 md:px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSimCard(simCard);
                                  }}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-md text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSimCard(simCard);
                                  }}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Contrôles de pagination optimisés mobile */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-4 pb-6 border-t border-slate-200 dark:border-slate-600 space-y-4">
                    {/* Informations d'affichage centrées sur mobile */}
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        Affichage {startIndex + 1}-{Math.min(endIndex, filteredSimCards.length)} sur {filteredSimCards.length} cartes SIM
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Page {currentPage} sur {totalPages}
                      </div>
                    </div>
                    
                    {/* Contrôles de navigation optimisés mobile */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      {/* Boutons Précédent/Suivant */}
                      <div className="flex items-center gap-2 order-2 sm:order-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="bg-white/50 dark:bg-slate-700/50 border-white/20 px-3 py-2 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          ← Préc.
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="bg-white/50 dark:bg-slate-700/50 border-white/20 px-3 py-2 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          Suiv. →
                        </Button>
                      </div>
                      
                      {/* Numéros de pages - responsive */}
                      <div className="flex gap-1 order-1 sm:order-2">
                        {Array.from({ length: Math.min(totalPages <= 5 ? totalPages : 5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                                currentPage === pageNum
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                  : "bg-white/50 dark:bg-slate-700/50 border-white/20 hover:bg-white/80"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {isFormOpen && (
          <SimCardFormModern
            isOpen={isFormOpen}
            simCard={selectedSimCard || undefined}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedSimCard(null);
            }}
          />
        )}

        {isDetailOpen && selectedSimCard && (
          <SimCardDetail
            simCardId={selectedSimCard.id}
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedSimCard(null);
            }}
            onEdit={(simCard: any) => {
              setSelectedSimCard(simCard);
              setIsDetailOpen(false);
              setIsFormOpen(true);
            }}
          />
        )}

        {/* Popups modernes de double confirmation */}
        <ModernDialog
          isOpen={deleteDialog.isOpen && deleteDialog.step === 1}
          onClose={handleCancelDelete}
          onConfirm={handleFirstConfirm}
          title="Suppression carte SIM"
          message={`Voulez-vous vraiment supprimer la carte SIM ${deleteDialog.simCard?.numero} ?`}
          confirmText="Continuer"
          cancelText="Annuler"
          type="warning"
          icon={<AlertTriangle className="w-6 h-6" />}
        />

        <ModernDialog
          isOpen={deleteDialog.isOpen && deleteDialog.step === 2}
          onClose={handleCancelDelete}
          onConfirm={handleFinalConfirm}
          title="Confirmation définitive"
          message={`ATTENTION : Cette action est définitive !\n\nConfirmez-vous la suppression de la carte SIM ${deleteDialog.simCard?.numero} ?\n\n⚠️ La carte sera supprimée définitivement.`}
          confirmText="Supprimer définitivement"
          cancelText="Annuler"
          type="danger"
          icon={<XCircle className="w-6 h-6" />}
        />

        {/* Dialog de restauration des cartes SIM supprimées - OPTIMISÉ MOBILE */}
        {restoreDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-white/20">
              {/* Header mobile optimisé */}
              <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                    Supprimées
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
                    {(deletedSimCards && deletedSimCards.length) || 0} carte{((deletedSimCards && deletedSimCards.length) || 0) > 1 ? 's' : ''} récupérable{((deletedSimCards && deletedSimCards.length) || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreDialog({ isOpen: false, simCards: [] })}
                  className="border-slate-200 dark:border-slate-600 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Fermer
                </Button>
              </div>

              {/* Contenu scrollable mobile */}
              <div className="flex-1 overflow-auto p-2 sm:p-6">
                {!deletedSimCards || deletedSimCards.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Aucune carte supprimée
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                      Toutes vos cartes SIM sont actives !
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:gap-4">
                    {deletedSimCards.map((simCard: any) => (
                      <div key={simCard.id} className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 sm:p-2 rounded-md sm:rounded-lg shadow-md">
                                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base">
                                  {simCard.numero}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                  Supprimée le {formatDate(simCard.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {simCard.clientNom && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-1 sm:mb-2">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Assignée à : <strong className="text-slate-800 dark:text-white">{simCard.clientNom}</strong></span>
                              </div>
                            )}
                            
                            {simCard.dateAttribution && (
                              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Attribuée le {formatDate(simCard.dateAttribution)}
                              </div>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => restoreSimCardMutation.mutate(simCard.id)}
                            disabled={restoreSimCardMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto"
                          >
                            {restoreSimCardMutation.isPending ? (
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-2" />
                            ) : (
                              <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            )}
                            Restaurer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </AppLayout>
    </div>
  );
}