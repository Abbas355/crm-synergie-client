import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/ui/page-container";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, CheckCircle2, ExternalLink, Upload, FileText, 
  Download, Eye, EyeOff, Pencil, Save, XCircle, RefreshCw, Mail
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, DialogClose, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RecruitmentProspect, DocumentType, RecruitmentDocument } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { DocumentPreviewModal } from "@/components/recruitment/document-preview-modal";

// Variant personnalisé pour les alerts de succès
const AlertSuccess = ({ children, ...props }: React.ComponentProps<typeof Alert>) => (
  <Alert {...props} className="border-green-500 bg-green-50">
    {children}
  </Alert>
);

// Composant pour afficher la liste des documents
interface DocumentListProps {
  prospectId: number;
  type?: DocumentType;
}

// Composant de pad de signature électronique
const SignaturePad = ({ onSign }: { onSign: (signature: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configuration du canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ajouter une ligne de signature
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
    
    // Ajouter du texte pour indiquer où signer
    ctx.font = '12px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText('Signez ici', 20, canvas.height - 30);
    
  }, []);
  
  // Gérer le début du dessin
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Obtenir les coordonnées
    let clientX, clientY;
    
    if ('touches' in e) {
      // Événement tactile
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Événement souris
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  // Dessiner pendant le mouvement
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Obtenir les coordonnées
    let clientX, clientY;
    
    if ('touches' in e) {
      // Événement tactile
      e.preventDefault(); // Empêcher le défilement sur mobile
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Événement souris
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  // Arrêter le dessin
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  // Effacer la signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redessiner la ligne de base
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
    
    // Ajouter du texte pour indiquer où signer
    ctx.font = '12px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText('Signez ici', 20, canvas.height - 30);
  };
  
  // Enregistrer la signature
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Convertir le canvas en base64
    const signature = canvas.toDataURL('image/png');
    onSign(signature);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="border rounded-md overflow-hidden">
        <canvas 
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-white touch-none"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Effacer
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={saveSignature}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          Enregistrer la signature
        </Button>
      </div>
    </div>
  );
};

