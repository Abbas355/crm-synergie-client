import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, Trophy, FileCheck, Award } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";

export default function Step6Finalisation() {
  const [, setLocation] = useLocation();

  // Récupérer les paramètres depuis l'URL et sessionStorage
  const [urlParams, setUrlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const data = {
      recrueId: params.get('recrueId'),
      prenom: params.get('prenom'),
      codeVendeur: params.get('codeVendeur')
    };
    
    // Récupérer depuis sessionStorage si vide
    if (!data.recrueId) {
      const cached = sessionStorage.getItem('recruitment_params');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Erreur parsing cached params:', e);
        }
      }
    }
    
    return data;
  });

  const { recrueId, prenom, codeVendeur } = urlParams;

  const handleReturnToHome = () => {
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('recruitment_params');
    sessionStorage.removeItem('attestation_signed');
    
    // Rediriger vers l'accueil ou l'application principale
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl shadow-lg w-fit border border-white/20 backdrop-blur-xl">
            <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mt-6">
            Félicitations !
          </h1>
          <p className="text-green-100 mt-2 text-lg">
            Votre inscription en tant que Vendeur à Domicile Indépendant est maintenant complète
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/30 shadow-2xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-t-xl">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent flex items-center justify-center">
              <Trophy className="h-6 w-6 mr-3 text-green-600" />
              Inscription finalisée
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {prenom}, vous avez accepté le règlement intérieur.
            </p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Message de félicitations */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Votre parcours est terminé
              </h2>
            </div>

            {/* Checklist de validation */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">Votre parcours est terminé</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Formation VAD validée</span>
                </div>
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Attestation sur l'honneur signée</span>
                </div>
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Règlement intérieur accepté</span>
                </div>
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Code vendeur attribué</span>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <Card className="bg-blue-50 border border-blue-200 mb-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Vos informations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-blue-700">
                  <p><strong>Nom complet :</strong> {prenom || '[Prénom]'} [Nom]</p>
                  <p><strong>Code vendeur :</strong> {codeVendeur || '[Code]'}</p>
                  <p><strong>Statut :</strong> Vendeur à Domicile Indépendant</p>
                  <p><strong>Date d'inscription :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Prochaines étapes */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Prochaines étapes
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>• Vous recevrez un email de confirmation dans les prochaines minutes</p>
                <p>• Votre accès à l'espace vendeur sera activé sous 24h</p>
                <p>• Un responsable vous contactera pour votre première mission</p>
                <p>• Consultez régulièrement votre espace personnel pour vos objectifs</p>
              </div>
            </div>

            {/* Bouton de retour */}
            <div className="text-center">
              <Button
                onClick={handleReturnToHome}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Accéder à l'application
              </Button>
              <p className="text-gray-500 text-sm mt-3">
                Bienvenue dans l'équipe Synergie Marketing Group !
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}