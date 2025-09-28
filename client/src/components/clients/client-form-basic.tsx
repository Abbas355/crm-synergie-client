import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { queryClient } from "@/lib/queryClient";
// FormProgressTracker removed - using inline progress calculation
import { 
  Form, 
  FormControl, 
  FormDescription,
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
import { Card, CardContent } from "@/components/ui/card";
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";
import { PostalCodeAutocomplete } from "@/components/postal-code-autocomplete";
import { TabsSimple } from "@/components/tabs-simple";
import { getSourcesForSelect } from "@shared/sources";

// Définition du schéma de validation avec champs obligatoires marqués
const clientFormSchema = z.object({
  // ÉTAPE PERSONNEL - Champs obligatoires (*)
  civilite: z.string().min(1, "La civilité est requise *"),
  prenom: z.string().min(1, "Le prénom est requis *"),
  nom: z.string().min(1, "Le nom est requis *"),
  email: z.string().email("Email invalide").min(1, "L'email est requis *"),
  telephone: z.string().optional(),
  dateNaissance: z.string().min(1, "La date de naissance est requise *"),
  
  // ÉTAPE ADRESSE - Champs obligatoires (*)
  adresse: z.string().min(1, "L'adresse est requise *"),
  codePostal: z.string().min(5, "Le code postal est requis (5 chiffres) *").max(5),
  ville: z.string().min(1, "La ville est requise *"),
  
  // ÉTAPE CONTRAT - Champs obligatoires (*)
  status: z.string().optional(), // Sera défini automatiquement pour les vendeurs
  produit: z.string().min(1, "Le produit est requis *"),
  identifiantContrat: z.string().optional(), // Optionnel selon le forfait
  dateSignature: z.string().optional(),
  dateRendezVous: z.string().optional(),
  dateInstallation: z.string().optional(),
  commentaire: z.string().optional(),
  codeVendeur: z.string().optional(),
  // Champs pour le forfait 5G
  portabilite: z.string().optional(),
  carteSim: z.string().optional(),
  numeroPorter: z.string().optional(),
  // Champs désormais masqués
  mandatSepa: z.boolean().optional().default(false),
  contratSigne: z.boolean().optional().default(false),
  bonCommande: z.boolean().optional().default(false),
  ribClient: z.boolean().optional().default(false),
  copiePieceIdentite: z.boolean().optional().default(false),
  attestationHonneur: z.boolean().optional().default(false),
  attestationFormation: z.boolean().optional().default(false),
  // Nouveaux champs pour la source
  source: z.string().optional(), // Optionnel maintenant
  typeRecommandation: z.string().optional(),
  clientRecommandation: z.number().optional(),
  // Champs pour le prospect de recommandation - maintenant tous optionnels
  prospectCivilite: z.string().optional(), // Plus requis par défaut
  // Prénom et Nom: au moins un des deux doit être renseigné
  prospectPrenom: z.string().optional(),
  prospectNom: z.string().optional(),
  prospectMobile: z.string().optional(), // Plus requis par défaut
  prospectCodePostal: z.string().optional(), // Plus requis par défaut
  prospectVille: z.string().optional(), // Plus requis par défaut
}).refine(
  (data) => {
    // Si la source est recommandation ET le type est prospect, 
    // on vérifie que au moins prénom OU nom est renseigné
    if (data.source === "recommandation" && data.typeRecommandation === "prospect") {
      // Vérification uniquement si tous les champs ont des valeurs
      const hasAllFields = !!data.prospectCivilite && 
        (!!data.prospectPrenom || !!data.prospectNom) && 
        !!data.prospectMobile && 
        !!data.prospectCodePostal && 
        !!data.prospectVille;
      
      if (hasAllFields) {
        return true; // Si tous sont remplis, c'est valide
      }
      
      // Si au moins un champ est rempli, alors tous doivent être remplis
      const hasAnyField = !!data.prospectCivilite || 
        !!data.prospectPrenom || 
        !!data.prospectNom || 
        !!data.prospectMobile || 
        !!data.prospectCodePostal || 
        !!data.prospectVille;
        
      // Si aucun champ n'est rempli, c'est ok aussi
      return !hasAnyField;
    }
    return true; // Pour les autres sources, pas de vérification
  },
  {
    message: "Si vous remplissez un champ prospect, vous devez tous les remplir",
    path: ["prospectPrenom"], // Afficher l'erreur sur le champ du prénom
  }
);

// Crée un type pour les valeurs du formulaire
export type ClientFormValues = z.infer<typeof clientFormSchema>;

type ClientFormProps = {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
  clientId?: number; // ID du client pour l'édition
};

export function ClientFormBasic({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  isEdit = false,
  clientId,
}: ClientFormProps) {
  const [activeTab, setActiveTab] = useState("personnel");
  const [availableSimCards, setAvailableSimCards] = useState<{id: number, iccid: string}[]>([]);
  const [availableClients, setAvailableClients] = useState<{id: number, nom: string, prenom: string}[]>([]);
  const [showRecommandationFields, setShowRecommandationFields] = useState(false);
  const [typeRecommandation, setTypeRecommandation] = useState("");
  
  const { toast } = useToast();
  const { getUserRole, getUserVendorCode } = useRole();
  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const vendorCode = getUserVendorCode();

  // Fonction pour calculer la progression par étape
  const calculateStepProgress = (step: string, formValues: any) => {
    switch (step) {
      case "personnel":
        // Champs obligatoires de base pour Personnel
        const personalFields = ['civilite', 'prenom', 'nom', 'email', 'dateNaissance'];
        const filledPersonal = personalFields.filter(field => formValues[field] && formValues[field].toString().trim() !== '').length;
        return Math.round((filledPersonal / personalFields.length) * 100);
      
      case "adresse":
        // Champs obligatoires pour Adresse
        const addressFields = ['adresse', 'codePostal', 'ville'];
        const filledAddress = addressFields.filter(field => formValues[field] && formValues[field].toString().trim() !== '').length;
        return Math.round((filledAddress / addressFields.length) * 100);
      
      case "contrat":
        // Calcul dynamique des champs obligatoires selon le contexte
        let contractFields = ['forfaitType'];
        
        // Si forfaitType est sélectionné, ajouter les champs conditionnels
        if (formValues.forfaitType && formValues.forfaitType.trim() !== '') {
          contractFields.push('identifiantContrat');
          
          // Si c'est un forfait 5G, ajouter les champs spécifiques obligatoires
          if (formValues.forfaitType === 'forfait_5g') {
            contractFields.push('portabilite', 'carteSim');
          }
        }
        
        const filledContract = contractFields.filter(field => formValues[field] && formValues[field].toString().trim() !== '').length;
        return Math.round((filledContract / contractFields.length) * 100);
      
      case "source":
        // Calcul dynamique pour Source selon le type de recommandation
        let sourceFields = ['source'];
        
        // Si source est recommandation, ajouter les champs conditionnels
        if (formValues.source === 'recommandation') {
          sourceFields.push('typeRecommandation');
          
          // Si type recommandation est prospect, ajouter les champs prospect obligatoires
          if (formValues.typeRecommandation === 'prospect') {
            sourceFields.push('prospectCivilite', 'prospectPrenom', 'prospectNom', 'prospectMobile', 'prospectCodePostal', 'prospectVille');
          }
          // Si type recommandation est client, ajouter le champ client
          else if (formValues.typeRecommandation === 'client') {
            sourceFields.push('clientRecommandation');
          }
        }
        
        const filledSource = sourceFields.filter(field => {
          const value = formValues[field];
          return value !== undefined && value !== null && value.toString().trim() !== '';
        }).length;
        return Math.round((filledSource / sourceFields.length) * 100);
      
      default:
        return 0;
    }
  };

  // Fonction pour calculer la progression globale
  const calculateGlobalProgress = (formValues: any) => {
    const steps = ["personnel", "adresse", "contrat", "source"];
    const totalProgress = steps.reduce((sum, step) => sum + calculateStepProgress(step, formValues), 0);
    return Math.round(totalProgress / steps.length);
  };

  // Formulaire avec validation Zod
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
      status: "",
      produit: "",
      dateSignature: "",
      dateRendezVous: "",
      dateInstallation: "",
      commentaire: "",
      codeVendeur: "",
      portabilite: "",
      carteSim: "",
      numeroPorter: "",
      mandatSepa: false,
      contratSigne: false,
      bonCommande: false,
      ribClient: false,
      copiePieceIdentite: false,
      attestationHonneur: false,
      source: "prospection",
      typeRecommandation: "",
      clientRecommandation: undefined,
      prospectCivilite: "",
      prospectPrenom: "",
      prospectNom: "",
      prospectMobile: "",
      prospectCodePostal: "",
      prospectVille: "",
      ...defaultValues,
    },
  });
  
  console.log("Formulaire initialisé avec les valeurs par défaut:", form.getValues());

  // Charger les cartes SIM disponibles quand le produit est un forfait 5G
  useEffect(() => {
    const produit = form.watch("produit");
    
    if (produit === "forfait_5g" || produit === "Forfait 5G") {
      const fetchSimCards = async () => {
        try {
          // En mode édition, inclure l'ID du client pour récupérer sa carte SIM actuelle
          const url = clientId 
            ? `/api/sim-cards/available?clientId=${clientId}`
            : '/api/sim-cards/available';
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Impossible de récupérer les cartes SIM disponibles');
          }
          const data = await response.json();
          setAvailableSimCards(data);
        } catch (error) {
          console.error('Erreur lors du chargement des cartes SIM:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les cartes SIM disponibles",
            variant: "destructive",
          });
        }
      };
      
      fetchSimCards();
    }
  }, [form.watch("produit"), toast, clientId]);
  
  // Logging des changements importants du formulaire
  useEffect(() => {
    const source = form.watch("source");
    const typeRecommandation = form.watch("typeRecommandation");
    
    console.log("Formulaire - Source:", source, "Type:", typeRecommandation);
  }, [form.watch("source"), form.watch("typeRecommandation")]);

  // Charger la liste des clients disponibles pour la recommandation
  useEffect(() => {
    const source = form.watch("source");
    const typeRecommandation = form.watch("typeRecommandation");
    
    if (source === "recommandation" && typeRecommandation === "client") {
      const fetchPersonalClients = async () => {
        try {
          const response = await fetch('/api/clients/personal');
          if (!response.ok) {
            throw new Error('Impossible de récupérer la liste des clients personnels');
          }
          const data = await response.json();
          console.log('Clients personnels récupérés:', data.length);
          setAvailableClients(data);
        } catch (error) {
          console.error('Erreur lors du chargement des clients personnels:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger la liste des clients personnels",
            variant: "destructive",
          });
          setAvailableClients([]);
        }
      };
      
      fetchPersonalClients();
    } else {
      // Réinitialiser la liste si pas de recommandation client
      setAvailableClients([]);
    }
  }, [form.watch("source"), form.watch("typeRecommandation"), toast]);
  
  // Effet pour observer les changements de valeurs importantes du formulaire
  useEffect(() => {
    const source = form.watch("source");
    const typeRecommandation = form.watch("typeRecommandation");
    const forfaitType = form.watch("forfaitType");
    
    console.log("Changements détectés:", { source, typeRecommandation, forfaitType });
  }, [form.watch("source"), form.watch("typeRecommandation"), form.watch("forfaitType")]);

  // Définition des onglets
  const tabs = [
    { id: "personnel", label: "Personnel" },
    { id: "adresse", label: "Adresse" },
    { id: "contrat", label: "Contrat" },
    { id: "source", label: "Source" },
  ];

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

  // Gestion de la soumission du formulaire avec validation stricte
  const handleSubmit = async (values: ClientFormValues) => {
    console.log("🚀 handleSubmit appelé avec:", values);
    console.log("🔍 Code vendeur dans les valeurs:", values.codeVendeur);
    console.log("📝 Valeurs complètes du formulaire:", form.getValues());
    
    // 🚨 CORRECTION BUG : Conversion date française vers ISO avant traitement
    const processedValues = { ...values };
    if (values.dateNaissance && values.dateNaissance.includes('/')) {
      const isoDate = convertFrenchDateToISO(values.dateNaissance);
      processedValues.dateNaissance = isoDate;
      console.log(`🔄 Conversion dateNaissance: ${values.dateNaissance} → ${isoDate}`);
    }
    
    // Pour les vendeurs, fixer le statut à "enregistre" s'il n'est pas défini AVANT la validation
    if (!isAdmin && (!processedValues.status || processedValues.status.trim() === '')) {
      processedValues.status = "enregistre";
      console.log("Statut automatiquement défini à 'enregistre' pour le vendeur");
    }
    
    // Pour les vendeurs, ajouter automatiquement leur code vendeur AVANT la validation
    if (!isAdmin && vendorCode) {
      processedValues.codeVendeur = vendorCode;
      console.log("Code vendeur automatiquement ajouté:", vendorCode);
    }
    
    // VALIDATION DES CHAMPS OBLIGATOIRES (simplifiée)
    const requiredFields = [
      { field: 'civilite', label: 'Civilité', section: 'Personnel' },
      { field: 'prenom', label: 'Prénom', section: 'Personnel' },
      { field: 'nom', label: 'Nom', section: 'Personnel' },
      { field: 'email', label: 'Email', section: 'Personnel' },
      { field: 'dateNaissance', label: 'Date de naissance', section: 'Personnel' },
      { field: 'adresse', label: 'Adresse', section: 'Adresse' },
      { field: 'codePostal', label: 'Code postal', section: 'Adresse' },
      { field: 'ville', label: 'Ville', section: 'Adresse' },
      { field: 'produit', label: 'Produit', section: 'Contrat' }
    ];

    const missingFields = requiredFields.filter(req => {
      const value = processedValues[req.field as keyof ClientFormValues];
      return !value || value.toString().trim() === '';
    });

    if (missingFields.length > 0) {
      const missingBySection = missingFields.reduce((acc, field) => {
        if (!acc[field.section]) acc[field.section] = [];
        acc[field.section].push(field.label);
        return acc;
      }, {} as Record<string, string[]>);

      const missingText = Object.entries(missingBySection)
        .map(([section, fields]) => `${section}: ${fields.join(', ')}`)
        .join(' | ');

      toast({
        title: "❌ Formulaire incomplet",
        description: `Champs obligatoires manquants: ${missingText}`,
        variant: "destructive"
      });
      
      // Rediriger vers la première section avec des champs manquants
      const firstMissingSection = Object.keys(missingBySection)[0].toLowerCase();
      const sectionMap: Record<string, string> = {
        'personnel': 'personnel',
        'adresse': 'adresse', 
        'contrat': 'contrat'
      };
      if (sectionMap[firstMissingSection]) {
        setActiveTab(sectionMap[firstMissingSection]);
      }
      
      return; // BLOQUER LA SOUMISSION
    }

    // Ces attributions ont déjà été faites plus tôt dans la fonction

    // Validation spéciale pour le téléphone
    if (processedValues.telephone && processedValues.telephone.length < 10) {
      toast({
        title: "❌ Téléphone invalide",
        description: "Le numéro de téléphone doit contenir au moins 10 chiffres.",
        variant: "destructive"
      });
      setActiveTab("personnel");
      return;
    }

    // Validation spéciale pour le code postal
    if (processedValues.codePostal && processedValues.codePostal.length !== 5) {
      toast({
        title: "❌ Code postal invalide", 
        description: "Le code postal doit contenir exactement 5 chiffres.",
        variant: "destructive"
      });
      setActiveTab("adresse");
      return;
    }
    
    // Log détaillé pour le débogage
    console.log("✅ Validation réussie - Formulaire soumis avec les valeurs:", JSON.stringify(processedValues, null, 2));
    
    try {
      await onSubmit(processedValues);
      
      // Après la sauvegarde réussie, actualiser les données
      console.log("🔄 Actualisation des données après sauvegarde...");
      
      // Invalider tous les caches liés aux clients
      await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      // Si nous sommes en mode édition, recharger spécifiquement les données de ce client
      if (clientId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
        await queryClient.refetchQueries({ queryKey: [`/api/clients/${clientId}`] });
      }
      
      // Recharger la liste générale des clients
      await queryClient.refetchQueries({ queryKey: ["/api/clients"] });
      
      console.log("✅ Données actualisées avec succès");
      
      // Notification de succès avec information sur l'attribution automatique
      if (processedValues.codeVendeur && isAdmin) {
        toast({
          title: "✅ Client sauvegardé",
          description: `Attribution automatique activée avec le code vendeur: ${processedValues.codeVendeur}`,
        });
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
    }
  };

  // Rendu du contenu de l'onglet Personnel
  const renderPersonnelTab = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="civilite"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Civilité <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sélectionner une civilité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">Monsieur</SelectItem>
                      <SelectItem value="Mme">Madame</SelectItem>
                      <SelectItem value="Mlle">Mademoiselle</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Prénom <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Nom <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nom" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="email@exemple.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Téléphone mobile" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateNaissance"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Date de naissance <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <DateNaissanceInput
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Bouton supprimé - utilisation des boutons en bas du formulaire */}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Rendu du contenu de l'onglet Adresse
  const renderAdresseTab = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Adresse <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Numéro et nom de rue" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codePostal"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Code postal <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <PostalCodeAutocomplete
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      onCitySelect={(city) => {
                        form.setValue("ville", city);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ville"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Ville <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ville" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Boutons supprimés - utilisation des boutons en bas du formulaire */}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Rendu du contenu de l'onglet Contrat
  const renderContratTab = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="produit"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Produit <span className="text-red-500">*</span></FormLabel>
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
                        <SelectValue placeholder="Sélectionner un forfait" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Freebox Pop">Freebox Pop</SelectItem>
                      <SelectItem value="Freebox Essentiel">Freebox Essentiel</SelectItem>
                      <SelectItem value="Freebox Ultra">Freebox Ultra</SelectItem>
                      <SelectItem value="Forfait 5G">Forfait 5G</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Identifiant contrat - AFFICHÉ SEULEMENT SI FORFAIT SÉLECTIONNÉ */}
            {form.watch("produit") && (
              <FormField
                control={form.control}
                name="identifiantContrat"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm font-medium">Identifiant contrat <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={form.watch("produit") === "Forfait 5G" ? "12345678" : "FO12345678"} 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          console.log("Identifiant contrat mis à jour (desktop):", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {['Freebox Pop', 'Freebox Essentiel', 'Freebox Ultra'].includes(form.watch("produit") || "") ? 
                        'Format: FO + 8 chiffres' : 
                        form.watch("produit") === 'Forfait 5G' ? 
                        'Format: 8 chiffres' : 
                        'Format: FO + 8 chiffres (ex: FO12345678)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Champs conditionnels pour le forfait 5G */}
            {form.watch("produit") === "Forfait 5G" && (
              <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                <FormField
                  control={form.control}
                  name="portabilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de ligne</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // Si l'utilisateur sélectionne "Portabilité", pré-remplir avec le numéro de téléphone saisi
                          if (value === "portabilite") {
                            const phoneNumber = form.getValues("telephone");
                            if (phoneNumber && phoneNumber.trim() !== "") {
                              form.setValue("numeroPorter", phoneNumber);
                            }
                          } else {
                            // Si ce n'est pas portabilité, vider le champ numéro à porter
                            form.setValue("numeroPorter", "");
                          }
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="portabilite">Portabilité</SelectItem>
                          <SelectItem value="creation">Création</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("portabilite") === "portabilite" && (
                  <FormField
                    control={form.control}
                    name="numeroPorter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro à porter</FormLabel>
                        <FormControl>
                          <Input placeholder="Numéro à porter" {...field} />
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
                      <FormLabel className="text-sm font-medium">Carte SIM <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // Mise à jour du champ carteSim
                          field.onChange(value);
                          
                          // Enregistrons le code vendeur associé à cette carte SIM
                          // pour les vendeurs, nous utilisons automatiquement leur code
                          if (!isAdmin && vendorCode) {
                            console.log("Associant le code vendeur à la carte SIM:", vendorCode);
                            
                            // Nous pourrions également stocker cette information dans le state local
                            // ou dans un champ caché du formulaire si nécessaire
                          }
                        }}
                        value={field.value}
                        disabled={availableSimCards.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              availableSimCards.length === 0 
                                ? "Aucune carte SIM disponible" 
                                : "Sélectionner une carte SIM"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSimCards.map((card) => (
                            <SelectItem key={card.id} value={card.id.toString()}>
                              {card.iccid}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Champ Statut: uniquement pour les administrateurs - PLACÉ EN PREMIER */}
            {userRole === "admin" && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm font-medium">Statut <span className="text-red-500">*</span></FormLabel>
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
                          if (produit === "Forfait 5G" || produit === "forfait_5g") {
                            const dateSignature = form.getValues("dateSignature");
                            if (dateSignature && dateSignature.trim() !== "") {
                              form.setValue("dateInstallation", dateSignature);
                            }
                          }
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="enregistre">Enregistré</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="valide7j">Validé 7 jours</SelectItem>
                        <SelectItem value="rendezvous">Rendez-vous</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="postproduction">Post-production</SelectItem>
                        <SelectItem value="resiliation">Résiliation</SelectItem>
                        <SelectItem value="abandonne">Abandonné</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      Le choix du statut déterminera quelles dates sont nécessaires ci-dessous
                    </p>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dateSignature"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Date de signature <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <DateInputFormatter 
                      placeholder="JJ/MM/AAAA"
                      value={field.value || ""}
                      onChange={(value) => {
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Champ Code Vendeur: uniquement pour les administrateurs avec attribution automatique */}
            {userRole === "admin" && (
              <FormField
                control={form.control}
                name="codeVendeur"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm font-medium text-blue-700">
                      Code Vendeur - Attribution Automatique
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: FR12345678"
                        {...field}
                        value={field.value || ""}
                        className="font-mono bg-blue-50 border-blue-200 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormDescription className="text-xs space-y-1">
                      <div className="font-medium text-blue-600">Attribution automatique activée :</div>
                      <div>• Le client sera automatiquement attribué au vendeur correspondant</div>
                      <div>• Pour les forfaits 5G : une carte SIM avec ce code vendeur sera automatiquement assignée</div>
                      <div className="text-muted-foreground mt-2">
                        Format : FR suivi de 8 chiffres. Laissez vide pour génération automatique.
                      </div>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date rendez-vous conditionnelle - SEULEMENT pour le statut "rendezvous" */}
            {form.watch("status") === "rendezvous" && (
              <FormField
                control={form.control}
                name="dateRendezVous"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Date de rendez-vous
                    </FormLabel>
                    <FormControl>
                      <DateInputFormatter 
                        placeholder="JJ/MM/AAAA"
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {form.watch("status") === "rendezvous" && !form.watch("dateRendezVous") && (
                      <p className="text-sm text-red-500 mt-1">
                        Ce champ est obligatoire pour le statut "Rendez-vous"
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* Date installation conditionnelle - SEULEMENT pour le statut "installation" */}
            {form.watch("status") === "installation" && (
              <FormField
                control={form.control}
                name="dateInstallation"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Date d'installation
                    </FormLabel>
                    <FormControl>
                      <DateInputFormatter 
                        placeholder="JJ/MM/AAAA"
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {form.watch("status") === "installation" && !form.watch("dateInstallation") && (
                      <p className="text-sm text-red-500 mt-1">
                        Ce champ est obligatoire pour le statut "Installation"
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}



            {/* Boutons de navigation supprimés - utilisation des boutons en bas du formulaire */}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Rendu du contenu de l'onglet Source
  const renderSourceTab = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium mb-2">Informations sur la source</h3>
            
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm font-medium">Source <span className="text-red-500">*</span></FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log("Source changée en:", value);
                      field.onChange(value);
                      
                      // Contrôler l'affichage des champs conditionnels
                      setShowRecommandationFields(value === "recommandation");
                      
                      // Réinitialiser les champs liés à la recommandation si la source change
                      if (value !== "recommandation") {
                        setTypeRecommandation("");
                        form.setValue("typeRecommandation", "");
                        form.setValue("clientRecommandation", undefined);
                        form.setValue("prospectCivilite", "");
                        form.setValue("prospectPrenom", "");
                        form.setValue("prospectNom", "");
                        form.setValue("prospectMobile", "");
                        form.setValue("prospectCodePostal", "");
                        form.setValue("prospectVille", "");
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la source" />
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
            
            {/* DEBUG VISIBLE - État des variables */}
            <div className="text-lg font-bold text-red-600 p-4 bg-yellow-200 border-2 border-red-500 rounded">
              🔍 DEBUG - Source: "{form.watch("source")}" | Show: {String(showRecommandationFields)} | Type: "{typeRecommandation}"
            </div>
            
            {/* TEST: Affichage FORCÉ des champs pour debug */}
            {(showRecommandationFields || true) && (
              <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
                <FormField
                  control={form.control}
                  name="typeRecommandation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Type de recommandation <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          console.log("Type recommandation changé en:", value);
                          field.onChange(value);
                          setTypeRecommandation(value);
                          
                          // Réinitialiser les champs spécifiques au type
                          if (value === "client") {
                            form.setValue("prospectCivilite", "");
                            form.setValue("prospectPrenom", "");
                            form.setValue("prospectNom", "");
                            form.setValue("prospectMobile", "");
                            form.setValue("prospectCodePostal", "");
                            form.setValue("prospectVille", "");
                          } else if (value === "prospect") {
                            form.setValue("clientRecommandation", undefined);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
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
                
                {/* Si type = client, afficher la liste des clients */}
                {typeRecommandation === "client" && (
                  <FormField
                    control={form.control}
                    name="clientRecommandation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Client référent <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableClients.length > 0 ? (
                              availableClients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.prenom} {client.nom}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_clients" disabled>
                                Aucun client disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Si type = prospect, afficher le mini-formulaire */}
                {typeRecommandation === "prospect" && (
                  <div className="space-y-4 border-l-2 border-muted p-3">
                    <h4 className="text-sm font-medium">Informations sur le prospect référent</h4>
                    
                    <FormField
                      control={form.control}
                      name="prospectCivilite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Civilité <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une civilité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Monsieur</SelectItem>
                              <SelectItem value="Mme">Madame</SelectItem>
                              <SelectItem value="Mlle">Mademoiselle</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="prospectPrenom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Prénom <span className="text-xs font-normal text-muted-foreground">(Prénom ou Nom requis)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Prénom" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="prospectNom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Nom <span className="text-xs font-normal text-muted-foreground">(Prénom ou Nom requis)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nom" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="prospectMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Mobile <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Téléphone mobile" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="prospectCodePostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Code Postal <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="75123" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="prospectVille"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Ville <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Ville" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notez les tâches à effectuer pour le client." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Boutons supprimés - utilisation de ceux en bas du formulaire */}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Ajouter une fonction pour gérer les clics directs sur le bouton
  const handleButtonClick = async () => {
    try {
      // Afficher les erreurs actuelles pour le débogage
      console.log("Erreurs actuelles du formulaire:", form.formState.errors);
      
      // En mode édition, on va envoyer directement le formulaire en ignorant certaines validations
      if (isEdit) {
        console.log("🚀 Mode édition - soumission directe");
        // Récupérer toutes les valeurs actuelles
        const values = form.getValues();
        console.log("🔥 Valeurs à envoyer:", values);
        console.log("🔍 Statut dans les valeurs:", values.status);
        console.log("📤 Envoi de la requête de mise à jour...");
        
        // Appel direct à la fonction de soumission fournie
        await onSubmit(values);
      } else {
        // En mode création, on valide normalement
        const isValid = await form.trigger();
        
        if (isValid) {
          const values = form.getValues();
          console.log("Validation réussie via le bouton. Valeurs:", values);
          handleSubmit(values);
        } else {
          // Message d'erreur détaillé
          const errorFields = Object.keys(form.formState.errors).join(", ");
          console.error("Validation du formulaire échouée. Champs en erreur:", errorFields);
          toast({
            title: "Erreur de validation",
            description: `Veuillez vérifier ces champs: ${errorFields}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la soumission directe:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={(e) => {
          console.log("🎯 Événement de soumission du formulaire déclenché");
          e.preventDefault();
          const formData = form.getValues();
          console.log("📋 Données du formulaire:", formData);
          form.handleSubmit(handleSubmit)(e);
        }}>
          <div className="bg-white rounded-lg shadow-sm mb-2">
            <TabsSimple 
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
          
          {/* Contrôleur de progression du formulaire */}
          {/* Progress tracker removed to fix error */}
          
          {activeTab === "personnel" && renderPersonnelTab()}
          {activeTab === "adresse" && renderAdresseTab()}
          {activeTab === "contrat" && renderContratTab()}
          {activeTab === "source" && renderSourceTab()}
          
          {/* Boutons de navigation et soumission */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
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
                  >
                    Suivant →
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                  onClick={(e) => {
                    console.log("🔥 Bouton cliqué - Type:", e.currentTarget.type);
                    console.log("🔥 Erreurs de validation:", form.formState.errors);
                    console.log("🔥 Formulaire valide:", form.formState.isValid);
                    console.log("🔥 Données actuelles:", form.getValues());
                  }}
                >
                  {isSubmitting ? "Sauvegarde..." : isEdit ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}