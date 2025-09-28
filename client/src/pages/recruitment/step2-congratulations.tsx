import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, GraduationCap, ExternalLink, Clock, BookOpen, Award, ArrowRight, Mail } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";
import { useToast } from "@/hooks/use-toast";

interface RecruteData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  codeVendeur: string;
  etapeActuelle: string;
  codeParrainage: string;
  civilite: string;
  mobile: string;
  adresse: string;
  codePostal: string;
  ville: string;
  rgpdAccepted: boolean;
}

export default function Step2Congratulations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [instructionsValidated, setInstructionsValidated] = useState({
    formation: false,
    score: false,
    email: false,
  });

  // Récupérer l'ID de la recrue depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const recrueId = urlParams.get('recrueId');
  
  console.log("🔍 Step2 - recrueId récupéré:", recrueId);
  console.log("🔍 Step2 - URL complète:", window.location.href);

  // Récupérer les données de la recrue
  const apiUrl = `/api/recruitment/recrue?recrueId=${recrueId}`;
  console.log("🔍 URL API construite:", apiUrl);
  
  const { data: recrueData, isLoading: isLoadingData, error } = useQuery<RecruteData>({
    queryKey: [apiUrl],
    enabled: !!recrueId,
  });
  
  console.log("🔍 useQuery state:", { 
    hasData: !!recrueData, 
    isLoading: isLoadingData, 
    hasError: !!error,
    error: error?.message,
    recrueData
  });

  // Gérer l'affichage permanent des félicitations
  const handleContinueToFormation = () => {
    setShowInstructions(true);
  };

  // Vérifier si toutes les instructions sont validées
  const allInstructionsValidated = Object.values(instructionsValidated).every(Boolean);

  const handleAccessFormation = async () => {
    console.log("🚀 handleAccessFormation appelé");
    console.log("🔍 allInstructionsValidated:", allInstructionsValidated);
    console.log("🔍 instructionsValidated:", instructionsValidated);
    
    if (!allInstructionsValidated) {
      console.log("❌ Instructions non validées, arrêt");
      toast({
        title: "Instructions non validées",
        description: "Veuillez confirmer toutes les instructions avant de continuer",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Instructions validées, poursuite...");
    console.log("🔄 Début setIsLoading(true)");
    setIsLoading(true);
    console.log("✅ setIsLoading(true) terminé");
    
    console.log("🔄 Début du bloc try");
    try {
      console.log("📧 Préparation envoi email pour recrueId:", recrueId);
      
      // Si pas de recrueId, afficher quand même le popup pour la démonstration
      if (!recrueId) {
        console.log("⚠️ Pas de recrueId, affichage popup de démonstration");
        setShowEmailPopup(true);
        console.log("🎯 Popup de démonstration affiché");
        return;
      }
      
      // Envoyer l'email si recrueId est présent
      const emailResponse = await fetch('/api/recruitment/send-formation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recrueId })
      });
      console.log("📧 Réponse fetch reçue:", emailResponse.status);
      console.log("📧 Début parsing JSON...");

      const result = await emailResponse.json();
      console.log("📧 JSON parsé avec succès:", result);
      
      if (result.success) {
        console.log("✅ Email envoyé avec succès, affichage popup");
        // Afficher le popup au lieu de rediriger
        setShowEmailPopup(true);
        console.log("🎯 Popup affiché, pas de redirection");
        
      } else {
        console.log("❌ Email non envoyé, lancement erreur");
        throw new Error(result.message || 'Erreur envoi email');
      }
      
      console.log("🏁 Fin du bloc try, passage au finally");

    } catch (error) {
      console.log("⚠️ Entrée dans le bloc catch");
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      console.log("🔚 Entrée dans le bloc finally");
      setIsLoading(false);
      console.log("🔚 setIsLoading(false) terminé - fonction terminée");
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="animate-spin text-white text-2xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Effets de fond animés cohérents avec l'application */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {!showInstructions ? (
          // Page de félicitations permanente avec design moderne
          <>
            {/* Header moderne avec logo intégré */}
            <div className="py-6 px-4">
              <div className="max-w-2xl mx-auto">
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
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-blue-100/80 text-sm font-medium mt-2">
                      Étape 2 sur 5 - Inscription confirmée
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteneur principal centré */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
              <div className="w-full max-w-lg">
                <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="text-center py-12 px-8">
                    <div className="mb-8">
                      {/* Icône de succès avec animation */}
                      <div className="relative mx-auto w-32 h-32 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse opacity-20"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                          <CheckCircle className="h-16 w-16 text-white animate-bounce" />
                        </div>
                      </div>
                      
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                        Félicitations {urlParams.get('prenom') || 'candidat'} !
                      </h2>
                      
                      <p className="text-gray-600 mb-8 font-medium text-lg">
                        Votre inscription a été enregistrée avec succès
                      </p>
                      
                      {/* Code vendeur avec design moderne */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8 shadow-xl">
                        <div className="flex items-center justify-center mb-3">
                          <div className="bg-green-500 rounded-full p-2 mr-3">
                            <Award className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-green-800 font-bold text-lg">Votre code vendeur</h3>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-300 shadow-lg">
                          <code className="text-2xl font-mono font-bold text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg shadow-sm">
                            {(recrueData as any)?.codeVendeur || urlParams.get('codeVendeur') || 'Chargement...'}
                          </code>
                        </div>
                        <p className="text-green-600 text-sm mt-3 font-medium">
                          Notez bien ce code, il vous sera nécessaire pour la suite
                        </p>
                      </div>
                    </div>
                    
                    {/* Bouton pour continuer */}
                    <Button
                      onClick={handleContinueToFormation}
                      className="w-full h-14 text-lg font-semibold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-blue-500/30"
                    >
                      <ArrowRight className="h-5 w-5 mr-3" />
                      Continuer vers la formation
                      <GraduationCap className="h-5 w-5 ml-3" />
                    </Button>
                    
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Étape suivante : Formation obligatoire Free
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          // Page d'instructions de formation avec header moderne
          <>
            {/* Header moderne avec logo intégré */}
            <div className="py-6 px-4">
              <div className="max-w-2xl mx-auto">
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
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-blue-100/80 text-sm font-medium mt-2">
                      Étape 2 sur 5 - Formation obligatoire
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteneur principal centré */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
              <div className="w-full max-w-2xl">
                {/* Carte formulaire modernisée */}
                <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-4 shadow-lg">
                        <GraduationCap className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Formation obligatoire
                    </CardTitle>
                    <p className="text-gray-600 px-4 font-medium">
                      Instructions pour suivre la formation Free
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 p-8">
                    {/* Message d'information sur le lien externe */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-lg mb-6">
                      <div className="flex items-start space-x-3">
                        <ExternalLink className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-orange-800 mb-2">Information importante</h4>
                          <p className="text-orange-700 text-sm">
                            Le bouton "Accéder à la formation" vous redirigera vers un site externe (vad-doc.proxad.net) 
                            pour suivre la formation obligatoire Free. Cette redirection est normale et sécurisée.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Instructions principales */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Instructions importantes
                      </h3>
                      
                      <div className="space-y-4 text-blue-800">
                        <p className="font-semibold">
                          Complétez les modules obligatoires via l'espace de formation Free :
                        </p>
                        
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-300 shadow-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-semibold">Login :</span>
                              <code className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 rounded-lg ml-2 font-mono text-sm shadow-sm">FreeVAD</code>
                            </div>
                            <div>
                              <span className="font-semibold">Mot de passe :</span>
                              <code className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 rounded-lg ml-2 font-mono text-sm shadow-sm">Ultra2024@</code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-lg">
                          <Award className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p>
                            <span className="font-semibold">Score requis :</span> Un score supérieur à 80% au quiz est requis pour réussir la formation.
                          </p>
                        </div>
                        
                        <p className="text-sm italic bg-blue-50 border-l-4 border-blue-300 pl-4 py-2 rounded-r-lg">
                          Note: La formation aux offres est protégée par le même mot de passe que celui pour l'accès au site de formation.
                        </p>
                      </div>
                    </div>

                    {/* Validation des instructions */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">
                        Veuillez confirmer chaque instruction :
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-lg hover:border-blue-300 transition-colors">
                          <Checkbox
                            checked={instructionsValidated.formation}
                            onCheckedChange={(checked) =>
                              setInstructionsValidated(prev => ({ ...prev, formation: !!checked }))
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shadow-lg"
                          />
                          <label className="text-sm text-gray-700 cursor-pointer flex-1 font-medium">
                            J'ai pris connaissance des identifiants de connexion à l'espace formation (FreeVAD / Ultra2024@)
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-lg hover:border-blue-300 transition-colors">
                          <Checkbox
                            checked={instructionsValidated.score}
                            onCheckedChange={(checked) =>
                              setInstructionsValidated(prev => ({ ...prev, score: !!checked }))
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shadow-lg"
                          />
                          <label className="text-sm text-gray-700 cursor-pointer flex-1 font-medium">
                            Je comprends qu'un score supérieur à 80% est requis pour valider la formation
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-lg hover:border-blue-300 transition-colors">
                          <Checkbox
                            checked={instructionsValidated.email}
                            onCheckedChange={(checked) =>
                              setInstructionsValidated(prev => ({ ...prev, email: !!checked }))
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shadow-lg"
                          />
                          <label className="text-sm text-gray-700 cursor-pointer flex-1 font-medium">
                            J'ai pris connaissance que je vais recevoir un email avec les instructions et le lien de continuation
                          </label>
                        </div>
                      </div>
                    </div>



                    {/* Bouton d'accès formation */}
                    <div className="pt-6">
                      <Button
                        onClick={handleAccessFormation}
                        disabled={!allInstructionsValidated || isLoading}
                        className={`w-full h-14 text-lg font-semibold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                          allInstructionsValidated && !isLoading
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-green-500/30"
                            : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                            Envoi en cours...
                          </div>
                        ) : allInstructionsValidated ? (
                          <>
                            <Mail className="h-5 w-5 mr-3" />
                            Accéder à la formation
                            <ArrowRight className="h-5 w-5 ml-3" />
                          </>
                        ) : (
                          "Veuillez valider toutes les instructions"
                        )}
                      </Button>
                      

                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popup de confirmation d'envoi d'email */}
      <Dialog open={showEmailPopup} onOpenChange={setShowEmailPopup}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-white via-green-50 to-emerald-50 border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Email envoyé avec succès !
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <p className="text-gray-700 mb-6 font-medium text-lg">
              Un email sera envoyé avec vos accès à la formation
            </p>
            
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200 rounded-2xl p-4 mb-6 shadow-lg">
              <p className="text-green-800 font-semibold text-sm">
                📧 Vérifiez votre boîte mail (y compris les spams)
              </p>
            </div>
            
            <Button 
              onClick={() => {
                setShowEmailPopup(false);
                // Redirection vers la page de connexion
                setLocation('/auth');
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Compris, merci !
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}