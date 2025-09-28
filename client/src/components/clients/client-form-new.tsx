import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useDuplicateCheck } from "@/hooks/use-duplicate-check";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ClientStatusSelector } from "@/components/clients/client-status-selector-simple";
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";
import { X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import du schéma standardisé depuis shared/schema.ts
import { clientFormSchema, type ClientFormValues } from "@shared/schema";
import { getSourcesForSelect } from "@shared/sources";

type ClientFormProps = {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => void;
  onReturnToList?: () => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
};

const PRODUITS = [
  { value: "Freebox Pop", label: "Freebox Pop", points: 4 },
  { value: "Freebox Essentiel", label: "Freebox Essentiel", points: 5 },
  { value: "Freebox Ultra", label: "Freebox Ultra", points: 6 },
  { value: "Forfait 5G", label: "Forfait 5G", points: 1 }
];

export function ClientFormNew({
  defaultValues,
  onSubmit,
  onReturnToList,
  isSubmitting = false,
  isEdit = false
}: ClientFormProps) {
  const { toast } = useToast();
  const { getUserId } = useAuth();
  const { duplicateState, checkEmail, checkContract, clearDuplicateState, isChecking } = useDuplicateCheck();

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
      identifiantContrat: "",
      carteSim: "", // Sera supprimé côté serveur - Attribution manuelle requise
      portabilite: "non",
      numeroPorter: "",
      source: "prospection",
      typeRecommandation: "",
      civiliteProspect: "",
      prenomProspect: "",
      nomProspect: "",
      mobileProspect: "",
      codePostalProspect: "",
      villeProspect: "",
      commentaire: "",
      dateSignature: undefined,
      dateRendezVous: "",
      dateInstallation: "",
      userId: getUserId() || 0,
      status: "enregistre",
      mandatSepa: false,
      contratSigne: false,
      bonCommande: false,
      ribClient: false,
      copiePieceIdentite: false,
      attestationHonneur: false,
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

  const formValues = form.watch();

  // Debounce pour la vérification des doublons
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCheckDuplicate = useCallback((type: 'email' | 'contract', value: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      if (type === 'email') {
        checkEmail(value, formValues.identifiantContrat);
      } else {
        checkContract(value, formValues.email);
      }
    }, 500); // 500ms de délai

    setDebounceTimer(newTimer);
  }, [debounceTimer, checkEmail, checkContract, formValues.email, formValues.identifiantContrat]);

  // Vérification email en temps réel
  useEffect(() => {
    if (formValues.email && formValues.email.length >= 3) {
      debouncedCheckDuplicate('email', formValues.email);
    }
  }, [formValues.email, debouncedCheckDuplicate]);

  // Vérification contrat en temps réel
  useEffect(() => {
    if (formValues.identifiantContrat && formValues.identifiantContrat.length >= 3) {
      debouncedCheckDuplicate('contract', formValues.identifiantContrat);
    }
  }, [formValues.identifiantContrat, debouncedCheckDuplicate]);

  // Auto-suggestion du téléphone personnel pour Forfait 5G + Portabilité
  useEffect(() => {
    if (formValues.produit === "Forfait 5G" && formValues.portabilite === "oui" && formValues.telephone && !formValues.numeroPorter) {
      form.setValue("numeroPorter", formValues.telephone);
    }
  }, [formValues.produit, formValues.portabilite, formValues.telephone, formValues.numeroPorter, form]);

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

  const handleSubmit = (values: ClientFormValues) => {
    console.log("📤 Données soumises depuis le formulaire unifié:", values);
    
    // 🚨 CORRECTION BUG : Conversion date française vers ISO avant envoi
    const processedValues = { ...values };
    if (values.dateNaissance && values.dateNaissance.includes('/')) {
      const isoDate = convertFrenchDateToISO(values.dateNaissance);
      processedValues.dateNaissance = isoDate;
      console.log(`🔄 Conversion dateNaissance: ${values.dateNaissance} → ${isoDate}`);
    }
    
    onSubmit(processedValues);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* En-tête avec bouton de fermeture pour le mode édition */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Modifier le client" : "Nouveau client"}
        </h2>
        {isEdit && onReturnToList && (
          <Button variant="ghost" size="sm" onClick={onReturnToList}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Section Informations personnelles */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="relative">
                          <Input 
                            type="email" 
                            placeholder="email@exemple.com" 
                            {...field}
                            className={duplicateState.email?.isDuplicate ? "border-red-500" : ""}
                          />
                          {isChecking && field.value && field.value.length >= 3 && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </FormControl>
                      
                      {/* Message de validation en temps réel */}
                      {duplicateState.email && field.value && field.value.length >= 3 && (
                        <Alert className={`mt-2 ${duplicateState.email.isDuplicate ? 'border-red-200 bg-red-50' : duplicateState.email.isNewContract ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                          <div className="flex items-start space-x-2">
                            {duplicateState.email.isDuplicate ? (
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertDescription className={`text-sm ${duplicateState.email.isDuplicate ? 'text-red-700' : duplicateState.email.isNewContract ? 'text-blue-700' : 'text-green-700'}`}>
                                {duplicateState.email.message}
                                {duplicateState.email.clientInfo && (
                                  <div className="mt-1 text-xs opacity-75">
                                    Client: {duplicateState.email.clientInfo.nom} • Contrat: {duplicateState.email.clientInfo.contratActuel}
                                  </div>
                                )}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      )}
                      
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
                        <DateNaissanceInput value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Adresse */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="75001" {...field} />
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
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Contrat */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Contrat</h3>
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
                              {produit.label} ({produit.points} pts)
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
                  name="identifiantContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant contrat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="ID contrat" 
                            {...field}
                            className={duplicateState.contract?.isDuplicate ? "border-red-500" : ""}
                          />
                          {isChecking && field.value && field.value.length >= 3 && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </FormControl>
                      
                      {/* Message de validation en temps réel */}
                      {duplicateState.contract && field.value && field.value.length >= 3 && (
                        <Alert className={`mt-2 ${duplicateState.contract.isDuplicate ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                          <div className="flex items-start space-x-2">
                            {duplicateState.contract.isDuplicate ? (
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertDescription className={`text-sm ${duplicateState.contract.isDuplicate ? 'text-red-700' : 'text-green-700'}`}>
                                {duplicateState.contract.message}
                                {duplicateState.contract.clientInfo && (
                                  <div className="mt-1 text-xs opacity-75">
                                    Client: {duplicateState.contract.clientInfo.nom} • Email: {duplicateState.contract.clientInfo.email}
                                  </div>
                                )}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carteSIM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carte SIM</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de carte SIM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
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

                {formValues.portabilite === "oui" && (
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <FormControl>
                        <ClientStatusSelector 
                          value={field.value} 
                          onChange={field.onChange} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Documents */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="mandatSepa"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Mandat SEPA</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="contratSigne"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Contrat signé</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="bonCommande"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Bon de commande</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="ribClient"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>RIB client</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="copiePieceIdentite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Copie pièce d'identité</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="attestationHonneur"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Attestation sur l'honneur</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Commentaires */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Commentaires</h3>
              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Commentaires additionnels..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            {onReturnToList && (
              <Button type="button" variant="outline" onClick={onReturnToList}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}