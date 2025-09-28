import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";
import { useState } from "react";

export default function FacturesPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Récupérer l'utilisateur connecté pour obtenir son ID
      const userResponse = await fetch('/api/auth/user');
      if (!userResponse.ok) {
        throw new Error('Utilisateur non authentifié');
      }
      const userData = await userResponse.json();
      
      // Télécharger la facture pour juin 2025
      const response = await fetch(`/api/factures/commission/${userData.id}/2025-06`);
      if (!response.ok) {
        throw new Error('Erreur lors de la génération de la facture');
      }
      
      // Convertir la réponse en blob pour le téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-commission-juin-2025.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL blob
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur téléchargement facture:', error);
      alert('Impossible de télécharger la facture. Veuillez réessayer.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewLoading(true);
    try {
      // Utiliser l'endpoint d'aperçu avec l'ID utilisateur 16 (Eric Rostand) qui a des données
      const url = '/api/factures/apercu/16/2025-06';
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
    } catch (error) {
      console.error('Erreur aperçu facture:', error);
      alert('Impossible d\'afficher l\'aperçu de la facture. Veuillez réessayer.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header simplifié */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/30 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 text-center">Factures de Commission</h1>
        <p className="text-sm text-gray-600 text-center mt-1">Consultez et téléchargez vos factures mensuelles au format PDF</p>
      </div>
      
      <div className="p-4">
        {/* Carte de facture unique selon capture d'écran */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-lg rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {/* En-tête avec icône et période */}
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Juin</h2>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">2025</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-semibold">Disponible</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">730€</div>
                <div className="text-sm text-gray-600 font-medium">Commission</div>
              </div>
            </div>

            {/* Statistiques en grille 2x2 exact selon capture */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <div className="text-sm text-gray-600 mb-1">Installations</div>
                <div className="text-3xl font-bold text-gray-900">15</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Points</div>
                <div className="text-sm text-gray-600 mb-1">CVD</div>
                <div className="text-3xl font-bold text-gray-900">56</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-600 mb-1">Tranche</div>
                <div className="text-3xl font-bold text-purple-600">3</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Paliers</div>
                <div className="text-sm text-gray-600 mb-1">franchis</div>
                <div className="text-3xl font-bold text-green-600">11</div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Bouton Aperçu avec icône Eye */}
            <div className="text-center mb-6">
              <button 
                onClick={handlePreview}
                disabled={isPreviewLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                {isPreviewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Aperçu de la facture
                  </>
                )}
              </button>
            </div>
            
            {/* Bouton principal Télécharger PDF */}
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl text-base font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Télécharger PDF
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}