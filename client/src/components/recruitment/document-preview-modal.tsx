import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Mail, Pencil } from "lucide-react";
import { RecruitmentDocument } from "@shared/schema";

interface DocumentPreviewModalProps {
  document: RecruitmentDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onSignRequest?: (documentId: number, documentName: string) => void;
  onEmailRequest?: (documentId: number, documentName: string) => void;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
  onSignRequest,
  onEmailRequest
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    if (document && document.contenuDocument && isOpen) {
      setPreviewHtml(document.contenuDocument);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [document, isOpen]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (document && document.contenuDocument) {
      // Téléchargement direct du document
      const docContent = document.contenuDocument;
      const docName = document.nomFichier || "document.html";
      
      const blob = new Blob([docContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien pour télécharger
      const downloadLink = globalThis.document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = docName;
      downloadLink.click();
      
      // Nettoyer l'URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>
            Prévisualisation: {document?.nomFichier}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md my-4" style={{ height: "65vh" }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              className="p-6 h-full"
              style={{ 
                backgroundColor: "white", 
                overflowY: "auto"
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }} 
            />
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {document && !document.estSigne && onSignRequest && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onClose();
                  onSignRequest(document.id, document.nomFichier);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Signer
              </Button>
            )}
            
            {document && document.estSigne && onEmailRequest && document.type === 'attestationFormation' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onClose();
                  onEmailRequest(document.id, document.nomFichier);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Fermer
              </Button>
            </DialogClose>
            
            <Button 
              type="button" 
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}