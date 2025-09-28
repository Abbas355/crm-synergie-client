import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";
import { 
  Camera, 
  FileText, 
  CreditCard, 
  Heart, 
  Home, 
  User, 
  CheckCircle, 
  AlertCircle,
  Upload
} from "lucide-react";

interface VendorDocumentUploaderProps {
  userProfile: {
    id: number;
    photoProfile?: string | null;
    attestationHonneur?: string | null;
    pieceIdentite?: string | null;
    rib?: string | null;
    carteVitale?: string | null;
    justificatifDomicile?: string | null;
    documentsComplets?: boolean | null;
    derniereMajDocuments?: string | null;
  };
}

const documentTypes = [
  {
    key: "photoProfile",
    label: "Photo de profil",
    icon: Camera,
    description: "Photo d'identité récente (JPG, PNG - max 2MB)",
    color: "bg-blue-50 border-blue-200 text-blue-700"
  },
  {
    key: "attestationHonneur",
    label: "Attestation sur l'honneur",
    icon: FileText,
    description: "Document signé attestant de votre formation",
    color: "bg-green-50 border-green-200 text-green-700"
  },
  {
    key: "pieceIdentite",
    label: "Pièce d'identité",
    icon: User,
    description: "Carte d'identité, passeport ou permis de conduire",
    color: "bg-purple-50 border-purple-200 text-purple-700"
  },
  {
    key: "rib",
    label: "RIB",
    icon: CreditCard,
    description: "Relevé d'identité bancaire pour les paiements",
    color: "bg-amber-50 border-amber-200 text-amber-700"
  },
  {
    key: "carteVitale",
    label: "Carte vitale",
    icon: Heart,
    description: "Attestation de droits ou carte vitale",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700"
  },
  {
    key: "justificatifDomicile",
    label: "Justificatif de domicile",
    icon: Home,
    description: "Facture récente (électricité, gaz, internet)",
    color: "bg-rose-50 border-rose-200 text-rose-700"
  }
];

export function VendorDocumentUploader({ userProfile }: VendorDocumentUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  // Mutation pour sauvegarder les documents
  const saveDocumentMutation = useMutation({
    mutationFn: async ({ documentType, documentURL }: { documentType: string; documentURL: string }) => {
      const response = await apiRequest("PUT", "/api/profile/documents", {
        documentType,
        documentURL
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setUploadingDocument(null);
      
      const documentLabel = documentTypes.find(doc => doc.key === variables.documentType)?.label || variables.documentType;
      
      toast({
        title: "Document sauvegardé",
        description: `${documentLabel} mis à jour avec succès.`,
      });

      // Notification spéciale si tous les documents sont complets
      if (data.documentsComplets) {
        toast({
          title: "✅ Dossier complet !",
          description: "Tous vos documents ont été fournis. Votre dossier vendeur est maintenant complet.",
          duration: 8000,
        });
      }
    },
    onError: (error: Error) => {
      setUploadingDocument(null);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde du document",
        variant: "destructive",
      });
    },
  });

  // Fonction pour obtenir l'URL d'upload
  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  // Fonction appelée à la fin de l'upload
  const handleUploadComplete = (documentType: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const documentURL = uploadedFile.uploadURL;
      
      if (documentURL) {
        saveDocumentMutation.mutate({ documentType, documentURL });
      }
    }
  };

  // Calculer le statut global
  const documentsUploaded = documentTypes.filter(doc => 
    userProfile[doc.key as keyof typeof userProfile]
  ).length;
  const progressPercentage = Math.round((documentsUploaded / documentTypes.length) * 100);

  return (
    <div className="space-y-6">
      {/* Statut global */}
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {userProfile.documentsComplets ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600" />
            )}
            Dossier Vendeur
          </CardTitle>
          <div className="flex items-center justify-center gap-4">
            <Badge 
              variant={userProfile.documentsComplets ? "default" : "secondary"}
              className={userProfile.documentsComplets ? "bg-green-600" : "bg-amber-600"}
            >
              {documentsUploaded}/{documentTypes.length} documents
            </Badge>
            <span className="text-sm text-muted-foreground">
              {progressPercentage}% complété
            </span>
          </div>
          {userProfile.derniereMajDocuments && (
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(userProfile.derniereMajDocuments).toLocaleDateString('fr-FR')}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Grille des documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((documentType) => {
          const IconComponent = documentType.icon;
          const isUploaded = !!userProfile[documentType.key as keyof typeof userProfile];
          const isUploading = uploadingDocument === documentType.key;
          
          return (
            <Card 
              key={documentType.key} 
              className={`transition-all duration-200 ${
                isUploaded 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {documentType.label}
                  {isUploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {documentType.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={2 * 1024 * 1024} // 2MB
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleUploadComplete(documentType.key)}
                  buttonClassName={`w-full ${
                    isUploaded 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : isUploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#FF6B6B] hover:bg-[#FF5252]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Upload...</span>
                      </>
                    ) : isUploaded ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Remplacer</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Télécharger</span>
                      </>
                    )}
                  </div>
                </ObjectUploader>
                
                {isUploaded && (
                  <Badge 
                    variant="outline" 
                    className="mt-2 w-full justify-center text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    ✓ Document fourni
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message d'encouragement */}
      {!userProfile.documentsComplets && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">Finalisez votre dossier</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Il vous reste {documentTypes.length - documentsUploaded} document{documentTypes.length - documentsUploaded > 1 ? 's' : ''} à fournir pour compléter votre dossier vendeur. 
                  Une fois tous les documents fournis, votre photo de profil sera automatiquement mise à jour.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}