// Modal de signature pour les documents
interface SignatureModalProps {
  documentId: number;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Modal d'envoi d'email pour les documents
interface EmailModalProps {
  documentId: number;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const SignatureModal = ({ documentId, documentName, isOpen, onClose }: SignatureModalProps) => {
  const [signature, setSignature] = useState<string | null>(null);
  const { signDocumentMutation } = useDocumentSign();
  
  const handleSign = (signatureData: string) => {
    setSignature(signatureData);
  };
  
  const handleSubmit = () => {
    if (!signature) {
      toast({
        title: "Signature manquante",
        description: "Veuillez signer le document avant de continuer.",
        variant: "destructive",
      });
      return;
    }
    
    signDocumentMutation.mutate(
      { 
        documentId, 
        signatureData: { signature } 
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Signer le document</DialogTitle>
          <DialogDescription>
            Veuillez apposer votre signature électronique sur le document
            <span className="font-medium"> "{documentName}"</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <SignaturePad onSign={handleSign} />
        </div>
        
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={!signature || signDocumentMutation.isPending}
          >
            {signDocumentMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Traitement en cours...
              </>
            ) : "Confirmer la signature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Modal d'envoi d'email
const EmailModal = ({ documentId, documentName, isOpen, onClose }: EmailModalProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { sendEmailMutation } = useDocumentEmail();
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email manquant",
        description: "Veuillez saisir l'adresse email du destinataire.",
        variant: "destructive",
      });
      return;
    }
    
    // Validation de base de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailMutation.mutate(
      { 
        documentId, 
        recipientEmail: email,
        recipientName: name
      },
      {
        onSuccess: () => {
          setEmail('');
          setName('');
          onClose();
        }
      }
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Envoyer par email</DialogTitle>
          <DialogDescription>
            Envoyez le document <span className="font-medium">"{documentName}"</span> par email à un destinataire.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient-email">Email du destinataire *</Label>
              <Input
                id="recipient-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="exemple@domaine.com"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="recipient-name">Nom du destinataire</Label>
              <Input
                id="recipient-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Nom et prénom (optionnel)"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!email || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Hook personnalisé pour la gestion des signatures
function useDocumentSign() {
  const signDocumentMutation = useMutation({
    mutationFn: async ({ documentId, signatureData }: { documentId: number, signatureData: { signature: string } }) => {
      const res = await apiRequest("POST", `/api/recruitment/documents/sign`, { 
        documentId,
        signatureData
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/recruitment/prospects/current'] 
      });
      
      // Invalider la liste des documents
      if (data.document?.prospectId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/recruitment/prospects/${data.document.prospectId}/documents`] 
        });
      }
      
      toast({
        title: "Document signé",
        description: "Le document a été signé électroniquement avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la signature du document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return { signDocumentMutation };
}

// Hook personnalisé pour l'envoi d'email
function useDocumentEmail() {
  const sendEmailMutation = useMutation({
    mutationFn: async ({ 
      documentId, 
      recipientEmail, 
      recipientName 
    }: { 
      documentId: number, 
      recipientEmail: string, 
      recipientName?: string 
    }) => {
      const res = await apiRequest("POST", `/api/recruitment/documents/send-email`, { 
        documentId,
        recipientEmail,
        recipientName
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Le document a été envoyé par email avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de l'envoi de l'email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return { sendEmailMutation };
}

function DocumentList({ prospectId, type }: DocumentListProps) {
  const { data: documents, isLoading } = useQuery<RecruitmentDocument[]>({
    queryKey: [`/api/recruitment/prospects/${prospectId}/documents`, type],
    enabled: !!prospectId,
  });
  
  // État pour le modal de signature
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    documentId: number;
    documentName: string;
  }>({
    isOpen: false,
    documentId: 0,
    documentName: '',
  });
  
  // État pour le modal d'envoi d'email
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    documentId: number;
    documentName: string;
  }>({
    isOpen: false,
    documentId: 0,
    documentName: '',
  });
  
  // État pour la prévisualisation du document
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    document: RecruitmentDocument | null;
  }>({
    isOpen: false,
    document: null,
  });

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Chargement des documents...</p>
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Aucun document disponible.</p>
      </div>
    );
  }
  
  // Ouvrir le modal de signature
  const openSignatureModal = (documentId: number, documentName: string) => {
    setSignatureModal({
      isOpen: true,
      documentId,
      documentName,
    });
  };
  
  // Fermer le modal de signature
  const closeSignatureModal = () => {
    setSignatureModal({
      ...signatureModal,
      isOpen: false,
    });
  };
  
  // Ouvrir le modal d'envoi d'email
  const openEmailModal = (documentId: number, documentName: string) => {
    setEmailModal({
      isOpen: true,
      documentId,
      documentName,
    });
  };
  
  // Fermer le modal d'envoi d'email
  const closeEmailModal = () => {
    setEmailModal({
      ...emailModal,
      isOpen: false,
    });
  };
  
  // Ouvrir le modal de prévisualisation
  const openPreviewModal = (document: RecruitmentDocument) => {
    setPreviewModal({
      isOpen: true,
      document,
    });
  };
  
  // Fermer le modal de prévisualisation
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      document: null,
    });
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">{doc.nomFichier}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(doc.dateUpload).toLocaleDateString("fr-FR")}
                {doc.estSigne && (
                  <span className="ml-2 text-green-600">• Signé</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0" 
              title="Prévisualiser le document"
              onClick={() => openPreviewModal(doc)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0" 
              title="Télécharger le document"
              onClick={() => {
                // URL directe pour le téléchargement
                const downloadUrl = `/documents/${doc.type === 'attestationFormation' ? 'attestations' : 'contracts'}/${doc.id}_${doc.nomFichier}`;
                window.open(downloadUrl, '_blank');
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {doc.type === 'attestationFormation' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-2 py-0" 
                title="Télécharger en PDF"
                onClick={() => {
                  if (doc.contenuDocument) {
                    // Utiliser html2pdf pour convertir le contenu en PDF
                    import('html2pdf.js').then(module => {
                      const html2pdf = module.default;
                      const element = document.createElement('div');
                      element.innerHTML = doc.contenuDocument || '';
                      document.body.appendChild(element);
                      
                      // Options pour le PDF
                      const options = {
                        margin: 10,
                        filename: `attestation_formation_${doc.id}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
                      };
                      
                      // Générer le PDF
                      html2pdf().from(element).set(options).save()
                        .then(() => {
                          document.body.removeChild(element);
                        });
                    });
                  } else {
                    // URL directe pour le téléchargement en PDF
                    const pdfUrl = `/documents/attestations/${doc.id}_${doc.nomFichier}?format=pdf`;
                    window.open(pdfUrl, '_blank');
                  }
                }}
              >
                PDF
              </Button>
            )}
            
