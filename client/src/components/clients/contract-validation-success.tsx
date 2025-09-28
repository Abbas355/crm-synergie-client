import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

interface ContractValidationSuccessProps {
  clientFirstName: string;
  onClose: () => void;
  onBackToClientList: () => void;
}

export function ContractValidationSuccess({
  clientFirstName,
  onClose,
  onBackToClientList,
}: ContractValidationSuccessProps) {
  console.log("🎨 ContractValidationSuccess rendu avec prénom:", clientFirstName);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 relative">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu principal */}
        <div className="p-6 text-center">
          {/* Icône de succès */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Titre principal */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Félicitations pour cette
            <br />
            nouvelle vente !
          </h2>

          {/* Message personnalisé */}
          <div className="mb-6 text-gray-700">
            <p className="mb-2">
              Bravo ! Vous avez ajouté{" "}
              <span className="font-semibold text-indigo-600">{clientFirstName}</span>{" "}
              à votre portefeuille client.
            </p>
            <p className="text-sm">
              Continuez votre excellent travail !
            </p>
          </div>

          {/* Bouton d'action */}
          <Button
            onClick={onBackToClientList}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
          >
            Retour à la liste des clients
          </Button>
        </div>
      </div>
    </div>
  );
}