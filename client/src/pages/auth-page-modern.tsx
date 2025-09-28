import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Building2, Phone, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SmgLogo } from "@/components/ui/smg-logo";
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

// Schéma de connexion simplifié - accepte username ou email
const loginSchema = z.object({
  username: z.string().min(1, { message: "Veuillez entrer votre nom d'utilisateur ou email." }),
  password: z.string().min(3, { message: "Le mot de passe est requis." }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPageModern() {
  const [showPassword, setShowPassword] = useState(false);
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirection immédiate si déjà connecté - éviter les rendus multiples
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    }, {
      onSuccess: () => {
        // Redirection immédiate vers la page d'accueil
        setLocation("/");
      }
    });
  }

  // Retour null si utilisateur déjà connecté pour éviter le double affichage
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center p-4">
      {/* Effet de particules animé en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Carte de connexion unique avec logo intégré */}
        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            {/* Logo unique dans le header */}
            <div className="mb-6">
              <div className="mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg w-fit border border-blue-100">
                <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Connexion
            </CardTitle>
            <CardDescription className="text-gray-600">
              Connectez-vous à votre espace de gestion
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                {/* Champ Email */}
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email ou nom d'utilisateur</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="sophie.martin ou sophie.martin@email.com"
                            className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            disabled={loginMutation.isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champ Mot de passe */}
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            disabled={loginMutation.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loginMutation.isPending}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Case à cocher Se souvenir */}
                <FormField
                  control={loginForm.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loginMutation.isPending}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-600 cursor-pointer">
                          Se souvenir de moi
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </Form>

            {/* Liens mot de passe oublié et inscription */}
            <div className="text-center mt-6 space-y-3">
              <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal">
                Mot de passe oublié ?
              </Button>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-600 text-sm mb-3">
                  Pas encore membre ?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/recruitment/step1'}
                  className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 font-medium transition-all duration-200"
                >
                  S'inscrire
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support info */}
        <div className="text-center mt-8">
          <p className="text-blue-100 text-sm flex items-center justify-center">
            <Phone className="h-4 w-4 mr-2" />
            Support : contact@synergiemarketingroup.fr
          </p>
        </div>
      </div>
    </div>
  );
}