import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimCard, Client } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, ArrowLeft, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SimCardFormProps = {
  isOpen: boolean;
  onClose: () => void;
  simCard?: SimCard;
};

// Schéma de validation pour le formulaire
const simCardSchema = z.object({
  codeVendeur: z
    .string()
    .optional()  // Rendre le code vendeur optionnel
    .default(""), // Valeur par défaut vide
  numero: z
    .string()
    .min(19, "Le numéro doit contenir 19 chiffres")
    .max(19, "Le numéro doit contenir 19 chiffres")
    .regex(/^893315022201\d{7}$/, "Le numéro doit commencer par 893315022201 suivi de 7 chiffres"),
  statut: z.string().optional(),
  clientId: z.number().optional().nullable(),
  dateInstallation: z.string().optional(),
  identifiantContrat: z.string().optional(),
}).superRefine((data, ctx) => {
  // Si tous les champs obligatoires sont remplis, la date d'installation devient obligatoire
  if (data.codeVendeur && data.statut === "Activé" && data.clientId && !data.dateInstallation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La date d'installation est obligatoire quand une carte SIM est attribuée à un client",
      path: ["dateInstallation"]
    });
  }
  
  // Si la date d'installation est renseignée, l'identifiant contrat devient obligatoire
  if (data.dateInstallation && !data.identifiantContrat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "L'identifiant contrat est obligatoire quand la date d'installation est renseignée",
      path: ["identifiantContrat"]
    });
  }
});

type FormValues = z.infer<typeof simCardSchema>;

