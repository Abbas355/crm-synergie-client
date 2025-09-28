import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ClientStatusSelector } from "@/components/clients/client-status-selector-simple";
import { X } from "lucide-react";
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

export function ClientFormSimple({
  defaultValues,
  onSubmit,
  onReturnToList,
  isSubmitting = false,
  isEdit = false
}: ClientFormProps) {
  const { user } = useAuth();

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
      carteSIM: "",
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
      userId: user?.id || 0,
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

  const handleSubmit = (values: ClientFormValues) => {
    console.log("📤 Données soumises depuis le formulaire simple:", values);
    onSubmit(values);
  };

  return (
    <div className="bg-white">
      {/* En-tête avec bouton de fermeture */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? "Modifier le client" : "Nouveau client"}
        </h2>
        {onReturnToList && (
          <Button variant="ghost" size="sm" onClick={onReturnToList}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations personnelles</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="civilite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civilité *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

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
                    <Input type="text" placeholder="JJ/MM/AAAA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adresse</h3>
            
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse *</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Contrat */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contrat</h3>
            
            <FormField
              control={form.control}
              name="produit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produit *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <Input placeholder="ID contrat" {...field} />
                  </FormControl>
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="portabilite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portabilité</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            
            <div className="grid grid-cols-2 gap-3">
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

          {/* Commentaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commentaires</h3>
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
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6">
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