import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { apiRequest } from "@/lib/queryClient";
import { ClientFormEditMobile } from "@/components/clients/client-form-edit-mobile";
import { NewClientFormComplete } from "@/components/clients/new-client-form-complete";
import { ClientDetailMobile } from "@/components/clients/client-detail-mobile";
import { Search, Plus, Users, TrendingUp, CheckCircle, Clock, MoreHorizontal, Phone, MapPin, Calendar, Grid3X3, List, Edit, Trash2, Eye, X } from "lucide-react";
import { StandardizedClientTable } from "@/components/ui/standardized-client-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CongratulationsModal } from "@/components/modals/congratulations-modal";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

// Fonction utilitaire pour formater les dates
const formatDate = (dateValue: string | Date | null): string => {
  if (!dateValue) return "-";
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "-";
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch {
    return "-";
  }
};

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string | null): string => {
  if (!status) return "bg-gray-100 text-gray-800";
  
  switch (status.toLowerCase()) {
    case 'enregistre':
    case 'enregistré':
      return "bg-blue-100 text-blue-800";
    case 'signature':
      return "bg-yellow-100 text-yellow-800";
    case 'validation':
      return "bg-orange-100 text-orange-800";
    case 'rendez_vous':
    case 'rendez-vous':
      return "bg-green-100 text-green-800";
    case 'installation':
      return "bg-purple-100 text-purple-800";
    case 'termine':
    case 'terminé':
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface ClientDisplay {
  id: number;
  name: string;
  prenom: string;
  nom: string;
  status: string;
  produit: string;
  telephone: string;
  email: string;
  dateSignature: string | null;
  dateRendezVous: string | null;
  dateInstallation: string | null;
  codeVendeur: string;
  identifiantContrat: string;
  codePostal: string;
  ville: string;
}

interface CustomStats {
  clientsCeMois: number;
  installations: number;
  ptsGeneresCeMois: number;
  clientsARelancer: number;
  nombreDeBox: number;
  nbForfait5G: number;
}

interface EditClientFormValues {
  id: number;
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string; // Architecture unifiée
  adresse: string;
  codePostal: string; // Architecture unifiée
  ville: string;
  status: string;
  produit: string; // Architecture unifiée
  identifiantContrat: string; // Architecture unifiée
  dateSignature: string; // Architecture unifiée
  dateRendezVous: string; // Architecture unifiée
  dateInstallation: string; // Architecture unifiée
  commentaire: string;
  codeVendeur: string; // Architecture unifiée
  portabilite: string;
  carteSim: string; // Architecture unifiée
  numeroPorter: string; // Architecture unifiée
  source: string;
  typeRecommandation: string;
  clientRecommandation?: number;
  prospectCivilite: string;
  prospectPrenom: string;
  prospectNom: string;
  prospectMobile: string;
  prospectCodePostal: string;
  prospectVille: string;
  mandatSepa: boolean;
  contratSigne: boolean; // Architecture unifiée
  bonCommande: boolean; // Architecture unifiée
  ribClient: boolean; // Architecture unifiée
  copiePieceIdentite: boolean; // Architecture unifiée
  attestationHonneur: boolean; // Architecture unifiée
  attestationFormation: boolean; // Architecture unifiée
}

export default function ClientsModern() {
  const [location] = useLocation();
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [isNewClientFormOpen, setIsNewClientFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const [editFormDefaultValues, setEditFormDefaultValues] = useState<Partial<EditClientFormValues> | null>(null);
  const [activeView, setActiveView] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailView, setShowDetailView] = useState(false);
  const [detailClientId, setDetailClientId] = useState<number | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientDisplay | null>(null);
  const [customFilter, setCustomFilter] = useState<string>("none");
  
  // Hook de recherche globale
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    hasQuery, 
    clearSearch 
  } = useGlobalSearch();
  
  // États pour le modal de félicitations
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  // Détecter les paramètres de filtre dans l'URL et scroll automatique
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const customParam = urlParams.get('custom');
    
    console.log('🔍 URL Filter Detection:', { statusParam, customParam });
    
    let shouldScroll = false;
    
    if (statusParam) {
      setStatusFilter(statusParam);
      setCustomFilter('none');
      shouldScroll = true;
      // Statut filtré
    } else if (customParam) {
      switch (customParam) {
        case 'signatures':
        case 'ventes_validees':
          console.log('🎯 Applying filter: ventes_validees');
          setCustomFilter('ventes_validees');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Ventes validées filtrées
          break;
        case 'relancer':
          setCustomFilter('clients_a_relancer');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Clients à relancer filtrés
          break;
        case 'points':
          setCustomFilter('pts_generes');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Points générés filtrés
          break;
        case 'installations':
          setCustomFilter('installations');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Installations filtrées (statut rendez-vous/post-production)
          break;
        case 'vraies_installations':
          setCustomFilter('vraies_installations');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Vraies installations filtrées (statut installation + date mois en cours)
          break;
        case 'box':
          setCustomFilter('nombre_box');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Box filtrées
          break;
        case '5g':
          setCustomFilter('forfait_5g');
          setStatusFilter('all_statuses');
          shouldScroll = true;
          // Forfaits 5G filtrés
          break;
        default:
          setCustomFilter('none');
          setStatusFilter('all_statuses');
      }
    } else {
      setCustomFilter('none');
      setStatusFilter('all_statuses');
      // Remise à zéro des filtres
    }
    
    // Scroll automatique si un filtre a été détecté depuis l'URL
    if (shouldScroll) {
      // Scroll automatique activé
      scrollToTable();
    }
  }, [location]);

  // Écouter les changements d'URL pour détecter les paramètres
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const statusParam = urlParams.get('status');
      const customParam = urlParams.get('custom');
      
      if (statusParam) {
        setStatusFilter(statusParam);
        setCustomFilter('none');
        // Navigation par statut
      } else if (customParam) {
        setStatusFilter('all_statuses');
        switch (customParam) {
          case 'signatures':
            setCustomFilter('ventes_validees');
            break;
          case 'relancer':
            setCustomFilter('clients_a_relancer');
            break;
          case 'points':
            setCustomFilter('pts_generes');
            break;
          case 'installations':
            setCustomFilter('installations');
            break;
          case 'box':
            setCustomFilter('nombre_box');
            break;
          case '5g':
            setCustomFilter('forfait_5g');
            break;
          default:
            setCustomFilter('none');
        }
        // Navigation par filtrage personnalisé
      } else {
        setCustomFilter('none');
        setStatusFilter('all_statuses');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();


  // Mutation pour créer un nouveau client
  const createNewClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest('POST', '/api/clients', clientData);
      return response;
    },
    onSuccess: (newClient: any, formData: any) => {
      console.log('🎉 CREATE SUCCESS - Données reçues:', { newClient, formData });
      console.log('🎉 Prénom détecté:', formData?.prenom);
      
      // Afficher le modal de félicitations pour TOUS les utilisateurs
      if (formData?.prenom) {
        console.log('🎉 Affichage modal félicitations pour:', formData.prenom);
        setNewClientName(formData.prenom.trim());
        setShowCongratulations(true);
        setIsNewClientFormOpen(false);
      } else {
        console.log('⚠️ Pas de prénom - affichage toast simple');
        // Si pas de prénom : toast simple et fermeture du modal
        toast({
          title: "Client créé avec succès",
          description: "Le nouveau client a été ajouté à la base de données.",
          variant: "default",
        });
        setIsNewClientFormOpen(false);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      refetch();
    },
    onError: (error) => {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive",
      });
    }
  });

  // Récupération des clients avec React Query standard
  const { 
    data: clientsData, 
    isLoading: isClientsLoading, 
    error: clientsError,
    refetch
  } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Échec de la récupération des clients');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 30 * 1000, // Refetch toutes les 30 secondes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
    refetchOnMount: true,
  });

  // Récupération des statistiques détaillées depuis l'endpoint API
  const { data: detailedStats } = useQuery({
    queryKey: ['/api/clients/custom-stats'],
    queryFn: async () => {
      // Récupération statistiques
      const response = await fetch('/api/clients/custom-stats', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Échec de la récupération des statistiques détaillées');
      }
      const data = await response.json();
      // Statistiques reçues
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
    refetchOnMount: true,
  });

  // Valeurs par défaut pour les statistiques détaillées
  const defaultDetailedStats = {
    ventesValidees: 0,
    clientsARelancer: 0,
    ptsGeneresCeMois: 0,
    installationsCeMois: 0,
    nombreBox: 0,
    nbForfait5G: 0
  };

  // Mapper les données de l'API vers les propriétés attendues par l'interface
  const finalDetailedStats = detailedStats ? {
    ventesValidees: detailedStats.clientsCeMois || 0,
    clientsARelancer: detailedStats.clientsARelancer || 0,
    ptsGeneresCeMois: detailedStats.ptsGeneresCeMois || 0,
    installationsCeMois: detailedStats.installationsEnCours || 0,
    nombreBox: detailedStats.nombreDeBox || 0,
    nbForfait5G: detailedStats.nbForfait5G || 0
  } : defaultDetailedStats;

  // Les statistiques sont maintenant calculées localement sans appel serveur

  useEffect(() => {
    if (clientsData && Array.isArray(clientsData)) {
      setClients(clientsData);
      setIsLoading(false);
    } else if (!isClientsLoading) {
      setIsLoading(false);
    }
  }, [clientsData, isClientsLoading]);

  // SOLUTION FINALE: Mutation avec hook de synchronisation
  const updateMutation = useMutation({
    mutationFn: async (formData: EditClientFormValues & { id: number }) => {
      // Protection des dates avec le module de sécurité
      const { protectDatesInData } = await import('@/utils/dateProtection');
      const protectedData = protectDatesInData(formData);
      
      console.log('🔄 MUTATION: Envoi des données:', protectedData);
      
      // Utiliser apiRequest directement pour plus de stabilité
      const result = await apiRequest("PUT", `/api/clients/${formData.id}`, protectedData);
      console.log('✅ MUTATION: Réponse serveur:', result);
      return result;
    },
    onSuccess: async (data) => {
      setIsEditFormOpen(false);
      setSelectedClient(null);
      setEditFormDefaultValues(null);
      
      // Invalider tous les caches React Query
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/custom-stats"] });
      queryClient.removeQueries({ queryKey: ["/api/clients"] });
      
      // Synchronisation douce sans rechargement de page
      await refetch();
      
      toast({
        title: "Succès", 
        description: "Client mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer un client
  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      refetch();
      toast({
        title: "Client supprimé",
        description: "Le client a été déplacé vers la corbeille et peut être restauré si nécessaire",
      });
      setClientToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
      setClientToDelete(null);
    }
  });

  // Fonction pour gérer la demande de suppression (ouvre la confirmation)
  const handleDeleteClient = (client: ClientDisplay) => {
    setClientToDelete(client);
  };

  // Fonction pour confirmer la suppression
  const confirmDeleteClient = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete.id);
    }
  };

  // Gestion de l'édition d'un client
  const handleEditClick = async (client: ClientDisplay) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Impossible de charger les données du client");
      }
      
      const latestClientData = await response.json();
      
      console.log("🔍 Données reçues pour l'édition:", latestClientData);
      console.log("🔍 Champs critiques pour l'édition:", {
        telephone: latestClientData.telephone,
        dateNaissance: latestClientData.dateNaissance,
        source: latestClientData.source,
        codePostal: latestClientData.codePostal,
        identifiantContrat: latestClientData.identifiantContrat,
        dateSignature: latestClientData.dateSignature,
        dateInstallation: latestClientData.dateInstallation
      });
      
      // ✅ UTILISATION DIRECTE SANS MODULE DE PROTECTION - Tests Debug
      console.log("🚨 AVANT TRANSFORMATION:", {
        dateNaissance: latestClientData.dateNaissance,
        source: latestClientData.source,
        type_dateNaissance: typeof latestClientData.dateNaissance,
        type_source: typeof latestClientData.source
      });
      
      const defaultValues = {
        id: latestClientData.id,
        ...latestClientData,
        civilite: latestClientData.civilite || "",
        prenom: latestClientData.prenom || "",
        nom: latestClientData.nom || "",
        email: latestClientData.email || "",
        telephone: latestClientData.telephone || "", // Architecture unifiée
        dateNaissance: latestClientData.dateNaissance || "", // Architecture unifiée
        adresse: latestClientData.adresse || "",
        codePostal: latestClientData.codePostal || "", // Architecture unifiée
        ville: latestClientData.ville || "",
        status: latestClientData.status || "",
        produit: latestClientData.produit || "", // Architecture unifiée
        identifiantContrat: latestClientData.identifiantContrat || "", // Architecture unifiée
        commentaire: latestClientData.commentaire || "",
        codeVendeur: latestClientData.codeVendeur || "", // Architecture unifiée
        portabilite: latestClientData.portabilite || "",
        carteSim: latestClientData.carteSim || "", // Architecture unifiée
        numeroPorter: latestClientData.numeroPorter || "", // Architecture unifiée
        source: latestClientData.source || "",
        typeRecommandation: latestClientData.typeRecommandation || "",
        clientRecommandation: latestClientData.clientRecommandation || undefined,
        prospectCivilite: latestClientData.prospectCivilite || "",
        prospectPrenom: latestClientData.prospectPrenom || "",
        prospectNom: latestClientData.prospectNom || "",
        prospectMobile: latestClientData.prospectMobile || "",
        prospectCodePostal: latestClientData.prospectCodePostal || "",
        prospectVille: latestClientData.prospectVille || "",
        mandatSepa: latestClientData.mandatSepa || false,
        contratSigne: latestClientData.contratSigne || false, // Architecture unifiée
        bonCommande: latestClientData.bonCommande || false, // Architecture unifiée
        ribClient: latestClientData.ribClient || false, // Architecture unifiée
        copiePieceIdentite: latestClientData.copiePieceIdentite || false, // Architecture unifiée
        attestationHonneur: latestClientData.attestationHonneur || false, // Architecture unifiée
        attestationFormation: latestClientData.attestationFormation || false, // Architecture unifiée
      };
      
      console.log("🚨 APRÈS TRANSFORMATION:", {
        defaultValues,
        source_final: defaultValues.source,
        dateNaissance_final: defaultValues.dateNaissance
      });
      
      console.log("🚨 AVANT DÉFINITION ÉTAT COMPONANT:", {
        selectedClient: latestClientData.id,
        defaultValues_keys: Object.keys(defaultValues),
        editFormDefaultValues_set: "about_to_set"
      });
      
      setSelectedClient(latestClientData);
      setEditFormDefaultValues(defaultValues);
      setIsEditFormOpen(true);
      
      console.log("✅ ÉTAT DÉFINI - MODAL PRÊT À S'OUVRIR");
      
    } catch (error) {
      console.error("Erreur lors du chargement des données du client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du client",
        variant: "destructive",
      });
    }
  };

  // Fonction pour ouvrir la vue détaillée d'un client
  const handleViewDetails = (client: ClientDisplay) => {
    setDetailClientId(client.id);
    setShowDetailView(true);
  };

  // Fonction pour fermer la vue détaillée
  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setDetailClientId(null);
  };

  // Fonction pour ouvrir l'édition depuis la vue détaillée
  const handleEditFromDetail = () => {
    if (detailClientId) {
      const client = clients.find(c => c.id === detailClientId);
      if (client) {
        handleCloseDetailView();
        handleEditClick(client);
      }
    }
  };

  // Filtrage des clients avec recherche locale améliorée
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Recherche locale dans tous les champs pertinents
      const matchesSearch = !hasQuery || [
        client?.prenom,
        client?.nom, 
        client?.email,
        client?.telephone,
        client?.ville,
        client?.produit,
        client?.identifiantContrat
      ].some(field => 
        field && field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesStatus = statusFilter === "all_statuses" || client.status === statusFilter;

      // Application du filtre personnalisé basé sur la chaîne de caractères
      let matchesCustomFilter = true;
      
      if (customFilter === "ventes_validees") {
        // Filtre pour ventes validées : TOUS les clients avec date de signature ce mois
        if (client?.dateSignature) {
          try {
            // Utilisation directe du nom de colonne de la base de données
            const signatureDate = new Date(client.dateSignature);
            const now = new Date();
            
            // Comparaison directe des mois et années - JavaScript utilise 0-11 pour les mois
            const currentMonth = now.getMonth(); // JavaScript: 0-11 (juillet = 6)
            const currentYear = now.getFullYear();
            const clientMonth = signatureDate.getMonth(); // JavaScript: 0-11 (juillet = 6)
            const clientYear = signatureDate.getFullYear();
            
            matchesCustomFilter = clientMonth === currentMonth && clientYear === currentYear;
          } catch (error) {
            console.error('Error parsing date:', error);
            matchesCustomFilter = false;
          }
        } else {
          matchesCustomFilter = false;
        }

      } else if (customFilter === "clients_a_relancer") {
        // Filtre pour clients à relancer : tous SAUF installation, résiliation et rendez-vous
        const statusToExclude = ["installation", "resiliation", "rendez-vous"];
        matchesCustomFilter = !statusToExclude.includes(client?.status || "");
      } else if (customFilter === "pts_generes") {
        // Filtre pour points générés : clients avec dateInstallation = mois en cours ET produit générateur de points
        if (client?.dateInstallation && client.produit) {
          try {
            const installationDate = new Date(client.dateInstallation);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const clientMonth = installationDate.getMonth();
            const clientYear = installationDate.getFullYear();
            const isCurrentMonth = clientMonth === currentMonth && clientYear === currentYear;
            
            const produit = client.produit.toLowerCase();
            const hasPoints = produit.includes('pop') || produit.includes('essentiel') || produit.includes('ultra') || produit.includes('forfait') || produit.includes('5g');
            matchesCustomFilter = isCurrentMonth && hasPoints;
          } catch {
            matchesCustomFilter = false;
          }
        } else {
          matchesCustomFilter = false;
        }
      } else if (customFilter === "installations") {
        // ✅ FILTRE INSTALLATIONS: (statut rendez-vous + dateRendezVous ce mois) OU statut post-production
        const isPostProduction = client?.status === 'post-production';
        const isRendezVous = client?.status === 'rendez-vous';
        let hasRdvThisMonth = false;
        
        if (isRendezVous && client?.dateRendezVous) {
          try {
            const rdvDate = new Date(client.dateRendezVous);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const rdvMonth = rdvDate.getMonth();
            const rdvYear = rdvDate.getFullYear();
            
            hasRdvThisMonth = rdvMonth === currentMonth && rdvYear === currentYear;
          } catch {
            hasRdvThisMonth = false;
          }
        }
        
        // Statut rendez-vous avec RDV ce mois OU statut post-production
        matchesCustomFilter = (isRendezVous && hasRdvThisMonth) || isPostProduction;
      } else if (customFilter === "vraies_installations") {
        // Filtre pour vraies installations : statut "installation" ET date installation mois en cours
        if (client?.status === "installation" && client?.dateInstallation) {
          try {
            const installationDate = new Date(client.dateInstallation);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const clientMonth = installationDate.getMonth();
            const clientYear = installationDate.getFullYear();
            
            matchesCustomFilter = clientMonth === currentMonth && clientYear === currentYear;
          } catch {
            matchesCustomFilter = false;
          }
        } else {
          matchesCustomFilter = false;
        }
      } else if (customFilter === "nombre_box") {
        // Filtre pour nombre de Box : produits Freebox avec signature ce mois
        if (client?.dateSignature && client.produit) {
          try {
            const signatureDate = new Date(client.dateSignature);
            const now = new Date();
            const isCurrentMonth = signatureDate.getMonth() === now.getMonth() && signatureDate.getFullYear() === now.getFullYear();
            const produit = client.produit.toLowerCase();
            const isFreebox = produit.includes('freebox') || produit.includes('box') || produit.includes('pop') || produit.includes('ultra') || produit.includes('essentiel');
            matchesCustomFilter = isCurrentMonth && isFreebox;
          } catch {
            matchesCustomFilter = false;
          }
        } else {
          matchesCustomFilter = false;
        }
      } else if (customFilter === "forfait_5g") {
        // Filtre pour forfait 5G : produits 5G avec signature ce mois
        if (client?.dateSignature && client.produit) {
          try {
            const signatureDate = new Date(client.dateSignature);
            const now = new Date();
            const isCurrentMonth = signatureDate.getMonth() === now.getMonth() && signatureDate.getFullYear() === now.getFullYear();
            const produit = client.produit.toLowerCase();
            const is5G = produit.includes('forfait') || produit.includes('5g');
            matchesCustomFilter = isCurrentMonth && is5G;
          } catch {
            matchesCustomFilter = false;
          }
        } else {
          matchesCustomFilter = false;
        }
      }

      const finalMatch = matchesSearch && matchesStatus && matchesCustomFilter;
      return finalMatch;
    });
  }, [clients, searchResults, hasQuery, searchQuery, statusFilter, customFilter]);

  console.log('📊 Filtered clients count:', filteredClients.length, 'out of', clients.length);
  


  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, customFilter]);

  // Fonction de scroll automatique vers le tableau
  const scrollToTable = () => {
    // Scroll automatique vers le tableau
    
    const attemptScroll = (attempts = 0) => {
      const maxAttempts = 20;
      
      if (attempts >= maxAttempts) {
        return;
      }
      
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        tableElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      } else {
        setTimeout(() => attemptScroll(attempts + 1), 100);
      }
    };
    
    // Démarrer les tentatives après un délai
    setTimeout(() => attemptScroll(), 300);
  };

  // Fonctions de filtrage pour les nouvelles cartes statistiques avec scroll automatique
  const handleFilterByVentesValidees = () => {
    console.log('🎯 handleFilterByVentesValidees called - Setting customFilter to ventes_validees');
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("ventes_validees");
    scrollToTable();
  };

  const handleFilterByClientsARelancer = () => {
    console.log('🎯 handleFilterByClientsARelancer called - Setting customFilter to clients_a_relancer');
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("clients_a_relancer");
    scrollToTable();
  };

  const handleFilterByPtsGeneres = () => {
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("pts_generes");
    scrollToTable();
  };

  const handleFilterByInstallations = () => {
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("installations"); // Filtre par date d'installation du mois en cours
    scrollToTable();
  };

  const handleFilterByNombreBox = () => {
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("nombre_box");
    scrollToTable();
  };

  const handleFilterByForfait5G = () => {
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("forfait_5g");
    scrollToTable();
  };

  // Fonction pour réinitialiser tous les filtres
  const handleClearFilters = () => {
    setStatusFilter("all_statuses");
    setSearchQuery("");
    setCustomFilter("none");
  };

  // Les statistiques sont maintenant calculées directement avec customStats

  // Statistiques de base pour l'affichage du total
  const stats = {
    total: clients.length,
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header moderne avec glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Clients
                  </h1>
                  <p className="text-sm text-gray-500">{stats.total} clients au total</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Boutons de vue */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeView === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("grid")}
                  className="px-3 py-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("list")}
                  className="px-3 py-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => setIsNewClientFormOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">

        
        {/* Cartes statistiques optimisées mobile selon capture d'écran */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6 mb-6">
          {/* Ventes validées */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-blue-50/50"
            onClick={handleFilterByVentesValidees}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Ventes validées</p>
                  <p className="text-lg md:text-3xl font-bold text-blue-600">{finalDetailedStats.ventesValidees}</p>
                  <p className="text-xs text-gray-500 truncate">Signatures ce mois →</p>
                  <p className="text-xs text-blue-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-blue-100 rounded-lg ml-1">
                  <Users className="h-4 w-4 md:h-8 md:w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installations */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-orange-50/50"
            onClick={handleFilterByInstallations}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Installations</p>
                  <p className="text-lg md:text-3xl font-bold text-orange-600">{finalDetailedStats.installationsCeMois}</p>
                  <p className="text-xs text-gray-500 truncate">En cours →</p>
                  <p className="text-xs text-orange-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-orange-100 rounded-lg ml-1">
                  <CheckCircle className="h-4 w-4 md:h-8 md:w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clients à relancer */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-purple-50/50"
            onClick={handleFilterByClientsARelancer}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Clients à relancer</p>
                  <p className="text-lg md:text-3xl font-bold text-purple-600">{finalDetailedStats.clientsARelancer}</p>
                  <p className="text-xs text-gray-500 truncate">Pour valider →</p>
                  <p className="text-xs text-purple-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-purple-100 rounded-lg ml-1">
                  <Clock className="h-4 w-4 md:h-8 md:w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pts générés */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-green-50/50"
            onClick={handleFilterByPtsGeneres}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Pts générés</p>
                  <p className="text-lg md:text-3xl font-bold text-green-600">{finalDetailedStats.ptsGeneresCeMois}</p>
                  <p className="text-xs text-gray-500 truncate">Ce mois →</p>
                  <p className="text-xs text-green-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-green-100 rounded-lg ml-1">
                  <TrendingUp className="h-4 w-4 md:h-8 md:w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nombre de Box */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-yellow-50/50"
            onClick={handleFilterByNombreBox}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Nombre de Box</p>
                  <p className="text-lg md:text-3xl font-bold text-yellow-600">{finalDetailedStats.nombreBox}</p>
                  <p className="text-xs text-gray-500 truncate">Ce mois →</p>
                  <p className="text-xs text-yellow-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-yellow-100 rounded-lg ml-1">
                  <svg className="h-4 w-4 md:h-8 md:w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nb Forfait 5G */}
          <Card 
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:bg-indigo-50/50"
            onClick={handleFilterByForfait5G}
          >
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">Nb Forfait 5G</p>
                  <p className="text-lg md:text-3xl font-bold text-indigo-600">{finalDetailedStats.nbForfait5G}</p>
                  <p className="text-xs text-gray-500 truncate">Ce mois →</p>
                  <p className="text-xs text-indigo-600 font-medium truncate">Cliquez pour filtrer</p>
                </div>
                <div className="p-1 md:p-3 bg-indigo-100 rounded-lg ml-1">
                  <Phone className="h-4 w-4 md:h-8 md:w-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche optimisés mobile */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-4">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col gap-3">
              {/* Ligne 1: Recherche + Boutons de vue mobile */}
              <div className="flex gap-2 md:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 border-0 bg-gray-50/50 focus:bg-white transition-colors h-10"
                    />
                    {/* Indicateur de recherche active */}
                    {hasQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-red-100"
                        title="Effacer la recherche"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    )}
                    {/* Indicateur de chargement */}
                    {isSearching && (
                      <div className="absolute right-2 top-3 h-4 w-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {/* Résultats de recherche */}
                  {hasQuery && (
                    <div className="mt-2 text-sm text-gray-600">
                      {isSearching ? (
                        <span>Recherche en cours...</span>
                      ) : filteredClients.length > 0 ? (
                        <span className="text-blue-600 font-medium">
                          {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''} pour "{searchQuery}"
                        </span>
                      ) : (
                        <span className="text-orange-600">Aucun résultat pour "{searchQuery}"</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Boutons de vue pour mobile */}
                <div className="flex md:hidden items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={activeView === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("grid")}
                    className="px-2 py-1 h-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={activeView === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("list")}
                    className="px-2 py-1 h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Ligne 2: Filtre par statut + Bouton réinitialiser */}
              <div className="flex gap-2 md:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 border-0 bg-gray-50/50 h-10">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_statuses">Tous les statuts</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="rendez_vous">Rendez-vous</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Bouton pour réinitialiser les filtres */}
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="bg-gray-50/50 border-0 hover:bg-gray-100/50 h-10 px-3 text-xs md:text-sm"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affichage conditionnel selon la vue */}
        {activeView === "grid" ? (
          /* Vue Grille - Format mobile optimisé */
          <div className="grid gap-4" data-table-container>
            {paginatedClients.map((client) => (
              <Card key={client.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        {client.prenom?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {client.name}
                          </h3>
                          <Badge className={`${getStatusColor(client.status)} border font-medium text-xs`}>
                            {client.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{client.telephone || "-"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{client.ville || "-"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(client?.dateSignature)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {isAdmin() && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditClick(client)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClient(client)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Vue Tableau - Format standardisé */
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg" data-table-container>
            <CardContent className="p-0">
              <StandardizedClientTable
                clients={paginatedClients}
                isAdmin={isAdmin()}
                onEdit={handleEditClick}
                onDelete={(clientId) => {
                  const client = clients.find(c => c.id === clientId);
                  if (client) handleDeleteClient(client);
                }}
                onViewDetails={handleViewDetails}
                isDeleting={deleteMutation.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-4">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-600 order-2 md:order-1">
                  {startIndex + 1} à {Math.min(endIndex, filteredClients.length)} sur {filteredClients.length}
                </div>
                <div className="flex items-center space-x-2 order-1 md:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    Préc.
                  </Button>
                  
                  {/* Pages numbers */}
                  <div className="hidden md:flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Page indicator for mobile */}
                  <div className="md:hidden text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {currentPage} / {totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    Suiv.
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredClients.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
              <p className="text-gray-500">Ajustez vos filtres ou créez un nouveau client.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de création de nouveau client */}
      {isNewClientFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden mx-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white">
              <h2 className="text-lg sm:text-2xl font-bold">Nouveau Client</h2>
              <p className="text-xs sm:text-sm text-green-100">Créer un nouveau client dans le système</p>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(95vh-100px)] p-3 sm:p-0">
              <NewClientFormComplete
                onClose={() => setIsNewClientFormOpen(false)}
                onSubmit={(values) => createNewClientMutation.mutate(values)}
                onSuccess={(clientFirstName) => {
                  setNewClientName(clientFirstName);
                  setShowCongratulations(true);
                  setIsNewClientFormOpen(false);
                }}
                isSubmitting={createNewClientMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isEditFormOpen && selectedClient && isAdmin() && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
              <h2 className="text-lg sm:text-2xl font-bold">
                Modifier {selectedClient.prenom} {selectedClient.nom}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100">Mettre à jour les informations du client</p>
            </div>
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
              {editFormDefaultValues && (
                <>
                  <ClientFormEditMobile
                    defaultValues={editFormDefaultValues}
                    onSubmit={(values) => updateMutation.mutate({ ...values, id: selectedClient.id } as any)}
                    isSubmitting={updateMutation.isPending}
                    clientId={selectedClient.id}
                  />
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4 px-2 sm:px-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditFormOpen(false);
                        setSelectedClient(null);
                        setEditFormDefaultValues(null);
                      }}
                      className="w-full sm:w-auto h-12 sm:h-10 text-sm font-medium"
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vue détaillée d'un client */}
      {showDetailView && detailClientId && (
        <div className="modal-scroll-container bg-black/50 backdrop-blur-sm">
          <div className="modal-scroll-content mobile-optimized">
            <ClientDetailMobile
              clientId={detailClientId.toString()}
              onEdit={handleEditFromDetail}
              onBack={handleCloseDetailView}
            />
          </div>
        </div>
      )}

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-lg">
              ⚠️ Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-sm leading-relaxed">
              Vous êtes sur le point de supprimer le client <strong>{clientToDelete?.prenom} {clientToDelete?.nom}</strong>.
              <br /><br />
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                ℹ️ Information importante
              </span>
              <br />
              Le client sera déplacé vers la corbeille et pourra être restauré ultérieurement depuis la section "Corbeille" de l'application.
              <br /><br />
              Cette action est <strong>réversible</strong> et n'affectera pas l'intégrité des données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Déplacer vers la corbeille"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de félicitations */}
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        clientPrenom={newClientName}
        onReturnToList={() => {
          setShowCongratulations(false);
          // Pas besoin de redirection, on reste sur la page clients
        }}
      />
    </div>
  );
}