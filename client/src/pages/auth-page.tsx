import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { CommuneInput } from "@/components/ui/commune-input";
import { RequiredAsterisk } from "@/components/ui/required-asterisk";
import { PasswordInput } from "@/components/ui/password-input";
import { SmgLogo } from "@/components/ui/smg-logo";

// Login form schema - accepte username ou email
const loginSchema = z.object({
  username: z.string().min(1, { message: "Veuillez entrer votre nom d'utilisateur ou email." }),
  password: z.string().min(3, { message: "Le mot de passe est requis." }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema (basé sur ProspectForm)
const registrationSchema = z.object({
  prenom: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
  telephone: z.string().min(10, { message: "Numéro de téléphone invalide" }),
  adresse: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
  codePostal: z.string().min(5, { message: "Le code postal doit contenir 5 chiffres" }),
  ville: z.string().min(2, { message: "La ville est requise" }),
  nomSociete: z.string().optional(), // Facultatif: nom de la société
  siret: z.string().optional(), // Facultatif: numéro SIRET
  source: z.string().default("site_web"),
  motivation: z.string().optional(),
  experiencePrecedente: z.enum(["oui", "non"]).optional(),
  disponibilite: z.enum(["immediate", "1_mois", "3_mois"]).optional(),
  codeVendeur: z.string().min(5, { message: "Le code de parrainage est requis" }), // Code de parrainage obligatoire
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
  confirmPassword: z.string().min(1, { message: "Veuillez confirmer votre mot de passe" }),
  terms: z.boolean().refine(val => val === true, { message: "Vous devez accepter les conditions d'utilisation" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  // Registration form
  const registrationForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      adresse: "",
      codePostal: "",
      ville: "",
      nomSociete: "",
      siret: "",
      source: "site_web",
      motivation: "",
      experiencePrecedente: undefined,
      disponibilite: undefined,
      codeVendeur: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  }

  function onRegistrationSubmit(data: RegistrationFormValues) {
    // Adapter les données pour l'API d'inscription qui attend aussi les infos du prospect
    registerMutation.mutate({
      username: data.email,
      password: data.password,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      adresse: data.adresse,
      codePostal: data.codePostal,
      ville: data.ville,
      nomSociete: data.nomSociete,
      siret: data.siret,
      source: data.source,
      motivation: data.motivation,
      experiencePrecedente: data.experiencePrecedente,
      disponibilite: data.disponibilite,
      codeVendeur: data.codeVendeur
    });
  }

  return (
    <div className="auth-container mobile-scroll-fix bg-gradient-to-br from-blue-500 via-blue-400 to-indigo-500 flex flex-col mobile-optimized">
      {!isLogin && (
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center space-x-2 sm:space-x-6 px-4 sm:px-8 py-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                1
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:block">Informations</span>
              <span className="text-xs font-medium text-gray-700 sm:hidden">Info</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">Validation</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                3
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 hidden sm:block">Accès plateforme</span>
              <span className="text-xs font-medium text-gray-500 sm:hidden">Accès</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center p-4 mobile-bottom-spacing">
        <Card className="auth-card max-w-md w-full shadow-2xl border-0">
          <CardHeader className="pt-6">
            <div className="flex justify-center mb-6">
              <SmgLogo variant="auth" width={200} height={100} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 text-center">
              {isLogin ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Connectez-vous à votre compte Synergie Marketing"
                : "Créez un compte pour accéder au CRM Synergie Marketing"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="votre@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={loginForm.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Se souvenir de moi</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary hover:text-indigo-700">
                      Mot de passe oublié?
                    </a>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Se connecter
                </Button>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">Vous n'avez pas de compte?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm font-medium text-primary hover:text-indigo-700"
                    onClick={() => setIsLogin(false)}
                  >
                    S'inscrire
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...registrationForm}>
              <form onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)} className="space-y-4">
                {/* Informations personnelles */}
                <div className="space-y-4 border rounded-lg p-4 mb-4">
                  <h3 className="font-medium">Informations personnelles</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={registrationForm.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Prénom <RequiredAsterisk />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nom <RequiredAsterisk />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registrationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="votre@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Téléphone <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0612345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Adresse <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="123 rue de la Paix" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={registrationForm.control}
                      name="codePostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Code postal <RequiredAsterisk />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="75000" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                // Reset ville si le code postal change
                                if (e.target.value.length !== 5) {
                                  registrationForm.setValue("ville", "");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="ville"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ville <RequiredAsterisk />
                          </FormLabel>
                          <CommuneInput
                            codePostal={registrationForm.watch("codePostal")}
                            onChange={field.onChange}
                            value={field.value}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Informations entreprise */}
                <div className="space-y-4 border rounded-lg p-4 mb-4">
                  <h3 className="font-medium">Informations professionnelles</h3>
                  
                  <FormField
                    control={registrationForm.control}
                    name="nomSociete"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise (facultatif)</FormLabel>
                        <FormControl>
                          <Input placeholder="Mon Entreprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="siret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro SIRET (facultatif)</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678900012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="experiencePrecedente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avez-vous une expérience en vente ?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une option" />
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

                  <FormField
                    control={registrationForm.control}
                    name="disponibilite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilité</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez votre disponibilité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immédiate</SelectItem>
                            <SelectItem value="1_mois">Dans 1 mois</SelectItem>
                            <SelectItem value="3_mois">Dans 3 mois</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registrationForm.control}
                    name="motivation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivation (facultatif)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Pourquoi souhaitez-vous rejoindre notre réseau ?" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Parrainage */}
                <div className="space-y-4 border rounded-lg p-4 mb-4">
                  <h3 className="font-medium">Parrainage</h3>
                  <FormField
                    control={registrationForm.control}
                    name="codeVendeur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Code de parrainage <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="FR12345678" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Code du vendeur qui vous a parrainé (format FR + 8 chiffres)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mot de passe */}
                <div className="space-y-4 border rounded-lg p-4 mb-4">
                  <h3 className="font-medium">Sécurité</h3>
                  <FormField
                    control={registrationForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Mot de passe <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registrationForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Confirmer le mot de passe <RequiredAsterisk />
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registrationForm.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J'accepte les{" "}
                          <a href="#" className="text-primary hover:text-indigo-700">
                            conditions d'utilisation
                          </a>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  S'inscrire
                </Button>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">Vous avez déjà un compte?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm font-medium text-primary hover:text-indigo-700"
                    onClick={() => setIsLogin(true)}
                  >
                    Se connecter
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
