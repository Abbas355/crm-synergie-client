import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";
import { PostalCodeAutocomplete } from "@/components/postal-code-autocomplete";
import { TabsSimple } from "@/components/tabs-simple";
import { SimCard } from "@shared/schema";
import { SimCardPickerModal } from "./sim-card-picker-modal";
import { getSourcesForSelect, normalizeSourceValue } from "@shared/sources";
import { formatDateForDisplay } from "@/utils/dateUtils";

// Fonction utilitaire pour formater les dates pour les inputs HTML
function formatDateForInput(dateValue: any): string {
  if (!dateValue) return "";
  
  try {
    // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Si c'est un format avec heure (YYYY-MM-DD HH:mm:ss)
    if (typeof dateValue === 'string' && dateValue.includes(' ')) {
      return dateValue.split(' ')[0];
    }
    
    // Si c'est un format ISO (YYYY-MM-DDTHH:mm:ss)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    // Si c'est un objet Date ou une chaîne, créer un objet Date et formater
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return "";
  } catch (error) {
    console.log("Erreur formatage date:", error, "pour valeur:", dateValue);
    return "";
  }
}

// Schéma de validation ultra-permissif pour l'édition - Tous les champs sont optionnels ou avec valeurs par défaut
const editClientFormSchema = z.object({
  // ÉTAPE PERSONNEL - Tous optionnels avec gestion des valeurs vides
  civilite: z.string().optional().or(z.literal("")),
  prenom: z.string().optional().or(z.literal("")),
  nom: z.string().optional().or(z.literal("")),
  email: z.union([z.string().email(), z.literal(""), z.string().optional()]).optional(),
  telephone: z.string().optional().or(z.literal("")),
  dateNaissance: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  
  // ÉTAPE ADRESSE - Tous optionnels
  adresse: z.string().optional().or(z.literal("")),
  codePostal: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  ville: z.string().optional().or(z.literal("")),
  
  // ÉTAPE CONTRAT - Tous optionnels
  status: z.string().optional().or(z.literal("")),
  produit: z.string().optional().or(z.literal("")),
  identifiantContrat: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  dateSignature: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  dateRendezVous: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  dateInstallation: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  commentaire: z.string().optional().or(z.literal("")),
  codeVendeur: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  portabilite: z.string().optional().or(z.literal("")),
  carteSim: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  numeroPorter: z.string().optional().or(z.literal("")), // Nom correct pour serveur
  
  // ÉTAPE SOURCE - Tous optionnels
  source: z.string().optional().or(z.literal("")),
  clientRecommandation: z.number().optional().or(z.null()),
  prospectCivilite: z.string().optional().or(z.literal("")),
  prospectPrenom: z.string().optional().or(z.literal("")),
  prospectNom: z.string().optional().or(z.literal("")),
  prospectMobile: z.string().optional().or(z.literal("")),
  prospectCodePostal: z.string().optional().or(z.literal("")),
  prospectVille: z.string().optional().or(z.literal("")),
  
  // Champs cachés - Tous optionnels avec valeurs par défaut
  mandatSepa: z.boolean().optional(),
  contratSigne: z.boolean().optional(), // Nom correct pour serveur
  bonCommande: z.boolean().optional(), // Nom correct pour serveur
  ribClient: z.boolean().optional(), // Nom correct pour serveur
  copiePieceIdentite: z.boolean().optional(), // Nom correct pour serveur
  attestationHonneur: z.boolean().optional(), // Nom correct pour serveur
  attestationFormation: z.boolean().optional(), // Nom correct pour serveur
}).passthrough(); // Accepte tous les champs supplémentaires

export type EditClientFormValues = z.infer<typeof editClientFormSchema>;

type EditClientFormProps = {
  defaultValues?: Partial<EditClientFormValues>;
  onSubmit: (values: EditClientFormValues) => void;
  isSubmitting?: boolean;
  clientId?: number;
};

