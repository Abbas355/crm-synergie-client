import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface ClientEditButtonProps {
  clientId: number;
  clientData: any;
}

export function ClientEditButton({ clientId, clientData }: ClientEditButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleUpdateClient = async () => {
    try {
      setIsSubmitting(true);
      
      // Validation côté client des champs requis
      if (!clientData.nom || clientData.nom.trim() === '') {
        throw new Error("Le nom du client est requis");
      }
      
      if (!clientData.prenom || clientData.prenom.trim() === '') {
        throw new Error("Le prénom du client est requis");
      }
      
      // ARCHITECTURE UNIFIÉE - Noms PostgreSQL exacts
      const essentialData = {
        civilite: clientData.civilite || null,
        prenom: clientData.prenom || null,
        nom: clientData.nom || null,
        email: clientData.email || null,
        telephone: clientData.telephone || null, // Architecture unifiée
        dateNaissance: clientData.dateNaissance || null, // Architecture unifiée
        adresse: clientData.adresse || null,
        codePostal: clientData.codePostal || null, // Architecture unifiée
        ville: clientData.ville || null,
        status: clientData.status || "enregistre",
        produit: clientData.produit || null, // Architecture unifiée
        identifiantContrat: clientData.identifiantContrat || null, // Architecture unifiée
        dateSignature: clientData.dateSignature || null, // Architecture unifiée
        commentaire: clientData.commentaire || null,
        source: clientData.source || "prospection_direct",
        // Ajouter les champs spécifiques aux dates conditionnelles
        ...(clientData.status === "rendez-vous" && { dateRendezVous: clientData.dateRendezVous || null }),
        ...(clientData.status === "installation" && { dateInstallation: clientData.dateInstallation || null })
      };
      
      console.log("ARCHITECTURE UNIFIÉE - Données envoyées pour mise à jour:", essentialData);
      
      // Appel API pour mettre à jour le client
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(essentialData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur serveur:", errorText);
        
        // Essayer de parser le JSON pour récupérer le message d'erreur spécifique
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Erreur: ${response.status} ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Erreur: ${response.status} ${response.statusText}`);
        }
      }
      
      // Invalider le cache pour recharger les données automatiquement
      queryClient.clear(); // Vider tout le cache
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      console.log("Cache des clients invalidé après mise à jour réussie");
      
      // Déclencher la synchronisation pour les autres composants
      localStorage.setItem(`client-updated-${clientId}`, Date.now().toString());
      
      // Force reload de la page pour s'assurer de la synchronisation
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleUpdateClient}
      className="bg-green-600 hover:bg-green-700 text-white font-medium w-full"
      disabled={isSubmitting}
    >
      {isSubmitting ? "Mise à jour en cours..." : "Enregistrer les modifications"}
    </Button>
  );
}