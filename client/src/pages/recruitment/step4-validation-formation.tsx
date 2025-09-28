import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PenTool, Calculator, Award, AlertCircle, CheckCircle, FileText, Download, Trash2, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SmgLogo } from "@/components/ui/smg-logo";

export default function Step4ValidationFormation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [attestationGenerated, setAttestationGenerated] = useState(false);

  // États pour la saisie des résultats
  const [resultat1, setResultat1] = useState("");
  const [resultat2, setResultat2] = useState("");
  const [resultat3, setResultat3] = useState("");
  const [moyenne, setMoyenne] = useState<number | null>(null);
  const [showAttestation, setShowAttestation] = useState(false);

  // Récupération des paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const recrueId = urlParams.get('recrueId');
  const prenom = urlParams.get('prenom') || '';

  // Données du formulaire (récupérées depuis l'API)
  const [formData, setFormData] = useState({
    prenom: prenom,
    nom: "",
    adresse: "",
    codePostal: "",
    ville: "",
    formation: "Formation Vendeur à Domicile (VAD) - Free",
    tauxReussite: ""
  });

  // Calcul automatique de la moyenne
  useEffect(() => {
    if (resultat1 && resultat2 && resultat3) {
      const r1 = parseFloat(resultat1);
      const r2 = parseFloat(resultat2);
      const r3 = parseFloat(resultat3);
      
      console.log("Calcul moyenne - Valeurs:", { resultat1, resultat2, resultat3 });
      console.log("Calcul moyenne - Nombres:", { r1, r2, r3 });
      
      if (!isNaN(r1) && !isNaN(r2) && !isNaN(r3)) {
        const moyenneCalculee = (r1 + r2 + r3) / 3;
        console.log("Calcul moyenne - Résultat:", moyenneCalculee);
        setMoyenne(moyenneCalculee);
        setFormData(prev => ({
          ...prev,
          tauxReussite: `${moyenneCalculee.toFixed(1)}%`
        }));
      }
    } else {
      setMoyenne(null);
      setFormData(prev => ({
        ...prev,
        tauxReussite: ""
      }));
    }
  }, [resultat1, resultat2, resultat3]);

  // Récupération des données de la recrue depuis l'inscription
  useEffect(() => {
    if (recrueId) {
      fetchRecrueData();
    }
  }, [recrueId]);

  const fetchRecrueData = async () => {
    try {
      const response = await fetch(`/api/recruitment/recrues/${recrueId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Données recrue récupérées:', data);
        
        // Pré-remplir tous les champs avec les données d'inscription
        setFormData(prev => ({
          ...prev,
          prenom: data.prenom || prenom,
          nom: data.nom || '',
          adresse: data.adresse || '',
          codePostal: data.codePostal || '',
          ville: data.ville || '',
          formation: "Formation Vendeur à Domicile (VAD) - Free"
        }));

        toast({
          title: "Données récupérées",
          description: `Bonjour ${data.prenom}, vos informations d'inscription ont été automatiquement remplies.`,
        });
      }
    } catch (error) {
      console.error('Erreur récupération données recrue:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos données d'inscription",
        variant: "destructive"
      });
    }
  };

  // Gestion de la signature électronique - Version simplifiée et robuste
  const initSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas - dimensions fixes pour éviter les problèmes de scaling
    canvas.width = 350;
    canvas.height = 180;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;

    // Fonction pour obtenir les coordonnées - simplifiée
    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
      };
    };

    // Gestionnaires d'événements unifiés
    const handleStart = (e: any) => {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setHasSignature(true); // Marquer immédiatement qu'une signature a commencé
      console.log('Signature started at:', pos);
    };

    const handleMove = (e: any) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      console.log('Drawing at:', pos);
    };

    const handleEnd = (e: any) => {
      if (e) e.preventDefault();
      isDrawing = false;
      console.log('Signature ended, hasSignature:', true);
    };

    // Attacher les événements directement avec logs
    canvas.onmousedown = (e) => {
      console.log('Mouse down detected');
      handleStart(e);
    };
    canvas.onmousemove = handleMove;
    canvas.onmouseup = handleEnd;
    canvas.onmouseout = handleEnd;
    
    canvas.ontouchstart = (e) => {
      console.log('Touch start detected');
      handleStart(e);
    };
    canvas.ontouchmove = (e) => {
      console.log('Touch move detected');
      handleMove(e);
    };
    canvas.ontouchend = (e) => {
      console.log('Touch end detected');
      handleEnd(e);
    };
    canvas.ontouchcancel = handleEnd;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleValidateFormation = () => {
    if (!resultat1 || !resultat2 || !resultat3) {
      toast({
        title: "Résultats manquants",
        description: "Veuillez saisir les 3 résultats de vos quiz",
        variant: "destructive"
      });
      return;
    }

    if (moyenne === null || moyenne < 80) {
      toast({
        title: "Moyenne insuffisante",
        description: `Votre moyenne de ${moyenne?.toFixed(1)}% est inférieure à 80%. Vous devez repasser la formation.`,
        variant: "destructive"
      });
      return;
    }

    setShowAttestation(true);
  };

  const openSignatureDialog = () => {
    setShowSignatureDialog(true);
    setHasSignature(false);
    // Initialiser la signature après ouverture du dialog
    setTimeout(() => {
      initSignature();
      console.log('Canvas de signature initialisé');
    }, 300);
  };

  const handleSignatureComplete = async () => {
    if (!hasSignature) {
      toast({
        title: "Signature manquante",
        description: "Veuillez signer dans la zone prévue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas?.toDataURL('image/png') || '';

      const attestationData = {
        recrueId: parseInt(recrueId || '0'),
        prenom: formData.prenom,
        nom: formData.nom,
        adresse: formData.adresse,
        codePostal: formData.codePostal,
        ville: formData.ville,
        formation: formData.formation,
        resultat1: parseFloat(resultat1),
        resultat2: parseFloat(resultat2),
        resultat3: parseFloat(resultat3),
        moyenne: moyenne,
        tauxReussite: formData.tauxReussite,
        signatureDataUrl,
        dateAttestation: new Date().toISOString()
      };

      const response = await fetch('/api/recruitment/attestation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attestationData)
      });

      if (response.ok) {
        const result = await response.json();
        setAttestationGenerated(true);
        setShowSignatureDialog(false);
        toast({
          title: "Attestation générée",
          description: "Votre attestation sur l'honneur a été créée et sauvegardée avec succès",
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur génération attestation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de l'attestation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/recruitment/attestation/pdf/${recrueId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attestation_${formData.prenom}_${formData.nom}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le PDF",
        variant: "destructive"
      });
    }
  };

  const previewPDF = async () => {
    try {
      console.log('Tentative de prévisualisation PDF pour recrueId:', recrueId);
      const response = await fetch(`/api/recruitment/attestation/pdf/${recrueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Réponse PDF:', response.status, response.statusText);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('Blob PDF créé, taille:', blob.size);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        const errorText = await response.text();
        console.error('Erreur serveur PDF:', errorText);
        toast({
          title: "Erreur",
          description: "Impossible de générer le PDF",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur prévisualisation PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de prévisualiser le PDF",
        variant: "destructive"
      });
    }
  };

  const continueToNextStep = () => {
    setLocation(`/recruitment/step5-completion?recrueId=${recrueId}&prenom=${encodeURIComponent(formData.prenom)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Effets de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header moderne */}
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
                  Validation de votre formation
                </h1>
                <p className="text-blue-100/80 text-sm font-medium mt-2">
                  Saisissez vos résultats pour générer votre attestation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur principal */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl">
            {!showAttestation ? (
              /* Phase 1: Saisie des résultats */
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full p-4 shadow-lg">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Résultats de formation
                  </CardTitle>
                  <p className="text-gray-600 px-4 font-medium">
                    Saisissez les résultats de vos 3 quiz pour calculer votre moyenne
                  </p>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Une moyenne de 80% minimum est requise pour obtenir votre attestation sur l'honneur.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="resultat1" className="text-gray-700 font-semibold">
                          Quiz 1 (%) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="resultat1"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={resultat1}
                          onChange={(e) => setResultat1(e.target.value)}
                          className="h-12 text-center font-semibold text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resultat2" className="text-gray-700 font-semibold">
                          Quiz 2 (%) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="resultat2"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={resultat2}
                          onChange={(e) => setResultat2(e.target.value)}
                          className="h-12 text-center font-semibold text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resultat3" className="text-gray-700 font-semibold">
                          Quiz 3 (%) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="resultat3"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={resultat3}
                          onChange={(e) => setResultat3(e.target.value)}
                          className="h-12 text-center font-semibold text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        />
                      </div>
                    </div>

                    {moyenne !== null && (
                      <div className={`p-6 rounded-xl border-2 ${moyenne >= 80 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-center space-x-3">
                          {moyenne >= 80 ? (
                            <Award className="h-8 w-8 text-green-600" />
                          ) : (
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          )}
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Votre moyenne</p>
                            <p className={`text-3xl font-bold ${moyenne >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                              {moyenne.toFixed(1)}%
                            </p>
                            <p className={`text-sm ${moyenne >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                              {moyenne >= 80 ? 'Félicitations ! Vous pouvez obtenir votre attestation.' : 'Moyenne insuffisante. Vous devez repasser la formation.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleValidateFormation}
                      disabled={!resultat1 || !resultat2 || !resultat3}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-lg rounded-xl"
                    >
                      Valider ma formation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !attestationGenerated ? (
              /* Phase 2: Attestation sur l'honneur */
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Attestation sur l'honneur
                  </CardTitle>
                  <p className="text-gray-600 px-4 font-medium">
                    Votre moyenne de {moyenne?.toFixed(1)}% vous permet d'obtenir votre attestation
                  </p>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">ATTESTATION SUR L'HONNEUR</h3>
                        <p className="text-sm text-gray-600 mt-2">Formation Vendeur à Domicile (VAD) - Free</p>
                      </div>
                      
                      <div className="space-y-4 text-sm text-gray-700">
                        <p>
                          Je soussigné(e) <strong>{formData.prenom} {formData.nom}</strong>, 
                          {formData.adresse && formData.codePostal && formData.ville ? (
                            <>demeurant au <strong>{formData.adresse}, {formData.codePostal} {formData.ville}</strong>,</>
                          ) : (
                            <span className="text-orange-600 font-medium"> (adresse en cours de récupération...)</span>
                          )}
                        </p>
                        
                        <p>
                          <strong>ATTESTE SUR L'HONNEUR</strong> avoir suivi l'intégralité des modules de formation 
                          obligatoires "{formData.formation}" et avoir obtenu les résultats suivants :
                        </p>
                        
                        <div className="bg-white p-4 rounded border">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="font-semibold">Quiz 1</p>
                              <p className="text-lg text-blue-600">{resultat1}%</p>
                            </div>
                            <div>
                              <p className="font-semibold">Quiz 2</p>
                              <p className="text-lg text-blue-600">{resultat2}%</p>
                            </div>
                            <div>
                              <p className="font-semibold">Quiz 3</p>
                              <p className="text-lg text-blue-600">{resultat3}%</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t text-center">
                            <p className="font-semibold">Moyenne générale : <span className="text-green-600 text-xl">{moyenne?.toFixed(1)}%</span></p>
                          </div>
                        </div>
                        
                        <p>
                          Cette attestation engage ma responsabilité, et j'ai connaissance que toute fausse déclaration 
                          m'expose à des sanctions conformément à l'article 441-1 du Code pénal.
                        </p>
                        
                        <div className="text-right mt-8">
                          <p>Fait le {new Date().toLocaleDateString('fr-FR')}</p>
                          <p className="mt-2">Signature électronique :</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={openSignatureDialog}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 rounded-xl font-semibold"
                      >
                        <PenTool className="h-5 w-5 mr-2" />
                        Signer électroniquement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Phase 3: Attestation générée */
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Attestation générée avec succès !
                  </CardTitle>
                  <p className="text-gray-600 px-4 font-medium">
                    Votre document est disponible en téléchargement
                  </p>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="space-y-6 text-center">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-green-800 font-semibold">
                        {formData.prenom?.trim()} votre attestation sur l'honneur a été générée et sauvegardée dans votre profil vendeur.
                      </p>
                      <p className="text-green-700 text-sm mt-2">
                        Vous pourrez la consulter à tout moment depuis votre espace personnel.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          const finalRecrueId = recrueId || '19';
                          console.log('Ouverture PDF avec ID:', finalRecrueId);
                          window.open(`/api/recruitment/attestation/pdf/${finalRecrueId}`, '_blank');
                        }}
                        variant="outline"
                        className="w-full flex items-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                        disabled={!attestationGenerated}
                      >
                        <Eye className="h-5 w-5" />
                        Consulter l'attestation
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const finalRecrueId = recrueId || '19';
                          console.log('Téléchargement PDF avec ID:', finalRecrueId);
                          window.open(`/api/recruitment/attestation/pdf/${finalRecrueId}`, '_blank');
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        disabled={!attestationGenerated}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le PDF
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const finalRecrueId = recrueId || '19';
                          const finalPrenom = formData.prenom || 'Eric';
                          console.log('Navigation avec paramètres forcés:', { finalRecrueId, finalPrenom });
                          setLocation(`/recruitment/step5-reglement-interieur?recrueId=${finalRecrueId}&prenom=${encodeURIComponent(finalPrenom)}`);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Continuer l'inscription
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de signature électronique */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-blue-600" />
              Signature électronique
            </DialogTitle>
            <DialogDescription>
              Signez dans la zone ci-dessous pour valider votre attestation sur l'honneur.
              La signature électronique a la même valeur juridique qu'une signature manuscrite.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4 bg-gray-50 mx-auto max-w-sm sm:max-w-none">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded bg-white cursor-crosshair mx-auto block touch-none"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  msTouchAction: 'none',
                  userSelect: 'none'
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Signez avec votre doigt ou stylet
              </p>
              {hasSignature && (
                <p className="text-xs text-green-600 text-center mt-1 font-medium">
                  ✓ Signature détectée
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <Button
                variant="outline"
                onClick={clearSignature}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </Button>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSignatureDialog(false)}
                  className="flex-1 sm:flex-none"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSignatureComplete}
                  disabled={!hasSignature || isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 sm:flex-none"
                >
                  {isLoading ? "Génération..." : "Valider"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}