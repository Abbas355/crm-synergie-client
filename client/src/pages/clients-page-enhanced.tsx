import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { getStatusHexColors } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  FileText, 
  ArrowLeft, 
  Edit,
  ChevronDown,
  Calendar,
  X,
  Search,
  SearchX,
  XCircle
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Version améliorée de la page clients avec les colonnes correctes
 * selon les spécifications demandées.
 */
// Fonction pour obtenir le libellé du statut
function getStatusLabel(status: string): string {
  if (!status) return 'Enregistré';
  
  switch(status) {
    case 'enregistre':
      return 'Enregistré';
    case 'valide':
      return 'Validé';
    case 'valide-7-jours':
    case 'valide_7_jours':
      return 'validé 7 jours';
    case 'rendez-vous':
    case 'rendez_vous':
      return 'rendez-vous';
    case 'installation':
      return 'Installation';
    case 'post-production':
    case 'post_production':
      return 'Post-production';
    case 'resiliation':
      return 'Résiliation';
    case 'abandonne':
      return 'Abandonné';
    default:
      return status;
  }
}

// Fonction pour obtenir les styles CSS selon le statut - harmonisée avec mode grille
function getStatusStyles(status: string | null | undefined): string {
  const colors = getStatusHexColors(status || '');
  const borderStyle = (status === 'enregistre' || !status) ? 'border border-gray-300' : '';
  return `inline-block px-3 py-1 rounded-full text-sm font-medium ${borderStyle}`;
}

