import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Shield, User, Phone, Mail, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SmgLogo } from "@/components/ui/smg-logo";



const step1Schema = z.object({
  codeParrainage: z.string()
    .min(1, "Le code de parrainage est obligatoire")
    .regex(/^FR\d{8}$/, "Format invalide (ex: FR03254789)"),
  civilite: z.enum(["M.", "Mr", "Mme", "Mlle"], {
    required_error: "La civilité est obligatoire",
  }),
  prenom: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
  nom: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  mobile: z.string()
    .min(10, "Le numéro de mobile doit contenir au moins 10 chiffres")
    .regex(/^[\d\s\-\+\(\)\.]+$/, "Format de téléphone invalide"),
  email: z.string()
    .email("Adresse email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),
  adresse: z.string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères"),
  codePostal: z.string()
    .min(5, "Le code postal doit contenir 5 caractères")
    .max(5, "Le code postal doit contenir 5 caractères")
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  ville: z.string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "La ville ne peut pas dépasser 100 caractères"),
  rgpdAccepted: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions RGPD",
  }),
});

type Step1FormData = z.infer<typeof step1Schema>;

export default function Step1Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      codeParrainage: "",
      civilite: undefined,
      prenom: "",
      nom: "",
      mobile: "",
      email: "",
      adresse: "",
      codePostal: "",
      ville: "",
      rgpdAccepted: false,
    },
    mode: "onChange",
  });

  // Effet pour pré-remplir le formulaire avec les données depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPrefilled = urlParams.get('prefilled') === 'true';
    const codeParrainage = urlParams.get('codeParrainage');
    const source = urlParams.get('source');
    
    // Toujours récupérer le code de parrainage s'il est présent dans l'URL
    if (codeParrainage && codeParrainage.trim()) {
      form.setValue('codeParrainage', codeParrainage);
      
      // Afficher un message spécifique si on vient du hub prospects
      if (source === 'prospects_hub') {
        toast({
          title: "Code vendeur pré-rempli",
          description: `Code de parrainage: ${codeParrainage}`,
          duration: 4000,
        });
      }
    }
    
    // Pré-remplir avec d'autres données si prefilled=true
    if (isPrefilled) {
      const prefilledData = {
        prenom: urlParams.get('prenom') || '',
        nom: urlParams.get('nom') || '',
        email: urlParams.get('email') || '',
        mobile: urlParams.get('mobile') || '',
        ville: urlParams.get('ville') || '',
        codePostal: urlParams.get('codePostal') || '',
        adresse: urlParams.get('adresse') || ''
      };

      // Pré-remplir les champs avec les données disponibles
      Object.entries(prefilledData).forEach(([key, value]) => {
        if (value && value.trim()) {
          form.setValue(key as keyof Step1FormData, value);
        }
      });

      if (!source || source !== 'prospects_hub') {
        toast({
          title: "Données récupérées",
          description: "Vos informations ont été pré-remplies depuis votre profil prospect.",
          duration: 4000,
        });
      }
    }
  }, [form, toast]);

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

  const step1Mutation = useMutation({
    mutationFn: async (data: Step1FormData) => {
      console.log("🚀 Envoi des données d'inscription:", data);
      
      const response = await fetch("/api/recruitment/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      console.log("📡 Réponse serveur reçue:", response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.log("❌ Données d'erreur:", errorData);
        
        if (response.status === 400 && errorData?.field === "email") {
          throw new Error("Un compte avec cet email existe déjà. Veuillez utiliser un autre email ou vous connecter.");
        }
        
        if (errorData?.message) {
          throw new Error(errorData.message);
        }
        
        throw new Error("Erreur lors de l'inscription");
      }
      
      console.log("✅ Inscription réussie, parsing JSON...");
      const result = await response.json();
      console.log("✅ Données de réponse:", result);
      return result;
    },
    onSuccess: async (data: any) => {
      // Vérifier s'il y a un prospectId dans l'URL pour marquer la conversion
      const urlParams = new URLSearchParams(window.location.search);
      const prospectId = urlParams.get('prospectId');
      
      if (prospectId) {
        try {
          const response = await fetch("/api/recruitment/mark-prospect-converted", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prospectId: parseInt(prospectId),
              recrueId: data.id
            }),
          });
          
          if (response.ok) {
            console.log(`✅ Prospect ${prospectId} marqué comme converti`);
          }
        } catch (error) {
          console.error("❌ Erreur marquage prospect:", error);
          // Ne pas bloquer le processus d'inscription pour cette erreur
        }
      }
      
      toast({
        title: "Inscription réussie !",
        description: prospectId ? "Prospect converti avec succès ! Redirection..." : "Redirection vers la page de félicitations...",
      });
      setLocation(`/recruitment/step2?recrueId=${data.id}&prenom=${encodeURIComponent(form.getValues('prenom'))}&codeVendeur=${encodeURIComponent(data.codevendeur || data.codeVendeur)}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur s'est produite lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Step1FormData) => {
    console.log('📝 Données du formulaire:', data);
    step1Mutation.mutate(data);
  };

  // Validation robuste du formulaire
  const formData = form.watch();
  const isFormValid = 
    formData.codeParrainage && 
    formData.civilite && 
    formData.prenom && 
    formData.nom && 
    formData.mobile && 
    formData.email && 
    formData.adresse && 
    formData.codePostal && 
    formData.ville && 
    formData.rgpdAccepted &&
    Object.keys(form.formState.errors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Effets de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header moderne avec logo intégré */}
        <div className="py-6 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 mx-auto w-fit shadow-2xl">
                <div className="mb-4">
                  <div className="mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg w-fit border border-blue-100">
                    <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  Votre candidature
                </h1>
                <div className="flex items-center justify-center mt-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <p className="text-blue-100/80 text-sm font-medium mt-2">
                  Étape 1 sur 5 - Informations personnelles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur principal centré */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">
            {/* Carte formulaire modernisée */}
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Inscription - Étape 1
                </CardTitle>
                <p className="text-gray-600 px-4 font-medium">
                  Renseignez vos informations personnelles pour commencer votre inscription
                </p>
              </CardHeader>
              
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Code de parrainage */}
                    <FormField
                      control={form.control}
                      name="codeParrainage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-blue-500" />
                            Code Parrainage <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="FR03254789"
                              className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white/80 backdrop-blur-sm font-mono text-center text-lg shadow-lg placeholder:text-gray-300 placeholder:font-normal"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Civilité */}
                    <FormField
                      control={form.control}
                      name="civilite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold">
                            Civilité <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
                                <SelectValue placeholder="Sélectionnez votre civilité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <SelectItem value="M." className="focus:bg-blue-50">M.</SelectItem>
                              <SelectItem value="Mr" className="focus:bg-blue-50">Mr</SelectItem>
                              <SelectItem value="Mme" className="focus:bg-blue-50">Mme</SelectItem>
                              <SelectItem value="Mlle" className="focus:bg-blue-50">Mlle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Prénom */}
                    <FormField
                      control={form.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            Prénom <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Votre prénom"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Nom */}
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            Nom <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Votre nom de famille"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Mobile */}
                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-purple-500" />
                            Téléphone mobile <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="06 12 34 56 78"
                              className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-orange-500" />
                            Adresse email <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="votre.email@example.com"
                              className="h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Adresse */}
                    <FormField
                      control={form.control}
                      name="adresse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                            Adresse <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Votre adresse complète"
                              className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Code postal */}
                    <FormField
                      control={form.control}
                      name="codePostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            Code postal <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="75123"
                                maxLength={5}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, ''); // Seulement les chiffres
                                  field.onChange(value);
                                  if (value.length === 5) {
                                    fetchCityFromPostalCode(value);
                                  } else {
                                    setAvailableCities([]);
                                    form.setValue('ville', '');
                                  }
                                }}
                                className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg pr-10"
                              />
                              {isLoadingCity && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Ville */}
                    <FormField
                      control={form.control}
                      name="ville"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-teal-500" />
                            Ville <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            {availableCities.length > 0 ? (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg">
                                  <SelectValue placeholder="Sélectionnez votre commune" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-xl max-h-60 overflow-y-auto">
                                  {availableCities.map((city) => (
                                    <SelectItem key={city} value={city} className="focus:bg-teal-50">
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                {...field}
                                placeholder="Votre ville"
                                readOnly={form.getValues('codePostal').length === 5}
                                className="h-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg"
                              />
                            )}
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    {/* Checkbox RGPD */}
                    <FormField
                      control={form.control}
                      name="rgpdAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border-2 border-gray-200 p-4 bg-gray-50/50 backdrop-blur-sm">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-1 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium text-gray-700 cursor-pointer">
                              J'accepte les conditions RGPD <span className="text-red-500">*</span>
                            </FormLabel>
                            <p className="text-xs text-gray-500">
                              En cochant cette case, vous acceptez que vos données personnelles soient traitées conformément au RGPD
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />



                    {/* Boutons d'action */}
                    <div className="flex flex-col space-y-3 pt-6">
                      <Button 
                        type="submit" 
                        disabled={!isFormValid || step1Mutation.isPending}
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"

                      >
                        {step1Mutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Inscription en cours...
                          </div>
                        ) : (
                          <>
                            Continuer vers l'étape 2
                            <UserPlus className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setLocation('/auth')}
                        className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Retour à l'authentification
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}