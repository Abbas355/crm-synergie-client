import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Download, User, Mail, Key, FileText, Building, MapPin, Phone } from "lucide-react";
import { useLocation } from "wouter";

export default function Step5Contrat() {
  const [, setLocation] = useLocation();
  const [contractData, setContractData] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Récupérer les données du contrat depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = {
      recrueId: urlParams.get('recrueId'),
      prenom: urlParams.get('prenom'),
      nom: urlParams.get('nom'),
      email: urlParams.get('email'),
      motDePasse: urlParams.get('motDePasse'),
      codeVendeur: urlParams.get('codeVendeur')
    };
    
    if (data.prenom && data.nom) {
      setContractData(data);
    }
  }, []);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Appel API pour générer le PDF du contrat
      const response = await fetch(`/api/recruitment/contrat-pdf/${contractData.recrueId}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrat_distribution_${contractData.prenom}_${contractData.nom}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données du contrat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de succès */}
        <div className="text-center mb-8">
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-t-2xl">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-100" />
            </div>
            <h1 className="text-3xl font-bold">Félicitations {contractData.prenom} !</h1>
            <p className="text-green-100 mt-2">Votre inscription est maintenant complète</p>
            
            {/* Indicateur d'étapes terminées */}
            <div className="flex justify-center mt-6 space-x-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-white text-green-600">
                  ✓
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informations de connexion */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Vos identifiants de connexion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email de connexion</p>
                    <p className="font-semibold text-gray-800">{contractData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Key className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Mot de passe généré</p>
                    <p className="font-mono font-bold text-green-800 text-lg">{contractData.motDePasse}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Code vendeur</p>
                    <p className="font-semibold text-purple-800">{contractData.codeVendeur}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Important :</strong> Conservez précieusement ces identifiants pour accéder à votre espace vendeur.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contrat de distribution */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrat de Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">CONTRAT DE DISTRIBUTION</h2>
                <p className="text-gray-600">Synergie Marketing Group</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Informations du distributeur</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom :</strong> {contractData.nom}</p>
                    <p><strong>Prénom :</strong> {contractData.prenom}</p>
                    <p><strong>Email :</strong> {contractData.email}</p>
                    <p><strong>Code distributeur :</strong> {contractData.codeVendeur}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Informations de l'entreprise</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Société :</strong> Synergie Marketing Group</p>
                    <p><strong>Secteur :</strong> Télécommunications</p>
                    <p><strong>Date d'entrée en vigueur :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-800">Article 1 - Objet du contrat</h3>
                <p>
                  Le présent contrat a pour objet de définir les conditions dans lesquelles {contractData.prenom} {contractData.nom} 
                  (ci-après "le Distributeur") commercialise les produits et services de télécommunications de la société 
                  Synergie Marketing Group (ci-après "la Société").
                </p>

                <h3 className="font-semibold text-gray-800">Article 2 - Obligations du distributeur</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Respecter les tarifs et conditions commerciales fixés par la Société</li>
                  <li>Assurer la promotion des produits dans le respect de l'image de marque</li>
                  <li>Fournir tous les justificatifs nécessaires pour les ventes réalisées</li>
                  <li>Respecter la réglementation en vigueur sur la vente de produits de télécommunications</li>
                </ul>

                <h3 className="font-semibold text-gray-800">Article 3 - Rémunération</h3>
                <p>
                  La rémunération du Distributeur est basée sur un système de commissions variables selon les produits vendus :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Freebox Ultra : 6 points</li>
                  <li>Freebox Essentiel : 5 points</li>
                  <li>Freebox Pop : 4 points</li>
                  <li>Forfait 5G : 1 point</li>
                </ul>

                <h3 className="font-semibold text-gray-800">Article 4 - Durée et résiliation</h3>
                <p>
                  Le présent contrat est conclu pour une durée indéterminée. Chacune des parties peut y mettre fin 
                  à tout moment moyennant un préavis de 30 jours par lettre recommandée avec accusé de réception.
                </p>

                <h3 className="font-semibold text-gray-800">Article 5 - Confidentialité</h3>
                <p>
                  Le Distributeur s'engage à respecter la confidentialité des informations commerciales et techniques 
                  qui lui seront communiquées dans le cadre de l'exécution du présent contrat.
                </p>
              </div>

              <Separator className="my-6" />

              <div className="text-center text-sm text-gray-600">
                <p>
                  En soumettant votre inscription, vous acceptez les termes et conditions de ce contrat de distribution.
                </p>
                <p className="mt-2">
                  <strong>Date de signature électronique :</strong> {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            {isGeneratingPDF ? 'Génération PDF...' : 'Télécharger le contrat PDF'}
          </Button>
          
          <Button
            onClick={() => setLocation('/auth')}
            variant="outline"
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            Accéder à mon espace vendeur
          </Button>
        </div>

        {/* Récapitulatif final */}
        <Card className="mt-8 backdrop-blur-sm bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Récapitulatif de votre inscription</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Formation validée</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Dossier complet</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Contrat généré</span>
                </div>
              </div>
              <p className="mt-4 text-green-700">
                Bienvenue dans l'équipe Synergie Marketing Group ! Vous pouvez maintenant accéder à votre espace vendeur 
                avec vos identifiants ci-dessus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}