import { AppLayout } from "@/components/layout/app-layout";
import { GoogleAuthButton } from "@/components/google-auth/google-auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Shield, Zap, Calendar, Settings } from "lucide-react";

export default function GoogleSettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Paramètres Google
              </h1>
              <p className="text-gray-600">
                Gérez votre connexion Google et vos préférences de synchronisation
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Panneau de connexion Google */}
          <div className="space-y-6">
            <GoogleAuthButton />
            
            {/* Informations de sécurité */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Shield className="w-5 h-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-blue-800">
                  <p className="mb-2">
                    Votre connexion Google est sécurisée par OAuth 2.0
                  </p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Aucun mot de passe stocké</li>
                    <li>• Tokens chiffrés en base</li>
                    <li>• Accès révocable à tout moment</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Fonctionnalités
                </CardTitle>
                <CardDescription>
                  Ce que vous pouvez faire avec votre compte Google connecté
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Synchronisation Calendrier
                      </h4>
                      <p className="text-sm text-green-700">
                        Synchronisez automatiquement vos tâches avec Google Calendar
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Disponible
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-purple-900">
                        Profil Synchronisé
                      </h4>
                      <p className="text-sm text-purple-700">
                        Photo de profil et informations automatiquement mises à jour
                      </p>
                    </div>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      Actif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guide de configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Guide de Configuration</CardTitle>
                <CardDescription>
                  Étapes pour configurer votre authentification Google
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Pour les administrateurs :</strong> Configurez les variables d'environnement 
                    GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans les paramètres Replit.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions détaillées */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions de Configuration</CardTitle>
            <CardDescription>
              Procédure complète pour configurer l'authentification Google
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Créer un projet Google Cloud</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>• Allez sur <code className="bg-gray-100 px-2 py-1 rounded">console.cloud.google.com</code></li>
                  <li>• Créez un nouveau projet ou sélectionnez un projet existant</li>
                  <li>• Activez l'API Google Calendar et l'API Google+</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Configurer OAuth 2.0</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>• Allez dans "Identifiants" → "Créer des identifiants" → "ID client OAuth 2.0"</li>
                  <li>• Type d'application : Application Web</li>
                  <li>• URI de redirection autorisés : <code className="bg-gray-100 px-2 py-1 rounded">https://votre-app.replit.dev/auth/google/callback</code></li>
                  <li>• Récupérez votre CLIENT_ID et CLIENT_SECRET</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">3. Configurer les variables d'environnement</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800">
{`GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://votre-app.replit.dev/auth/google/callback`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">4. Redémarrer l'application</h3>
                <p className="text-sm text-gray-600 ml-4">
                  Redémarrez votre application Replit pour prendre en compte les nouvelles variables d'environnement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}