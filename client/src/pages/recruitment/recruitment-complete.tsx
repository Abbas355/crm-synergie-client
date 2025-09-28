import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, FileText, Key, Mail, Home } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";

export default function RecruitmentComplete() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Récupérer l'ID de la recrue depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const recrueId = urlParams.get('recrueId');

  // Récupérer les données finales de la recrue
  const { data: recrueData, isLoading } = useQuery({
    queryKey: ['/api/recruitment/recrue', recrueId],
    enabled: !!recrueId,
  });

  useEffect(() => {
    // Afficher le mot de passe après 3 secondes
    const timer = setTimeout(() => {
      setShowPassword(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="animate-spin text-white text-2xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      {/* Effets de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="mx-auto p-6 bg-gradient-to-br from-white/20 to-white/10 rounded-3xl shadow-2xl w-fit border border-white/30 backdrop-blur-xl">
            <SmgLogo variant="auth" className="h-20 w-auto max-w-[250px] object-contain mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mt-6">
            Inscription Finalisée !
          </h1>
          <p className="text-green-100 mt-2 text-lg">
            Félicitations {recrueData?.prenom}, votre dossier est complet
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
              Processus Terminé
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Récapitulatif */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-green-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Récapitulatif de votre inscription
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
                <div>
                  <span className="font-semibold">Nom complet :</span>
                  <p>{recrueData?.civilite} {recrueData?.prenom} {recrueData?.nom}</p>
                </div>
                <div>
                  <span className="font-semibold">Email :</span>
                  <p>{recrueData?.email}</p>
                </div>
                <div>
                  <span className="font-semibold">Code vendeur :</span>
                  <p className="font-mono text-lg">{recrueData?.codeVendeur}</p>
                </div>
                <div>
                  <span className="font-semibold">Parrain :</span>
                  <p>{recrueData?.codeParrainage}</p>
                </div>
              </div>
            </div>

            {/* Mot de passe d'accès */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Accès à votre interface vendeur
              </h3>
              
              {!showPassword ? (
                <div className="text-center py-4">
                  <div className="animate-pulse text-blue-700">
                    Génération de vos identifiants...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/70 rounded-lg p-4 border border-blue-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-blue-900">Email de connexion :</span>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded">{recrueData?.email}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-900">Mot de passe :</span>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded text-lg">
                          {recrueData?.motDePasseGenere}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>Important :</strong> Conservez précieusement ces identifiants. 
                      Ils vous permettront d'accéder à votre interface vendeur une fois votre contrat signé.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prochaines étapes */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-bold text-orange-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Prochaines étapes
              </h3>
              
              <div className="space-y-3 text-orange-800">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">1. Signature électronique du contrat</p>
                    <p className="text-sm">Vous recevrez un email avec le contrat à signer électroniquement dans les prochaines heures.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Download className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">2. Validation administrative</p>
                    <p className="text-sm">Nos équipes vérifieront vos documents sous 48h ouvrées.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">3. Activation de votre compte</p>
                    <p className="text-sm">Une fois tout validé, vous pourrez vous connecter à votre interface vendeur.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact support */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-700 text-sm">
                <strong>Besoin d'aide ?</strong><br />
                Contactez notre support : <a href="mailto:recrutement@synergiemarketingroup.fr" className="text-blue-600 hover:underline">recrutement@synergiemarketingroup.fr</a>
              </p>
            </div>

            {/* Bouton retour */}
            <div className="pt-6">
              <Button
                onClick={() => setLocation("/")}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Home className="h-5 w-5 mr-3" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}