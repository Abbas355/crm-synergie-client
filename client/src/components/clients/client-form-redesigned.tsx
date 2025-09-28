import { useState, useEffect, useRef, useMemo } from "react";
import { z } from "zod";
import { ProductionSafeSelect } from "@/lib/production-safe-select";
import { SimpleDatePicker } from "@/components/simple-date-picker";
import { useRole } from "@/hooks/use-role";
import { ClientStatusSelect } from "@/components/clients/client-status-select";
import { statusOptions, getStatusInfo } from "@/components/clients/client-status-select";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SimCardSelect } from "./sim-card-select";
import { Client } from "@shared/schema";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { getStatutLabel } from "@/lib/status-utils";
import { invalidateClientCache } from "@/lib/queryClient";
import { 
  User, 
  Trash, 
  Eye, 
  X, 
  ArrowRightCircle 
} from "lucide-react";

// Détecte si nous sommes en mode production
const isProduction = import.meta.env.MODE === 'production';

// Composant de menu déroulant simplifié pour la production
function SimpleSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled 
}: { 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Schéma de validation du formulaire client
const clientFormSchema = z.object({
  // Champs obligatoires
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  status: z.string().min(1, "Le statut est requis"),
  
  // Champs optionnels
  id: z.number().optional(),
  civilite: z.string().nullable().optional(),
  email: z.string().email("Courriel invalide").nullable().optional(),
  telephone: z.string().nullable().optional(),
  fixe: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  codePostal: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  dateNaissance: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  dateSignature: z.string().nullable().optional(),
  dateRendezVous: z.string().nullable().optional(),
  dateInstallation: z.string().nullable().optional(),
  codeVendeur: z.string().nullable().optional(),
  produit: z.string().nullable().optional(),
  forfaitType: z.string().nullable().optional(),
  contratSigne: z.boolean().nullable().optional(),
  identiteValidee: z.boolean().nullable().optional(),
  ribValide: z.boolean().nullable().optional(),
  justificatifDomicileValide: z.boolean().nullable().optional(),
  carteSim: z.string().nullable().optional(),
});

type ClientFormProps = {
  isOpen: boolean;
  onClose: () => void;
  client?: Client; // Optional for edit mode
  standalone?: boolean; // Whether the form is displayed as a standalone page
};

// Type inféré à partir du schéma
type FormValues = z.infer<typeof clientFormSchema>;

export function ClientForm({ isOpen, onClose, client, standalone = false }: ClientFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState("personnel");
  
  // Logs pour le debug
  useEffect(() => {
    console.log("Onglet actif:", activeTab);
  }, [activeTab]);
  const formRef = useRef<HTMLFormElement>(null);

  // Options pour les sélecteurs
  const sourceOptions = useMemo(() => [
    { value: "prospection", label: "Prospection" },
    { value: "parrainage", label: "Parrainage" },
    { value: "recommandation", label: "Recommandation" },
    { value: "ancien-client", label: "Ancien client" },
    { value: "salon", label: "Salon" },
    { value: "appel-entrant", label: "Appel entrant" },
    { value: "web", label: "Web" },
    { value: "autre", label: "Autre" },
  ], []);

  const civiliteOptions = useMemo(() => [
    { value: "M.", label: "M." },
    { value: "Mme", label: "Mme" },
    { value: "Mlle", label: "Mlle" },
  ], []);

  const forfaitTypeOptions = useMemo(() => [
    { value: "ultra", label: "Ultra (6 points)" },
    { value: "essentiel", label: "Essentiel (5 points)" },
    { value: "pop", label: "POP (4 points)" },
    { value: "5g", label: "5G (1 point)" },
  ], []);

  const produitOptions = useMemo(() => [
    { value: "fibre", label: "Fibre" },
    { value: "adsl", label: "ADSL" },
    { value: "5g", label: "5G" },
    { value: "4g", label: "4G" },
    { value: "autre", label: "Autre" },
  ], []);

  const statusOptions = useMemo(() => [
    { value: "nouveau", label: "Nouveau" },
    { value: "en-attente", label: "En attente" },
    { value: "signe", label: "Signé" },
    { value: "rendez-vous", label: "Rendez-vous" },
    { value: "refus", label: "Refus" },
    { value: "installation", label: "Installation" },
    { value: "termine", label: "Terminé" },
    { value: "valide_7j", label: "Validé 7 jours" },
    { value: "post-production", label: "Post-production" },
  ], []);

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      civilite: client?.civilite || null,
      prenom: client?.prenom || "",
      nom: client?.nom || "",
      email: client?.email || null,
      phone: client?.phone || null,
      fixe: client?.fixe || null,
      adresse: client?.adresse || null,
      codePostal: client?.codePostal || null,
      ville: client?.ville || null,
      dateNaissance: client?.dateNaissance ? new Date(client.dateNaissance).toISOString().split("T")[0] : null,
      source: client?.source || null,
      commentaire: client?.commentaire || null,
      status: client?.status || "nouveau",
      dateSignature: client?.dateSignature ? new Date(client.dateSignature).toISOString().split("T")[0] : null,
      dateRendezVous: client?.dateRendezVous ? new Date(client.dateRendezVous).toISOString().split("T")[0] : null,
      dateInstallation: client?.dateInstallation ? new Date(client.dateInstallation).toISOString().split("T")[0] : null,
      codeVendeur: client?.codeVendeur || null,
      produit: client?.produit || null,
      forfaitType: client?.forfaitType || null,
      // Valeurs additionnelles
      contratSigne: client?.contratSigne || false,
      identiteValidee: client?.identiteValidee || false, 
      ribValide: client?.ribValide || false,
      justificatifDomicileValide: client?.justificatifDomicileValide || false,
      carteSIM: client?.carteSIM || null,
    },
  });

  useEffect(() => {
    // Réinitialiser le formulaire quand le client change
    if (client) {
      form.reset({
        id: client.id,
        civilite: client.civilite,
        prenom: client.prenom || "",
        nom: client.nom || "",
        email: client.email,
        phone: client.phone || "",
        fixe: client.fixe,
        adresse: client.adresse,
        codePostal: client.codePostal,
        ville: client.ville,
        dateNaissance: client.dateNaissance ? new Date(client.dateNaissance).toISOString().split("T")[0] : null,
        source: client.source,
        commentaire: client.commentaire,
        status: client.status || "nouveau",
        dateSignature: client.dateSignature ? new Date(client.dateSignature).toISOString().split("T")[0] : null,
        dateRendezVous: client.dateRendezVous ? new Date(client.dateRendezVous).toISOString().split("T")[0] : null,
        dateInstallation: client.dateInstallation ? new Date(client.dateInstallation).toISOString().split("T")[0] : null,
        codeVendeur: client.codeVendeur || "",
        produit: client.produit || "",
        forfaitType: client.forfaitType || "",
        // Valeurs additionnelles
        contratSigne: client.contratSigne || false,
        identiteValidee: client.identiteValidee || false,
        ribValide: client.ribValide || false,
        justificatifDomicileValide: client.justificatifDomicileValide || false,
        carteSIM: client.carteSIM,
      });
    } else {
      form.reset({
        civilite: null,
        prenom: "",
        nom: "",
        email: null,
        phone: null,
        fixe: null,
        adresse: null,
        codePostal: null,
        ville: null,
        dateNaissance: null,
        source: null,
        commentaire: null,
        status: "nouveau",
        dateSignature: null,
        dateRendezVous: null,
        dateInstallation: null,
        codeVendeur: null,
        produit: null,
        forfaitType: null,
        contratSigne: false,
        identiteValidee: false,
        ribValide: false,
        justificatifDomicileValide: false,
        carteSIM: null,
      });
    }
    
    // Réinitialiser le mode d'affichage
    setIsViewMode(false);
    setActiveTab("personnel");
  }, [client, form]);

  // Mutation pour créer un client
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur lors de la création: ${errText}`);
      }
      return await res.json();
    },
    onSuccess: (response) => {
      // Récupérer les données du client créé
      const clientData = response.client;
      const clientPrenom = clientData.prenom;
      
      if (!isAdmin) {
        // Afficher le message de félicitations personnalisé pour les vendeurs
        toast({
          title: "Félicitations !",
          description: `${clientPrenom} a été ajouté avec succès. Excellente vente !`,
          duration: 5000,
        });
      } else {
        // Message standard pour les administrateurs
        toast({
          title: "Client créé avec succès",
          description: `Le client "${clientPrenom} ${clientData.nom}" a été ajouté.`,
        });
      }
      
      handleClose();
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
    mutationFn: async (data: FormValues) => {
      const res = await fetch(`/api/clients/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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

  // Mutation pour supprimer un client
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur lors de la suppression: ${errText}`);
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Client supprimé avec succès",
        description: `Le client "${client?.prenom} ${client?.nom}" a été supprimé.`,
      });
      setConfirmDelete(false);
      handleClose();
      invalidateClientCache();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
      setConfirmDelete(false);
    },
  });

  // Basculer entre mode lecture et édition
  const toggleViewMode = () => {
    setIsViewMode(!isViewMode);
  };

  // Gestion de la fermeture
  const handleClose = () => {
    if (standalone) {
      // En mode standalone, retourner à la liste des clients
      setLocation("/clients");
    } else {
      // En mode modal, fermer simplement le modal
      onClose();
    }
  };

  // Soumission du formulaire
  const onSubmit = (data: FormValues) => {
    // Si c'est un client existant, mettre à jour
    if (client?.id) {
      updateMutation.mutate({
        ...data,
        id: client.id,
      });
    } else {
      // Sinon, créer un nouveau client
      createMutation.mutate(data);
    }
  };

  // Déterminer si on est en train de soumettre
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Contenu principal du formulaire
  const formContent = (
    <>
      <DialogTitle className="flex justify-between items-center">
        <div className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          {client ? (
            <span>
              <span className="text-sm text-gray-500">Client: </span>{client.prenom} {client.nom}
            </span>
          ) : (
            "Nouveau Client"
          )}
        </div>
        <div className="flex items-center space-x-2">
          {client && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleViewMode}
            className={cn(
              isViewMode && "bg-blue-50 text-blue-600 border-blue-200",
              !isViewMode && "bg-gray-50"
            )}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogTitle>
      
      {/* Message en haut du formulaire */}
      <div className="text-xs sm:text-sm text-gray-600 mb-4 p-2 sm:p-3 bg-gray-50 rounded">
        Les champs marqués d'un * sont obligatoires.
      </div>
      
      {/* Dialog to confirm delete */}
      {confirmDelete && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement le client <strong>{client?.prenom} {client?.nom}</strong> et ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel 
                onClick={() => setConfirmDelete(false)} 
                className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => client?.id && deleteMutation.mutate(client.id)}
                className="bg-red-500 hover:bg-red-600 h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="personnel" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="personnel" className="text-xs sm:text-sm px-1 py-1 sm:px-3 sm:py-2">Personnel</TabsTrigger>
              <TabsTrigger value="adresse" className="text-xs sm:text-sm px-1 py-1 sm:px-3 sm:py-2">Adresse</TabsTrigger>
              <TabsTrigger value="contrat" className="text-xs sm:text-sm px-1 py-1 sm:px-3 sm:py-2">Contrat</TabsTrigger>
              <TabsTrigger value="source" className="text-xs sm:text-sm px-1 py-1 sm:px-3 sm:py-2">Source</TabsTrigger>
            </TabsList>
            
            {/* Tab: Personnel */}
            <TabsContent value="personnel">
              <div className="space-y-4 px-1 sm:px-3">
                <FormField
                  control={form.control}
                  name="civilite"
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="text-xs sm:text-sm font-medium mb-1">Civilité *</FormLabel>
                      <FormControl>
                        {isProduction ? (
                          <SimpleSelect 
                            options={civiliteOptions} 
                            value={field.value || ""} 
                            onChange={field.onChange} 
                            placeholder="Sélectionner une civilité" 
                            disabled={isViewMode}
                          />
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || undefined}
                            value={field.value || undefined}
                            disabled={isViewMode}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une civilité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {civiliteOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de naissance *</FormLabel>
                      <FormControl>
                        <SimpleDatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split("T")[0] : null)}
                          disabled={isViewMode}
                          placeholder="jj/mm/aaaa"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">Format: jj/mm/aaaa (ex: 01/01/1990). Le client doit avoir au moins 18 ans.</p>
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
                      <FormLabel>Fixe (optionnel)</FormLabel>
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
              </div>
            </TabsContent>
            
            {/* Tab: Adresse */}
            <TabsContent value="adresse">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Numéro et nom de rue" 
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
                  name="codePostal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="75001" 
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
                  name="ville"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Paris" 
                          {...field} 
                          value={field.value || ""} 
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            {/* Tab: Contrat */}
            <TabsContent value="contrat">
              <div className="space-y-4">
                {/* Champ Statut vente */}
                <div id="statut-vente-field">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut vente *</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value || ""}
                            onChange={field.onChange}
                            disabled={isViewMode}
                          >
                            <option value="" disabled>Sélectionner un statut</option>
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Champ Date de signature */}
                <FormField
                  control={form.control}
                  name="dateSignature"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de signature *</FormLabel>
                      <FormControl>
                        <SimpleDatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split("T")[0] : null)}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Champ Produit */}
                <FormField
                  control={form.control}
                  name="produit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit *</FormLabel>
                      <FormControl>
                        {isProduction ? (
                          <SimpleSelect 
                            options={produitOptions} 
                            value={field.value || ""} 
                            onChange={field.onChange} 
                            placeholder="Sélectionner un produit" 
                            disabled={isViewMode}
                          />
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={isViewMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un produit" />
                            </SelectTrigger>
                            <SelectContent>
                              {produitOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Champ Type de forfait */}
                <FormField
                  control={form.control}
                  name="forfaitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit</FormLabel>
                      <FormControl>
                        {isProduction ? (
                          <SimpleSelect 
                            options={forfaitTypeOptions} 
                            value={field.value || ""} 
                            onChange={field.onChange} 
                            placeholder="Sélectionner un forfait" 
                            disabled={isViewMode}
                          />
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={isViewMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un forfait" />
                            </SelectTrigger>
                            <SelectContent>
                              {forfaitTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Champ Carte SIM */}
                <FormField
                  control={form.control}
                  name="carteSIM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carte SIM</FormLabel>
                      <FormControl>
                        <SimCardSelect
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isViewMode}
                          clientId={client?.id}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Champ Date de rendez-vous */}
                <FormField
                  control={form.control}
                  name="dateRendezVous"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de rendez-vous</FormLabel>
                      <FormControl>
                        <SimpleDatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split("T")[0] : null)}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Champ Date d'installation */}
                <FormField
                  control={form.control}
                  name="dateInstallation"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'installation</FormLabel>
                      <FormControl>
                        <SimpleDatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split("T")[0] : null)}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Espacement conservé sans les champs de vérification */}
                </div>

                <FormField
                  control={form.control}
                  name="commentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commentaire</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes additionnelles sur le client" 
                          className="resize-none" 
                          {...field} 
                          value={field.value || ""} 
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            {/* Tab: Source */}
            <TabsContent value="source">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        {isProduction ? (
                          <SimpleSelect 
                            options={sourceOptions} 
                            value={field.value || ""} 
                            onChange={field.onChange} 
                            placeholder="Sélectionner une source" 
                            disabled={isViewMode}
                          />
                        ) : (
                          <ProductionSafeSelect
                            options={sourceOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Sélectionner une source"
                            disabled={isViewMode}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="codeVendeur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code vendeur</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="FR12345678" 
                          {...field} 
                          value={field.value || ""} 
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
            >
              Annuler
            </Button>
            {isViewMode ? (
              <Button
                type="button"
                onClick={() => setIsViewMode(false)}
                className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                Modifier
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
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
        className="w-full max-w-3xl"
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