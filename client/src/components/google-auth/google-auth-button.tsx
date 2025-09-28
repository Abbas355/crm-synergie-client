import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Chrome, CheckCircle, XCircle, RefreshCw, Calendar, Mail, User } from "lucide-react";

interface GoogleAuthStatus {
  hasGoogleAuth: boolean;
  isTokenValid: boolean;
  email?: string;
  profileImage?: string;
}

export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer le statut de l'authentification Google
  const { data: authStatus, isLoading: statusLoading } = useQuery<GoogleAuthStatus>({
    queryKey: ["/auth/google/status"],
    queryFn: async () => {
      const response = await fetch("/auth/google/status", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors de la vérification du statut');
      return response.json();
    }
  });

  // Mutation pour rafraîchir les tokens
  const refreshTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/auth/google/refresh", {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors du rafraîchissement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/google/status"] });
      toast({
        title: "Tokens rafraîchis",
        description: "Votre connexion Google a été mise à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Rediriger vers l'authentification Google
    window.location.href = "/auth/google";
  };

  const handleRefreshTokens = () => {
    refreshTokensMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Chrome className="w-5 h-5 text-white" />
          </div>
          Authentification Google
        </CardTitle>
        <CardDescription>
          Connectez-vous avec votre compte Google pour accéder aux fonctionnalités avancées
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {authStatus?.hasGoogleAuth ? (
          <div className="space-y-4">
            {/* Statut de la connexion */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {authStatus.profileImage && (
                  <img 
                    src={authStatus.profileImage} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {authStatus.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    Compte Google connecté
                  </span>
                </div>
              </div>
              <Badge 
                variant={authStatus.isTokenValid ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {authStatus.isTokenValid ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Actif
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Expiré
                  </>
                )}
              </Badge>
            </div>

            {/* Fonctionnalités disponibles */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Fonctionnalités disponibles :</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Synchronisation Google Calendar
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-green-500" />
                  Notifications par email
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-purple-500" />
                  Profil synchronisé
                </div>
              </div>
            </div>

            {/* Bouton de rafraîchissement si nécessaire */}
            {!authStatus.isTokenValid && (
              <Button 
                onClick={handleRefreshTokens}
                disabled={refreshTokensMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {refreshTokensMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser la connexion
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                Aucun compte Google connecté
              </p>
            </div>
            
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Chrome className="w-4 h-4 mr-2" />
                  Se connecter avec Google
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}