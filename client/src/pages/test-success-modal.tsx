import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { SuccessModal } from "@/components/clients/success-modal";
import { useLocation } from "wouter";

export default function TestSuccessModal() {
  const [showModal, setShowModal] = useState(false);
  const [, setLocation] = useLocation();

  const handleReturnToList = () => {
    setLocation("/clients");
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Test Modal de Félicitations</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Cliquez sur le bouton ci-dessous pour tester la modal de félicitations 
            qui s'affiche après l'ajout d'un client par un vendeur.
          </p>
          
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tester la modal de félicitations
          </Button>
        </div>

        <SuccessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          clientName="Inès"
          onReturnToList={handleReturnToList}
        />
      </div>
    </AppLayout>
  );
}