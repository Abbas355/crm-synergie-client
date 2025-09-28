import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CheckCircle, PenTool, Trash2, X, ArrowLeft, ArrowRight, FileText, Download, Eye } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";

import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RecruteData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  codeVendeur: string;
  etapeActuelle: string;
  signatureElectronique?: string | null;
}

export default function Step4Attestation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  
  // États pour les résultats des quiz
  const [quiz1, setQuiz1] = useState("");
  const [quiz2, setQuiz2] = useState("");
  const [quiz3, setQuiz3] = useState("");
  const [moyenne, setMoyenne] = useState(0);
  const [canSign, setCanSign] = useState(false);

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
          const parsedData = JSON.parse(cached);
          return {
            recrueId: parsedData.recrueId || parsedData.id,
            prenom: parsedData.prenom,
            codeVendeur: parsedData.codeVendeur
          };
        } catch (e) {
          console.warn('Erreur parsing cached params:', e);
        }
      }
    }
    
    // Sauvegarder dans sessionStorage
    if (data.recrueId) {
      sessionStorage.setItem('recruitment_params', JSON.stringify(data));
    }
    
    return data;
  });

  const { recrueId, prenom, codeVendeur } = urlParams;

  // Récupérer les données complètes du recruté
  const { data: recrueData } = useQuery<RecruteData>({
    queryKey: [`/api/recruitment/recrue?recrueId=${recrueId}`],
    enabled: !!recrueId,
  });

  // Synchroniser l'état local avec les données de la base
  useEffect(() => {
    console.log("🔍 Step4 - recrueData:", recrueData);
    console.log("🔍 Step4 - recrueId:", recrueId);
    
    // Synchroniser l'état de la signature avec la base de données
    if (recrueData?.signatureElectronique) {
      setHasSignature(true);
      console.log("✅ Signature détectée en base de données");
    } else {
      setHasSignature(false);
      console.log("❌ Aucune signature en base de données");
    }
  }, [recrueData, recrueId]);

  // Calcul automatique de la moyenne
  useEffect(() => {
    const q1 = parseFloat(quiz1) || 0;
    const q2 = parseFloat(quiz2) || 0;
    const q3 = parseFloat(quiz3) || 0;
    
    if (quiz1 && quiz2 && quiz3) {
      const avg = (q1 + q2 + q3) / 3;
      setMoyenne(avg);
      setCanSign(avg >= 80);
    } else {
      setMoyenne(0);
      setCanSign(false);
    }
  }, [quiz1, quiz2, quiz3]);

  // Initialisation du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration initiale uniquement
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Effacer la signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Valider l'attestation
  const handleValidateAttestation = async () => {
    if (!canSign) {
      toast({
        title: "Résultats requis",
        description: "Veuillez saisir les 3 résultats avec une moyenne ≥ 80%.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasSignature) {
      toast({
        title: "Signature requise",
        description: "Veuillez signer dans la zone prévue avant de valider.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Récupérer la signature en base64
      const canvas = canvasRef.current;
      if (!canvas) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer la signature.",
          variant: "destructive",
        });
        return;
      }
      
      const signatureDataUrl = canvas.toDataURL('image/png');
      
      // Sauvegarder la signature et les résultats en base de données
      const response = await fetch('/api/recruitment/save-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recrueId: parseInt(recrueId!),
          signature: signatureDataUrl,
          quiz1: parseFloat(quiz1),
          quiz2: parseFloat(quiz2),
          quiz3: parseFloat(quiz3),
          moyenne: moyenne
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      // Sauvegarder la validation dans sessionStorage aussi
      sessionStorage.setItem('attestation_signed', 'true');
      sessionStorage.setItem('quiz_results', JSON.stringify({
        quiz1: parseFloat(quiz1),
        quiz2: parseFloat(quiz2),
        quiz3: parseFloat(quiz3),
        moyenne
      }));
      
      toast({
        title: "Attestation validée",
        description: "Votre signature électronique a été enregistrée avec succès.",
      });

      // Rediriger vers l'étape 6 (finalisation avec photo d'identité)
      setLocation(`/recruitment/step6-complete-form?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`);
    } catch (error) {
      console.error('Erreur sauvegarde signature:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de la signature.",
        variant: "destructive",
      });
    }
  };

  // Gérer l'ouverture de la modal de signature
  const handleSignClick = () => {
    if (!canSign) {
      toast({
        title: "Accès restreint",
        description: "Complétez d'abord les 3 quiz avec une moyenne ≥ 80%.",
        variant: "destructive",
      });
      return;
    }
    setShowSignatureModal(true);
  };

  // Fermer la modal
  const handleCloseModal = () => {
    setShowSignatureModal(false);
  };

  // Date du jour
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Fonction pour générer le PDF
  const generatePDF = async (shouldDownload = false) => {
    try {
      // Trouver l'élément de l'attestation
      const attestationElement = document.querySelector('.attestation-content') as HTMLElement;
      if (!attestationElement) {
        toast({
          title: "Erreur",
          description: "Impossible de trouver le contenu de l'attestation",
          variant: "destructive"
        });
        return null;
      }

      // Créer un canvas de l'attestation
      const canvas = await html2canvas(attestationElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculer les dimensions pour le PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `Attestation_${recrueData?.prenom || prenom}_${recrueData?.nom || 'Vendeur'}_${today.replace(/\//g, '-')}.pdf`;

      if (shouldDownload) {
        // Télécharger le PDF
        pdf.save(fileName);
        
        // Envoyer aussi au serveur pour stockage dans le profil
        const pdfBlob = pdf.output('blob');
        await uploadAttestationToProfile(pdfBlob, fileName);
        
        toast({
          title: "PDF téléchargé",
          description: "L'attestation a été téléchargée et sauvegardée dans votre profil",
        });
      } else {
        // Utiliser la même méthode que les factures : endpoint serveur
        try {
          const url = `/api/recruitment/attestation/${recrueId}`;
          window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          
          toast({
            title: "Attestation ouverte",
            description: "L'attestation s'ouvre dans un nouvel onglet",
          });
        } catch (error) {
          console.error('Erreur ouverture attestation:', error);
          toast({
            title: "Erreur",
            description: "Impossible d'ouvrir l'attestation. Veuillez réessayer.",
            variant: "destructive",
          });
        }
      }

      return pdf;
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF",
        variant: "destructive"
      });
      return null;
    }
  };

  // Fonction pour uploader l'attestation au profil vendeur
  const uploadAttestationToProfile = async (pdfBlob: Blob, fileName: string) => {
    try {
      const formData = new FormData();
      formData.append('attestation', pdfBlob, fileName);
      formData.append('recrueId', recrueId || '');
      formData.append('type', 'attestation_formation');

      const response = await fetch('/api/recruitment/upload-attestation', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur upload attestation');
      }

      const result = await response.json();
      console.log('✅ Attestation uploadée:', result);
    } catch (error) {
      console.error('❌ Erreur upload attestation:', error);
      // Ne pas bloquer le téléchargement si l'upload échoue
    }
  };

  // Gérer la consultation PDF
  const handleViewPDF = () => {
    generatePDF(false);
  };

  // Gérer le téléchargement PDF
  const handleDownloadPDF = () => {
    generatePDF(true);
  };

  // Afficher la signature électronique (même méthode que pour les factures)
  const handleViewSignature = () => {
    if (!recrueData?.signatureElectronique) {
      toast({
        title: "Signature non disponible",
        description: "Aucune signature électronique trouvée pour ce candidat.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ouvrir la signature dans une nouvelle fenêtre comme les factures
      const signatureWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (signatureWindow) {
        signatureWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Signature Électronique - ${recrueData.prenom} ${recrueData.nom}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif; 
                  background: #f5f5f5;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                .signature-container {
                  background: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 600px;
                  width: 100%;
                }
                .signature-image {
                  max-width: 100%;
                  height: auto;
                  border: 2px solid #e2e8f0;
                  border-radius: 8px;
                  background: #fafafa;
                }
                .close-btn {
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  background: #ef4444;
                  color: white;
                  border: none;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  cursor: pointer;
                  font-size: 18px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .close-btn:hover {
                  background: #dc2626;
                }
              </style>
            </head>
            <body>
              <button class="close-btn" onclick="window.close()">&times;</button>
              <div class="signature-container">
                <h2>Signature Électronique</h2>
                <p><strong>${recrueData.prenom} ${recrueData.nom}</strong><br>
                Code Vendeur: ${recrueData.codeVendeur}</p>
                <img src="${recrueData.signatureElectronique}" alt="Signature" class="signature-image" />
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                  Signature capturée lors de l'attestation sur l'honneur
                </p>
              </div>
            </body>
          </html>
        `);
        signatureWindow.document.close();
      }
      
      toast({
        title: "Signature affichée",
        description: "La signature s'ouvre dans une nouvelle fenêtre",
      });
    } catch (error) {
      console.error('Erreur affichage signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'afficher la signature. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Effets de fond animés cohérents avec l'application */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Bouton de fermeture en position absolue - plus visible */}
        <Button
          onClick={() => setLocation(`/recruitment/step3?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`)}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-50 text-white hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Header moderne harmonisé */}
        <div className="py-3 px-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            
            <div className="text-center mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mx-auto w-fit shadow-xl text-center text-white">
                <div className="mb-4">
                  <div className="mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg w-fit border border-blue-100">
                    <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
                  </div>
                </div>
                <h1 className="text-xl sm:text-3xl font-bold text-white mb-2">
                  Attestation sur l'honneur
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Complétez vos informations pour générer votre attestation
                </p>
                
                {/* Sélecteur d'étapes à points colorés */}
                <div className="flex items-center justify-center mt-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <p className="text-blue-100 text-sm font-medium mt-2">
                  Étape 4 sur 5 - Attestation sur l'honneur
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur principal centré */}
        <div className="flex-1 flex items-start justify-center px-3 pb-4 sm:px-4 sm:pb-8">
          <div className="w-full max-w-2xl">
            <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/30 shadow-2xl">
          <CardHeader className="text-center pb-3 sm:pb-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-t-xl">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
              Attestation sur l'honneur
            </CardTitle>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Contenu de l'attestation */}
            <div className="attestation-content bg-gray-50 p-4 rounded-lg border space-y-3">
              <p className="text-base">
                Je soussigné(e) <strong>{recrueData?.prenom || prenom || '[Prénom]'} {recrueData?.nom || '[Nom]'}</strong>,
              </p>
              
              <p className="font-semibold text-gray-900 text-sm">
                ATTESTE SUR L'HONNEUR avoir suivi l'intégralité des modules de formation 
                obligatoires "Formation Vendeur à Domicile (VAD) - Free" et avoir obtenu 
                les résultats suivants :
              </p>

              {/* Saisie des résultats */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded space-y-2 sm:space-y-3">
                <p className="font-semibold text-gray-800 text-sm">Résultats des évaluations :</p>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Label htmlFor="quiz1" className="text-sm font-medium w-14 sm:w-16">Quiz 1:</Label>
                    <Input
                      id="quiz1"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={quiz1}
                      onChange={(e) => setQuiz1(e.target.value)}
                      placeholder="0"
                      className="w-16 sm:w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Label htmlFor="quiz2" className="text-sm font-medium w-14 sm:w-16">Quiz 2:</Label>
                    <Input
                      id="quiz2"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={quiz2}
                      onChange={(e) => setQuiz2(e.target.value)}
                      placeholder="0"
                      className="w-16 sm:w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Label htmlFor="quiz3" className="text-sm font-medium w-14 sm:w-16">Quiz 3:</Label>
                    <Input
                      id="quiz3"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={quiz3}
                      onChange={(e) => setQuiz3(e.target.value)}
                      placeholder="0"
                      className="w-16 sm:w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
                
                {moyenne > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className={`font-bold text-sm ${moyenne >= 80 ? 'text-green-700' : 'text-red-700'}`}>
                      Moyenne générale: {moyenne.toFixed(1)}%
                    </p>
                    {moyenne < 80 && (
                      <p className="text-red-600 text-xs mt-1">
                        Minimum requis: 80%
                      </p>
                    )}
                  </div>
                )}
              </div>


              <p className="text-gray-700 text-sm">
                Cette attestation engage ma responsabilité, et j'ai connaissance 
                que toute fausse déclaration m'expose à des sanctions conformément à 
                l'article 441-1 du Code pénal.
              </p>

              <p className="text-gray-700 text-sm">
                Fait le <strong>{today}</strong>
              </p>

              <div className="text-center mt-4">
                <p className="text-base font-semibold text-gray-800 mb-3">
                  Signature électronique :
                </p>
                
                {recrueData?.signatureElectronique || hasSignature ? (
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="text-green-600 font-semibold flex items-center justify-center text-sm mb-2">
                      ✓ Signature électronique authentifiée
                    </div>
                    <p className="text-green-700 text-xs text-center mb-3">
                      Document signé électroniquement de manière sécurisée
                    </p>
                    
                    {/* Boutons d'action pour la signature */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleViewSignature}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir la signature
                      </Button>
                      <Button
                        onClick={handleSignClick}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="text-red-600 font-semibold flex items-center justify-center text-sm mb-2">
                      ⚠️ Signature électronique manquante
                    </div>
                    <p className="text-red-700 text-xs text-center">
                      Veuillez refaire le processus de signature
                    </p>
                    <Button
                      onClick={handleSignClick}
                      disabled={!canSign}
                      className={`w-full mt-3 py-3 text-base font-semibold shadow-lg transform transition-all duration-200 ${
                        canSign 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Signer électroniquement
                    </Button>
                  </div>
                )}

                <p className="text-gray-600 mt-3 text-sm">
                  Code vendeur: <strong>{recrueData?.codeVendeur || codeVendeur || '[Code]'}</strong>
                </p>
                
                <p className="text-gray-500 text-xs mt-2">
                  © 2025 Synergie Marketing Group - Document officiel
                </p>
              </div>
            </div>

            {/* Boutons PDF - Optimisés pour mobile */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Actions PDF
                </h4>
                
                {/* Boutons empilés pour mobile avec design moderne */}
                <div className="space-y-3">
                  <Button
                    onClick={handleViewPDF}
                    variant="outline"
                    className="w-full h-14 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="h-5 w-5 mr-3" />
                    Consulter PDF
                  </Button>
                  
                  <Button
                    onClick={handleDownloadPDF}
                    className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Télécharger PDF
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Le téléchargement sauvegarde aussi dans votre profil (onglet Sécurité)
                </p>
              </div>
            </div>

            {/* Navigation et validation */}
            <div className="flex flex-col space-y-2 sm:space-y-3">
              {moyenne < 80 && moyenne > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                  <p className="text-red-700 text-xs sm:text-sm text-center">
                    ⚠️ Moyenne insuffisante ({moyenne.toFixed(1)}%). Minimum requis: 80%
                  </p>
                </div>
              )}
              
              <div className="flex justify-between space-x-2 sm:space-x-3">
                <Button
                  onClick={() => setLocation(`/recruitment/step3?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`)}
                  variant="outline"
                  className="flex-1 py-2 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Retour
                </Button>
                
                <Button
                  onClick={handleValidateAttestation}
                  disabled={!hasSignature || !canSign}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm"
                >
                  {hasSignature && canSign ? (
                    <>
                      Valider
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    </>
                  ) : (
                    <>
                      <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="truncate">{!canSign ? 'Complétez les quiz' : 'Signature requise'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de signature optimisée mobile */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <PenTool className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">Signature électronique</h3>
                </div>
                <Button
                  onClick={handleCloseModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-600 mt-2 text-sm">
                Signez dans la zone ci-dessous pour valider votre attestation sur l'honneur.
              </p>
            </div>

            <div className="p-4">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-blue-50">
                <div 
                  className="relative w-full bg-white border-2 border-blue-200 rounded overflow-hidden"
                  style={{ 
                    height: '140px',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    setIsDrawing(true);
                    ctx.strokeStyle = '#1e40af';
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.beginPath();
                    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!isDrawing) return;
                    
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    ctx.stroke();
                    setHasSignature(true);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setIsDrawing(false);
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={140}
                    className="w-full h-full cursor-crosshair touch-none"
                    style={{ 
                      imageRendering: 'auto',
                      touchAction: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      KhtmlUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  />
                  
                  {/* Indicateur visuel pour la zone de signature vide */}
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-blue-400 text-center opacity-60">
                        <div className="text-2xl mb-1">✍️</div>
                        <div className="text-sm font-medium">Signez ici</div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-center text-blue-600 text-sm mt-2 font-medium">
                  📝 Signez avec votre doigt ou stylet dans la zone blanche
                </p>
                {isDrawing && (
                  <p className="text-center text-green-600 text-xs mt-1 font-bold">
                    ✅ Dessin en cours...
                  </p>
                )}
                {hasSignature && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center text-green-600 text-xs font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Signature détectée
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4 space-x-3">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Effacer
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCloseModal}
                    variant="outline"
                    size="sm"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      if (hasSignature) {
                        setShowSignatureModal(false);
                        toast({
                          title: "Signature enregistrée",
                          description: "Votre signature a été sauvegardée.",
                        });
                      } else {
                        toast({
                          title: "Signature requise",
                          description: "Veuillez signer avant de valider.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!hasSignature}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Valider
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}