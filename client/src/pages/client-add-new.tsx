import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { NewClientFormComplete } from "@/components/clients/new-client-form-complete";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContractValidationSuccess } from "@/components/clients/contract-validation-success";

export default function ClientAddNew() {
  const [, setLocation] = useLocation();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");

  const handleSuccess = (clientFirstName: string) => {
    setNewClientFirstName(clientFirstName);
    setShowCongratulations(true);
  };



  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header avec bouton retour */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-3 text-gray-600 hover:text-gray-900"
              onClick={() => setLocation("/clients")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Nouveau Client</h1>
          </div>
        </div>



        {/* Formulaire complet */}
        <div className="py-6">
          <NewClientFormComplete 
            onSuccess={handleSuccess}
            onSubmit={(data) => {
              handleSuccess(data.prenom || "Client");
            }}
          />
        </div>

        {/* Message de félicitations personnalisé */}
        {showCongratulations && (
          <ContractValidationSuccess
            clientFirstName={newClientFirstName}
            onClose={() => {
              setShowCongratulations(false);
              setLocation("/clients");
            }}
            onBackToClientList={() => {
              setShowCongratulations(false);
              setLocation("/clients");
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}