export function SimCardForm({ isOpen, onClose, simCard }: SimCardFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickActionLoading, setIsQuickActionLoading] = useState(false);

  // État pour la recherche de client
  const [clientSearch, setClientSearch] = useState("");

  // Fonctions d'attribution bidirectionnelle
  const handleQuickAssign = async (simCardId: number, clientId: number) => {
    setIsQuickActionLoading(true);
    try {
      await apiRequest("POST", `/api/sim-cards/${simCardId}/assign-client`, { clientId });
      toast({
        title: "Attribution réussie",
        description: "La carte SIM a été attribuée au client avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'attribution",
        variant: "destructive",
      });
    } finally {
      setIsQuickActionLoading(false);
    }
  };

  const handleQuickUnassign = async (simCardId: number) => {
    setIsQuickActionLoading(true);
    try {
      await apiRequest("POST", `/api/sim-cards/${simCardId}/unassign-client`);
      toast({
        title: "Libération réussie",
        description: "La carte SIM a été libérée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la libération",
        variant: "destructive",
      });
    } finally {
      setIsQuickActionLoading(false);
    }
  };

  const handleQuickReassign = async (simCardId: number, newClientId: number) => {
    setIsQuickActionLoading(true);
    try {
      await apiRequest("POST", `/api/sim-cards/${simCardId}/reassign-client`, { newClientId });
      toast({
        title: "Réattribution réussie",
        description: "La carte SIM a été réattribuée au nouveau client avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la réattribution",
        variant: "destructive",
      });
    } finally {
      setIsQuickActionLoading(false);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(simCardSchema),
    defaultValues: {
      codeVendeur: simCard?.codeVendeur || "",
      numero: simCard?.numero || "893315022201",
      statut: simCard?.statut || "disponible",
      clientId: simCard?.clientId || null,
      dateInstallation: simCard?.dateInstallation ? new Date(simCard.dateInstallation).toISOString().split('T')[0] : "",
      identifiantContrat: simCard?.identifiantContrat || "",
    },
  });

  // Observer les champs du formulaire
  const codeVendeur = form.watch("codeVendeur");
  const statut = form.watch("statut");
  const clientId = form.watch("clientId");
  const dateInstallation = form.watch("dateInstallation");
  
  // Déterminer si le champ date d'installation doit être affiché
  const shouldShowDateInstallation = codeVendeur && statut === "Activé" && clientId;
  
  // Déterminer si le champ identifiant contrat doit être affiché
  const shouldShowIdentifiantContrat = dateInstallation;
  
  // Récupérer les données du client assigné pour pré-remplir l'identifiant contrat
  const { data: assignedClient } = useQuery({
    queryKey: ["/api/clients", simCard?.clientId],
    queryFn: async () => {
      if (!simCard?.clientId) return null;
      const response = await apiRequest("GET", `/api/clients/${simCard.clientId}`);
      return await response.json();
    },
    enabled: !!simCard?.clientId && isOpen,
  });

  // Effet pour pré-remplir l'identifiant contrat quand un client est assigné
  useEffect(() => {
    // Vérifier les deux formats possibles : camelCase et snake_case
    const identifiantContrat = assignedClient?.identifiantContrat || assignedClient?.identifiant_contrat;
    
    if (identifiantContrat && isOpen) {
      form.setValue("identifiantContrat", identifiantContrat);
    }
  }, [assignedClient, form, isOpen]);

  // Récupérer la liste des clients du vendeur sélectionné
  const { data: vendorClients } = useQuery<Client[]>({
    queryKey: ["/api/clients/by-vendor", codeVendeur],
    queryFn: async () => {
      if (!codeVendeur) return [];
      const res = await apiRequest("GET", `/api/clients/by-vendor/${codeVendeur}`);
      return res.json();
    },
    enabled: isOpen && !!codeVendeur,
  });
  
  // Récupérer la liste complète des clients pour le select (fallback)
  const { data: allClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      const data = await res.json();
      return data;
    },
    enabled: isOpen,
  });

  // Utiliser les clients du vendeur si disponibles, sinon tous les clients
  const clientsToShow = vendorClients && vendorClients.length > 0 ? vendorClients : allClients;
  
  // Filtrer les clients selon la recherche
  const filteredClients = clientsToShow?.filter(client => {
    if (!clientSearch) return true;
    const searchLower = clientSearch.toLowerCase();
    const fullName = `${client.prenom || ''} ${client.nom || ''}`.toLowerCase();
    return fullName.includes(searchLower) || 
           (client.email && client.email.toLowerCase().includes(searchLower));
  }) || [];

  // Réinitialiser le formulaire lorsque la carte SIM change
  useEffect(() => {
    if (isOpen && simCard) {
      form.reset({
        codeVendeur: simCard?.codeVendeur || "",
        numero: simCard?.numero || "893315022201",
        statut: simCard?.statut || "disponible",
        clientId: simCard?.clientId || null,
        dateInstallation: simCard?.dateInstallation ? new Date(simCard.dateInstallation).toISOString().split('T')[0] : "",
        identifiantContrat: "", // Sera rempli par l'effet suivant quand les données client arrivent
      });
    }
  }, [isOpen, simCard, form]);

  useEffect(() => {
    // Si le statut change pour disponible, réinitialiser le client
    if (statut === "disponible") {
      form.setValue("clientId", null);
    }
  }, [statut, form]);

  // Effet pour mettre à jour automatiquement le code vendeur quand un client est sélectionné
  useEffect(() => {
    if (clientId && allClients) {
      const selectedClient = allClients.find(client => client.id === clientId);
      if (selectedClient && selectedClient.codeVendeur) {
        form.setValue("codeVendeur", selectedClient.codeVendeur);
        console.log(`✅ Code vendeur automatiquement attribué: ${selectedClient.codeVendeur} pour le client ${selectedClient.prenom} ${selectedClient.nom}`);
      }
    }
  }, [clientId, allClients, form]);



  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (simCard) {
        // Mise à jour - inclure tous les champs, la route côté serveur gère la mise à jour client
        const res = await apiRequest("PUT", `/api/sim-cards/${simCard.id}`, data);
        return res.json();
      } else {
        // Création - retirer les champs spécifiques au client pour les nouvelles cartes
        const { dateInstallation, identifiantContrat, ...simCardData } = data;
        const res = await apiRequest("POST", "/api/sim-cards", simCardData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Invalider aussi les clients par vendeur si un code vendeur est présent
      const codeVendeur = form.getValues("codeVendeur");
      if (codeVendeur) {
        queryClient.invalidateQueries({ queryKey: ["/api/clients/by-vendor", codeVendeur] });
      }
      
      toast({
        title: simCard ? "Carte SIM mise à jour" : "Carte SIM créée",
        description: simCard ? "La carte SIM a été mise à jour avec succès." : "La carte SIM a été créée avec succès.",
      });
      
      onClose();
      setIsSubmitting(false);
      form.reset({
        codeVendeur: "V1001",
        numero: "893315022201",
        statut: "disponible",
        clientId: null,
      });
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-0 shadow-2xl mx-auto" hideCloseButton={true}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-lg -z-10"></div>
        
        <DialogHeader className="relative">
          {/* Header mobile avec bouton retour */}
          <div className="flex items-center justify-between py-2 md:py-0 md:block">
            {/* Bouton retour visible uniquement sur mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 md:hidden p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Retour</span>
            </Button>

            {/* Titre centré */}
            <div className="text-center flex-1 md:block">
              <DialogTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1 md:mb-2">
                {simCard ? "Modifier la carte SIM" : "Ajouter une carte SIM"}
              </DialogTitle>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                {simCard ? "Modifiez les informations de votre carte SIM" : "Ajoutez une nouvelle carte SIM à votre inventaire"}
              </p>
            </div>

            {/* Espace pour équilibrer sur mobile */}
            <div className="w-16 md:hidden"></div>
          </div>
          
          {/* Bouton fermer visible uniquement sur desktop */}
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-2 rounded-full bg-white/80 hover:bg-white/90 shadow-lg transition-all duration-200 hover:scale-105 hidden md:block"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative">
            {/* Champ Numéro */}
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Numéro de la carte SIM
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="893315022201XXXXXXX" 
                      className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-white/80 dark:focus:bg-slate-800/80"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ Code Vendeur */}
            <FormField
              control={form.control}
              name="codeVendeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Code Vendeur (optionnel)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="FR98445061" 
                      className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-white/80 dark:focus:bg-slate-800/80"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Champ Statut */}
            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Statut
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || "disponible"}
                  >
                    <FormControl>
                      <SelectTrigger className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-white/80 dark:focus:bg-slate-800/80">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/20 shadow-2xl rounded-xl">
                      <SelectItem value="disponible" className="hover:bg-blue-50/80 dark:hover:bg-blue-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Disponible
                        </div>
                      </SelectItem>
                      <SelectItem value="Activé" className="hover:bg-purple-50/80 dark:hover:bg-purple-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Activé
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ Client - Affiché uniquement si statut = Activé */}
            {statut === "Activé" && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Client assigné
                      {vendorClients && vendorClients.length > 0 && (
                        <span className="text-xs text-blue-600 ml-2 bg-blue-50 px-2 py-1 rounded-full">
                          {vendorClients.length} client{vendorClients.length > 1 ? 's' : ''} trouvé{vendorClients.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </FormLabel>
                    <div className="space-y-3">
                      <Input
                        placeholder="Rechercher un client..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-white/80 dark:focus:bg-slate-800/80"
                      />
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-white/80 dark:focus:bg-slate-800/80">
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/20 shadow-2xl rounded-xl max-h-60">
                          {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()} className="hover:bg-blue-50/80 dark:hover:bg-blue-900/30 rounded-lg">
                                <div className="flex flex-col py-1">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {client.prenom && client.nom 
                                      ? `${client.prenom} ${client.nom}` 
                                      : `Client #${client.id}`}
                                  </span>
                                  {client.email && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {client.email}
                                    </span>
                                  )}
                                  {client.codeVendeur && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded mt-1 inline-block">
                                      Code: {client.codeVendeur}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-results" disabled className="text-slate-500">
                              {codeVendeur ? `Aucun client trouvé pour le vendeur ${codeVendeur}` : 'Aucun client trouvé'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Champ Date d'installation - affiché conditionnellement */}
            {shouldShowDateInstallation && (
              <FormField
                control={form.control}
                name="dateInstallation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Date d'installation *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="backdrop-blur-sm bg-red-50/70 dark:bg-red-900/20 border-red-200/50 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-red-50/80 dark:focus:bg-red-900/30 focus:border-red-400"
                        placeholder="Sélectionner une date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Champ Identifiant contrat - affiché quand date d'installation est renseignée */}
            {shouldShowIdentifiantContrat && (
              <FormField
                control={form.control}
                name="identifiantContrat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Identifiant contrat *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="backdrop-blur-sm bg-orange-50/70 dark:bg-orange-900/20 border-orange-200/50 shadow-lg rounded-xl transition-all duration-200 focus:shadow-xl focus:bg-orange-50/80 dark:focus:bg-orange-900/30 focus:border-orange-400"
                        placeholder="Saisir l'identifiant du contrat"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}


            
            {/* Actions d'attribution bidirectionnelle */}
            {simCard && (
              <div className="mt-4 p-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Actions rapides
                </h4>
                <div className="flex flex-col gap-2">
                  {simCard.statut === "disponible" && !simCard.clientId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Logique pour attribuer rapidement à un client
                        const clientId = form.getValues("clientId");
                        if (clientId) {
                          handleQuickAssign(simCard.id, clientId);
                        }
                      }}
                      disabled={!form.getValues("clientId") || isQuickActionLoading}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Attribuer au client sélectionné
                    </Button>
                  )}
                  
                  {simCard.clientId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickUnassign(simCard.id)}
                      disabled={isQuickActionLoading}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Libérer la carte SIM
                    </Button>
                  )}
                  
                  {simCard.clientId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newClientId = form.getValues("clientId");
                        if (newClientId && newClientId !== simCard.clientId) {
                          handleQuickReassign(simCard.id, newClientId);
                        }
                      }}
                      disabled={!form.getValues("clientId") || form.getValues("clientId") === simCard.clientId || isQuickActionLoading}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Réattribuer au client sélectionné
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action unifiés */}
            <div className="pt-6 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto backdrop-blur-sm bg-slate-50/70 dark:bg-slate-800/70 border-slate-200/50 shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl hover:bg-slate-50/90 dark:hover:bg-slate-800/90 hover:border-slate-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {simCard ? "Mettre à jour" : "Créer la carte SIM"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}