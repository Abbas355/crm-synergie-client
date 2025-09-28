import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/app-layout";
import { Trash2, RotateCcw, Users, AlertCircle, Search, Mail, Phone, Package, MapPin, Clock, Calendar, Grid, List, CheckCircle, User, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeletedItem {
  id: number;
  type: 'client' | 'task' | 'sim_card';
  title: string;
  description: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  produit: string;
  status: string;
  deletedAt: string;
  priority?: string;
  dueDate?: string;
  category?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  numero?: string; // Pour les cartes SIM
}

type ViewMode = 'list' | 'grid';

export default function CorbeillePage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Mode liste par défaut

  // Récupérer les éléments supprimés (clients et tâches)
  const { data: deletedItems = [], isLoading, error } = useQuery<DeletedItem[]>({
    queryKey: ["/api/trash/deleted"],
    queryFn: async () => {
      const response = await fetch("/api/trash/deleted", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des éléments supprimés");
      return response.json();
    }
  });

  // Mutation pour restaurer un élément
  const restoreMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'client' | 'task' | 'sim_card' }) => {
      if (type === 'client') {
        await apiRequest("PUT", `/api/clients/${id}/restore`);
      } else if (type === 'task') {
        await apiRequest("PUT", `/api/tasks/${id}/restore`);
      } else if (type === 'sim_card') {
        // Pour les cartes SIM, on remet le statut à "disponible" au lieu de "supprime"
        await apiRequest("PUT", `/api/sim-cards/${id}`, { statut: "disponible" });
      }
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trash/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      const titles = {
        client: "Client restauré",
        task: "Tâche restaurée", 
        sim_card: "Carte SIM restaurée"
      };
      const descriptions = {
        client: "Le client a été restauré avec succès",
        task: "La tâche a été restaurée avec succès",
        sim_card: "La carte SIM a été restaurée avec succès"
      };
      toast({
        title: titles[type],
        description: descriptions[type],
      });
      setIsRestoring(null);
    },
    onError: (_, { type }) => {
      toast({
        title: "Erreur",
        description: type === 'client' ? "Erreur lors de la restauration du client" : "Erreur lors de la restauration de la tâche",
        variant: "destructive",
      });
      setIsRestoring(null);
    }
  });

  // Fonction de navigation vers les détails
  const handleNavigateToDetails = (item: DeletedItem) => {
    if (item.type === 'client') {
      setLocation(`/clients/${item.id}?fromTrash=true`);
    } else if (item.type === 'task') {
      setLocation(`/tasks/${item.id}?fromTrash=true`);
    }
  };

  const handleRestore = (item: DeletedItem) => {
    setIsRestoring(item.id);
    restoreMutation.mutate({ id: item.id, type: item.type });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60));
    const remainingHours = Math.max(0, 48 - diffInHours);
    
    if (remainingHours === 0) {
      return "Suppression définitive imminente";
    } else if (remainingHours < 24) {
      return `${remainingHours}h restantes`;
    } else {
      const days = Math.floor(remainingHours / 24);
      const hours = remainingHours % 24;
      return `${days}j ${hours}h restantes`;
    }
  };

  // Filtrer les éléments selon le terme de recherche
  const filteredItems = deletedItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.prenom.toLowerCase().includes(searchLower) ||
      item.nom.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower) ||
      item.telephone?.toLowerCase().includes(searchLower) ||
      item.produit.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de la corbeille...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-500">Impossible de charger la corbeille</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header moderne avec glassmorphism */}
          <div className="text-center py-6 sm:py-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Trash2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent mb-4">
              Corbeille
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl font-medium">
              Corbeille - {deletedItems.length} éléments
            </p>
          </div>

          {/* Barre de recherche et contrôles */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans la corbeille..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white/50 border-0 shadow-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {/* Boutons de basculement de vue */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`${viewMode === 'list' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-white/70 text-gray-700 hover:bg-white/90'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`${viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-white/70 text-gray-700 hover:bg-white/90'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1">
                  {deletedItems.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                  {deletedItems.filter(c => {
                    const hours = Math.floor((new Date().getTime() - new Date(c.deletedAt).getTime()) / (1000 * 60 * 60));
                    return hours > 24;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Anciens</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
                  {deletedItems.filter(c => {
                    const hours = Math.floor((new Date().getTime() - new Date(c.deletedAt).getTime()) / (1000 * 60 * 60));
                    return hours > 40;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Urgents</div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu */}
          {filteredItems.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12 text-center">
                <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Aucun résultat" : "Corbeille vide"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? "Aucun élément trouvé pour cette recherche" : "Aucun élément supprimé à afficher"}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'list' ? (
            /* Mode Liste - Tableau */
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Élément</th>
                        <th className="text-left p-4 font-medium text-gray-700 hidden sm:table-cell">Type</th>
                        <th className="text-left p-4 font-medium text-gray-700 hidden md:table-cell">Supprimé le</th>
                        <th className="text-left p-4 font-medium text-gray-700 hidden lg:table-cell">Temps restant</th>
                        <th className="text-center p-4 font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-indigo-50/50 transition-colors cursor-pointer"
                          onClick={() => handleNavigateToDetails(item)}
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                {item.type === 'client' ? (
                                  <User className="h-4 w-4 text-white" />
                                ) : item.type === 'sim_card' ? (
                                  <Smartphone className="h-4 w-4 text-white" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'client' 
                                ? 'bg-blue-100 text-blue-800' 
                                : item.type === 'sim_card'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'client' ? 'Client' : item.type === 'sim_card' ? 'Carte SIM' : 'Tâche'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                            {formatDate(item.deletedAt)}
                          </td>
                          <td className="p-4 text-sm hidden lg:table-cell">
                            <span className="text-orange-600 font-medium">
                              {getTimeRemaining(item.deletedAt)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(item);
                              }}
                              disabled={isRestoring === item.id}
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                            >
                              {isRestoring === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Mode Grille - Cartes */
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                  onClick={() => handleNavigateToDetails(item)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {item.type === 'client' ? (
                            <User className="h-6 w-6 text-white" />
                          ) : item.type === 'sim_card' ? (
                            <Smartphone className="h-6 w-6 text-white" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">
                            {item.title}
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(item.deletedAt)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                item.type === 'client' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : item.type === 'sim_card'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.type === 'client' ? 'Client' : item.type === 'sim_card' ? 'Carte SIM' : 'Tâche'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-600">
                              {getTimeRemaining(item.deletedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(item);
                        }}
                        disabled={isRestoring === item.id}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg w-full sm:w-auto"
                      >
                        {isRestoring === item.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Restauration...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}