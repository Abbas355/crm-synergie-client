import React, { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import { invalidateClientCache } from "@/lib/queryClient";

// Components
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SimpleDatePicker } from "@/components/simple-date-picker";
import { PostalCodeLookup } from "@/components/postal-code-lookup";
import { SimCardSelect } from "@/components/clients/sim-card-select";
import { ClientSearch } from "@/components/clients/client-search";
import { ProspectForm } from "@/components/clients/prospect-form";
import { CongratulationsScreen } from "@/components/clients/congratulations-screen";
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";

// Icons
import { 
  User, 
  Trash, 
  X, 
  MapPin, 
  FileSignature, 
  ArrowRightCircle, 
  Eye
} from "lucide-react";

// Schemas
import { 
  clientFormSchema, 
  ClientFormValues,
  civiliteOptions,
  produitOptions,
  portabiliteOptions,
  sourceOptions,
  typeRecommandationOptions
} from "@/lib/schemas/client-schema";

// Types
import { Client } from "@shared/schema";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client; // Optional for edit mode
  standalone?: boolean; // Whether the form is displayed as a standalone page
}

export function ClientForm({ isOpen, onClose, client, standalone = false }: ClientFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState("personnel");
  const [isViewMode, setIsViewMode] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [clientName, setClientName] = useState("");

  // Format de date française
  const formatDateForDisplay = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    
    try {
      // Si la date est au format ISO, la convertir en format français
      const date = new Date(dateStr);
      if (isValid(date)) {
        return format(date, "dd/MM/yyyy", { locale: fr });
      }
      
      // Si déjà au format français, retourner tel quel
      if (dateStr.includes("/")) {
        return dateStr;
      }
      
      return "";
    } catch (e) {
      return "";
    }
  };
  
  // Fonction pour parser une date au format français et la convertir en ISO
  const parseDateToIso = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    
    try {
      // Si déjà au format ISO, retourner tel quel
      if (dateStr.includes("-")) {
        return dateStr;
      }
      
      // Convertir du format français vers ISO
      const date = parse(dateStr, "dd/MM/yyyy", new Date());
      if (isValid(date)) {
        return format(date, "yyyy-MM-dd");
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // Initialisation du formulaire
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      civilite: client?.civilite || undefined,
      prenom: client?.prenom || "",
      nom: client?.nom || "",
      email: client?.email || null,
      phone: client?.phone || null,
      fixe: client?.fixe || null,
      adresse: client?.adresse || null,
      codePostal: client?.codePostal || null,
      ville: client?.ville || null,
      dateNaissance: formatDateForDisplay(client?.dateNaissance),
      source: client?.source || undefined,
      commentaire: client?.commentaire || null,
      status: client?.status || "nouveau",
      dateSignature: formatDateForDisplay(client?.dateSignature),
      dateRendezVous: formatDateForDisplay(client?.dateRendezVous),
      dateInstallation: formatDateForDisplay(client?.dateInstallation),
      codeVendeur: client?.codeVendeur || null,
      produit: client?.produit as any || undefined,
      forfaitType: client?.forfaitType || null,
      contratSigne: client?.contratSigne || false,
      identiteValidee: client?.identiteValidee || false, 
      ribValide: client?.ribValide || false,
      justificatifDomicileValide: client?.justificatifDomicileValide || false,
    },
  });

  // Réinitialiser le formulaire lorsque le client change
  useEffect(() => {
    if (client) {
      form.reset({
        civilite: client.civilite || undefined,
        prenom: client.prenom || "",
        nom: client.nom || "",
        email: client.email || null,
        phone: client.phone || null,
        fixe: client.fixe || null,
        adresse: client.adresse || null,
        codePostal: client.codePostal || null,
        ville: client.ville || null,
        dateNaissance: formatDateForDisplay(client.dateNaissance),
        source: client.source || undefined,
        commentaire: client.commentaire || null,
        status: client.status || "nouveau",
        dateSignature: formatDateForDisplay(client.dateSignature),
        dateRendezVous: formatDateForDisplay(client.dateRendezVous),
        dateInstallation: formatDateForDisplay(client.dateInstallation),
        codeVendeur: client.codeVendeur || null,
        produit: client.produit as any || undefined,
        identifiantContrat: client.identifiant || null,
        forfaitType: client.forfaitType || null,
        contratSigne: client.contratSigne || false,
        identiteValidee: client.identiteValidee || false,
        ribValide: client.ribValide || false,
        justificatifDomicileValide: client.justificatifDomicileValide || false,
      });
    } else {
      form.reset({
        civilite: undefined,
        prenom: "",
        nom: "",
        email: null,
        phone: null,
        fixe: null,
        adresse: null,
        codePostal: null,
        ville: null,
        dateNaissance: null,
        source: undefined,
        commentaire: null,
        status: "nouveau",
        dateSignature: null,
        dateRendezVous: null,
        dateInstallation: null,
        codeVendeur: null,
        produit: undefined,
        identifiantContrat: null,
        forfaitType: null,
        contratSigne: false,
        identiteValidee: false,
        ribValide: false,
        justificatifDomicileValide: false,
      });
    }
    
    // Réinitialiser les états du formulaire
    setIsViewMode(false);
    setActiveTab("personnel");
    setShowCongratulations(false);
  }, [client, form]);

  // Observer les changements sur les champs spécifiques
  const produit = form.watch("produit");
  const source = form.watch("source");
  const typeRecommandation = form.watch("typeRecommandation");
  const portabilite = form.watch("portabilite");

  // Mutation pour créer un client
  const createMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Convertir les dates au format ISO pour l'API
      const formattedData = {
        ...data,
        dateNaissance: parseDateToIso(data.dateNaissance),
        dateSignature: parseDateToIso(data.dateSignature),
        dateRendezVous: parseDateToIso(data.dateRendezVous),
        dateInstallation: parseDateToIso(data.dateInstallation),
      };
      
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        throw new Error(errData.message || `Erreur lors de la création: ${res.status}`);
      }
      
      return await res.json();
    },
    onSuccess: (createdClient) => {
      // Montrer l'écran de félicitations pour tous les vendeurs non-admin
      setClientName(`${form.getValues("prenom")} ${form.getValues("nom")}`);
      setShowCongratulations(true);
      
      // Invalider le cache pour actualiser les listes de clients
      invalidateClientCache();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un client
  const updateMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Convertir les dates au format ISO pour l'API
      const formattedData = {
        ...data,
        dateNaissance: parseDateToIso(data.dateNaissance),
        dateSignature: parseDateToIso(data.dateSignature),
        dateRendezVous: parseDateToIso(data.dateRendezVous),
        dateInstallation: parseDateToIso(data.dateInstallation),
      };
      
      const res = await fetch(`/api/clients/${client?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur lors de la mise à jour: ${errText}`);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Client mis à jour avec succès",
        description: `Les informations de "${form.getValues("prenom")} ${form.getValues("nom")}" ont été mises à jour.`,
      });
      handleClose();
      invalidateClientCache();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Déterminer si on est en train de soumettre
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Basculer entre mode lecture et édition
  const toggleViewMode = () => {
    setIsViewMode(!isViewMode);
  };

  // Gestion de la fermeture
  const handleClose = () => {
    // Réinitialiser le formulaire
    form.reset();
    setShowCongratulations(false);
    
    if (standalone) {
      // En mode standalone, retourner à la liste des clients
      setLocation("/clients");
    } else {
      // En mode modal, fermer simplement le modal
      onClose();
    }
  };

  // Lorsque l'utilisateur veut ajouter un autre client
  const handleAddAnotherClient = () => {
    // Réinitialiser le formulaire et les états
    form.reset({
      civilite: undefined,
      prenom: "",
      nom: "",
      email: null,
      phone: null,
      fixe: null,
      adresse: null,
      codePostal: null,
      ville: null,
      dateNaissance: null,
      source: undefined,
      commentaire: null,
      status: "nouveau",
      dateSignature: null,
      dateRendezVous: null,
      dateInstallation: null,
      codeVendeur: null,
      produit: undefined,
      identifiantContrat: null,
      forfaitType: null,
      contratSigne: false,
      identiteValidee: false,
      ribValide: false,
      justificatifDomicileValide: false,
    });
    
    setShowCongratulations(false);
    setActiveTab("personnel");
  };

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

  // Soumission du formulaire
  const onSubmit = (data: ClientFormValues) => {
    // 🚨 CORRECTION BUG : Conversion date française vers ISO avant envoi
    const processedData = { ...data };
    if (data.dateNaissance && data.dateNaissance.includes('/')) {
      const isoDate = convertFrenchDateToISO(data.dateNaissance);
      processedData.dateNaissance = isoDate;
      console.log(`🔄 Conversion dateNaissance: ${data.dateNaissance} → ${isoDate}`);
    }

    // Si c'est un client existant, mettre à jour
    if (client?.id) {
      updateMutation.mutate(processedData);
    } else {
      // Sinon, créer un nouveau client
      createMutation.mutate(processedData);
    }
  };

  // Si l'écran de félicitations est affiché
  if (showCongratulations) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <CongratulationsScreen
            clientName={clientName}
            onAddNewClient={handleAddAnotherClient}
            onBackToList={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Contenu principal du formulaire
  const formContent = (
    <>
      <div className="flex justify-between items-center p-4 border-b mb-4">
        <div className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {client ? (
              <span>
                <span className="text-sm text-gray-500">Client: </span>{client.prenom} {client.nom}
              </span>
            ) : (
              "Nouveau Client"
            )}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {client && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
                  // Supprimer le client
                  fetch(`/api/clients/${client.id}`, {
                    method: "DELETE",
                  })
                    .then(res => {
                      if (res.ok) {
                        toast({
                          title: "Client supprimé",
                          description: "Le client a été supprimé avec succès",
                        });
                        invalidateClientCache();
                        handleClose();
                      } else {
                        throw new Error("Erreur lors de la suppression");
                      }
                    })
                    .catch(err => {
                      toast({
                        title: "Erreur",
                        description: "Une erreur est survenue lors de la suppression du client",
                        variant: "destructive",
                      });
                    });
                }
              }}
            >
              <Trash className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
          {client && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className={isViewMode ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-gray-50"}
            >
              {isViewMode ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Mode lecture
                </>
              ) : (
                <>
                  <ArrowRightCircle className="h-4 w-4 mr-1" />
                  Mode édition
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Message en haut du formulaire */}
      <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
        Les champs marqués d'un * sont obligatoires.
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="personnel" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-2">
              <TabsTrigger value="personnel">Personnel</TabsTrigger>
              <TabsTrigger value="adresse">Adresse</TabsTrigger>
              <TabsTrigger value="contrat">Contrat</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
            </TabsList>
            
            {/* Tab: Informations personnelles */}
            <TabsContent value="personnel" className="space-y-5 pt-4">
              <FormField
                control={form.control}
                name="civilite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civilité *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une civilité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {civiliteOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
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
                      <Input
                        placeholder="John"
                        {...field}
                        disabled={isViewMode}
                      />
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
                      <Input
                        placeholder="Doe"
                        {...field}
                        disabled={isViewMode}
                      />
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
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: jj/mm/aaaa (ex: 01/01/1990). Le client doit avoir au moins 18 ans.
                    </p>
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
                      <Input
                        type="email"
                        placeholder="john.doe@email.com"
                        {...field}
                        value={field.value || ""}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+33612345678"
                        {...field}
                        value={field.value || ""}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fixe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixe (Facultatif)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+33123456789"
                        {...field}
                        value={field.value || ""}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            {/* Tab: Adresse */}
            <TabsContent value="adresse" className="space-y-5 pt-4">
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12, Avenue de la République"
                        {...field}
                        value={field.value || ""}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <FormField
                  control={form.control}
                  name="codePostal"
                  render={({ field: postalCodeField }) => (
                    <FormField
                      control={form.control}
                      name="ville"
                      render={({ field: cityField }) => (
                        <PostalCodeLookup
                          postalCodeValue={postalCodeField.value || ""}
                          cityValue={cityField.value || ""}
                          onPostalCodeChange={postalCodeField.onChange}
                          onCityChange={cityField.onChange}
                          postalCodeDisabled={isViewMode}
                          cityDisabled={isViewMode}
                          required={true}
                        />
                      )}
                    />
                  )}
                />
              </div>
            </TabsContent>
            
            {/* Tab: Contrat */}
            <TabsContent value="contrat" className="space-y-5 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <FormField
                  control={form.control}
                  name="dateSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de signature *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="jj/mm/aaaa"
                          {...field}
                          value={field.value || ""}
                          disabled={isViewMode}
                          onChange={(e) => {
                            // Permettre la saisie manuelle avec formatage automatique
                            let value = e.target.value.replace(/[^\d]/g, "");
                            if (value.length > 8) value = value.slice(0, 8);
                            
                            // Formatter la date avec les séparateurs
                            if (value.length > 4) {
                              value = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4);
                            } else if (value.length > 2) {
                              value = value.slice(0, 2) + "/" + value.slice(2);
                            }
                            
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
                  name="produit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={isViewMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {produitOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {produit && (
                <FormField
                  control={form.control}
                  name="identifiantContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant contrat *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            ["Freebox Pop", "Freebox Essentiel", "Freebox Ultra"].includes(produit)
                              ? "FO35000000"
                              : "52000000"
                          }
                          {...field}
                          value={field.value || ""}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {produit === "Forfait 5G" && (
                <>
                  <FormField
                    control={form.control}
                    name="carteSim"
                    render={({ field }) => (
                      <SimCardSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isViewMode}
                      />
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="portabilite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portabilité *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isViewMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type de portabilité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {portabiliteOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {portabilite === "Portabilité" && (
                    <FormField
                      control={form.control}
                      name="numeroPorter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro à porter *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+33612345678"
                              {...field}
                              value={field.value || ""}
                              disabled={isViewMode}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              
              {/* Les champs de vérification ont été supprimés:
                - Contrat signé
                - Identité validée
                - RIB validé
                - Justificatif de domicile validé
              */}
            </TabsContent>
            
            {/* Tab: Source */}
            <TabsContent value="source" className="space-y-5 pt-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {source === "Recommandation" && (
                <>
                  <FormField
                    control={form.control}
                    name="typeRecommandation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de recommandation *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isViewMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {typeRecommandationOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {typeRecommandation === "Client" && (
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <ClientSearch
                          selectedClientId={field.value}
                          onClientSelect={field.onChange}
                          disabled={isViewMode}
                        />
                      )}
                    />
                  )}
                  
                  {typeRecommandation === "Prospect" && (
                    <ProspectForm form={form} disabled={isViewMode} />
                  )}
                </>
              )}
              
              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire (Facultatif)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notez les tâches à effectuer pour le client"
                        className="resize-none min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            
            {isViewMode ? (
              <Button
                type="button"
                onClick={() => setIsViewMode(false)}
              >
                Modifier
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </>
  );

  // Rendu conditionnel en fonction du mode (modal ou standalone)
  if (standalone) {
    return (
      <div className="container p-4 md:p-8 max-w-3xl mx-auto">
        {formContent}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Empêcher la fermeture sur clic extérieur pendant la soumission
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        {formContent}
      </DialogContent>
    </Dialog>
  );
}