import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Award, FileText, Download, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompletionPage() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute('/recruitment/step5-completion');
  const { toast } = useToast();
  
  const [recrueData, setRecrueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const recrueId = new URLSearchParams(location.split('?')[1] || '').get('recrueId');

  console.log('CompletionPage - recrueId:', recrueId, 'location:', location);

  useEffect(() => {
    if (recrueId) {
      fetchRecrueData();
    } else {
      setIsLoading(false);
    }
  }, [recrueId]);

  const fetchRecrueData = async () => {
    try {
      console.log('Fetching recrue data pour ID:', recrueId);
      const response = await fetch(`/api/recruitment/recrues/${recrueId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Données recrue récupérées:', data);
        setRecrueData(data);
      } else {
        console.error('Erreur fetch recrue:', response.status);
      }
    } catch (error) {
      console.error('Erreur récupération données recrue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocuments = () => {
    toast({
      title: "Documents générés",
      description: "Vos documents ont été préparés pour téléchargement",
    });
    // Ici on pourrait implémenter la génération PDF des documents
    window.print();
  };

  const goToDashboard = () => {
    navigate('/recruitment/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <Award className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-4xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Félicitations {recrueData?.prenom} !
          </CardTitle>
          
          {/* Sélecteur d'étapes à points colorés */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
            </div>
          </div>
          <p className="text-emerald-600 text-sm font-medium mb-6">
            Étape 5 sur 5 - Processus terminé avec succès
          </p>
          
          <p className="text-xl text-gray-600 mb-6">
            Votre inscription est maintenant complète
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Processus d'inscription terminé avec succès
            </h3>
            <p className="text-green-700">
              Vous êtes maintenant officiellement inscrit(e) en tant que vendeur à domicile. 
              Votre code vendeur <strong>{recrueData?.codeVendeur}</strong> est actif.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Récapitulatif des étapes */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Étapes complétées
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">✓ Inscription initiale</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">✓ Formation VAD validée</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">✓ Attestation signée</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">✓ Dossier finalisé</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Vos informations
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom complet :</span>
                  <span className="font-semibold">{recrueData?.prenom} {recrueData?.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Code vendeur :</span>
                  <span className="font-mono font-bold text-blue-600">{recrueData?.codeVendeur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email :</span>
                  <span className="font-semibold">{recrueData?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className="font-semibold text-green-600">Actif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Prochaines étapes
            </h3>
            <ul className="space-y-2 text-blue-700">
              <li>• Vous recevrez un email de confirmation sous 24h</li>
              <li>• Votre responsable vous contactera pour l'accompagnement</li>
              <li>• Accédez à votre tableau de bord pour commencer</li>
              <li>• Consultez vos outils et ressources de vente</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={downloadDocuments}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3"
            >
              <Download className="h-5 w-5" />
              Télécharger mes documents
            </Button>
            
            <Button
              onClick={goToDashboard}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 px-8 py-3"
            >
              <Home className="h-5 w-5" />
              Accéder au tableau de bord
            </Button>
          </div>

          {/* Message de remerciement */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-lg">
              Merci de votre confiance et bienvenue dans l'équipe !
            </p>
            <p className="text-sm text-gray-500 mt-2">
              © 2025 Synergie Marketing Group - Tous droits réservés
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}