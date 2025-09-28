import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users } from "lucide-react";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientPrenom: string;
  onReturnToList: () => void;
}

export function CongratulationsModal({ 
  isOpen, 
  onClose, 
  clientPrenom, 
  onReturnToList 
}: CongratulationsModalProps) {
  const handleReturnToList = () => {
    onClose();
    onReturnToList();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-teal-950/30 rounded-lg -z-10"></div>
        
        <DialogHeader className="text-center pb-6">
          {/* Icône avec animation et glassmorphism */}
          <div className="relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-lg animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 shadow-xl">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Félicitations pour cette nouvelle vente !
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
              Bravo ! Vous avez ajouté <span className="font-bold text-slate-900 dark:text-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{clientPrenom}</span> à votre portefeuille client.
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Continuez votre excellent travail !
            </p>
          </div>
          
          <div className="pt-4">
            <Button
              onClick={handleReturnToList}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl py-3 font-semibold text-base"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Retour à la liste des clients
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}