export default function ClientsPageEnhanced() {
  const [_, setLocation] = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateDialog, setDateDialog] = useState<{isOpen: boolean; clientId: number | null; status: string | null}>({
    isOpen: false,
    clientId: null,
    status: null
  });
  const [dateValue, setDateValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Récupération du rôle de l'utilisateur
  const { isAdmin } = useRole();
  const userIsAdmin = isAdmin();
  
  // Récupération du système de notifications
  const { toast } = useToast();
  
  // Fonction pour mettre à jour le statut d'un client
  const updateClientStatus = async (clientId: number, status: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }
      
      toast({
        title: "Statut mis à jour",
        description: "Le statut du client a été mis à jour avec succès",
      });
      
      // Recharger les clients
      await loadClients();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour demander une date et mettre à jour le statut
  const promptDateAndUpdateStatus = (clientId: number, status: string) => {
    // Ouvrir la boîte de dialogue pour demander une date
    setDateDialog({
      isOpen: true,
      clientId,
      status
    });
  };
  
  // Fonction pour confirmer la mise à jour du statut avec une date
  const confirmDateAndUpdateStatus = async () => {
    if (!dateDialog.clientId || !dateDialog.status || !dateValue) {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir une date valide",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Champ à mettre à jour selon le statut
      const dateField = dateDialog.status === "rendez-vous" ? "dateRendezVous" : "dateInstallation";
      
      const response = await fetch(`/api/clients/${dateDialog.clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: dateDialog.status,
          [dateField]: dateValue 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut et la date ont été mis à jour avec succès`,
      });
      
      // Fermer la boîte de dialogue
      setDateDialog({
        isOpen: false,
        clientId: null,
        status: null
      });
      setDateValue("");
      
      // Recharger les clients
      await loadClients();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour charger les clients
  const loadClients = async () => {
    try {
      setIsLoading(true);
      // Standardiser l'URL API - les admins voient tous les clients, les vendeurs seulement les leurs
      // Forcer le rafraîchissement avec timestamp unique
      const timestamp = Date.now();
      const url = isAdmin() ? `/api/clients?all=true&debug=1&_t=${timestamp}` : `/api/clients?debug=1&_t=${timestamp}`;
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des clients: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Les données reçues ne sont pas un tableau");
      }
      
      console.log("Nombre total de clients reçus de l'API:", data.length);
      
      // Tri des clients par date de signature (décroissant)
      const sortedClients = [...data].sort((a, b) => {
        // Par défaut, utiliser dateSignature (qui est le champ "dateSignature" du schéma)
        let dateA = a.dateSignature ? new Date(a.dateSignature).getTime() : 0;
        let dateB = b.dateSignature ? new Date(b.dateSignature).getTime() : 0;
        
        // Si dateSignature n'est pas disponible, essayer date (champ legacy)
        if (dateA === 0 && a.date) dateA = new Date(a.date).getTime();
        if (dateB === 0 && b.date) dateB = new Date(b.date).getTime();
        
        return dateB - dateA; // Tri décroissant (du plus récent au plus ancien)
      });
      
      console.log("Clients triés par date décroissante:", 
                  sortedClients.slice(0, 3).map(c => `${c.prenom} ${c.nom}: ${c.dateSignature || c.date}`));
      
      setClients(sortedClients);
      setFilteredClients(sortedClients);
      setError(null);
      
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrer les clients selon les critères
  const filterClients = useCallback(() => {
    if (!clients.length) return;
    
    let result = [...clients];
    
    // Filtrer par statut
    if (statusFilter) {
      result = result.filter(client => client.status === statusFilter);
    }
    
    // Filtrer par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => {
        return (
          (client.prenom && client.prenom.toLowerCase().includes(query)) ||
          (client.nom && client.nom.toLowerCase().includes(query)) ||
          (client.codeVendeur && client.codeVendeur.toLowerCase().includes(query)) ||
          (client.identifiantContrat && client.identifiantContrat.toLowerCase().includes(query)) ||
          (client.identifiant && client.identifiant.toLowerCase().includes(query)) ||
          (client.carteSim && client.carteSim.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredClients(result);
  }, [clients, statusFilter, searchQuery]);
  
  // Effet pour filtrer les clients lors de changements de filtres
  useEffect(() => {
    filterClients();
  }, [filterClients, clients, statusFilter, searchQuery]);
  
  // Charger les clients au chargement de la page
  useEffect(() => {
    loadClients();
  }, []);

  return (
    <AppLayout>
      <div className="py-4 px-4">
        {/* Dialogue pour demander une date */}
        <Dialog 
          open={dateDialog.isOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setDateDialog({ isOpen: false, clientId: null, status: null });
              setDateValue("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {dateDialog.status === "rendez-vous" ? "Date de rendez-vous" : "Date d'installation"}
              </DialogTitle>
              <DialogDescription>
                Veuillez saisir une date pour {dateDialog.status === "rendez-vous" ? "le rendez-vous" : "l'installation"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={confirmDateAndUpdateStatus}>
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-4">Liste des clients</h1>
          </div>
          
          <div className="flex space-x-2">
            {/* Bouton d'ajout de client */}
            <Button 
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={() => setLocation("/clients/add-new")}
            >
              <FileText className="h-4 w-4 mr-1" />
              Nouveau client
            </Button>
            
            {/* Bouton de rafraîchissement */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                loadClients();
                toast({
                  title: "Rafraîchissement",
                  description: "Rechargement des données clients...",
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Clients */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Clients</div>
          </div>

          {/* Avec produit */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.produit).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Avec produit</div>
          </div>

          {/* Validés */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.status === "valide").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Validés</div>
          </div>

          {/* Installation en cours */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.status === "installation").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Installation</div>
          </div>
        </div>

        {/* Panneau de filtrage et statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Filtres */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
            <h3 className="font-medium mb-2">Filtrer par statut</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-white text-black border ${statusFilter === null ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
                onClick={() => setStatusFilter(null)}
              >
                Tous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-white text-black border-none ${statusFilter === 'enregistre' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('enregistre')}
              >
                Enregistré
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-yellow-500 text-black border-none ${statusFilter === 'valider' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('valider')}
              >
                Valider
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-gray-300 text-black border-none ${statusFilter === 'validation7jours' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('validation7jours')}
              >
                Validation + 7 jours
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-[#a0905a] text-white border-none ${statusFilter === 'rendezvous' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('rendezvous')}
              >
                Rendez-vous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-red-300 text-black border-none ${statusFilter === 'postproduction' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('postproduction')}
              >
                Post-production
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-green-200 text-black border-none ${statusFilter === 'installation' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('installation')}
              >
                Installation
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-red-600 text-white border-none ${statusFilter === 'resilie' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('resilie')}
              >
                Résilié
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-gray-600 text-white border-none ${statusFilter === 'abandonne' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('abandonne')}
              >
                Abandonné
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-green-400 text-black border-none ${statusFilter === 'rendez-vous' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('rendez-vous')}
              >
                Rendez-vous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-green-200 text-black border-none ${statusFilter === 'installation' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setStatusFilter('installation')}
              >
                Installation
              </Button>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
            <h3 className="font-medium mb-2">Statistiques</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Total clients</p>
                <p className="text-lg font-bold">{clients.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">En installation</p>
                <p className="text-lg font-bold">{clients.filter(c => c.status === "installation").length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Validés</p>
                <p className="text-lg font-bold">{clients.filter(c => c.status === "valide").length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rendez-vous</p>
                <p className="text-lg font-bold">{clients.filter(c => c.status === "rendez-vous" || c.status === "rendez_vous").length}</p>
              </div>
            </div>
          </div>
          
          {/* Recherche */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Recherche</h3>
            <div className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="Nom, code vendeur, identifiant..." 
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                size="sm"
                onClick={() => filterClients()}
              >
                <Search className="h-4 w-4 mr-1" />
                Rechercher
              </Button>
            </div>
          </div>
        </div>

        {/* Récapitulatif des résultats de filtrage */}
        {statusFilter || searchQuery ? (
          <div className="mb-4 text-sm text-gray-600">
            <p>
              Affichage de {filteredClients.length} résultat(s) sur un total de {clients.length} client(s)
              {statusFilter && ` • Filtre: ${statusFilter}`}
              {searchQuery && ` • Recherche: "${searchQuery}"`}
              {(statusFilter || searchQuery) && (
                <Button 
                  variant="link" 
                  className="ml-2 text-blue-600 p-0 h-auto" 
                  onClick={() => {
                    setStatusFilter(null);
                    setSearchQuery("");
                  }}
                >
                  Effacer les filtres
                </Button>
              )}
            </p>
          </div>
        ) : null}
        
        {/* Client List */}
        {isLoading ? (
          <div className="text-center py-10">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <FileText className="h-8 w-8 mx-auto text-red-400" />
            <p className="mt-2 text-gray-500">Erreur: {error.message}</p>
            <Button onClick={loadClients} className="mt-4">Réessayer</Button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-700">Aucun client trouvé</h3>
            <p className="text-gray-500 mt-1">Aucun client ne correspond aux critères sélectionnés.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={() => {
                setStatusFilter(null);
                setSearchQuery("");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="rounded-md border overflow-y-auto max-h-screen">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left font-medium text-gray-600 p-3">Date Signature</th>
                    {userIsAdmin && (
                      <th className="text-left font-medium text-gray-600 p-3 border-l-2 border-gray-400">Code Vendeur</th>
                    )}
                    <th className="text-left font-medium text-gray-600 p-3">Nom</th>
                    <th className="text-left font-medium text-gray-600 p-3">Identifiant Contrat</th>
                    <th className="text-left font-medium text-gray-600 p-3">Date Rdv</th>
                    <th className="text-left font-medium text-gray-600 p-3">Date Installation</th>
                    <th className="text-left font-medium text-gray-600 p-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {client.dateSignature 
                          ? new Date(client.dateSignature).toLocaleDateString('fr-FR')
                          : "-"}
                      </td>
                      {userIsAdmin && (
                        <td className="p-3 border-l-2 border-gray-400 font-semibold text-gray-700">
                          {client.codeVendeur || "-"}
                        </td>
                      )}
                      <td className="p-3 font-medium" onClick={() => window.location.href = `/clients/edit/${client.id}`}>
                        <div className="cursor-pointer hover:underline">
                          {`${client.prenom || ''} ${client.nom || ''}`}
                        </div>
                      </td>
                      <td className="p-3">
                        {client.identifiantContrat || client.identifiant || "-"}
                      </td>
                      <td className="p-3">
                        {client.dateRendezVous 
                          ? new Date(client.dateRendezVous).toLocaleDateString('fr-FR')
                          : "-"}
                      </td>
                      <td className="p-3">
                        {client.dateInstallation 
                          ? new Date(client.dateInstallation).toLocaleDateString('fr-FR')
                          : "-"}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div 
                              className={`cursor-pointer ${getStatusStyles(client.status)}`}
                              style={{
                                backgroundColor: getStatusHexColors(client.status || 'enregistre').bg,
                                color: getStatusHexColors(client.status || 'enregistre').text
                              }}
                            >
                              {getStatusLabel(client.status || "")}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "enregistre")}>
                              <div className="w-3 h-3 rounded-full bg-white border mr-2"></div>
                              Enregistré
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "valide")}>
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                              Validé
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "valide-7-jours")}>
                              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                              Validé 7 jours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => promptDateAndUpdateStatus(client.id, "rendez-vous")}>
                              <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                              Rendez-vous
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => promptDateAndUpdateStatus(client.id, "installation")}>
                              <div className="w-3 h-3 rounded-full bg-green-200 mr-2"></div>
                              Installation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "post-production")}>
                              <div className="w-3 h-3 rounded-full bg-red-300 mr-2"></div>
                              Post-production
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "resiliation")}>
                              <div className="w-3 h-3 rounded-full bg-red-700 mr-2"></div>
                              Résiliation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, "abandonne")}>
                              <div className="w-3 h-3 rounded-full bg-gray-700 mr-2"></div>
                              Abandonné
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}