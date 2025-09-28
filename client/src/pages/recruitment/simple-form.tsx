import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, MapPin, Loader2, Users, Target, Clock, TrendingUp, MessageSquare, Brain, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SmgLogo } from "@/components/ui/smg-logo";
import { apiRequest } from "@/lib/queryClient";

const recruitmentSchema = z.object({
  // Champs obligatoires générés automatiquement
  codeParrainage: z.string().optional(),
  
  // Champs obligatoires selon les règles métier
  civilite: z.enum(["M.", "Mr", "Mme", "Mlle"]).optional(),
  prenom: z.string()
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .optional(),
  nom: z.string()
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .optional(),
  mobile: z.string()
    .min(10, "Le numéro de mobile est obligatoire")
    .regex(/^[\d\s\-\+\(\)\.]+$/, "Format de téléphone invalide"),
  
  // Tous les autres champs sont facultatifs
  email: z.string()
    .email("Adresse email invalide")
    .max(100, "L'email ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),
  adresse: z.string()
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .optional(),
  codePostal: z.string()
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres")
    .optional()
    .or(z.literal("")),
  ville: z.string()
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Champs additionnels pour le suivi de prospects - tous facultatifs
  experienceVente: z.enum(["aucune", "moins_1_an", "1_3_ans", "plus_3_ans"]).optional(),
  disponibilite: z.enum(["temps_plein", "temps_partiel", "weekends", "flexible"]).optional(),
  motivationPrincipale: z.string()
    .max(500, "La motivation ne peut pas dépasser 500 caractères")
    .optional(),
  objectifFinancier: z.enum(["complement_revenu", "revenu_principal", "independance_financiere"]).optional(),
  commentaires: z.string().optional(),
}).refine((data) => {
  // RÈGLE MÉTIER : Au moins un prénom OU un nom doit être renseigné
  return (data.prenom && data.prenom.trim() !== "") || (data.nom && data.nom.trim() !== "");
}, {
  message: "Au moins un prénom ou un nom doit être renseigné",
  path: ["prenom"],
});

type RecruitmentFormData = z.infer<typeof recruitmentSchema>;

export default function SimpleRecruitmentForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentUserCode, setCurrentUserCode] = useState<string>("");

  // Récupérer les infos de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log("🔍 Récupération utilisateur côté frontend...");
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const user = await response.json();
          console.log("👤 Utilisateur reçu côté frontend:", user);
          if (user.codeVendeur) {
            console.log("✅ Code vendeur trouvé:", user.codeVendeur);
            setCurrentUserCode(user.codeVendeur);
          } else {
            console.warn("⚠️ Pas de code vendeur pour l'utilisateur");
          }
        } else {
          console.error("❌ Erreur réponse serveur:", response.status);
        }
      } catch (error) {
        console.error("❌ Erreur récupération utilisateur:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const form = useForm<RecruitmentFormData>({
    resolver: zodResolver(recruitmentSchema),
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
      experienceVente: undefined,
      disponibilite: undefined,
      motivationPrincipale: "",
      objectifFinancier: undefined,
      commentaires: "",
    },
  });

  // Pré-remplir le code de parrainage avec le code du vendeur connecté
  useEffect(() => {
    if (currentUserCode) {
      form.setValue("codeParrainage", currentUserCode);
    }
  }, [currentUserCode, form]);

  // Fonction pour récupérer les villes depuis le code postal
  const fetchCityFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 5) {
      setAvailableCities([]);
      return;
    }

    setIsLoadingCity(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/fr/${postalCode}`);
      if (response.ok) {
        const data = await response.json();
        const cities = data.places?.map((place: any) => place['place name']) || [];
        setAvailableCities(cities);
        
        // Auto-remplir la ville s'il n'y en a qu'une
        if (cities.length === 1) {
          form.setValue("ville", cities[0]);
        } else if (cities.length === 0) {
          form.setValue("ville", "");
        }
      } else {
        setAvailableCities([]);
        form.setValue("ville", "");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la ville:", error);
      setAvailableCities([]);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const createRecruitmentMutation = useMutation({
    mutationFn: async (data: RecruitmentFormData) => {
      const response = await apiRequest("POST", "/api/recruitment/prospects", {
        ...data,
        type: "vendeur",
        source: "prospects_hub",
        stade: "nouveau",
        etapeActuelle: "informations",
        progression: 10,
        experienceVente: data.experienceVente,
        disponibilite: data.disponibilite,
        motivationPrincipale: data.motivationPrincipale,
        objectifFinancier: data.objectifFinancier,
        commentaires: data.commentaires || ""
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Le prospect vendeur a été créé avec succès.",
        variant: "default",
      });
      setLocation('/prospects');
    },
    onError: (error: any) => {
      console.error("Erreur lors de la création du prospect:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création du prospect.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour l'analyse IA automatique
  const analyzeProfileMutation = useMutation({
    mutationFn: async (profileData: {
      experience: string;
      availability: string;
      financialGoal: string;
      motivation: string;
      additionalComments?: string;
    }) => {
      const response = await apiRequest("POST", "/api/recruitment/analyze-profile", profileData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("🤖 Réponse analyse IA reçue:", data);
      if (data?.success && data?.analysis) {
        form.setValue("commentaires", data.analysis);
        toast({
          title: "Analyse générée",
          description: "L'analyse IA du profil a été générée avec succès.",
          variant: "default",
        });
      } else {
        console.error("❌ Réponse analyse IA invalide:", data);
        toast({
          title: "Erreur d'analyse",
          description: "L'analyse IA n'a pas pu être récupérée.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Erreur lors de l'analyse IA:", error);
      toast({
        title: "Erreur d'analyse",
        description: error?.message || "Impossible de générer l'analyse automatique.",
        variant: "destructive",
      });
    },
  });

  // Fonction pour lancer l'analyse IA automatique
  const handleAutoAnalysis = () => {
    const formValues = form.getValues();
    
    // Vérifier qu'au moins les champs de base du profil vendeur sont remplis
    if (!formValues.experienceVente || !formValues.disponibilite || !formValues.objectifFinancier) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir l'expérience, la disponibilité et l'objectif financier pour l'analyse IA.",
        variant: "destructive",
      });
      return;
    }

    const profileData = {
      experience: formValues.experienceVente || "",
      availability: formValues.disponibilite || "",
      financialGoal: formValues.objectifFinancier || "",
      motivation: formValues.motivationPrincipale || "",
      additionalComments: formValues.commentaires || ""
    };

    setIsAnalyzing(true);
    analyzeProfileMutation.mutate(profileData);
  };

  // Réinitialiser l'état d'analyse quand la mutation se termine
  useEffect(() => {
    if (!analyzeProfileMutation.isPending) {
      setIsAnalyzing(false);
    }
  }, [analyzeProfileMutation.isPending]);

  const onSubmit = (data: RecruitmentFormData) => {
    createRecruitmentMutation.mutate(data);
  };

  const handleBack = () => {
    setLocation('/prospects');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header avec logo et bouton retour */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-white hover:bg-white/20 p-2 rounded-md"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Retour
          </Button>
          <div className="bg-white p-2 rounded-lg shadow-lg">
            <SmgLogo variant="auth" className="h-8 w-auto" />
          </div>
        </div>

        {/* Header principal avec icône et titre */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 mb-4 text-center shadow-xl border border-emerald-500/30">
          <div className="bg-white/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Nouveau Prospect Vendeur</h1>
          <p className="text-emerald-100 text-sm">Recrutement professionnel</p>
          
          {/* Sélecteur d'étapes à points colorés */}
          <div className="flex items-center justify-center mt-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            </div>
          </div>
          <p className="text-emerald-100 text-sm font-medium mt-2">
            Étape 1 sur 5 - Informations personnelles
          </p>
        </div>

        {/* Carte du formulaire */}
        <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Informations du Prospect Vendeur</h2>
            <p className="text-sm text-gray-600">Créez un prospect vendeur pour le recrutement</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Code Vendeur Parrain */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <FormField
                    control={form.control}
                    name="codeParrainage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-emerald-700 font-medium text-sm">
                          <span className="bg-emerald-100 rounded-full p-1 mr-2">
                            <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Code Vendeur Parrain
                        </FormLabel>
                        <p className="text-xs text-gray-500 mb-2">Code vendeur automatique</p>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="FR12345678"
                            className="bg-gray-100 text-center font-mono text-sm border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Civilité */}
                <FormField
                  control={form.control}
                  name="civilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium text-sm">Civilité *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20">
                            <SelectValue placeholder="Sélectionnez une civilité" />
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

                {/* Prénom et Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium text-sm">Prénom *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Jean" 
                            className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
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
                        <FormLabel className="text-gray-700 font-medium text-sm">Nom *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Dupont" 
                            className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mobile */}
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium text-sm">Mobile *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="06 12 34 56 78" 
                          type="tel" 
                          className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium text-sm">Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="jean.dupont@email.com" 
                          type="email" 
                          className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Adresse */}
                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium text-sm">Adresse</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123 rue de la Paix" 
                          className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Code postal et ville */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="codePostal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-gray-700 font-medium text-sm">
                          Code postal
                          {isLoadingCity && <Loader2 className="w-3 h-3 animate-spin ml-1 text-emerald-600" />}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="75001"
                            className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20"
                            onChange={(e) => {
                              field.onChange(e);
                              fetchCityFromPostalCode(e.target.value);
                            }}
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
                        <FormLabel className="flex items-center text-gray-700 font-medium text-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          Ville
                        </FormLabel>
                        <FormControl>
                          {availableCities.length > 0 ? (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20">
                                <SelectValue placeholder="Choisir..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCities.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              {...field} 
                              placeholder="Votre ville" 
                              className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20" 
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Champs additionnels pour le suivi de prospects en recrutement */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-emerald-600" />
                    Profil Vendeur (Optionnel)
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Expérience en vente */}
                    <FormField
                      control={form.control}
                      name="experienceVente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">Expérience en vente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20">
                                <SelectValue placeholder="Sélectionnez votre expérience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="aucune">Aucune expérience</SelectItem>
                              <SelectItem value="moins_1_an">Moins d'1 an</SelectItem>
                              <SelectItem value="1_3_ans">1 à 3 ans</SelectItem>
                              <SelectItem value="plus_3_ans">Plus de 3 ans</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Disponibilité */}
                    <FormField
                      control={form.control}
                      name="disponibilite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-gray-700 font-medium text-sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Disponibilité
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20">
                                <SelectValue placeholder="Sélectionnez votre disponibilité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="temps_plein">Temps plein</SelectItem>
                              <SelectItem value="temps_partiel">Temps partiel</SelectItem>
                              <SelectItem value="weekends">Weekends uniquement</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Objectif financier */}
                    <FormField
                      control={form.control}
                      name="objectifFinancier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-gray-700 font-medium text-sm">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Objectif financier
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20">
                                <SelectValue placeholder="Sélectionnez votre objectif" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="complement_revenu">Complément de revenu</SelectItem>
                              <SelectItem value="revenu_principal">Revenu principal</SelectItem>
                              <SelectItem value="independance_financiere">Indépendance financière</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Motivation principale */}
                    <FormField
                      control={form.control}
                      name="motivationPrincipale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">Motivation principale</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Qu'est-ce qui vous motive à rejoindre notre équipe de vente ?"
                              className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20 resize-none"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Commentaires */}
                    <FormField
                      control={form.control}
                      name="commentaires"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center text-gray-700 font-medium text-sm">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Commentaires additionnels
                            </FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAutoAnalysis}
                              disabled={isAnalyzing || analyzeProfileMutation.isPending}
                              className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700 shadow-md"
                            >
                              {isAnalyzing || analyzeProfileMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Analyse...
                                </>
                              ) : (
                                <>
                                  <Brain className="w-3 h-3 mr-1" />
                                  Analyse IA
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Toute information complémentaire... Ou utilisez l'analyse IA automatique ↗"
                              className="bg-white border-gray-300 focus:border-emerald-400 focus:ring-emerald-400/20 resize-none"
                              rows={8}
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            💡 Remplissez d'abord l'expérience, disponibilité et objectif financier pour générer une analyse IA personnalisée
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium shadow-lg transition-colors duration-200 mt-6"
                  disabled={createRecruitmentMutation.isPending}
                >
                  {createRecruitmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Créer le prospect vendeur
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}