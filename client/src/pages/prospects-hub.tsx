import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Users, Phone, Mail, Calendar, Eye, Edit, Trash2, ArrowRight, Edit3, X, Clock, MessageSquare, Calculator, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EconomySimulator } from "@/components/prospects/economy-simulator";
// ProspectFormUnified intégré directement dans le composant
import { SimulateurResiliation } from "@/components/prospects/simulateur-resiliation";
// Formulaire supprimé - utilisation du système d'édition unifié
import { useLocation, Link } from "wouter";

// Types pour les prospects
type ProspectType = "client" | "vendeur";
type ProspectStade = "nouveau" | "contacte" | "qualifie" | "pret_signature" | "converti";

interface ProspectSelect {
  id: number;
  type: ProspectType;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville?: string;
  codePostal?: string;
  adresse?: string;
  stade?: ProspectStade;
  source?: string;
  interet?: string;
  dernierContact?: string;
  prochainContact?: string;
  nombreContacts?: number;
  commentaire?: string;
  economyData?: {
    details: string;
    freeCost: number;
    products: string[];
    currentCost: number;
    annualSavings: number;
    monthlySavings: number;
    profileDetails?: any;
    simulationDate?: string;
    profileSelected?: any;
    simulationSummary?: string;
  };
  historiqueContacts?: any[];
  potentielEstime?: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProspectsHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // États pour les filtres et la recherche
  const [activeTab, setActiveTab] = useState<string>("client"); // Commencer par Prospects Clients
  const [searchTerm, setSearchTerm] = useState("");
  const [stadeFilter, setStadeFilter] = useState<string>("tous");
  const [activeCardFilter, setActiveCardFilter] = useState<string | null>(null); // Nouveau state pour les cartes actives
  const [showNewProspectDialog, setShowNewProspectDialog] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectSelect | null>(null);
  // Variable d'état pour l'édition supprimée - plus de formulaire d'édition
  const [prefilledComment, setPrefilledComment] = useState<string>("");
  const [simulationSaved, setSimulationSaved] = useState(false); // Protection sauvegardes multiples
  const [showEditDialog, setShowEditDialog] = useState(false); // Dialog d'édition
  const [prospectFormData, setProspectFormData] = useState<any>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    source: "",
    codePostal: "",
    ville: "",
    commentaire: "",
    dateProchainRdv: "",
    stade: "nouveau"
  });
  const [potentielEstime, setPotentielEstime] = useState<string>("");
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showEconomySimulator, setShowEconomySimulator] = useState(false);
  
  // États pour la suppression avec confirmation
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<ProspectSelect | null>(null);
  
  // État pour le mode d'affichage (liste par défaut)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // États pour le zoom des commentaires lors du changement de stade
  const [showCommentZoom, setShowCommentZoom] = useState(false);
  const [previousStade, setPreviousStade] = useState<string>("");
  
  // États pour le formulaire vendeur - plus nécessaire
  // const [showVendorProspectForm, setShowVendorProspectForm] = useState(false);

  // Fonction fetchCityFromPostalCode optimisée pour éviter les re-renders
  const fetchCityFromPostalCode = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    let lastPostalCode = "";
    
    return async (postalCode: string) => {
      // Éviter les appels en double pour le même code postal
      if (postalCode === lastPostalCode) return;
      lastPostalCode = postalCode;
      
      if (postalCode.length !== 5) {
        setAvailableCities([]);
        return;
      }
      
      // Debounce pour éviter les appels répétés
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        setIsLoadingCity(true);
        try {
          const response = await fetch(`https://api.zippopotam.us/fr/${postalCode}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.places && data.places.length > 0) {
              if (data.places.length === 1) {
                // Une seule ville : remplissage automatique
                const city = data.places[0]['place name'];
                setProspectFormData(prev => ({ ...prev, ville: city }));
                setAvailableCities([]);
              } else {
                // Plusieurs villes : stockage des options pour le menu déroulant
                const cities = data.places.map((place: any) => place['place name']);
                setAvailableCities(cities);
                setProspectFormData(prev => ({ ...prev, ville: "" }));
              }
            }
          }
        } catch (error) {
          console.log('Erreur lors de la récupération de la ville:', error);
        } finally {
          setIsLoadingCity(false);
        }
      }, 800); // Augmentation du debounce pour plus de stabilité
    };
  }, []); // Suppression de la dépendance toast qui causait des re-renders

  // Handlers optimisés avec useCallback pour éviter les re-rendus
  const handleProspectFormDataChange = useCallback((field: string, value: any) => {
    setProspectFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStadeChange = useCallback((value: string) => {
    const currentStade = prospectFormData?.stade || "nouveau";
    if (currentStade !== value) {
      setPreviousStade(currentStade);
      setShowCommentZoom(true);
    }
    setProspectFormData(prev => ({ ...prev, stade: value }));
  }, [prospectFormData?.stade]);

  const handleCodePostalChange = useCallback((postalCode: string) => {
    setProspectFormData(prev => ({ ...prev, codePostal: postalCode }));
    if (postalCode.length === 5) {
      fetchCityFromPostalCode(postalCode);
    } else if (postalCode.length < 5) {
      setAvailableCities([]);
      setProspectFormData(prev => ({ ...prev, ville: "" }));
    }
  }, [fetchCityFromPostalCode]);

  const handleCitySelection = useCallback((value: string) => {
    setProspectFormData(prev => ({ ...prev, ville: value }));
    setAvailableCities([]); // Nettoyer les options après sélection
  }, []);

  // Effet pour récupérer le commentaire depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const commentParam = urlParams.get('comment');
    if (commentParam) {
      const decodedComment = decodeURIComponent(commentParam);
      setPrefilledComment(decodedComment);
      setShowNewProspectDialog(true); // Ouvrir automatiquement le dialog
      
      // Nettoyer l'URL après récupération du paramètre
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      toast({
        title: "Simulation récupérée ✅",
        description: "Le commentaire de simulation a été pré-rempli dans le nouveau prospect",
      });
    }
  }, [location, toast]);

  // Effet pour détecter les paramètres de création de prospect vendeur
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const actionParam = urlParams.get('action');
    
    if (typeParam === 'vendeur' && actionParam === 'nouveau') {
      // Rediriger directement vers le système de recrutement
      window.location.href = "/recruitment/prospects";
    }
  }, [location, toast]);

  // Query pour récupérer les prospects (seulement pour les onglets prospects)
  const { data: prospectsData, isLoading } = useQuery({
    queryKey: ["/api/prospects", { type: activeTab, search: searchTerm, stade: stadeFilter !== "tous" ? stadeFilter : undefined }],
    enabled: activeTab === "client" || activeTab === "vendeur",
  });

  // Query pour récupérer les informations de l'utilisateur actuel
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Mutation pour créer un prospect
  const createProspectMutation = useMutation({
    mutationFn: async (prospectData: any) => {
      return await apiRequest("POST", "/api/prospects", prospectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      console.error("Erreur lors de la création du prospect:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le prospect",
        variant: "destructive"
      });
    }
  });

  // Mutation pour convertir un prospect
  const convertProspectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: ProspectType }) => {
      return await apiRequest("POST", `/api/prospects/${id}/convert`, { type });
    },
    onSuccess: (data) => {
      toast({
        title: "Prospect converti avec succès",
        description: `Le prospect a été converti en ${data.type}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de convertir le prospect.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour transférer un prospect vers le recrutement
  const transferToRecruitmentMutation = useMutation({
    mutationFn: async (prospect: ProspectSelect) => {
      // Au lieu d'appeler l'API, on redirige directement vers le formulaire pré-rempli
      const recruitmentUrl = `/recruitment/step1?` + new URLSearchParams({
        prenom: prospect.prenom || '',
        nom: prospect.nom || '',
        email: prospect.email || '',
        mobile: prospect.telephone || '',
        ville: prospect.ville || '',
        codePostal: prospect.codePostal || '',
        adresse: prospect.adresse || '',
        codeParrainage: currentUser?.user?.codeVendeur || '',
        prefilled: 'true',
        prospectId: prospect.id.toString()
      }).toString();

      // Ouvrir le formulaire d'inscription dans la même fenêtre
      window.location.href = recruitmentUrl;
      
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      // Le toast ne sera pas visible car on redirige, mais on le garde pour la cohérence
      toast({
        title: "Redirection vers le formulaire d'inscription",
        description: "Le formulaire d'inscription s'ouvre avec les données pré-remplies.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de transfert",
        description: "Impossible de transférer le prospect vers le recrutement.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un prospect (soft delete)
  const deleteProspectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/prospects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Prospect supprimé",
        description: "Le prospect a été déplacé vers la corbeille. Vous pouvez le récupérer depuis la corbeille.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      setShowDeleteConfirmDialog(false);
      setProspectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le prospect.",
        variant: "destructive",
      });
      setShowDeleteConfirmDialog(false);
      setProspectToDelete(null);
    },
  });



  // Fonction pour ouvrir la confirmation de suppression
  const handleDeleteClick = (prospect: ProspectSelect) => {
    setProspectToDelete(prospect);
    setShowDeleteConfirmDialog(true);
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (prospectToDelete) {
      deleteProspectMutation.mutate(prospectToDelete.id);
    }
  };

  // Mutation pour modifier un prospect
  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/prospects/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Prospect modifié",
        description: "Les modifications ont été sauvegardées.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le prospect.",
        variant: "destructive",
      });
    },
  });

  // Fonction pour gérer le transfert vers le recrutement
  const handleTransferToRecruitment = (prospect: ProspectSelect) => {
    if (!prospect.prenom || !prospect.nom || !prospect.telephone) {
      toast({
        title: "Données insuffisantes",
        description: "Le prospect doit avoir au minimum un prénom, nom et téléphone pour être transféré.",
        variant: "destructive",
      });
      return;
    }
    
    transferToRecruitmentMutation.mutate(prospect);
  };

  // Fonction pour gérer les clics sur les cartes statistiques
  const handleCardClick = (filterType: string) => {
    setActiveCardFilter(filterType);
    
    // Appliquer le filtre correspondant
    switch (filterType) {
      case "total":
        setStadeFilter("tous");
        break;
      case "contacte":
        setStadeFilter("contacte");
        break;
      case "qualifie":
        setStadeFilter("qualifie");
        break;
      case "pret_signature":
        setStadeFilter("pret_signature");
        break;
      default:
        setStadeFilter("tous");
    }
    
    // Scroll automatique vers la liste des résultats
    setTimeout(() => {
      const resultsSection = document.getElementById("prospects-results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }
    }, 100);
  };

  // Réinitialiser le filtre actif quand on change d'onglet
  useEffect(() => {
    setActiveCardFilter(null);
    setStadeFilter("tous");
    setSearchTerm("");
  }, [activeTab]);

  // Filtrer les prospects côté client avec sécurisation des types
  const filteredProspects = useMemo(() => {
    const prospects = (prospectsData as any)?.prospects || [];
    if (!prospects.length || activeTab === "simulateur") return [];
    
    return prospects.filter((prospect: any) => {
      // Filtrer par type selon l'onglet actif
      const matchesType = prospect.type === activeTab;
      
      const matchesSearch = searchTerm === "" || 
        prospect.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.telephone.includes(searchTerm);
      
      const matchesStade = stadeFilter === "tous" || prospect.stade === stadeFilter;
      
      return matchesType && matchesSearch && matchesStade;
    });
  }, [(prospectsData as any)?.prospects, searchTerm, stadeFilter, activeTab]);

  // Calculer les statistiques contextuelles selon le type de prospects
  const getContextualStats = () => {
    const prospects = (prospectsData as any)?.prospects || [];
    const currentTypeProspects = prospects.filter((p: any) => p.type === activeTab);
    
    return {
      total: currentTypeProspects.length,
      contacte: currentTypeProspects.filter((p: any) => p.stade === "contacte").length,
      qualifie: currentTypeProspects.filter((p: any) => p.stade === "qualifie").length,
      pret_signature: currentTypeProspects.filter((p: any) => p.stade === "pret_signature").length,
      converti: currentTypeProspects.filter((p: any) => p.stade === "converti").length,
    };
  };

  const getStadeLabel = (stade: string) => {
    switch (stade) {
      case "nouveau": return "Nouveau";
      case "contacte": return "Contacté";
      case "qualifie": return "Qualifié";
      case "pret_signature": return "Prêt signature";
      case "converti": return "Converti";
      default: return "Nouveau";
    }
  };

  const getStadeBadgeColor = (stade: string) => {
    switch (stade) {
      case "nouveau": return "bg-blue-500";
      case "contacte": return "bg-yellow-500";
      case "qualifie": return "bg-orange-500";
      case "pret_signature": return "bg-purple-500";
      case "converti": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStadeOptions = () => [
    { value: "tous", label: "Tous les stades" },
    { value: "nouveau", label: "Nouveau" },
    { value: "contacte", label: "Contacté" },
    { value: "qualifie", label: "Qualifié" },
    { value: "pret_signature", label: "Prêt signature" },
    { value: "converti", label: "Converti" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 pb-24 relative">
      {/* Header moderne */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hub Prospects
            </h1>
            <p className="text-gray-600 mt-1">Gestion pré-signature des prospects clients et vendeurs</p>
          </div>
          <div className="hidden md:flex gap-2">
            <Link href="/prospects/trash">
              <Button 
                variant="outline"
                className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700 shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Corbeille
              </Button>
            </Link>
            <Button 
              onClick={() => {
                if (activeTab === "vendeur") {
                  // Rediriger vers le formulaire simple avec le code vendeur pré-rempli
                  const recruitmentUrl = `/recruitment/simple-form?` + new URLSearchParams({
                    codeParrainage: currentUser?.user?.codeVendeur || '',
                    source: 'prospects_hub'
                  }).toString();
                  window.location.href = recruitmentUrl;
                } else {
                  setShowNewProspectDialog(true);
                }
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === "vendeur" ? "Nouveau Prospect Vendeur" : "Nouveau Prospect"}
            </Button>
          </div>
        </div>

        {/* Statistiques rapides contextuelles et cliquables */}
        {(activeTab === "client" || activeTab === "vendeur") && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(() => {
              const stats = getContextualStats();
              return (
                <>
                  <Card 
                    className={`bg-white/60 backdrop-blur-sm shadow-lg border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      activeCardFilter === "total" ? "ring-2 ring-blue-500 bg-blue-50/80" : "hover:shadow-xl"
                    }`}
                    onClick={() => handleCardClick("total")}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                      {activeCardFilter === "total" && (
                        <div className="text-xs text-blue-600 font-medium mt-1">● Filtre actif</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card 
                    className={`bg-white/60 backdrop-blur-sm shadow-lg border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      activeCardFilter === "contacte" ? "ring-2 ring-yellow-500 bg-yellow-50/80" : "hover:shadow-xl"
                    }`}
                    onClick={() => handleCardClick("contacte")}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.contacte}</div>
                      <div className="text-sm text-gray-600">Contactés</div>
                      {activeCardFilter === "contacte" && (
                        <div className="text-xs text-yellow-600 font-medium mt-1">● Filtre actif</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card 
                    className={`bg-white/60 backdrop-blur-sm shadow-lg border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      activeCardFilter === "qualifie" ? "ring-2 ring-orange-500 bg-orange-50/80" : "hover:shadow-xl"
                    }`}
                    onClick={() => handleCardClick("qualifie")}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.qualifie}</div>
                      <div className="text-sm text-gray-600">Qualifiés</div>
                      {activeCardFilter === "qualifie" && (
                        <div className="text-xs text-orange-600 font-medium mt-1">● Filtre actif</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card 
                    className={`bg-white/60 backdrop-blur-sm shadow-lg border-0 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      activeCardFilter === "pret_signature" ? "ring-2 ring-purple-500 bg-purple-50/80" : "hover:shadow-xl"
                    }`}
                    onClick={() => handleCardClick("pret_signature")}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.pret_signature}</div>
                      <div className="text-sm text-gray-600">Prêts signature</div>
                      {activeCardFilter === "pret_signature" && (
                        <div className="text-xs text-purple-600 font-medium mt-1">● Filtre actif</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Navigation par onglets optimisée mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/60 backdrop-blur-sm shadow-lg h-auto p-1">
          <TabsTrigger 
            value="client" 
            className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Users className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-center leading-tight">Prospects<br className="sm:hidden" /> Clients</span>
          </TabsTrigger>
          <TabsTrigger 
            value="vendeur" 
            className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
          >
            <Users className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-center leading-tight">Prospects<br className="sm:hidden" /> Vendeurs</span>
          </TabsTrigger>
          <TabsTrigger 
            value="simulateur" 
            className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <Calculator className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-center leading-tight">Simulateur<br className="sm:hidden" /> Résiliation</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Simulateur de Résiliation */}
        <TabsContent value="simulateur" className="space-y-6">
          <SimulateurResiliation />
        </TabsContent>

        {/* Onglets Prospects Clients et Vendeurs */}
        <TabsContent value="client" className="space-y-6">
          {/* Barre de recherche */}
          <div className="flex flex-col gap-4" id="prospects-results">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un prospect client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
              />
            </div>

            {/* Ligne des filtres et modes d'affichage alignés */}
            <div className="flex items-center gap-2">
              {/* Filtre par stade */}
              <div className="flex-1">
                <Select value={stadeFilter} onValueChange={setStadeFilter}>
                  <SelectTrigger className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
                    <SelectValue placeholder="Tous les stades" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStadeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélecteur de mode d'affichage */}
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg p-1 shadow-lg">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>

              {/* Bouton de réinitialisation des filtres */}
              {(activeCardFilter || stadeFilter !== "tous" || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCardFilter(null);
                    setStadeFilter("tous");
                    setSearchTerm("");
                  }}
                  className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-red-50 hover:border-red-300 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Indicateur de filtre actif depuis les cartes */}
            {activeCardFilter && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Filter className="w-4 h-4" />
                <span>Filtre : {activeCardFilter === "total" ? "Tous" : 
                  activeCardFilter === "contacte" ? "Contactés" :
                  activeCardFilter === "qualifie" ? "Qualifiés" : "Prêts signature"}</span>
              </div>
            )}
          </div>

          {/* Liste des prospects clients */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des prospects clients...</p>
            </div>
          ) : filteredProspects.length === 0 ? (
            <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun prospect client trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || stadeFilter !== "tous" 
                    ? "Aucun prospect ne correspond à vos critères de recherche."
                    : "Aucun prospect client enregistré pour le moment."
                  }
                </p>
                <Button 
                  onClick={() => setShowNewProspectDialog(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un prospect client
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            /* Mode Liste */
            <div className="space-y-3 pb-24">
              {filteredProspects.map((prospect: any) => (
                <Card key={prospect.id} className="bg-white/60 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-2">
                      {/* Ligne 1: Nom + Badge stade */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {prospect.prenom} {prospect.nom}
                        </h3>
                        <Badge className={`${getStadeBadgeColor(prospect.stade || "nouveau")} text-white px-2 py-1 rounded-full text-xs flex-shrink-0`}>
                          {getStadeLabel(prospect.stade || "nouveau")}
                        </Badge>
                      </div>

                      {/* Ligne 2: Badge économique si présent */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {(() => {
                            // Badge économique optimisé pour mobile
                            if (prospect.economyData && prospect.economyData.monthlySavings > 0) {
                              return (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  +{prospect.economyData.monthlySavings.toFixed(0)}€/mois d'économie
                                </Badge>
                              );
                            }
                            
                            if (prospect.commentaire) {
                              const comment = prospect.commentaire;
                              
                              if (comment.includes('💰 ÉCONOMIES RÉALISÉES')) {
                                const match = comment.match(/Mensuelle:\s*\+([0-9.,]+)€/);
                                if (match) {
                                  const savings = parseFloat(match[1].replace(',', '.'));
                                  if (savings > 0) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        +{savings.toFixed(0)}€/mois d'économie
                                      </Badge>
                                    );
                                  }
                                }
                              }
                              
                              const patterns = [
                                /(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE.*?(?:Économies?|économie).*?([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /Économies?\s+([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /\+\s*([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /SITUATION\s+ACTUELLE.*?économies?\s+([0-9.,]+)\s*€/i,
                                /économies?\s+(?:de\s+)?([0-9.,]+)\s*€/i
                              ];
                              
                              for (const pattern of patterns) {
                                const match = comment.match(pattern);
                                if (match) {
                                  const savings = parseFloat(match[1].replace(',', '.'));
                                  if (savings > 0) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        +{savings.toFixed(0)}€/mois d'économie
                                      </Badge>
                                    );
                                  }
                                }
                              }
                              
                              if (comment.match(/(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE/i)) {
                                return (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    📊 Simulation économique
                                  </Badge>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                        
                        {/* Actions compactes à droite */}
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProspect(prospect)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProspectFormData({
                                ...prospect,
                                dateProchainRdv: prospect.prochainContact || ""
                              });
                              setPreviousStade(prospect.stade || "nouveau");
                              setShowCommentZoom(false);
                              setShowEditDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProspectToDelete(prospect);
                              setShowDeleteConfirmDialog(true);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Ligne 3: Informations de contact compactes */}
                      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{prospect.telephone}</span>
                        </div>
                        {prospect.ville && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">📍</span>
                            <span className="text-xs">{prospect.ville} {prospect.codePostal}</span>
                          </div>
                        )}
                        {prospect.dernierContact && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Dernier contact: {new Date(prospect.dernierContact).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Mode Grille (existant) */
            <div className="grid grid-cols-1 gap-4 pb-24">
              {filteredProspects.map((prospect: any) => (
                <Card key={prospect.id} className="bg-white/60 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                          {prospect.prenom} {prospect.nom}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${getStadeBadgeColor(prospect.stade || "nouveau")} text-white px-2 py-1 rounded-full text-xs`}>
                            {getStadeLabel(prospect.stade || "nouveau")}
                          </Badge>
                          {(() => {
                            // 1. Vérifier si economyData existe avec monthlySavings
                            if (prospect.economyData && prospect.economyData.monthlySavings > 0) {
                              return (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  +{prospect.economyData.monthlySavings.toFixed(0)}€/mois d'économie
                                </Badge>
                              );
                            }
                            
                            // 2. Sinon, extraire les économies depuis les commentaires
                            if (prospect.commentaire && prospect.commentaire.includes('💰 ÉCONOMIES RÉALISÉES')) {
                              const match = prospect.commentaire.match(/Mensuelle:\s*\+([0-9.,]+)€/);
                              if (match) {
                                const savings = parseFloat(match[1].replace(',', '.'));
                                if (savings > 0) {
                                  return (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      +{savings.toFixed(0)}€/mois d'économie
                                    </Badge>
                                  );
                                }
                              }
                            }
                            
                            // 3. Patterns plus larges pour diverses simulations économiques
                            if (prospect.commentaire) {
                              const comment = prospect.commentaire;
                              
                              // Pattern pour "SIMULATION ÉCONOMIQUE" avec émojis et calculs divers
                              const patterns = [
                                // "🔴 SIMULATION ÉCONOMIQUE FREE" avec calculs
                                /(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE.*?(?:Économies?|économie).*?([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                // "Économies X€/mois"  
                                /Économies?\s+([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                // "+X€/mois" direct
                                /\+\s*([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                // "SITUATION ACTUELLE" avec économies
                                /SITUATION\s+ACTUELLE.*?économies?\s+([0-9.,]+)\s*€/i,
                                // Format libre avec économies
                                /économies?\s+(?:de\s+)?([0-9.,]+)\s*€/i
                              ];
                              
                              for (const pattern of patterns) {
                                const match = comment.match(pattern);
                                if (match) {
                                  const savings = parseFloat(match[1].replace(',', '.'));
                                  if (savings > 0) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        +{savings.toFixed(0)}€/mois d'économie
                                      </Badge>
                                    );
                                  }
                                }
                              }
                              
                              // Pattern spécial pour détecter toute simulation même sans économies explicites
                              if (comment.match(/(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE/i)) {
                                return (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    📊 Simulation économique
                                  </Badge>
                                );
                              }
                            }
                            
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      {prospect.email && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{prospect.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{prospect.telephone}</span>
                      </div>
                      {prospect.ville && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex-shrink-0">📍</span>
                          <span>{prospect.ville} {prospect.codePostal}</span>
                        </div>
                      )}
                      {prospect.dernierContact && (
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Dernier contact: {new Date(prospect.dernierContact).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {prospect.commentaire && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{prospect.commentaire}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProspect(prospect)}
                        className="flex-1 h-10"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Détails</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProspectFormData({
                            ...prospect,
                            dateProchainRdv: prospect.prochainContact || ""
                          });
                          setPreviousStade(prospect.stade || "nouveau");
                          setShowCommentZoom(false);
                          setShowEditDialog(true);
                        }}
                        className="h-10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(prospect)}
                        className="h-10 hover:bg-red-50 hover:border-red-300"
                        disabled={deleteProspectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {prospect.stade === "pret_signature" && (
                        <Button
                          size="sm"
                          onClick={() => convertProspectMutation.mutate({ id: prospect.id, type: "client" })}
                          className="h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          disabled={convertProspectMutation.isPending}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vendeur" className="space-y-6">
          {/* Barre de recherche et filtres pour vendeurs */}
          <div className="flex flex-col md:flex-row gap-4" id="prospects-results">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un prospect vendeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
              />
            </div>
            <div className="flex gap-2">
              <Select value={stadeFilter} onValueChange={setStadeFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
                  <SelectValue placeholder="Filtrer par stade" />
                </SelectTrigger>
                <SelectContent>
                  {getStadeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Bouton de réinitialisation des filtres */}
              {(activeCardFilter || stadeFilter !== "tous" || searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCardFilter(null);
                    setStadeFilter("tous");
                    setSearchTerm("");
                  }}
                  className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-red-50 hover:border-red-300"
                >
                  <X className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Réinitialiser</span>
                </Button>
              )}
            </div>

            {/* Indicateur de filtre actif depuis les cartes */}
            {activeCardFilter && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
                <Filter className="w-4 h-4" />
                <span>Filtre : {activeCardFilter === "total" ? "Tous" : 
                  activeCardFilter === "contacte" ? "Contactés" :
                  activeCardFilter === "qualifie" ? "Qualifiés" : "Prêts signature"}</span>
              </div>
            )}
          </div>

          {/* Liste des prospects vendeurs */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des prospects vendeurs...</p>
            </div>
          ) : filteredProspects.length === 0 ? (
            <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun prospect vendeur trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || stadeFilter !== "tous" 
                    ? "Aucun prospect ne correspond à vos critères de recherche."
                    : "Aucun prospect vendeur enregistré pour le moment."
                  }
                </p>
                <Button 
                  onClick={() => setShowNewProspectDialog(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un prospect vendeur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-24">
              {filteredProspects.map((prospect: any) => (
                <Card key={prospect.id} className="bg-white/60 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                          {prospect.prenom} {prospect.nom}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${getStadeBadgeColor(prospect.stade || "nouveau")} text-white px-2 py-1 rounded-full text-xs`}>
                            {getStadeLabel(prospect.stade || "nouveau")}
                          </Badge>
                          {(() => {
                            // Badge économie pour prospects vendeurs aussi
                            if (prospect.economyData && prospect.economyData.monthlySavings > 0) {
                              return (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  +{prospect.economyData.monthlySavings.toFixed(0)}€/mois d'économie
                                </Badge>
                              );
                            }
                            
                            // Même logique d'extraction que pour les prospects clients
                            if (prospect.commentaire) {
                              const comment = prospect.commentaire;
                              
                              // Vérifier d'abord les formats spécifiques
                              if (comment.includes('💰 ÉCONOMIES RÉALISÉES')) {
                                const match = comment.match(/Mensuelle:\s*\+([0-9.,]+)€/);
                                if (match) {
                                  const savings = parseFloat(match[1].replace(',', '.'));
                                  if (savings > 0) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        +{savings.toFixed(0)}€/mois d'économie
                                      </Badge>
                                    );
                                  }
                                }
                              }
                              
                              // Patterns plus larges pour diverses simulations économiques
                              const patterns = [
                                /(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE.*?(?:Économies?|économie).*?([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /Économies?\s+([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /\+\s*([0-9.,]+)\s*€\s*\/?\s*mois/i,
                                /SITUATION\s+ACTUELLE.*?économies?\s+([0-9.,]+)\s*€/i,
                                /économies?\s+(?:de\s+)?([0-9.,]+)\s*€/i
                              ];
                              
                              for (const pattern of patterns) {
                                const match = comment.match(pattern);
                                if (match) {
                                  const savings = parseFloat(match[1].replace(',', '.'));
                                  if (savings > 0) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        +{savings.toFixed(0)}€/mois d'économie
                                      </Badge>
                                    );
                                  }
                                }
                              }
                              
                              // Pattern pour détecter toute simulation même sans économies explicites
                              if (comment.match(/(?:🔴|🟢|🟡|💰)?\s*SIMULATION\s+(?:É|E)CONOMIQUE/i)) {
                                return (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    📊 Simulation économique
                                  </Badge>
                                );
                              }
                            }
                            
                            return null;
                          })()}
                          {prospect.interet && (
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {prospect.interet}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      {prospect.email && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{prospect.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{prospect.telephone}</span>
                      </div>
                      {prospect.ville && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex-shrink-0">📍</span>
                          <span>{prospect.ville} {prospect.codePostal}</span>
                        </div>
                      )}
                      {prospect.dernierContact && (
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Dernier contact: {new Date(prospect.dernierContact).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {prospect.commentaire && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{prospect.commentaire}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProspect(prospect)}
                        className="flex-1 h-10"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Détails</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProspectFormData({
                            ...prospect,
                            dateProchainRdv: prospect.prochainContact || ""
                          });
                          setPreviousStade(prospect.stade || "nouveau");
                          setShowCommentZoom(false);
                          setShowEditDialog(true);
                        }}
                        className="h-10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(prospect)}
                        className="h-10 hover:bg-red-50 hover:border-red-300"
                        disabled={deleteProspectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      {/* Bouton de basculement vers le recrutement - seulement pour les prospects vendeurs */}
                      {prospect.type === "vendeur" && (
                        <Button
                          size="sm"
                          onClick={() => handleTransferToRecruitment(prospect)}
                          className="h-10 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                          title="Basculer vers le tunnel de recrutement"
                          disabled={transferToRecruitmentMutation.isPending}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Recrutement</span>
                        </Button>
                      )}
                      
                      {prospect.stade === "pret_signature" && (
                        <Button
                          size="sm"
                          onClick={() => convertProspectMutation.mutate({ id: prospect.id, type: "vendeur" })}
                          className="h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          disabled={convertProspectMutation.isPending}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog pour nouveau prospect - VERSION MOBILE OPTIMISÉE */}
      <Dialog open={showNewProspectDialog} onOpenChange={() => {
        setShowNewProspectDialog(false);
        setSimulationSaved(false); // Réinitialiser protection
        setShowEconomySimulator(false);
      }}>
        <DialogContent className="max-w-sm w-full max-h-[95vh] overflow-hidden bg-white p-0 border-0 m-1 sm:m-2 flex flex-col">
          {/* Header fixe avec titre et bouton fermer */}
          <div className="bg-white z-10 p-4 pb-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-gray-900 leading-tight flex-1 text-center">
                🎯 Nouveau Prospect avec Simulation Économique Complète
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewProspectDialog(false);
                  setSimulationSaved(false);
                  setShowEconomySimulator(false);
                  // Réinitialiser le formulaire
                  setProspectFormData({
                    prenom: "",
                    nom: "",
                    email: "",
                    telephone: "",
                    source: "",
                    codePostal: "",
                    ville: "",
                    commentaire: "",
                    dateProchainRdv: "",
                    stade: "nouveau"
                  });
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Zone de contenu avec hauteur fixe pour éviter les re-layouts */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '500px', maxHeight: 'calc(95vh - 120px)' }}>
              {/* Section 1: Informations du prospect - CHAMPS UNIFIÉS AVEC CLIENTS */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">📋</span>
                  </div>
                  <h3 className="text-base font-semibold text-blue-800">Informations du prospect</h3>
                </div>
                
                <div className="space-y-3">
                  {/* Prénom et Nom sur 2 colonnes */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Prénom *" 
                      value={prospectFormData?.prenom || ""}
                      onChange={(e) => handleProspectFormDataChange('prenom', e.target.value)}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                    <Input 
                      placeholder="Nom *" 
                      value={prospectFormData?.nom || ""}
                      onChange={(e) => handleProspectFormDataChange('nom', e.target.value)}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Email facultatif */}
                  <Input 
                    placeholder="Email (facultatif)" 
                    type="email"
                    value={prospectFormData?.email || ""}
                    onChange={(e) => handleProspectFormDataChange('email', e.target.value)}
                    className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                  />
                  
                  {/* Téléphone obligatoire */}
                  <Input 
                    placeholder="Téléphone *" 
                    value={prospectFormData?.telephone || ""}
                    onChange={(e) => handleProspectFormDataChange('telephone', e.target.value)}
                    className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                  />
                  
                  {/* Source prospect */}
                  <Select 
                    value={prospectFormData?.source || ""} 
                    onValueChange={(value) => handleProspectFormDataChange('source', value)}
                  >
                    <SelectTrigger className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Source prospect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salon">Salon/Événement</SelectItem>
                      <SelectItem value="site_web">Site web</SelectItem>
                      <SelectItem value="parrainage">Parrainage</SelectItem>
                      <SelectItem value="demarchage">Démarchage</SelectItem>
                      <SelectItem value="reseaux_sociaux">Réseaux sociaux</SelectItem>
                      <SelectItem value="bouche_a_oreille">Bouche à oreille</SelectItem>
                      <SelectItem value="prospection_directe">Prospection directe</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Code postal et ville - Version stabilisée sans layout shifts */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input 
                        placeholder="Code postal" 
                        value={prospectFormData?.codePostal || ""}
                        onChange={(e) => handleCodePostalChange(e.target.value)}
                        maxLength={5}
                        className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                      />
                      {isLoadingCity && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Container avec hauteur fixe pour éviter les tremblements */}
                    <div style={{ minHeight: '44px' }}>
                      {availableCities.length > 0 ? (
                        <Select 
                          value={prospectFormData?.ville || ""} 
                          onValueChange={handleCitySelection}
                        >
                          <SelectTrigger className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder="Choisir la ville" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          placeholder="Ville" 
                          value={prospectFormData?.ville || ""}
                          onChange={(e) => handleProspectFormDataChange('ville', e.target.value)}
                          className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Commentaires (auto-rempli par simulation) - Hauteur fixe pour stabilité */}
                  <div style={{ minHeight: '80px' }}>
                    <textarea 
                      placeholder="Commentaires (se remplit automatiquement après simulation)" 
                      value={prospectFormData?.commentaire || ""}
                      onChange={(e) => handleProspectFormDataChange('commentaire', e.target.value)}
                      className="w-full bg-white text-sm border border-gray-300 focus:border-blue-500 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Date prochain rendez-vous */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Date prochain rendez-vous (optionnel)
                    </label>
                    <Input 
                      type="date" 
                      value={prospectFormData?.dateProchainRdv || ""}
                      onChange={(e) => handleProspectFormDataChange('dateProchainRdv', e.target.value)}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {prospectFormData?.dateProchainRdv && (
                      <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded">
                        ✅ Une tâche sera automatiquement créée pour cette date
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Simulation économique Free - Container avec hauteur minimale */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200" style={{ minHeight: '120px' }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💰</span>
                    </div>
                    <h3 className="text-base font-semibold text-purple-800">Simulation économique Free (optionnel)</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEconomySimulator(!showEconomySimulator)}
                    className="bg-white hover:bg-purple-50 border-purple-300 text-purple-700 hover:border-purple-400 flex-shrink-0"
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    {showEconomySimulator ? "Masquer" : "Calculer"}
                  </Button>
                </div>
                
                {!showEconomySimulator ? (
                  <div className="text-center py-6 bg-white/60 rounded-lg border-2 border-dashed border-purple-200">
                    <Calculator className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                    <p className="text-sm text-purple-600 mb-2">
                      Simulateur d'économies Free (optionnel)
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Calculez les économies potentielles pour convaincre le prospect
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEconomySimulator(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Lancer simulation
                    </Button>
                  </div>
                ) : (
                  <EconomySimulator
                  onEconomyCalculated={(economyData) => {
                    console.log("🎯 SIMULATION COMPLÈTE GÉNÉRÉE:", economyData);
                    
                    // PROTECTION CONTRE SAUVEGARDES MULTIPLES
                    if (simulationSaved) {
                      toast({
                        title: "Simulation déjà enregistrée",
                        description: "Cette simulation a déjà été ajoutée aux commentaires",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // AUTO-SAUVEGARDE UNIQUEMENT dans les commentaires (sans fermer le formulaire)
                    // GÉNÉRATION automatique d'un résumé complet si simulationSummary manque
                    const simulationText = economyData.simulationSummary || 
                      `🎯 SIMULATION ÉCONOMIQUE FREE
📅 ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SITUATION ACTUELLE:
━━━━━━━━━━━━━━━━━━━━━━━━━

• TOTAL ACTUEL:
  ${economyData.currentCost?.toFixed(2) || 0}€/mois
  (${((economyData.currentCost || 0) * 12).toFixed(2)}€/an) 💸

━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PROPOSITION FREE:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Profil recommandé:
  ${economyData.profileDetails?.profile || 'Gaming + Streaming'}

• ${economyData.profileDetails?.freebox || 'Freebox Ultra'}:
  ${economyData.profileDetails?.boxPrice || '49.99'}€/mois

• Mobiles:
  ${economyData.profileDetails?.mobileCost || '10.00'}€/mois

• TOTAL FREE:
  ${economyData.freeCost?.toFixed(2) || 0}€/mois 🟢

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ÉCONOMIES RÉALISÉES:
━━━━━━━━━━━━━━━━━━━━━━━━━

• Mensuelle:
  ${economyData.monthlySavings > 0 ? '+' : ''}${economyData.monthlySavings?.toFixed(2) || 0}€

• Annuelle:
  ${economyData.annualSavings > 0 ? '+' : ''}${economyData.annualSavings?.toFixed(0) || 0}€ ${(economyData.monthlySavings || 0) > 0 ? '🎯' : '⚠️'}

━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ARGUMENT COMMERCIAL:
━━━━━━━━━━━━━━━━━━━━━━━━━

"Économisez ${economyData.monthlySavings?.toFixed(2) || 0}€/mois avec Free, soit ${economyData.annualSavings?.toFixed(0) || 0}€ d'économies sur l'année !"

━━━━━━━━━━━━━━━━━━━━━━━━━
Simulation générée automatiquement
━━━━━━━━━━━━━━━━━━━━━━━━━`;
                    
                    // Mise à jour automatique du champ commentaire
                    setProspectFormData(prev => ({
                      ...prev,
                      commentaire: prev.commentaire ? `${prev.commentaire}\n\n${simulationText}` : simulationText
                    }));
                    
                    // Marquer comme sauvegardé
                    setSimulationSaved(true);
                    
                    toast({
                      title: "Simulation sauvegardée !",
                      description: `Économies: ${economyData.monthlySavings?.toFixed(2) || 0}€/mois ajoutées aux commentaires`,
                    });
                  }}
                />
                )}
              </div>

              {/* Bouton de sauvegarde FINAL - Toujours visible */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💾</span>
                  </div>
                  <h3 className="text-base font-semibold text-orange-800">Finaliser la création</h3>
                </div>
                
                <Button
                  onClick={async () => {
                    // Validation prénom ou nom + téléphone
                    if ((!prospectFormData.prenom?.trim() && !prospectFormData.nom?.trim()) || !prospectFormData.telephone?.trim()) {
                      toast({
                        title: "Erreur de validation",
                        description: "Au moins le prénom ou nom + téléphone sont obligatoires",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const prospectData = {
                      prenom: prospectFormData.prenom || "",
                      nom: prospectFormData.nom || "",
                      email: prospectFormData.email || "",
                      telephone: prospectFormData.telephone,
                      codePostal: prospectFormData.codePostal || "",
                      ville: prospectFormData.ville || "",
                      source: prospectFormData.source || "",
                      commentaire: prospectFormData.commentaire || "",
                      stade: prospectFormData.stade || "nouveau",
                      type: "client",
                      potentielEstime: "moyen"
                    };
                    
                    try {
                      // 1. Créer le prospect
                      const response = await apiRequest("POST", "/api/prospects", prospectData);
                      const newProspect = await response.json();
                      
                      // 2. Créer automatiquement une tâche si date RDV renseignée
                      if (prospectFormData.dateProchainRdv) {
                        const taskData = {
                          title: `RDV Prospect: ${prospectData.prenom} ${prospectData.nom}`,
                          description: `Rendez-vous planifié avec prospect ${prospectData.prenom} ${prospectData.nom}\nTéléphone: ${prospectData.telephone}${prospectFormData.commentaire ? `\n\nCommentaires:\n${prospectFormData.commentaire}` : ''}`,
                          dateEcheance: prospectFormData.dateProchainRdv,
                          priorite: "normale",
                          clientId: newProspect.id,
                          type: "rdv_prospect"
                        };
                        
                        await apiRequest("POST", "/api/tasks", taskData);
                        
                        toast({
                          title: "Prospect et tâche créés !",
                          description: `${prospectData.prenom} ${prospectData.nom} + RDV le ${new Date(prospectFormData.dateProchainRdv).toLocaleDateString('fr-FR')}`,
                        });
                      } else {
                        toast({
                          title: "Prospect créé !",
                          description: `${prospectData.prenom} ${prospectData.nom} ajouté avec succès`,
                        });
                      }
                      
                      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
                      setShowNewProspectDialog(false);
                      
                      // Réinitialiser le formulaire
                      setProspectFormData({
                        prenom: "",
                        nom: "",
                        email: "",
                        telephone: "",
                        source: "",
                        codePostal: "",
                        ville: "",
                        commentaire: "",
                        dateProchainRdv: "",
                        stade: "nouveau"
                      });
                      setShowEconomySimulator(false);
                      setSimulationSaved(false); // Réinitialiser protection
                      
                    } catch (error) {
                      console.error("❌ Erreur lors de la création:", error);
                      toast({
                        title: "Erreur",
                        description: "Impossible de créer le prospect",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  disabled={(!prospectFormData?.prenom?.trim() && !prospectFormData?.nom?.trim()) || !prospectFormData?.telephone?.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {prospectFormData.commentaire?.includes('Simulation') ? 'Créer prospect avec simulation' : 'Créer prospect'}
                </Button>
              </div>
            </div>
            
            {/* Footer fixe avec boutons - Version stabilisée */}
            <div className="bg-white p-4 pt-3 border-t border-gray-100 flex-shrink-0" style={{ minHeight: '80px' }}>
              <div className="flex gap-3 mb-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewProspectDialog(false);
                    setSimulationSaved(false);
                    setShowEconomySimulator(false);
                  }}
                  className="flex-1 h-11 text-sm border-gray-300"
                  disabled={createProspectMutation.isPending}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={async () => {
                    // Utiliser la même logique que le bouton principal dans le formulaire
                    if ((!prospectFormData?.prenom?.trim() && !prospectFormData?.nom?.trim()) || !prospectFormData?.telephone?.trim()) {
                      toast({
                        title: "Erreur de validation",
                        description: "Au moins le prénom ou nom + téléphone sont obligatoires",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const prospectData = {
                      prenom: prospectFormData.prenom || "",
                      nom: prospectFormData.nom || "",
                      email: prospectFormData.email || "",
                      telephone: prospectFormData.telephone,
                      codePostal: prospectFormData.codePostal || "",
                      ville: prospectFormData.ville || "",
                      source: prospectFormData.source || "",
                      commentaire: prospectFormData.commentaire || "",
                      stade: prospectFormData.stade || "nouveau",
                      type: "client",
                      potentielEstime: "moyen"
                    };
                    
                    try {
                      await createProspectMutation.mutateAsync(prospectData);
                      
                      // 2. Créer automatiquement une tâche si date RDV renseignée
                      if (prospectFormData.dateProchainRdv) {
                        const taskData = {
                          title: `RDV Prospect: ${prospectData.prenom} ${prospectData.nom}`,
                          description: `Rendez-vous planifié avec prospect ${prospectData.prenom} ${prospectData.nom}\nTéléphone: ${prospectData.telephone}${prospectFormData.commentaire ? `\n\nCommentaires:\n${prospectFormData.commentaire}` : ''}`,
                          dateEcheance: prospectFormData.dateProchainRdv,
                          priorite: "normale",
                          clientId: prospectData.id,
                          type: "rdv_prospect"
                        };
                        
                        await apiRequest("POST", "/api/tasks", taskData);
                        
                        toast({
                          title: "Prospect et tâche créés !",
                          description: `${prospectData.prenom} ${prospectData.nom} + RDV le ${new Date(prospectFormData.dateProchainRdv).toLocaleDateString('fr-FR')}`,
                        });
                      }
                      
                      // Fermer le dialog et réinitialiser
                      setShowNewProspectDialog(false);
                      setProspectFormData({
                        prenom: "",
                        nom: "",
                        email: "",
                        telephone: "",
                        source: "",
                        codePostal: "",
                        ville: "",
                        commentaire: "",
                        dateProchainRdv: "",
                        stade: "nouveau"
                      });
                      setShowEconomySimulator(false);
                      setSimulationSaved(false);
                      
                    } catch (error) {
                      console.error("❌ Erreur:", error);
                    }
                  }}
                  disabled={createProspectMutation.isPending || (!prospectFormData?.prenom?.trim() && !prospectFormData?.nom?.trim()) || !prospectFormData?.telephone?.trim()}
                  className="flex-1 h-11 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {createProspectMutation.isPending ? "Création..." : "Créer automatiquement"}
                </Button>
              </div>
              
              {/* Note de validation */}
              <p className="text-xs text-gray-500 text-center">
                * Prénom ou Nom + Téléphone obligatoires
              </p>
            </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de détails prospect */}
      {selectedProspect && (
        <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl mx-4">
            <DialogHeader className="pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {selectedProspect.prenom} {selectedProspect.nom}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {/* Bouton Modifier supprimé - Seul le formulaire optimisé existe */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProspect(null)}
                    className="h-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${getStadeBadgeColor(selectedProspect.stade || "nouveau")} text-white px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
                  {getStadeLabel(selectedProspect.stade || "nouveau")}
                </Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  Prospect {selectedProspect.type}
                </Badge>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-base">Informations de contact</h4>
                  <div className="space-y-3 text-sm">
                    {selectedProspect.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="break-all">{selectedProspect.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{selectedProspect.telephone}</span>
                    </div>
                    {selectedProspect.ville && (
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0">📍</span>
                        <span>{selectedProspect.ville} {selectedProspect.codePostal}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-base">Qualification</h4>
                  <div className="space-y-3 text-sm">
                    {selectedProspect.potentielEstime && (
                      <div><strong>Potentiel:</strong> {selectedProspect.potentielEstime}</div>
                    )}
                    {selectedProspect.source && (
                      <div><strong>Source:</strong> {selectedProspect.source}</div>
                    )}
                    {selectedProspect.economyData?.monthlySavings && (
                      <div className="text-green-600 font-medium bg-green-50 p-2 rounded-lg">
                        💰 Économie: +{selectedProspect.economyData.monthlySavings.toFixed(0)}€/mois
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Suivi et Planification */}
                <div>
                  <h4 className="font-semibold mb-3 text-base">Suivi et Planification</h4>
                  <div className="space-y-3 text-sm">
                    {selectedProspect.dernierContact && (
                      <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-blue-700">Dernier contact:</span>
                          <span className="ml-2">{new Date(selectedProspect.dernierContact).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    )}
                    {selectedProspect.prochainContact && (
                      <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-700">Prochain contact:</span>
                          <span className="ml-2">{new Date(selectedProspect.prochainContact).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    )}
                    {selectedProspect.nombreContacts && selectedProspect.nombreContacts > 0 && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span><strong>Nombre de contacts:</strong> {selectedProspect.nombreContacts}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              

              
              {/* Section Commentaires - TOUJOURS AFFICHÉE */}
              {selectedProspect.commentaire && (
                <div>
                  <h4 className="font-semibold mb-3 text-base">Commentaires et Simulation</h4>
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg text-sm whitespace-pre-wrap border border-green-200 leading-relaxed">
                    {selectedProspect.commentaire}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog d'édition de prospect */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm w-full max-h-[95vh] overflow-y-auto bg-white p-0 border-0 m-2">
          <div className="relative">
            <div className="sticky top-0 bg-white z-10 p-4 pb-3 border-b border-gray-100">
              <DialogTitle className="text-center text-lg font-bold text-gray-900 leading-tight">
                ✏️ Modifier le prospect
              </DialogTitle>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">📋</span>
                  </div>
                  <h3 className="text-base font-semibold text-blue-800">Informations du prospect</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Prénom *" 
                      value={prospectFormData?.prenom || ""}
                      onChange={(e) => setProspectFormData(prev => ({ ...prev, prenom: e.target.value }))}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                    <Input 
                      placeholder="Nom *" 
                      value={prospectFormData?.nom || ""}
                      onChange={(e) => setProspectFormData(prev => ({ ...prev, nom: e.target.value }))}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <Input 
                    placeholder="Email (facultatif)" 
                    type="email"
                    value={prospectFormData?.email || ""}
                    onChange={(e) => setProspectFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                  />
                  
                  <Input 
                    placeholder="Téléphone *" 
                    value={prospectFormData?.telephone || ""}
                    onChange={(e) => setProspectFormData(prev => ({ ...prev, telephone: e.target.value }))}
                    className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                  />
                  
                  {/* Source prospect */}
                  <Select 
                    value={prospectFormData?.source || ""} 
                    onValueChange={(value) => setProspectFormData(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Source prospect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salon">Salon/Événement</SelectItem>
                      <SelectItem value="site_web">Site web</SelectItem>
                      <SelectItem value="parrainage">Parrainage</SelectItem>
                      <SelectItem value="demarchage">Démarchage</SelectItem>
                      <SelectItem value="reseaux_sociaux">Réseaux sociaux</SelectItem>
                      <SelectItem value="bouche_a_oreille">Bouche à oreille</SelectItem>
                      <SelectItem value="prospection_directe">Prospection directe</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Stade du prospect */}
                  <Select 
                    value={prospectFormData?.stade || "nouveau"} 
                    onValueChange={handleStadeChange}
                  >
                    <SelectTrigger className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Stade du prospect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                      <SelectItem value="contacte">Contacté</SelectItem>
                      <SelectItem value="qualifie">Qualifié</SelectItem>
                      <SelectItem value="pret_signature">Prêt signature</SelectItem>
                      <SelectItem value="converti">Converti</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Code postal" 
                      value={prospectFormData?.codePostal || ""}
                      onChange={(e) => {
                        setProspectFormData(prev => ({ ...prev, codePostal: e.target.value }));
                        if (e.target.value.length === 5) {
                          fetchCityFromPostalCode(e.target.value);
                        }
                      }}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                    <Input 
                      placeholder="Ville" 
                      value={prospectFormData?.ville || ""}
                      onChange={(e) => setProspectFormData(prev => ({ ...prev, ville: e.target.value }))}
                      className="bg-white h-11 text-sm border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Champ commentaires avec zoom conditionnel */}
                  {showCommentZoom ? (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCommentZoom(false)}>
                      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                              <div>
                                <h3 className="font-semibold text-lg">Changement de stade</h3>
                                <p className="text-blue-100 text-sm">
                                  {getStadeLabel(previousStade)} → {getStadeLabel(prospectFormData?.stade || "nouveau")}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowCommentZoom(false)}
                              className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-amber-800 text-sm font-medium">
                              💡 Ajoutez un commentaire pour expliquer ce changement de stade
                            </p>
                          </div>
                          
                          <textarea 
                            placeholder={`Pourquoi passer de "${getStadeLabel(previousStade)}" à "${getStadeLabel(prospectFormData?.stade || "nouveau")}" ?\n\nExemple: "Client contacté par téléphone, très intéressé par l'offre Freebox Ultra..."`}
                            value={prospectFormData?.commentaire || ""}
                            onChange={(e) => setProspectFormData(prev => ({ ...prev, commentaire: e.target.value }))}
                            className="w-full h-40 p-4 bg-gray-50 text-sm border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:bg-white transition-colors resize-none"
                            autoFocus
                          />
                          
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowCommentZoom(false)}
                              className="flex-1"
                            >
                              Fermer sans sauvegarder
                            </Button>
                            <Button
                              onClick={() => setShowCommentZoom(false)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                            >
                              Continuer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <textarea 
                      placeholder="Commentaires et notes..." 
                      value={prospectFormData?.commentaire || ""}
                      onChange={(e) => setProspectFormData(prev => ({ ...prev, commentaire: e.target.value }))}
                      className="w-full h-20 p-3 bg-white text-sm border border-gray-300 rounded-lg focus:border-blue-500 resize-none"
                    />
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                <Button
                  onClick={async () => {
                    if ((!prospectFormData.prenom?.trim() && !prospectFormData.nom?.trim()) || !prospectFormData.telephone?.trim()) {
                      toast({
                        title: "Erreur de validation",
                        description: "Au moins le prénom ou nom + téléphone sont obligatoires",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    updateProspectMutation.mutate({
                      id: prospectFormData.id,
                      data: {
                        prenom: prospectFormData.prenom || "",
                        nom: prospectFormData.nom || "",
                        email: prospectFormData.email || "",
                        telephone: prospectFormData.telephone,
                        codePostal: prospectFormData.codePostal || "",
                        ville: prospectFormData.ville || "",
                        commentaire: prospectFormData.commentaire || "",
                        source: prospectFormData.source || "",
                        stade: prospectFormData.stade || "nouveau"
                      }
                    });
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  disabled={updateProspectMutation.isPending || (!prospectFormData?.prenom?.trim() && !prospectFormData?.nom?.trim()) || !prospectFormData?.telephone?.trim()}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {updateProspectMutation.isPending ? "Modification..." : "Sauvegarder les modifications"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-md w-full m-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer le prospect :
              </p>
              {prospectToDelete && (
                <div className="font-semibold text-red-800">
                  {prospectToDelete.prenom} {prospectToDelete.nom}
                  <br />
                  <span className="text-sm font-normal text-gray-600">
                    {prospectToDelete.telephone}
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>📁 Information :</strong> Le prospect sera déplacé vers la corbeille. 
                Vous pourrez le récupérer depuis la corbeille avant la suppression définitive.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setProspectToDelete(null);
                }}
                className="flex-1"
                disabled={deleteProspectMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteProspectMutation.isPending}
              >
                {deleteProspectMutation.isPending ? "Suppression..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      


      {/* Modal d'avertissement supprimée - redirection directe vers le recrutement */}

      {/* Bouton flottant "+" pour ajouter un nouveau prospect - Position ajustée pour mobile */}
      <Button
        onClick={() => {
          if (activeTab === "client") {
            // Réinitialiser les données du formulaire
            setProspectFormData({
              prenom: "",
              nom: "",
              email: "",
              telephone: "",
              source: "",
              codePostal: "",
              ville: "",
              commentaire: "",
              dateProchainRdv: "",
              stade: "nouveau"
            });
            setPotentielEstime("");
            setShowNewProspectDialog(true);
          } else {
            // Rediriger vers le formulaire simple avec le code vendeur pré-rempli
            const recruitmentUrl = `/recruitment/simple-form?` + new URLSearchParams({
              codeParrainage: currentUser?.user?.codeVendeur || '',
              source: 'prospects_hub'
            }).toString();
            window.location.href = recruitmentUrl;
          }
        }}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-0 md:bottom-6"
        style={{
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}