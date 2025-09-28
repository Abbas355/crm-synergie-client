import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  onReturnToList?: () => void;
}

export function SuccessModal({ isOpen, onClose, clientName, onReturnToList }: SuccessModalProps) {
  const handleClose = () => {
    onClose();
    if (onReturnToList) {
      onReturnToList();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Félicitations pour cette
            <br />
            nouvelle vente !
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Bravo ! Vous avez ajouté <span className="font-semibold text-gray-900">{clientName}</span> à votre
            <br />
            portefeuille client.
          </p>
          <p className="text-gray-600">
            Continuez votre excellent travail !
          </p>
          
          <Button 
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            Retour à la liste des clients
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}