            {/* Bouton d'envoi par email pour les attestations */}
            {doc.type === 'attestationFormation' && doc.estSigne && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0" 
                title="Envoyer par email"
                onClick={() => openEmailModal(doc.id, doc.nomFichier)}
              >
                <Mail className="h-4 w-4" />
              </Button>
            )}
            
            {!doc.estSigne && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0" 
                title="Signer le document"
                onClick={() => openSignatureModal(doc.id, doc.nomFichier)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {/* Modal de signature */}
      <SignatureModal 
        documentId={signatureModal.documentId}
        documentName={signatureModal.documentName}
        isOpen={signatureModal.isOpen}
        onClose={closeSignatureModal}
      />
      
      {/* Modal d'envoi d'email */}
      <EmailModal 
        documentId={emailModal.documentId}
        documentName={emailModal.documentName}
        isOpen={emailModal.isOpen}
        onClose={closeEmailModal}
      />
      
      {/* Modal de prévisualisation */}
      <DocumentPreviewModal
        document={previewModal.document}
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        onSignRequest={(documentId, documentName) => {
          closePreviewModal();
          openSignatureModal(documentId, documentName);
        }}
        onEmailRequest={(documentId, documentName) => {
          closePreviewModal();
          openEmailModal(documentId, documentName);
        }}
      />
    </div>
  );
}

