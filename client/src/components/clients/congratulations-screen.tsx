import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, FilePlus, ArrowLeft } from "lucide-react";

interface CongratulationsScreenProps {
  clientName: string;
  onAddNewClient: () => void;
  onBackToList: () => void;
}

export function CongratulationsScreen({
  clientName,
  onAddNewClient,
  onBackToList,
}: CongratulationsScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Félicitations !
      </h2>
      
      <p className="text-lg mb-6">
        <span className="font-bold">{clientName}</span> a été ajouté avec succès.
      </p>
      
      <div className="border-t border-b py-6 my-6 w-full">
        <p className="text-muted-foreground mb-3">
          Que souhaitez-vous faire maintenant ?
        </p>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Button
            variant="outline"
            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-800 space-x-2 flex items-center"
            onClick={onAddNewClient}
          >
            <FilePlus className="w-4 h-4" />
            <span>Ajouter un autre client</span>
          </Button>
          
          <Button
            variant="outline"
            className="space-x-2 flex items-center"
            onClick={onBackToList}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste</span>
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        L'équipe technique va traiter votre dossier dans les plus brefs délais.
      </p>
    </div>
  );
}