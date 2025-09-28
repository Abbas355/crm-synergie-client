import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, ChevronLeft, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateNaissanceInput } from "@/components/ui/date-naissance-input";

// Définition du schéma de formulaire
const formSchema = z.object({
  civilite: z.string().min(1, { message: "La civilité est requise" }),
  prenom: z.string().min(1, { message: "Le prénom est requis" }),
  nom: z.string().min(1, { message: "Le nom est requis" }),
  email: z.string().email({ message: "Email invalide" }).min(1, { message: "L'email est requis" }),
  dateNaissance: z.string().min(1, { message: "La date de naissance est requise" }),
  // Autres champs pour les onglets adresse, contrat et infos
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  identifiantContrat: z.string().optional(),
  forfaitType: z.string().optional(),
  codeVendeur: z.string().optional(),
  commentaire: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ClientAddMobile() {
  const [activeTab, setActiveTab] = useState("personnel");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      civilite: "",
      prenom: "",
      nom: "",
      email: "",
      dateNaissance: "",
      adresse: "",
      codePostal: "",
      ville: "",
      telephone: "",
      identifiantContrat: "",
      forfaitType: "",
      codeVendeur: "",
      commentaire: "",
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

  // Soumission du formulaire
  async function onSubmit(data: FormValues) {
    try {
      // 🚨 CORRECTION BUG : Conversion date française vers ISO avant envoi
      let processedDateNaissance = data.dateNaissance;
      if (data.dateNaissance && data.dateNaissance.includes('/')) {
        processedDateNaissance = convertFrenchDateToISO(data.dateNaissance);
        console.log(`🔄 Conversion dateNaissance: ${data.dateNaissance} → ${processedDateNaissance}`);
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          civilite: data.civilite,
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          dateNaissance: processedDateNaissance,
          adresse: data.adresse,
          codePostal: data.codePostal,
          ville: data.ville,
          phone: data.telephone,
          identifiantContrat: data.identifiantContrat,
          forfaitType: data.forfaitType,
          codeVendeur: data.codeVendeur,
          commentaire: data.commentaire,
          status: "enregistre",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du client");
      }

      toast({
        title: "Client créé avec succès",
        description: "Le client a été ajouté à la base de données",
      });

      // Redirection vers la liste des clients
      setLocation("/clients-dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive",
      });
    }
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* En-tête du formulaire */}
        <div className="bg-white p-4 flex items-center justify-between border-b">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <h1 className="text-lg font-medium">Nouveau client</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setLocation("/clients-dashboard")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-0 bg-gray-100">
            <TabsTrigger 
              value="personnel" 
              className="py-3 rounded-none data-[state=active]:bg-white"
            >
              Personnel
            </TabsTrigger>
            <TabsTrigger 
              value="adresse" 
              className="py-3 rounded-none data-[state=active]:bg-white"
            >
              Adresse
            </TabsTrigger>
            <TabsTrigger 
              value="contrat" 
              className="py-3 rounded-none data-[state=active]:bg-white"
            >
              Contrat
            </TabsTrigger>
            <TabsTrigger 
              value="infos" 
              className="py-3 rounded-none data-[state=active]:bg-white"
            >
              Infos
            </TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
              {/* Onglet Personnel */}
              <TabsContent value="personnel" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="civilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base after:content-['*'] after:ml-0.5 after:text-red-500">
                        Civilité
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white h-14">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Monsieur</SelectItem>
                          <SelectItem value="Mme">Madame</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
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
                      <FormLabel className="text-base after:content-['*'] after:ml-0.5 after:text-red-500">
                        Prénom
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Prénom"
                          className="bg-white h-14"
                          {...field}
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
                      <FormLabel className="text-base after:content-['*'] after:ml-0.5 after:text-red-500">
                        Nom
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nom"
                          className="bg-white h-14"
                          {...field}
                        />
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
                      <FormLabel className="text-base after:content-['*'] after:ml-0.5 after:text-red-500">
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemple.com"
                          className="bg-white h-14"
                          {...field}
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
                      <FormLabel className="text-base after:content-['*'] after:ml-0.5 after:text-red-500">
                        Date de naissance
                      </FormLabel>
                      <FormControl>
                        <DateNaissanceInput
                          value={field.value}
                          onChange={field.onChange}
                          className="bg-white h-14"
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">Format : JJ/MM/AAAA</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("adresse")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Suivant
                  </Button>
                </div>
              </TabsContent>
              
              {/* Onglet Adresse */}
              <TabsContent value="adresse" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Adresse</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adresse"
                          className="bg-white h-14"
                          {...field}
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
                      <FormLabel className="text-base">Code postal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Code postal"
                          className="bg-white h-14"
                          {...field}
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
                      <FormLabel className="text-base">Ville</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ville"
                          className="bg-white h-14"
                          {...field}
                        />
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
                      <FormLabel className="text-base">Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Téléphone"
                          className="bg-white h-14"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("personnel")}
                  >
                    Précédent
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("contrat")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Suivant
                  </Button>
                </div>
              </TabsContent>
              
              {/* Onglet Contrat */}
              <TabsContent value="contrat" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="identifiantContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Identifiant du contrat</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Identifiant du contrat"
                          className="bg-white h-14"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="forfaitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Produit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white h-14">
                            <SelectValue placeholder="Sélectionner un forfait" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="essentiel">Essentiel</SelectItem>
                          <SelectItem value="5g">5G</SelectItem>
                          <SelectItem value="ultra">Ultra</SelectItem>
                          <SelectItem value="pop">Pop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="codeVendeur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Code vendeur</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Code vendeur"
                          className="bg-white h-14"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("adresse")}
                  >
                    Précédent
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("infos")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Suivant
                  </Button>
                </div>
              </TabsContent>
              
              {/* Onglet Infos */}
              <TabsContent value="infos" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="commentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Commentaire</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Commentaire"
                          className="bg-white h-14"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("contrat")}
                  >
                    Précédent
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Enregistrer
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </div>
    </AppLayout>
  );
}