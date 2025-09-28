import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, User, MapPin, FileText, CheckCircle, MessageCircle, Calendar } from "lucide-react";
import { clientFormSchema, type ClientFormValues } from "@shared/schema";
import { getSourcesForSelect } from "@shared/sources";
import { SimCardSelect } from "@/components/clients/sim-card-select";
import { ClientSelector } from "@/components/clients/client-selector";
// ProspectFormModern supprimé - Plus de formulaires prospects multiples
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";

type NewClientFormProps = {
  onClose?: () => void;
  onSubmit?: (values: ClientFormValues) => void;
  onSuccess?: (clientName: string) => void;
  isSubmitting?: boolean;
};

const PRODUITS = [
  { value: "Freebox Pop", label: "Freebox Pop", points: 4, color: "bg-blue-500" },
  { value: "Freebox Essentiel", label: "Freebox Essentiel", points: 5, color: "bg-green-500" },
  { value: "Freebox Ultra", label: "Freebox Ultra", points: 6, color: "bg-purple-500" },
  { value: "Forfait 5G", label: "Forfait 5G", points: 1, color: "bg-orange-500" }
];

// Sources centralisées importées depuis shared/sources.ts
const SOURCES_FOR_SELECT = getSourcesForSelect();

const STATUS_OPTIONS = [
  { value: "enregistre", label: "Enregistré", color: "bg-gray-500" },
  { value: "signature", label: "Signature", color: "bg-blue-500" },
  { value: "valide", label: "Validé", color: "bg-green-500" },
  { value: "rendez_vous", label: "Rendez-vous", color: "bg-yellow-600" },
  { value: "installation", label: "Installation", color: "bg-purple-500" }
];