export default function RecruitmentTunnel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("formation");
  const [formationTerminee, setFormationTerminee] = useState(false);
  const [attestationSurHonneur, setAttestationSurHonneur] = useState(false);
  const [contratSigne, setContratSigne] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    pieceIdentite: null as File | null,
    rib: null as File | null,
    adresse: "",
    codePostal: "",
    ville: "",
    // Champs supplémentaires pour le formulaire de recrutement
  });

  // Récupérer les données du prospect si déjà existant
  const { data: prospectData, isLoading } = useQuery<RecruitmentProspect>({
    queryKey: [`/api/recruitment/prospects/current`],
    enabled: !!user,
  });

  // Mutation pour mettre à jour le statut de formation
  const updateFormationStatus = useMutation({
    mutationFn: async (data: { formationCompletee: boolean }) => {
      const res = await apiRequest("PUT", `/api/recruitment/prospects/formation-status`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recruitment/prospects/current`] });
      toast({
        title: "Statut de formation mis à jour",
        description: "Votre progression a été enregistrée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour soumettre le formulaire complet
  const submitFormMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", `/api/recruitment/prospects/submit-form`, formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recruitment/prospects/current`] });
      setActiveTab("contrat");
      toast({
        title: "Formulaire soumis",
        description: "Vos informations ont été enregistrées, votre contrat sera généré prochainement.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la soumission",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour générer le contrat
  const generateContractMutation = useMutation({
    mutationFn: async () => {
      if (!prospectData?.id) throw new Error("Données prospect manquantes");
      const res = await apiRequest("POST", `/api/recruitment/prospects/generate-contract`, { 
        prospectId: prospectData.id 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/recruitment/prospects/current`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/recruitment/prospects/${prospectData?.id}/documents`] 
      });
      toast({
        title: "Contrat généré",
        description: "Votre contrat a été généré avec succès, vous pouvez le télécharger.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la génération du contrat",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour générer l'attestation de formation
  const generateAttestationMutation = useMutation({
    mutationFn: async () => {
      if (!prospectData?.id) throw new Error("Données prospect manquantes");
      const res = await apiRequest("POST", `/api/recruitment/prospects/generate-attestation`, { 
        prospectId: prospectData.id 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/recruitment/prospects/current`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/recruitment/prospects/${prospectData?.id}/documents`] 
      });
      toast({
        title: "Attestation générée",
        description: "Votre attestation de formation a été générée avec succès. Vous pouvez la télécharger et la signer.",
      });
      
      // Ouvrir l'attestation dans un nouvel onglet si on a l'URL du document
      if (data.document?.contenuDocument) {
        const blob = new Blob([data.document.contenuDocument], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la génération de l'attestation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // La fonctionnalité de signature de documents est maintenant gérée par le hook useDocumentSign
  
  // Mutation pour soumettre le contrat signé
  const submitContractMutation = useMutation({
    mutationFn: async () => {
      if (!contratSigne || !prospectData?.id) throw new Error("Contrat manquant");
      
      const formData = new FormData();
      formData.append("contratSigne", contratSigne);
      
      const res = await apiRequest("POST", `/api/recruitment/prospects/submit-contract`, formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recruitment/prospects/current`] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/recruitment/prospects/${prospectData?.id}/documents`] 
      });
      toast({
        title: "Contrat soumis",
        description: "Votre contrat signé a été enregistré avec succès. Vous êtes maintenant un vendeur agréé.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la soumission du contrat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculer la progression générale
  const calculateProgress = () => {
    if (!prospectData) return 0;
    
    let totalSteps = 3; // Formation, Formulaire, Contrat
    let completedSteps = 0;
    
    if (prospectData.formationCompletee) completedSteps += 1;
    if (prospectData.formulaireComplete) completedSteps += 1;
    if (prospectData.contratSigne) completedSteps += 1;
    
    return (completedSteps / totalSteps) * 100;
  };

  // Gérer le changement d'onglet
  useEffect(() => {
    if (prospectData) {
      if (!prospectData.formationCompletee) {
        setActiveTab("formation");
      } else if (!prospectData.formulaireComplete) {
        setActiveTab("formulaire");
      } else {
        setActiveTab("contrat");
      }
    }
  }, [prospectData]);

  // Gérer la soumission de la formation
  const handleFormationComplete = () => {
    if (formationTerminee && attestationSurHonneur) {
      updateFormationStatus.mutate({ 
        formationCompletee: true 
      });
    } else {
      toast({
        title: "Attestation requise",
        description: "Vous devez confirmer avoir terminé la formation et attester sur l'honneur que vous avez compris les règles.",
        variant: "destructive",
      });
    }
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pieceIdentite || !formData.rib) {
      toast({
        title: "Documents manquants",
        description: "Veuillez télécharger tous les documents requis.",
        variant: "destructive",
      });
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("pieceIdentite", formData.pieceIdentite);
    formDataToSubmit.append("rib", formData.rib);
    formDataToSubmit.append("adresse", formData.adresse);
    formDataToSubmit.append("codePostal", formData.codePostal);
    formDataToSubmit.append("ville", formData.ville);
    
    submitFormMutation.mutate(formDataToSubmit);
  };

  // Gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'pieceIdentite' | 'rib') => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        [fieldName]: e.target.files[0]
      });
    }
  };
  
  // Gérer le changement du fichier de contrat signé
  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContratSigne(e.target.files[0]);
    }
  };
  
  // Gérer la soumission du contrat signé
  const handleSubmitContract = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contratSigne) {
      toast({
        title: "Document manquant",
        description: "Veuillez télécharger votre contrat signé.",
        variant: "destructive",
      });
      return;
    }
    
    submitContractMutation.mutate();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container pb-24 overflow-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <BackButton />
            <h1 className="text-2xl font-semibold">Tunnel de Recrutement</h1>
            <div className="w-8"></div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="formation" 
                disabled={!user}
                className={prospectData?.formationCompletee ? "bg-green-50" : ""}
              >
                {prospectData?.formationCompletee && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                Formation
              </TabsTrigger>
              <TabsTrigger 
                value="formulaire" 
                disabled={!prospectData?.formationCompletee}
                className={prospectData?.formulaireComplete ? "bg-green-50" : ""}
              >
                {prospectData?.formulaireComplete && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                Formulaire
              </TabsTrigger>
              <TabsTrigger 
                value="contrat" 
                disabled={!prospectData?.formulaireComplete}
                className={prospectData?.contratSigne ? "bg-green-50" : ""}
              >
                {prospectData?.contratSigne && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
                Contrat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="formation" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formation Obligatoire</CardTitle>
                  <CardDescription>
                    Complétez les modules de formation pour pouvoir vous inscrire en tant que vendeur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Instructions</AlertTitle>
                    <AlertDescription>
                      1. Accédez à l'espace de formation en cliquant sur le lien ci-dessous<br />
                      2. Connectez-vous avec les identifiants fournis<br />
                      3. Complétez tous les modules obligatoires<br />
                      4. Passez le quiz final<br />
                      5. Attestez sur l'honneur avoir suivi la formation
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="bg-blue-50 border-blue-500">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-700">Important</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      N'oubliez pas de faire une capture d'écran de vos résultats pour finaliser votre dossier d'inscription.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center mt-4">
                    <a 
                      href="http://vad-doc.proxad.net/login.html" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      Accéder à l'espace de formation
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-semibold">Identifiants de connexion :</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="login">Login</Label>
                        <Input id="login" value="FreeVAD" readOnly />
                      </div>
                      <div>
                        <Label htmlFor="password">Mot de passe</Label>
                        <div className="relative">
                          <Input 
                            id="password" 
                            value="Ultra2024@" 
                            type={showPassword ? "text" : "password"} 
                            readOnly 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="formation-terminee" 
                        checked={formationTerminee}
                        onCheckedChange={(checked) => setFormationTerminee(checked as boolean)} 
                      />
                      <Label 
                        htmlFor="formation-terminee"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        J'ai terminé tous les modules de formation
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="attestation-honneur" 
                        checked={attestationSurHonneur}
                        onCheckedChange={(checked) => setAttestationSurHonneur(checked as boolean)} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor="attestation-honneur"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          J'atteste sur l'honneur que :
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          J'ai suivi l'intégralité de la formation et compris toutes les règles concernant 
                          les droits et obligations des vendeurs. Je m'engage à respecter les procédures 
                          et les règles éthiques de vente présentées durant la formation.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <div className="flex w-full justify-between">
                    <div className="text-sm text-muted-foreground">
                      {prospectData?.formationCompletee 
                        ? "Formation validée par attestation sur l'honneur" 
                        : "Formation non complétée"}
                    </div>
                    <Button 
                      onClick={handleFormationComplete}
                      disabled={!formationTerminee || !attestationSurHonneur || Boolean(prospectData?.formationCompletee)}
                    >
                      Valider la formation
                    </Button>
                  </div>
                  
                  {prospectData?.formationCompletee && (
                    <div className="border-t pt-4">
                      <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold">Attestation de formation validée</h4>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez générer votre attestation de formation pour témoigner de la réussite de votre formation.
                        </p>
                        <Button 
                          onClick={() => generateAttestationMutation.mutate()}
                          disabled={generateAttestationMutation.isPending}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          {generateAttestationMutation.isPending 
                            ? "Génération en cours..." 
                            : "Générer l'attestation de formation"}
                        </Button>
                        
                        {/* Liste des attestations générées */}
                        <div className="mt-2">
                          <DocumentList 
                            prospectId={prospectData.id} 
                            type="attestationFormation" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="formulaire" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formulaire d'Inscription</CardTitle>
                  <CardDescription>
                    Complétez le formulaire et téléchargez les documents requis pour établir votre contrat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adresse">Adresse complète</Label>
                        <Textarea 
                          id="adresse" 
                          value={formData.adresse}
                          onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="codePostal">Code postal</Label>
                          <Input 
                            id="codePostal" 
                            value={formData.codePostal}
                            onChange={(e) => setFormData({...formData, codePostal: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="ville">Ville</Label>
                          <Input 
                            id="ville" 
                            value={formData.ville}
                            onChange={(e) => setFormData({...formData, ville: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Pièce d'identité</Label>
                        <div className="border rounded-md p-3">
                          <label className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formData.pieceIdentite ? formData.pieceIdentite.name : "Télécharger votre pièce d'identité"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'pieceIdentite')}
                              required={!prospectData?.pieceIdentiteDeposee}
                            />
                            <span className="text-xs text-muted-foreground">
                              Formats acceptés : PDF, JPG, PNG
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Relevé d'Identité Bancaire</Label>
                        <div className="border rounded-md p-3">
                          <label className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formData.rib ? formData.rib.name : "Télécharger votre RIB"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'rib')}
                              required={!prospectData?.ribDepose}
                            />
                            <span className="text-xs text-muted-foreground">
                              Formats acceptés : PDF, JPG, PNG
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={prospectData?.formulaireComplete || submitFormMutation.isPending}
                    >
                      {submitFormMutation.isPending ? "Envoi en cours..." : "Soumettre le formulaire"}
                    </Button>
                  </form>
                </CardContent>
                {prospectData?.formulaireComplete && (
                  <CardFooter>
                    <AlertSuccess className="w-full">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Formulaire complété</AlertTitle>
                      <AlertDescription>
                        Vos informations et documents ont été enregistrés avec succès.
                      </AlertDescription>
                    </AlertSuccess>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="contrat" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contrat</CardTitle>
                  <CardDescription>
                    Votre contrat sera généré après vérification de vos informations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!prospectData?.contratGenere ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Contrat en cours de préparation</AlertTitle>
                      <AlertDescription>
                        Votre contrat est en cours de préparation. Vous recevrez une notification dès qu'il sera disponible.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <AlertSuccess>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Contrat disponible</AlertTitle>
                        <AlertDescription>
                          Votre contrat est maintenant disponible. Veuillez le télécharger, le signer et le renvoyer.
                        </AlertDescription>
                      </AlertSuccess>
                      
                      {/* Affichage du contrat vierge */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Contrat à signer :</h3>
                        <div className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 mr-3" />
                            <div>
                              <div className="font-medium">Contrat de vendeur</div>
                              <div className="text-sm text-muted-foreground">PDF, format standard</div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateContractMutation.mutate()}
                            disabled={generateContractMutation.isPending}
                          >
                            {generateContractMutation.isPending ? "En cours..." : "Télécharger"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Liste des documents du prospect */}
                      {prospectData && (
                        <div className="mt-4 space-y-3">
                          <h3 className="text-sm font-semibold">Vos documents :</h3>
                          <DocumentList prospectId={prospectData.id} />
                        </div>
                      )}
                      
                      <div className="space-y-2 mt-4">
                        <Label>Contrat signé</Label>
                        <div className="border rounded-md p-3">
                          <label className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {contratSigne ? contratSigne.name : "Télécharger votre contrat signé"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf"
                              onChange={handleContractFileChange}
                              disabled={Boolean(prospectData?.contratSigne)}
                            />
                            <span className="text-xs text-muted-foreground">
                              Format accepté : PDF
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4"
                        onClick={handleSubmitContract}
                        disabled={Boolean(prospectData?.contratSigne) || !contratSigne || submitContractMutation.isPending}
                      >
                        {submitContractMutation.isPending ? "Envoi en cours..." : "Envoyer le contrat signé"}
                      </Button>
                    </>
                  )}
                </CardContent>
                {prospectData?.contratSigne && (
                  <CardFooter>
                    <AlertSuccess className="w-full">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Contrat signé</AlertTitle>
                      <AlertDescription>
                        Votre contrat a été signé et validé. Vous êtes maintenant un vendeur agréé.
                      </AlertDescription>
                    </AlertSuccess>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}