export function ClientFormEditMobile({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  clientId,
}: EditClientFormProps) {
  const [activeTab, setActiveTab] = useState("personnel");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [isSimCardPickerOpen, setIsSimCardPickerOpen] = useState(false);
  
  const { toast } = useToast();
  const { getUserRole } = useRole();
  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const queryClient = useQueryClient();

  // ✅ DÉBOGAGE CRITIQUE: Afficher les defaultValues reçues
  console.log("🚨 DEBUG DEFAULTVALUES REÇUES:", {
    defaultValues,
    dateNaissance: defaultValues?.dateNaissance,
    dateSignature: defaultValues?.dateSignature,
    dateSignatureFormatted: defaultValues?.dateSignature ? formatDateForInput(defaultValues.dateSignature) : "",
    source: defaultValues?.source,
    hasDefaultValues: !!defaultValues,
    keys: defaultValues ? Object.keys(defaultValues) : []
  });

  // Récupérer les cartes SIM disponibles
  const { data: allAvailableSimCards = [] } = useQuery<SimCard[]>({
    queryKey: ["/api/sim-cards/available", clientId],
    staleTime: 0,
    gcTime: 0,
  });

  console.log('🔍 CARTES SIM DEBUG:', {
    totalCartes: allAvailableSimCards.length,
    cartesDisponibles: allAvailableSimCards.map(c => c.numero),
    carteActuelle: defaultValues?.carteSim,
    produit: defaultValues?.produit
  });

  // Créer la liste complète des cartes SIM pour le sélecteur
  const getAllSimCardsForSelect = () => {
    let allOptions = [...allAvailableSimCards];
    
    // Si le client a une carte SIM et un forfait, l'ajouter en premier
    if (defaultValues?.carteSim && defaultValues.produit?.includes('Forfait')) {
      const currentCardExists = allAvailableSimCards.some(card => card.numero === defaultValues.carteSim);
      
      if (!currentCardExists) {
        allOptions.unshift({
          id: 'current',
          numero: defaultValues.carteSim,
          statut: 'affecte',
          clientId: defaultValues.id || null,
          codeVendeur: '',
          dateAttribution: null,
          note: null,
          userId: 1,
          createdAt: new Date().toISOString(),
          dateActivation: null,
          dateInstallation: null
        });
      }
    }
    
    return allOptions;
  };

  const simCardsForSelect = getAllSimCardsForSelect();

  console.log('🎯 SÉLECTEUR CARTES SIM:', {
    simCardsForSelect: simCardsForSelect.length,
    cartes: simCardsForSelect.map(c => c.numero),
    carteActuelle: defaultValues?.carteSim,
    produitType: defaultValues?.produit
  });

  // ✅ CORRECTION BUG CRITIQUE: Utiliser les vraies valeurs du client
  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientFormSchema),
    defaultValues: {
      civilite: defaultValues?.civilite || "",
      prenom: defaultValues?.prenom || "",
      nom: defaultValues?.nom || "",
      email: defaultValues?.email || "",
      telephone: defaultValues?.telephone || "",
      dateNaissance: defaultValues?.dateNaissance ? (defaultValues.dateNaissance.includes('/') ? defaultValues.dateNaissance : formatDateForDisplay(defaultValues.dateNaissance)) : "", // Format français pour DateNaissanceInput
      adresse: defaultValues?.adresse || "",
      codePostal: defaultValues?.codePostal || "",
      ville: defaultValues?.ville || "",
      status: defaultValues?.status || "",
      produit: defaultValues?.produit || "",
      identifiantContrat: defaultValues?.identifiantContrat || "",
      dateSignature: defaultValues?.dateSignature ? formatDateForInput(defaultValues.dateSignature) : "",
      dateRendezVous: defaultValues?.dateRendezVous ? formatDateForInput(defaultValues.dateRendezVous) : "",
      dateInstallation: defaultValues?.dateInstallation ? formatDateForInput(defaultValues.dateInstallation) : "",
      commentaire: defaultValues?.commentaire || "",
      codeVendeur: defaultValues?.codeVendeur || "",
      portabilite: defaultValues?.portabilite || "",
      carteSim: defaultValues?.carteSim || "",
      numeroPorter: defaultValues?.numeroPorter || "",
      source: defaultValues?.source ? normalizeSourceValue(defaultValues.source) : "prospection", // ✅ CORRECTION: Normaliser source legacy
      clientRecommandation: defaultValues?.clientRecommandation || undefined,
      prospectCivilite: defaultValues?.prospectCivilite || "",
      prospectPrenom: defaultValues?.prospectPrenom || "",
      prospectNom: defaultValues?.prospectNom || "",
      prospectMobile: defaultValues?.prospectMobile || "",
      prospectCodePostal: defaultValues?.prospectCodePostal || "",
      prospectVille: defaultValues?.prospectVille || "",
      mandatSepa: defaultValues?.mandatSepa || false,
      contratSigne: defaultValues?.contratSigne || false,
      bonCommande: defaultValues?.bonCommande || false,
      ribClient: defaultValues?.ribClient || false,
      copiePieceIdentite: defaultValues?.copiePieceIdentite || false,
      attestationHonneur: defaultValues?.attestationHonneur || false,
      attestationFormation: defaultValues?.attestationFormation || false
    },
  });

  // ✅ SOLUTION FINALE BUG PRÉ-REMPLISSAGE : Forcer reset complet avec trigger
  useEffect(() => {
    if (defaultValues) {
      console.log("🔄 FORCE RESET - Mise à jour du formulaire:", defaultValues);
      console.log("🔍 VALEURS CRITIQUES:", {
        dateNaissance: defaultValues.dateNaissance,
        source: defaultValues.source,
        identifiantContrat: defaultValues.identifiantContrat,
        codePostal: defaultValues.codePostal
      });
      
      // ✅ SOLUTION : reset complet avec toutes les valeurs + trigger validation
      const resetValues = {
        civilite: defaultValues.civilite || "",
        prenom: defaultValues.prenom || "",
        nom: defaultValues.nom || "",
        email: defaultValues.email || "",
        telephone: defaultValues.telephone || "",
        dateNaissance: defaultValues.dateNaissance ? (defaultValues.dateNaissance.includes('/') ? defaultValues.dateNaissance : formatDateForDisplay(defaultValues.dateNaissance)) : "",
        adresse: defaultValues.adresse || "",
        codePostal: defaultValues.codePostal || "", // Nom correct pour serveur
        ville: defaultValues.ville || "",
        status: defaultValues.status || "",
        produit: defaultValues.produit || "",
        identifiantContrat: defaultValues.identifiantContrat || "", // Nom correct pour serveur
        dateSignature: defaultValues.dateSignature ? formatDateForInput(defaultValues.dateSignature) : "", // Nom correct pour serveur
        dateRendezVous: defaultValues.dateRendezVous ? formatDateForInput(defaultValues.dateRendezVous) : "", // Nom correct pour serveur
        dateInstallation: defaultValues.dateInstallation ? formatDateForInput(defaultValues.dateInstallation) : "", // Nom correct pour serveur
        commentaire: defaultValues.commentaire || "",
        codeVendeur: defaultValues.codeVendeur || "", // Nom correct pour serveur
        portabilite: defaultValues.portabilite || "",
        carteSim: String(defaultValues.carteSim || ""), // Nom correct pour serveur
        numeroPorter: defaultValues.numeroPorter || "", // Nom correct pour serveur
        source: defaultValues.source ? normalizeSourceValue(defaultValues.source) : "prospection", // ✅ CORRECTION: Normaliser source legacy
        clientRecommandation: defaultValues.clientRecommandation || undefined,
        prospectCivilite: defaultValues.prospectCivilite || "",
        prospectPrenom: defaultValues.prospectPrenom || "",
        prospectNom: defaultValues.prospectNom || "",
        prospectMobile: defaultValues.prospectMobile || "",
        prospectCodePostal: defaultValues.prospectCodePostal || "",
        prospectVille: defaultValues.prospectVille || "",
        mandatSepa: defaultValues.mandatSepa || false,
        contratSigne: defaultValues.contratSigne || false, // Nom correct pour serveur
        bonCommande: defaultValues.bonCommande || false, // Nom correct pour serveur
        ribClient: defaultValues.ribClient || false, // Nom correct pour serveur
        copiePieceIdentite: defaultValues.copiePieceIdentite || false, // Nom correct pour serveur
        attestationHonneur: defaultValues.attestationHonneur || false, // Nom correct pour serveur
        attestationFormation: defaultValues.attestationFormation || false, // Nom correct pour serveur
      };
      
      // ✅ SOLUTION FINALE : Reset complet du formulaire avec trigger
      form.reset(resetValues);
      
      // Force setValue pour les champs critiques
      if (defaultValues.dateNaissance) {
        form.setValue("dateNaissance", defaultValues.dateNaissance, { shouldValidate: true });
        console.log("✅ Force setValue dateNaissance:", defaultValues.dateNaissance);
      }
      if (defaultValues.source) {
        const normalizedSource = normalizeSourceValue(defaultValues.source);
        form.setValue("source", normalizedSource, { shouldValidate: true });
        console.log("✅ Force setValue source:", defaultValues.source, "→", normalizedSource);
      }
      if (defaultValues.identifiantContrat) {
        form.setValue("identifiantContrat", defaultValues.identifiantContrat, { shouldValidate: true });
        console.log("✅ Force setValue identifiantContrat:", defaultValues.identifiantContrat);
      }
      if (defaultValues.codePostal) {
        form.setValue("codePostal", defaultValues.codePostal, { shouldValidate: true });
        console.log("✅ Force setValue codePostal:", defaultValues.codePostal);
      }
      
      console.log("✅ RESET COMPLET FORMULAIRE TERMINÉ");
    }
  }, [defaultValues, form]);

  // Suivre le statut sans déclencher de re-validation
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "status" && value.status) {
        setCurrentStatus(value.status);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Initialiser le statut au chargement
  useEffect(() => {
    if (defaultValues?.status) {
      setCurrentStatus(defaultValues.status);
    }
  }, [defaultValues?.status]);

  // Configuration des onglets
  const tabs = [
    { id: "personnel", label: "Personnel", icon: "👤" },
    { id: "adresse", label: "Adresse", icon: "📍" },
    { id: "contrat", label: "Contrat", icon: "📋" },
    { id: "source", label: "Source", icon: "🎯" }
  ];

  // Supprimer l'ancien useEffect qui entre en conflit avec useQuery

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

  // Fonction de soumission du formulaire
  const handleSubmit = (data: EditClientFormValues) => {
    console.log("🔥 Soumission formulaire édition mobile:", data);
    console.log("🔍 Erreurs de validation:", form.formState.errors);
    console.log("🔍 État du formulaire:", {
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      isDirty: form.formState.isDirty
    });
    
    // 🚨 CORRECTION BUG : Conversion date française vers ISO avant envoi
    const processedData = { ...data };
    if (data.dateNaissance && data.dateNaissance.includes('/')) {
      const isoDate = convertFrenchDateToISO(data.dateNaissance);
      processedData.dateNaissance = isoDate;
      console.log(`🔄 Conversion dateNaissance: ${data.dateNaissance} → ${isoDate}`);
    }
    
    onSubmit(processedData);
  };

  // Debug: afficher les erreurs en temps réel
  const errors = form.formState.errors;
  if (Object.keys(errors).length > 0) {
    console.log("🚨 Erreurs de validation en temps réel:", errors);
  }

  // Rendu de l'onglet Personnel
  const renderPersonnelTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="civilite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Civilité <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
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
              <FormLabel>Prénom <span className="text-red-500">*</span></FormLabel>
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
              <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
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
              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
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
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="0123456789" {...field} value={field.value || ""} />
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
              <FormLabel>Date de naissance <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <DateNaissanceInput 
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Rendu de l'onglet Adresse
  const renderAdresseTab = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="adresse"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresse <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Adresse complète" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="codePostal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code postal <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <PostalCodeAutocomplete
                  value={field.value || ""}
                  onChange={(value) => field.onChange(value)}
                  onCitySelect={(city) => form.setValue("ville", city)}
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
              <FormLabel>Ville <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Ville" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Rendu de l'onglet Contrat
  const renderContratTab = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="produit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Produit <span className="text-red-500">*</span></FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                
                // AMÉLIORATION: Si Forfait 5G + statut Installation = auto-remplir date installation avec date signature
                if (value === "Forfait 5G") {
                  const statut = form.getValues("status");
                  if (statut === "installation") {
                    const dateSignature = form.getValues("dateSignature");
                    if (dateSignature && dateSignature.trim() !== "") {
                      form.setValue("dateInstallation", dateSignature);
                    }
                  }
                }
              }} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Freebox Ultra">Freebox Ultra (6 points)</SelectItem>
                <SelectItem value="Freebox Essentiel">Freebox Essentiel (5 points)</SelectItem>
                <SelectItem value="Freebox Pop">Freebox Pop (4 points)</SelectItem>
                <SelectItem value="Forfait 5G">Forfait 5G (1 point)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Champs spécifiques pour le forfait 5G */}
      {form.watch("produit") === "Forfait 5G" && (
        <>
          <FormField
            control={form.control}
            name="portabilite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portabilité</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    
                    // AMÉLIORATION: Si "Oui", pré-remplir avec le numéro de téléphone saisi
                    if (value === "oui") {
                      const phoneNumber = form.getValues("telephone");
                      if (phoneNumber && phoneNumber.trim() !== "") {
                        form.setValue("numeroPorter", phoneNumber);
                      }
                    } else {
                      // Si "Non", vider le champ numéro à porter
                      form.setValue("numeroPorter", "");
                    }
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Portabilité demandée ?" />
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

          {form.watch("portabilite") === "oui" && (
            <FormField
              control={form.control}
              name="numeroPorter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro à porter</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0123456789" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="carteSim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carte SIM</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    {field.value ? (
                      // Carte SIM déjà attribuée - Affichage en lecture seule avec badge de confirmation
                      <div className="space-y-2">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-800">
                                Carte SIM attribuée définitivement
                              </span>
                            </div>
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-mono">
                              {field.value}
                            </div>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Cette attribution est définitive et conforme aux exigences légales de traçabilité.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSimCardPickerOpen(true)}
                          className="text-blue-600 hover:text-blue-700 border-blue-200"
                        >
                          Modifier (réattribuer)
                        </Button>
                      </div>
                    ) : (
                      // Aucune carte SIM - Affichage normal pour sélection
                      <div className="flex gap-2">
                        <Input
                          placeholder="Aucune carte SIM sélectionnée"
                          value=""
                          readOnly
                          className="flex-1 bg-gray-50 cursor-pointer"
                          onClick={() => setIsSimCardPickerOpen(true)}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setIsSimCardPickerOpen(true)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0"
                        >
                          Sélectionner
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={form.control}
        name="identifiantContrat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identifiant contrat</FormLabel>
            <FormControl>
              <Input placeholder="Identifiant du contrat" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Champ Statut: placé AVANT les dates pour clarifier la logique */}
      {isAdmin && (
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  
                  // Réinitialiser les dates qui ne correspondent pas au nouveau statut
                  if (value !== "rendezvous") {
                    form.setValue("dateRendezVous", "");
                  }
                  if (value !== "installation") {
                    form.setValue("dateInstallation", "");
                  }
                  
                  // AMÉLIORATION: Pour Forfait 5G + statut Installation = auto-remplir date installation avec date signature
                  if (value === "installation") {
                    const produit = form.getValues("produit");
                    if (produit === "Forfait 5G") {
                      const dateSignature = form.getValues("dateSignature");
                      if (dateSignature && dateSignature.trim() !== "") {
                        form.setValue("dateInstallation", dateSignature);
                      }
                    }
                  }
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="enregistre">Enregistré</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="valide-7-jours">Validé 7 jours</SelectItem>
                  <SelectItem value="rendez-vous">Rendez-vous</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="post-production">Post-production</SelectItem>
                  <SelectItem value="resiliation">Résiliation</SelectItem>
                  <SelectItem value="abandonne">Abandonné</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                Le choix du statut détermine quelles dates sont nécessaires
              </p>
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="dateSignature"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de signature <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input
                type="date"
                placeholder="JJ/MM/AAAA"
                value={field.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value);
                  
                  // AMÉLIORATION: Auto-remplir date installation si Forfait 5G + statut Installation
                  const produit = form.getValues("produit");
                  const statut = form.getValues("status");
                  if (produit === "Forfait 5G" && statut === "installation") {
                    if (value && value.trim() !== "") {
                      form.setValue("dateInstallation", value);
                    }
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date rendez-vous - conditionnelle selon statut */}
      {currentStatus === "rendez-vous" && (
        <FormField
          control={form.control}
          name="dateRendezVous"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de rendez-vous <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="JJ/MM/AAAA"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                Obligatoire pour le statut "Rendez-vous"
              </p>
            </FormItem>
          )}
        />
      )}

      {/* Date installation - conditionnelle selon statut */}
      {currentStatus === "installation" && (
        <FormField
          control={form.control}
          name="dateInstallation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date d'installation <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="JJ/MM/AAAA"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                Obligatoire pour le statut "Installation"
              </p>
            </FormItem>
          )}
        />
      )}

      {/* Section administrative pour les autres champs */}

      <FormField
        control={form.control}
        name="commentaire"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commentaire</FormLabel>
            <FormControl>
              <Textarea placeholder="Commentaires additionnels..." {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // Rendu de l'onglet Source
  const renderSourceTab = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Source</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Comment avez-vous connu le client ?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {getSourcesForSelect().map((sourceOption) => (
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
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          console.log("❌ Erreurs de validation lors de la soumission:", errors);
          toast({
            title: "Erreur de validation",
            description: "Veuillez vérifier les champs requis",
            variant: "destructive",
          });
        })} className="space-y-6">
          {/* Navigation par onglets */}
          <div className="w-full">
            <TabsSimple 
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
          
          {activeTab === "personnel" && renderPersonnelTab()}
          {activeTab === "adresse" && renderAdresseTab()}
          {activeTab === "contrat" && renderContratTab()}
          {activeTab === "source" && renderSourceTab()}
          
          {/* Boutons de navigation et soumission optimisés mobile */}
          <div className="mt-4 sm:mt-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {activeTab !== "personnel" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(t => t.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    className="w-full sm:w-auto h-12 sm:h-10 text-sm font-medium"
                  >
                    ← Précédent
                  </Button>
                )}
                
                {activeTab !== "source" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(t => t.id === activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1].id);
                      }
                    }}
                    className="w-full sm:w-auto h-12 sm:h-10 text-sm font-medium"
                  >
                    Suivant →
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg"
                >
                  {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log("🔄 Fermeture manuelle du formulaire demandée");
                    // Cette fonction sera appelée depuis le parent
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('closeEditForm');
                      window.dispatchEvent(event);
                    }
                  }}
                  className="w-full sm:w-auto h-12 sm:h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Modal de sélection de carte SIM */}
      <SimCardPickerModal
        isOpen={isSimCardPickerOpen}
        selectedSimCard={form.getValues("carteSim") || ""}
        onSelect={async (simCardNumber) => {
          console.log(`🔄 SÉLECTION CARTE SIM: Début du processus pour ${simCardNumber}`);
          
          // Mettre à jour le formulaire immédiatement
          form.setValue("carteSim", simCardNumber);
          console.log(`✅ Formulaire mis à jour avec carte SIM: ${simCardNumber}`);
          
          // Si nous avons un clientId, synchroniser immédiatement avec la base de données
          if (clientId) {
            try {
              console.log(`🔄 SYNCHRONISATION: Envoi requête changement carte SIM client ${clientId}`);
              
              const response = await fetch(`/api/clients/${clientId}/change-sim-card`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache"
                },
                credentials: "include",
                body: JSON.stringify({
                  newSimCardNumber: simCardNumber
                })
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de l'assignation de la carte SIM");
              }

              const result = await response.json();
              console.log(`✅ SYNCHRONISATION RÉUSSIE:`, result);
              
              toast({
                title: "Carte SIM mise à jour",
                description: `La carte SIM ${simCardNumber} a été assignée avec succès`,
              });

              // Invalider les caches pour forcer la synchronisation
              queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
              queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
              
            } catch (error: any) {
              console.error(`❌ ERREUR SYNCHRONISATION:`, error);
              
              // Remettre le formulaire dans l'état précédent en cas d'erreur
              form.setValue("carteSim", defaultValues?.carteSim || "");
              
              toast({
                title: "Erreur",
                description: error.message || "Impossible d'assigner la carte SIM",
                variant: "destructive",
              });
            }
          }
        }}
        onClose={() => setIsSimCardPickerOpen(false)}
      />
    </div>
  );
}