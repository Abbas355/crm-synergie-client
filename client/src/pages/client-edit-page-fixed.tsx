import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ClientFormBasic } from "@/components/clients/client-form-basic";
import { FormProgressTracker } from "@/components/clients/form-progress-tracker";
import { Loader2, ArrowLeft } from "lucide-react";
import { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ClientEditPageFixed() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Requête pour charger les données du client
  const { data: client, isLoading, isError, error } = useQuery<Client>({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${id}`);
      if (!res.ok) {
        throw new Error("Impossible de charger les informations du client");
      }
      const data = await res.json();
      console.log("Données client reçues pour édition:", data);
      return data;
    },
    enabled: !!id,
  });

  // Fonction de soumission unifiée qui récupère les vraies données du formulaire
  const handleSubmit = async (formValues: any) => {
    try {
      // Validation côté client des champs requis
      if (!formValues.nom || formValues.nom.trim() === '') {
        throw new Error("Le nom du client est requis");
      }
      
      if (!formValues.prenom || formValues.prenom.trim() === '') {
        throw new Error("Le prénom du client est requis");
      }

      // Préparation des données pour l'API avec le mapping correct des champs
      const updateData = {
        civilite: formValues.civilite || null,
        prenom: formValues.prenom?.trim() || null,
        nom: formValues.nom?.trim() || null,
        email: formValues.email || null,
        mobile: formValues.phone || null, // Correction: l'API attend 'mobile'
        dateNaissance: formValues.dateNaissance || null,
        adresse: formValues.adresse || null,
        codePostal: formValues.codePostal || null,
        ville: formValues.ville || null,
        status: formValues.status || "enregistre",
        forfaitType: formValues.forfaitType || null,
        identifiantContrat: formValues.identifiantContrat || null,
        carteSIM: formValues.carteSIM || null,
        portabilite: formValues.portabilite || null,
        numeroPorter: formValues.numeroPorter || null,
        dateSignature: formValues.dateSignature || null,
        commentaire: formValues.commentaire || null,
        source: formValues.source || "prospection",
        // Ajouter les champs spécifiques aux dates conditionnelles
        ...(formValues.status === "rendez-vous" && { dateRendezVous: formValues.dateRendezVous || null }),
        ...(formValues.status === "installation" && { dateInstallation: formValues.dateInstallation || null })
      };

      console.log("Données envoyées pour mise à jour:", updateData);

      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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

      toast({
        title: "Succès",
        description: "Client mis à jour avec succès",
        variant: "default"
      });

      // Retourner à la liste des clients
      setLocation("/clients");
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    }
  };

  // Si on n'a pas encore les données
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des données du client...</span>
      </div>
    );
  }

  // Si erreur
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">
          Une erreur est survenue lors du chargement du client
        </div>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : "Erreur inconnue"}
        </p>
        <Button onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">Client introuvable</div>
        <Button onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/clients")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la liste
          </Button>
          <h1 className="text-lg font-semibold">
            Modifier le client: {client.prenom} {client.nom}
          </h1>
        </div>
      </div>

      {/* Formulaire unifié */}
      <div className="p-4">
        {/* Suivi de progression */}
        <FormProgressTracker formData={{
          civilite: client.civilite || "",
          prenom: client.prenom || "",
          nom: client.nom || "",
          email: client.email || "",
          phone: client.phone || "",
          dateNaissance: client.dateNaissance ? String(client.dateNaissance) : "",
          adresse: client.adresse || "",
          codePostal: client.codePostal || "",
          ville: client.ville || "",
          identifiantContrat: client.identifiantContrat || "",
          forfaitType: client.forfaitType || "",
          dateSignature: client.dateSignature ? String(client.dateSignature) : "",
          source: client.source || "",
          typeRecommandation: client.typeRecommandation || "",
          prospectCivilite: client.civiliteProspect || "",
          prospectPrenom: client.prenomProspect || "",
          prospectNom: client.nomProspect || ""
        }} />
        
        <ClientFormBasic
          key={`edit-client-${client.id}`}
          defaultValues={{
            civilite: client.civilite || "",
            prenom: client.prenom || "",
            nom: client.nom || "",
            email: client.email || "",
            phone: client.phone || "",
            dateNaissance: client.dateNaissance ? String(client.dateNaissance) : "",
            adresse: client.adresse || "",
            codePostal: client.codePostal || "",
            ville: client.ville || "",
            status: client.status || "enregistre",
            forfaitType: client.forfaitType || "",
            identifiantContrat: client.identifiantContrat || "",
            dateSignature: client.dateSignature ? String(client.dateSignature) : "",
            dateRendezVous: client.dateRendezVous ? String(client.dateRendezVous) : "",
            dateInstallation: client.dateInstallation ? String(client.dateInstallation) : "",
            commentaire: client.commentaire || "",
            codeVendeur: client.codeVendeur || "",
            carteSIM: client.carteSIM || "",
            portabilite: client.portabilite || "",
            numeroPorter: client.numeroPorter || "",
            source: client.source || "prospection_direct",
            typeRecommandation: client.typeRecommandation || "",
            mandatSepa: false,
            contratSigne: false,
            bonCommande: false,
            ribClient: false,
            copiePieceIdentite: false,
            attestationHonneur: false
          }}
          onSubmit={handleSubmit}
          isEdit={true}
          clientId={client.id}
        />
      </div>
    </div>
  );
}