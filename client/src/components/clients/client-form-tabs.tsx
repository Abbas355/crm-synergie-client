import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientStatusSelector } from "@/components/clients/client-status-selector-simple";
import { ArrowLeft } from "lucide-react";
import { clientFormSchema, type ClientFormValues } from "@shared/schema";

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

export function ClientFormTabs({
  defaultValues,
  onSubmit,
  onReturnToList,
  isSubmitting = false,
  isEdit = false
}: ClientFormProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personnel");

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
      carteSim: "",
      portabilite: "non",
      numeroPorter: "",
      source: "Prospection",
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
    console.log("📤 Données soumises depuis le formulaire avec onglets:", values);
    onSubmit(values);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header avec navigation */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onReturnToList && (
              <button
                onClick={onReturnToList}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Retour
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {isEdit ? "Modifier le client" : "Ajouter un nouveau client"}
            </h1>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-6">Informations du client</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personnel" className="text-blue-600 border-b-2 border-blue-600">
                    Personnel
                  </TabsTrigger>
                  <TabsTrigger value="adresse">Adresse</TabsTrigger>
                  <TabsTrigger value="contrat">Contrat</TabsTrigger>
                  <TabsTrigger value="source">Source</TabsTrigger>
                </TabsList>

                {/* Onglet Personnel */}
                <TabsContent value="personnel" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="civilite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Civilité *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une civilité" />
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
                </TabsContent>

                {/* Onglet Adresse */}
                <TabsContent value="adresse" className="space-y-4">
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
                </TabsContent>

                {/* Onglet Contrat */}
                <TabsContent value="contrat" className="space-y-4">
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

                  {/* Documents */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Documents</h4>
                    
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
                            <FormLabel className="text-sm">Mandat SEPA</FormLabel>
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
                            <FormLabel className="text-sm">Contrat signé</FormLabel>
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
                            <FormLabel className="text-sm">Bon de commande</FormLabel>
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
                            <FormLabel className="text-sm">RIB client</FormLabel>
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
                            <FormLabel className="text-sm">Copie pièce d'identité</FormLabel>
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
                            <FormLabel className="text-sm">Attestation sur l'honneur</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Source */}
                <TabsContent value="source" className="space-y-4">
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
                            <SelectItem value="Prospection">Prospection</SelectItem>
                            <SelectItem value="Recommandation">Recommandation</SelectItem>
                            <SelectItem value="Internet">Internet</SelectItem>
                            <SelectItem value="Publicité">Publicité</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="typeRecommandation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de recommandation</FormLabel>
                        <FormControl>
                          <Input placeholder="Type de recommandation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h4 className="font-medium">Informations prospect</h4>
                    
                    <FormField
                      control={form.control}
                      name="civiliteProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Civilité prospect</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Civilité" />
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
                      name="prenomProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom prospect</FormLabel>
                          <FormControl>
                            <Input placeholder="Prénom du prospect" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom prospect</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du prospect" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile prospect</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="0123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="codePostalProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal prospect</FormLabel>
                          <FormControl>
                            <Input placeholder="75001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="villeProspect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville prospect</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                </TabsContent>
              </Tabs>

              {/* Boutons d'action fixes en bas */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="max-w-2xl mx-auto flex justify-end space-x-4">
                  {onReturnToList && (
                    <Button type="button" variant="outline" onClick={onReturnToList}>
                      Annuler
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}