export function NewClientFormComplete({ onClose, onSubmit, onSuccess, isSubmitting = false }: NewClientFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const search = location.includes('?') ? location.split('?')[1] : '';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personnel");
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showProspectForm, setShowProspectForm] = useState(false);

  // Récupérer les données pré-remplies depuis localStorage
  const getPrefilledData = () => {
    try {
      const prospectData = localStorage.getItem('prospectConversionData');
      
      if (prospectData) {
        const decodedData = JSON.parse(prospectData);
        console.log("🎯 Données prospect récupérées depuis localStorage:", decodedData);
        // Nettoyer les données après récupération
        localStorage.removeItem('prospectConversionData');
        return decodedData;
      }
    } catch (error) {
      console.log("Erreur lors du décodage des données prospect:", error);
    }
    return null;
  };

  // Fonction pour récupérer automatiquement la ville depuis le code postal
  const fetchCityFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 5) return;
    
    setIsLoadingCity(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/fr/${postalCode}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          if (data.places.length === 1) {
            // Une seule ville : remplissage automatique
            const city = data.places[0]['place name'];
            form.setValue('ville', city);
            setAvailableCities([]);
          } else {
            // Plusieurs villes : stockage des options pour le menu déroulant
            const cities = data.places.map((place: any) => place['place name']);
            setAvailableCities(cities);
            form.setValue('ville', ''); // Vider le champ pour forcer la sélection
            toast({
              title: "Plusieurs communes trouvées",
              description: `${data.places.length} communes correspondent à ce code postal. Veuillez sélectionner votre commune.`,
              duration: 4000,
            });
          }
        }
      }
    } catch (error) {
      console.log('Erreur lors de la récupération de la ville:', error);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      civilite: "",
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      dateNaissance: "",
      adresse: "",
      codePostal: "",
      ville: "",
      produit: "",
      status: "enregistre", // Statut par défaut pour les vendeurs
      identifiantContrat: "",
      carteSIM: "",
      portabilite: "non",
      numeroPorter: "",
      source: "prospection",
      civiliteProspect: "",
      prenomProspect: "",
      nomProspect: "",
      mobileProspect: "",
      codePostalProspect: "",
      villeProspect: "",
      commentaire: "",
      dateSignature: "",
      dateRendezVous: "",
      dateInstallation: "",
      userId: user?.id || 0,
      clientRecommandation: undefined,
      prospectCivilite: "",
      prospectPrenom: "",
      prospectNom: "",
      prospectMobile: "",
      prospectCodePostal: "",
      prospectVille: "",
    },
  });

  // Effet pour pré-remplir le formulaire avec les données du prospect
  useEffect(() => {
    const prefilledData = getPrefilledData();
    if (prefilledData) {
      console.log("✅ Pré-remplissage du formulaire avec données prospect");
      
      // Pré-remplir les champs disponibles
      if (prefilledData.prenom) form.setValue('prenom', prefilledData.prenom);
      if (prefilledData.nom) form.setValue('nom', prefilledData.nom);
      if (prefilledData.email) form.setValue('email', prefilledData.email);
      if (prefilledData.phone) form.setValue('telephone', prefilledData.phone);
      if (prefilledData.adresse) form.setValue('adresse', prefilledData.adresse);
      if (prefilledData.codePostal) form.setValue('codePostal', prefilledData.codePostal);
      if (prefilledData.ville) form.setValue('ville', prefilledData.ville);
      if (prefilledData.source) form.setValue('source', prefilledData.source);
      if (prefilledData.commentaire) form.setValue('commentaire', prefilledData.commentaire);
      
      // Afficher une notification
      toast({
        title: "Données pré-remplies",
        description: "Les informations du prospect ont été automatiquement intégrées dans le formulaire.",
      });
    }
  }, [search, form, toast, getPrefilledData]);

  // Observer les changements de formulaire pour la logique conditionnelle
  const watchedSource = useWatch({ control: form.control, name: 'source' });
  const watchedPortabilite = useWatch({ control: form.control, name: 'portabilite' });
  const watchedProduit = useWatch({ control: form.control, name: 'produit' });
  const watchedTelephone = useWatch({ control: form.control, name: 'telephone' });
  const watchedNumeroPorter = useWatch({ control: form.control, name: 'numeroPorter' });
  const watchedStatus = useWatch({ control: form.control, name: 'status' });
  const watchedTypeRecommandation = useWatch({ control: form.control, name: 'typeRecommandation' }) as string;

  // ✅ SUPPRIMÉ : Fonction formatDateNaissance remplacée par composant unifié DateNaissanceInput

  // Fonction pour obtenir le placeholder de l'identifiant contrat selon le produit
  const getContractPlaceholder = (produit: string) => {
    if (["Freebox Pop", "Freebox Essentiel", "Freebox Ultra"].includes(produit)) {
      return "FO350XXXXX";
    } else if (produit === "Forfait 5G") {
      return "52XXXXXX";
    }
    return "Identifiant contrat";
  };

  // Fonction de validation côté client pour l'identifiant contrat
  const validateContractId = (value: string, produit: string) => {
    if (!value || !produit) return true;
    
    // Pour les produits Freebox : format FO + 8 chiffres
    if (["Freebox Pop", "Freebox Essentiel", "Freebox Ultra"].includes(produit)) {
      const freeboxRegex = /^FO\d{8}$/;
      return freeboxRegex.test(value);
    }
    
    // Pour Forfait 5G : 8 chiffres
    if (produit === "Forfait 5G") {
      const forfaitRegex = /^\d{8}$/;
      return forfaitRegex.test(value);
    }
    
    return true;
  };

  // Auto-suggestion du téléphone pour portabilité
  useEffect(() => {
    if (watchedProduit === "Forfait 5G" && watchedPortabilite === "oui" && watchedTelephone && !watchedNumeroPorter) {
      form.setValue("numeroPorter", watchedTelephone);
    }
  }, [watchedProduit, watchedPortabilite, watchedTelephone, watchedNumeroPorter, form]);

  // Validation des étapes
  const validateStep = (step: string): boolean => {
    const errors = form.formState.errors;
    switch (step) {
      case "personnel":
        return !errors.civilite && !errors.prenom && !errors.nom && !errors.email && !errors.telephone && !errors.dateNaissance;
      case "adresse":
        return !errors.adresse && !errors.codePostal && !errors.ville;
      case "contrat":
        return !errors.produit && !errors.source;
      default:
        return true;
    }
  };

  // Mutation pour créer un client
  const clientAddMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const response = await apiRequest("POST", "/api/clients", {
        ...data,
        // Conversion des dates si nécessaire
        dateSignature: data.dateSignature || undefined,
        dateRendezVous: data.dateRendezVous || undefined,
        dateInstallation: data.dateInstallation || undefined,
        // Gestion du nom complet (pour compatibilité)
        name: `${data.prenom} ${data.nom}`,
      });
      const newClient = await response.json();
      
      // Créer automatiquement une tâche si un commentaire a été saisi
      if (data.commentaire && data.commentaire.trim() !== "") {
        console.log("Création automatique d'une tâche à partir du commentaire client");
        
        // Création de la tâche associée au client
        const taskResponse = await apiRequest("POST", "/api/tasks", {
          title: `Suivi client: ${data.prenom} ${data.nom}`,
          description: data.commentaire,
          status: "en attente",
          priority: "normale",
          clientId: newClient.id,
          taskType: "suivi"
        });
        
        console.log("Tâche créée automatiquement:", await taskResponse.json());
      }
      
      return newClient;
    },
    onSuccess: (newClient, formData) => {
      // Invalidation du cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-global"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      
      // Affichage d'un toast de succès
      toast({
        title: "Client créé avec succès",
        description: `${formData.prenom} ${formData.nom} a été ajouté à votre portefeuille client.`,
        variant: "default",
      });
      
      // Déclenchement du callback de félicitations
      if (onSuccess) {
        const clientFirstName = formData.prenom?.trim() || "Client";
        onSuccess(clientFirstName);
      } else if (onSubmit) {
        onSubmit(formData);
      }
      
      // NE PAS fermer automatiquement le modal pour laisser le temps au message de s'afficher
      // if (onClose) {
      //   onClose();
      // }
    },
    onError: (error: any) => {
      console.error("❌ Erreur complète:", error);
      
      let errorTitle = "Erreur lors de la création";
      let errorMessage = "Une erreur est survenue lors de la création du client.";

      // Essayer de parser l'erreur pour obtenir plus de détails
      try {
        const errorText = error.message || error.toString();
        
        // Gestion spécifique pour les erreurs de doublons
        if (errorText.includes("duplicate") || errorText.includes("existe déjà")) {
          errorTitle = "Client déjà existant";
          if (errorText.includes("email")) {
            errorMessage = "Un client avec cet email existe déjà.";
          } else if (errorText.includes("identifiant_contrat")) {
            errorMessage = "Un contrat avec cet identifiant existe déjà.";
          } else {
            errorMessage = "Ce client existe déjà dans la base de données.";
          }
        } else if (errorText.includes("400")) {
          errorTitle = "Données incorrectes";
          errorMessage = "Veuillez vérifier les informations saisies.";
        } else if (errorText.includes("401")) {
          errorTitle = "Accès non autorisé";
          errorMessage = "Vous n'êtes pas autorisé à effectuer cette action.";
        } else if (errorText.includes("500")) {
          errorTitle = "Erreur serveur";
          errorMessage = "Une erreur interne est survenue. Veuillez réessayer.";
        }
      } catch (parseError) {
        console.error("Erreur lors du parsing de l'erreur:", parseError);
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fonction de conversion date française vers ISO
  const convertFrenchDateToISO = (frenchDate: string): string => {
    if (!frenchDate || frenchDate.length !== 10) return "";
    
    const parts = frenchDate.split('/');
    if (parts.length !== 3) return "";
    
    const [day, month, year] = parts;
    if (!day || !month || !year) return "";
    
    // Format ISO: AAAA-MM-JJ
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleSubmit = async (values: ClientFormValues) => {
    console.log("📤 Données soumises depuis le formulaire complet:", values);
    
    // 🚨 CORRECTION BUG : Conversion date française vers ISO avant envoi
    const processedValues = { ...values };
    if (values.dateNaissance && values.dateNaissance.includes('/')) {
      const isoDate = convertFrenchDateToISO(values.dateNaissance);
      processedValues.dateNaissance = isoDate;
      console.log(`🔄 Conversion dateNaissance: ${values.dateNaissance} → ${isoDate}`);
    }
    
    await clientAddMutation.mutateAsync(processedValues);
  };

  const getSelectedProduct = () => {
    return PRODUITS.find(p => p.value === watchedProduit);
  };

  const getSelectedStatus = () => {
    return STATUS_OPTIONS.find(s => s.value === watchedStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white relative">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Nouveau Client</h2>
              <p className="text-blue-100">Créer un nouveau dossier client</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Badges de progression */}
          <div className="flex items-center space-x-4 mt-4">
            {getSelectedProduct() && (
              <Badge className={`${getSelectedProduct()?.color} text-white border-0 px-3 py-1`}>
                {getSelectedProduct()?.label} ({getSelectedProduct()?.points} pts)
              </Badge>
            )}
            {getSelectedStatus() && (
              <Badge className={`${getSelectedStatus()?.color} text-white border-0 px-3 py-1`}>
                {getSelectedStatus()?.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 backdrop-blur-sm h-12">
                  <TabsTrigger value="personnel" className="flex items-center justify-center gap-1.5 text-xs px-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Personnel</span>
                  </TabsTrigger>
                  <TabsTrigger value="adresse" className="flex items-center justify-center gap-1.5 text-xs px-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Adresse</span>
                  </TabsTrigger>
                  <TabsTrigger value="contrats" className="flex items-center justify-center gap-1.5 text-xs px-2">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Contrat</span>
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Informations personnelles */}
                <TabsContent value="personnel" className="space-y-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span>Informations personnelles</span>
                        {validateStep("personnel") && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="civilite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Civilité *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="M.">M.</SelectItem>
                                <SelectItem value="Mme">Mme</SelectItem>
                                <SelectItem value="Mlle">Mlle</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="prenom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Prénom" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemple.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telephone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone *</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="0123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateNaissance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de naissance *</FormLabel>
                            <FormControl>
                              <DateNaissanceInput
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Adresse */}
                <TabsContent value="adresse" className="space-y-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <span>Adresse</span>
                        {validateStep("adresse") && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adresse"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse *</FormLabel>
                            <FormControl>
                              <Input placeholder="Adresse complète" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="codePostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="75001" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const postalCode = e.target.value;
                                  if (postalCode.length === 5) {
                                    fetchCityFromPostalCode(postalCode);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ville"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville *</FormLabel>
                            <FormControl>
                              {availableCities.length > 1 ? (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez votre commune" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableCities.map((city) => (
                                      <SelectItem key={city} value={city}>
                                        {city}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="relative">
                                  <Input 
                                    placeholder="Paris" 
                                    {...field}
                                    disabled={isLoadingCity}
                                  />
                                  {isLoadingCity && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Contrats fusionné */}
                <TabsContent value="contrats" className="space-y-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span>Contrat</span>
                        {validateStep("contrat") && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Section Contrat et Services */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Contrat et Services
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="produit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produit *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un produit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PRODUITS.map((produit) => (
                                  <SelectItem key={produit.value} value={produit.value}>
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-3 h-3 rounded ${produit.color}`}></div>
                                      <span>{produit.label} ({produit.points} pts)</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />



                      {/* Identifiant contrat conditionnel selon le produit */}
                      <FormField
                        control={form.control}
                        name="identifiantContrat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identifiant contrat *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={getContractPlaceholder(watchedProduit || "")}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Source du prospect" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SOURCES_FOR_SELECT.map((sourceOption) => (
                                  <SelectItem key={sourceOption.value} value={sourceOption.value}>
                                    {sourceOption.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Champ Type Recommandation conditionnel */}
                      {watchedSource === "recommandation" && (
                        <FormField
                          control={form.control}
                          name="source"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type Recommandation *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/70 backdrop-blur-sm border-orange-200 focus:border-orange-400 rounded-xl shadow-lg">
                                    <SelectValue placeholder="Choisir le type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="prospect">Prospect</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {watchedProduit === "Forfait 5G" && (
                        <>
                          <FormField
                            control={form.control}
                            name="carteSIM"
                            render={({ field }) => (
                              <SimCardSelect
                                value={field.value}
                                onChange={field.onChange}
                                disabled={false}
                              />
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="portabilite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Portabilité</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Portabilité" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="oui">Oui</SelectItem>
                                    <SelectItem value="non">Non</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {watchedPortabilite === "oui" && (
                            <FormField
                              control={form.control}
                              name="numeroPorter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Numéro à porter</FormLabel>
                                  <FormControl>
                                    <Input placeholder="0123456789" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section spéciale pour les recommandations */}
                  {watchedSource === "recommandation" && watchedTypeRecommandation && (
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-orange-600" />
                          <span>{watchedTypeRecommandation === "client" ? "Sélectionner un Client" : "Nouveau Prospect"}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {watchedTypeRecommandation === "client" ? (
                          <div>
                            <p className="text-sm text-orange-700 mb-4">
                              Sélectionnez un de vos clients existants qui a recommandé ce nouveau prospect :
                            </p>
                            <ClientSelector
                              onSelect={(client) => {
                                setSelectedClient(client);
                                form.setValue('clientRecommandation', client.id);
                              }}
                              selectedClientId={selectedClient?.id}
                            />
                            {selectedClient && (
                              <div className="mt-4 p-3 bg-white/70 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-800">
                                  ✓ Client sélectionné : {selectedClient.prenom} {selectedClient.nom}
                                </p>
                                {selectedClient.email && (
                                  <p className="text-xs text-orange-600 mt-1">{selectedClient.email}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-orange-700 mb-4">
                              Créez d'abord une fiche prospect pour la personne qui vous a recommandé ce client :
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowProspectForm(true)}
                              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                            >
                              <User className="h-4 w-4" />
                              <span>Ouvrir le formulaire Prospect</span>
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Section Commentaires intégrée */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-teal-600" />
                        <span>Commentaires et Notes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="commentaire"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commentaires</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Commentaires additionnels, notes spéciales..." 
                                className="min-h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Boutons d'action - Optimisé mobile */}
              <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0 pt-6 border-t bg-gray-50/80 backdrop-blur-sm -mx-6 px-6 py-4">
                {/* Boutons de navigation */}
                <div className="flex space-x-2 justify-center md:justify-start">
                  {activeTab !== "personnel" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 md:flex-none"
                      onClick={() => {
                        const tabs = ["personnel", "adresse", "contrats"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}
                    >
                      Précédent
                    </Button>
                  )}
                  
                  {activeTab !== "contrats" && (
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1 md:flex-none"
                      onClick={() => {
                        const tabs = ["personnel", "adresse", "contrats"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}
                    >
                      Suivant
                    </Button>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-3 w-full md:w-auto">
                  {onClose && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                      className="flex-1 md:flex-none"
                    >
                      Annuler
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={clientAddMutation.isPending} 
                    className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    {clientAddMutation.isPending ? "Création..." : "Créer le client"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Modal pour formulaire prospect */}
      {showProspectForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden mx-auto">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Nouveau Prospect</h2>
                  <p className="text-xs sm:text-sm text-orange-100">Créer une fiche prospect pour la recommandation</p>
                </div>
                <button
                  onClick={() => setShowProspectForm(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(95vh-100px)]">
              {/* ProspectFormModern supprimé - Redirection vers /prospects pour le formulaire unique */}
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4">Le formulaire prospect a été déplacé.</p>
                <Button 
                  onClick={() => {
                    setShowProspectForm(false);
                    window.open('/prospects', '_blank');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ouvrir le formulaire prospect optimisé
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}