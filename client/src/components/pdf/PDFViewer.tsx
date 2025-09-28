import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Printer, Eye } from "lucide-react";
import { genererFacturePDFSimple } from "@/utils/pdfGenerator";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  moisData: any;
  title: string;
}

export default function PDFViewer({ isOpen, onClose, moisData, title }: PDFViewerProps) {
  const [pdfDataUri, setPdfDataUri] = useState<string>("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (isOpen && moisData) {
      generatePDF();
      setShowFallback(false);
    }
    return () => {
      // Nettoyer les URLs blob lors du démontage
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [isOpen, moisData]);

  // Détection automatique si l'iframe ne fonctionne pas après 3 secondes
  useEffect(() => {
    if (pdfBlobUrl || pdfDataUri) {
      const timer = setTimeout(() => {
        // Sur mobile, activer le fallback par défaut si iframe pose problème
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          console.log('🔄 Mobile détecté - Activation fallback PDF par sécurité');
          setShowFallback(true);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [pdfBlobUrl, pdfDataUri]);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError("");
    
    try {
      console.log('🎯 GÉNÉRATION PDF VISUALISEUR - Début...', moisData);
      
      const doc = genererFacturePDFSimple(moisData, false);
      
      // Générer à la fois datauri (pour téléchargement) et blob (pour affichage)
      const pdfDataUri = doc.output('datauristring');
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      setPdfDataUri(pdfDataUri);
      setPdfBlobUrl(blobUrl);
      console.log('✅ PDF généré pour visualiseur avec blob URL');
      
    } catch (err) {
      console.error('❌ ERREUR GÉNÉRATION PDF VISUALISEUR:', err);
      setError("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    try {
      console.log('🎯 DÉBUT TÉLÉCHARGEMENT PDF...', { pdfDataUri: pdfDataUri.substring(0, 50) + '...' });
      
      const filename = `facture-commission-${moisData?.mois?.replace(' ', '-')?.toLowerCase()}-${new Date().getFullYear()}.pdf`;
      
      // Méthode mobile-first
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Sur mobile, ouvrir directement le PDF dans un nouvel onglet pour permettre le téléchargement
        const downloadWindow = window.open('', '_blank');
        if (downloadWindow) {
          downloadWindow.document.write(`
            <html>
              <head>
                <title>Téléchargement - ${filename}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background: #f8f9fa;
                    text-align: center;
                  }
                  .download-container {
                    max-width: 400px;
                    margin: 50px auto;
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                  }
                  .download-btn {
                    display: block;
                    width: 100%;
                    padding: 15px;
                    background: #28a745;
                    color: white;
                    text-decoration: none;
                    text-align: center;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                    font-size: 16px;
                  }
                  .view-btn {
                    background: #007bff;
                  }
                </style>
              </head>
              <body>
                <div class="download-container">
                  <h2>📄 Facture de Commission</h2>
                  <p><strong>${moisData?.mois}</strong></p>
                  <p>Commission: ${moisData?.commission}€<br>
                     Points: ${moisData?.points}<br>
                     Ventes: ${moisData?.total}</p>
                  
                  <a href="${pdfDataUri}" download="${filename}" class="download-btn">
                    📥 Télécharger le PDF
                  </a>
                  
                  <a href="${pdfDataUri}" target="_blank" class="download-btn view-btn">
                    👁️ Voir le PDF
                  </a>
                </div>
                <script>
                  // Tentative de téléchargement automatique après 1 seconde
                  setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = '${pdfDataUri}';
                    link.download = '${filename}';
                    link.click();
                  }, 1000);
                </script>
              </body>
            </html>
          `);
          downloadWindow.document.close();
        } else {
          // Fallback direct
          window.location.href = pdfDataUri;
        }
      } else {
        // Desktop - méthode classique
        const a = document.createElement('a');
        a.href = pdfDataUri;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      console.log('✅ TÉLÉCHARGEMENT DEPUIS VISUALISEUR - Succès', filename);
    } catch (err) {
      console.error('❌ ERREUR TÉLÉCHARGEMENT VISUALISEUR:', err);
      // Fallback ultime
      window.location.href = pdfDataUri;
    }
  };

  const handlePrint = () => {
    try {
      console.log('🎯 DÉBUT IMPRESSION PDF...');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Facture Commission - ${moisData?.mois}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100vw; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUri}" onload="setTimeout(() => window.print(), 1000);"></iframe>
            </body>
          </html>
        `);
        printWindow.document.close();
        console.log('✅ IMPRESSION DEPUIS VISUALISEUR - Succès');
      }
    } catch (err) {
      console.error('❌ ERREUR IMPRESSION VISUALISEUR:', err);
    }
  };

  const handleOpenNewTab = () => {
    try {
      console.log('🎯 DÉBUT OUVERTURE NOUVEL ONGLET...');
      
      // Approche alternative pour mobile
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Facture Commission - ${moisData?.mois}</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  margin: 0; 
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background: #f5f5f5;
                }
                .container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  color: #333;
                }
                iframe {
                  width: 100%;
                  height: 600px;
                  border: none;
                  border-radius: 5px;
                }
                .download-btn {
                  display: block;
                  width: 100%;
                  padding: 15px;
                  background: #3b82f6;
                  color: white;
                  text-decoration: none;
                  text-align: center;
                  border-radius: 5px;
                  margin-top: 20px;
                  font-weight: bold;
                }
                @media (max-width: 768px) {
                  iframe { height: 400px; }
                  body { padding: 10px; }
                  .container { padding: 15px; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Facture Commission - ${moisData?.mois}</h2>
                  <p>Commission: ${moisData?.commission}€ | Points: ${moisData?.points} | Ventes: ${moisData?.total}</p>
                </div>
                <iframe src="${pdfDataUri}"></iframe>
                <a href="${pdfDataUri}" download="facture-commission-${moisData?.mois?.replace(' ', '-')?.toLowerCase()}-${new Date().getFullYear()}.pdf" class="download-btn">
                  📥 Télécharger le PDF
                </a>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback si popup bloqué
        window.location.href = pdfDataUri;
      }
      
      console.log('✅ OUVERTURE NOUVEL ONGLET - Succès');
    } catch (err) {
      console.error('❌ ERREUR OUVERTURE NOUVEL ONGLET:', err);
      // Fallback final
      window.location.href = pdfDataUri;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-5xl w-[95vw] md:w-[90vw] max-h-[95vh] h-[95vh] md:h-[90vh] p-0 overflow-hidden"
        aria-describedby="pdf-viewer-content"
      >
        <DialogHeader className="px-4 md:px-6 py-2 md:py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm md:text-lg font-semibold text-white truncate mr-2">
              {title} - {moisData?.mois}
            </DialogTitle>
            <div className="flex items-center gap-1 md:gap-2">
              {/* Boutons header cachés sur mobile (disponibles en bas) */}
              {pdfDataUri && (
                <>
                  <Button
                    onClick={handleDownload}
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex text-white hover:bg-white/20"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimer
                  </Button>
                </>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-1 md:p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="pdf-viewer-content" className="sr-only">
          Visualiseur de facture de commission pour {moisData?.mois}. Commission de {moisData?.commission}€ pour {moisData?.points} points CVD et {moisData?.total} ventes.
        </div>


        <div className="flex-1 bg-gray-100 overflow-auto">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Génération de l'aperçu en cours...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium">❌ Erreur</p>
                <p className="mt-2">{error}</p>
                <Button onClick={generatePDF} className="mt-4">
                  Réessayer
                </Button>
              </div>
            </div>
          ) : (pdfDataUri || pdfBlobUrl) ? (
            <div className="h-full w-full flex flex-col">
              {/* Preview PDF mobile et desktop optimisé */}
              <div className="h-full w-full flex flex-col">
                {/* Header info mobile compact */}
                <div className="md:hidden bg-white border-b px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">PDF Prêt</h3>
                      <p className="text-sm text-gray-600">Commission: {moisData?.commission}€ | Points: {moisData?.points} | {moisData?.total} ventes</p>
                    </div>
                  </div>
                </div>
                
                {/* PDF Preview - Iframe ou fallback intelligent */}
                <div className="flex-1 bg-white relative">
                  {!showFallback ? (
                    /* Iframe principal pour desktop et tentative mobile */
                    <iframe
                      src={pdfBlobUrl || pdfDataUri}
                      className="w-full h-full border-none"
                      title={`${title} - ${moisData?.mois}`}
                      style={{ minHeight: '400px' }}
                      onError={() => {
                        console.log('❌ Erreur iframe PDF - Basculement fallback');
                        setShowFallback(true);
                      }}
                    />
                  ) : (
                    /* Fallback mobile-friendly */
                    <div className="flex items-center justify-center h-full bg-gray-50 text-center p-6">
                      <div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Eye className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">PDF Prêt</h3>
                        <p className="text-gray-600 mb-4">Votre facture de commission est prête à être consultée.</p>
                        <p className="text-sm text-gray-500 mb-6">Utilisez les boutons ci-dessous pour l'ouvrir ou la télécharger.</p>
                        
                        {/* Bouton essayer aperçu */}
                        <Button
                          onClick={() => setShowFallback(false)}
                          variant="outline"
                          size="sm"
                          className="mb-4"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Essayer l'aperçu
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Boutons d'action mobile compacts en bas */}
                <div className="md:hidden bg-white border-t p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={handleDownload}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Télécharger
                    </Button>
                    
                    <Button
                      onClick={handleOpenNewTab}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Nouvel onglet
                    </Button>
                    
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Imprimer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-600">
                <p>Chargement du PDF en cours...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}