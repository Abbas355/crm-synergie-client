import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ClientFormBasic } from "@/components/clients/client-form-basic";
import { Loader2 } from "lucide-react";
import { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [client, setClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  
  // Requête pour charger les données du client
  const { data, isLoading, isError, error } = useQuery<Client>({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${id}`);
      if (!res.ok) {
        throw new Error("Impossible de charger les informations du client");
      }
      return res.json();
    },
    enabled: !!id,
  });
  
  useEffect(() => {
    if (data) {
      setClient(data);
    }
  }, [data]);
  
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
        <button
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={() => setLocation("/clients")}
        >
          Retour à la liste des clients
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <button
          className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center text-sm sm:text-base shadow-sm"
          onClick={() => setLocation("/clients")}
        >
          <span className="mr-1">←</span> Retour à la liste
        </button>
      </div>
      
      {client && (
        <>
          <ClientFormBasic 
            defaultValues={{
              civilite: client.civilite || "",
              prenom: client.prenom || "",
              nom: client.nom || "",
              email: client.email || "",
              phone: client.phone || "",
              dateNaissance: client.dateNaissance 
                ? (typeof client.dateNaissance === 'string' 
                    ? client.dateNaissance 
                    : String(client.dateNaissance))
                : "",
              adresse: client.adresse || "",
              codePostal: client.codePostal || "",
              ville: client.ville || "",
              status: client.status || "enregistre",
              identifiantContrat: client.identifiantContrat || "",
              forfaitType: client.forfaitType || "",
              dateSignature: client.dateSignature ? String(client.dateSignature) : "",
              dateRendezVous: client.dateRendezVous ? String(client.dateRendezVous) : "",
              dateInstallation: client.dateInstallation ? String(client.dateInstallation) : "",
              commentaire: client.commentaire || "",
              codeVendeur: client.codeVendeur || "",
              source: client.source || "prospection",
              typeRecommandation: client.typeRecommandation || "",
              mandatSepa: false,
              contratSigne: false,
              bonCommande: false,
              ribClient: false,
              copiePieceIdentite: false,
              attestationHonneur: false
            }}
            onSubmit={async (values) => {
              console.log("🚀 MISE À JOUR CLIENT - Début de la soumission");
              console.log("🔥 Valeurs reçues:", values);
              console.log("🔍 Statut dans les valeurs:", values.status);
              
              try {
                // Préparation des données pour l'API
                const updateData = {
                  civilite: values.civilite || null,
                  prenom: values.prenom?.trim() || null,
                  nom: values.nom?.trim() || null,
                  email: values.email || null,
                  phone: values.phone || null,
                  dateNaissance: values.dateNaissance || null,
                  adresse: values.adresse || null,
                  codePostal: values.codePostal || null,
                  ville: values.ville || null,
                  status: values.status || "enregistre",
                  forfaitType: values.forfaitType || null,
                  identifiantContrat: values.identifiantContrat || null,
                  dateSignature: values.dateSignature || null,
                  dateRendezVous: values.dateRendezVous || null,
                  dateInstallation: values.dateInstallation || null,
                  commentaire: values.commentaire || null,
                  codeVendeur: values.codeVendeur || null,
                  source: values.source || "prospection",
                  typeRecommandation: values.typeRecommandation || null
                };

                console.log("📤 Données envoyées à l'API:", updateData);

                const response = await apiRequest("PUT", `/api/clients/${id}`, updateData);

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error("❌ Erreur serveur:", errorText);
                  throw new Error(`Erreur: ${response.status} ${response.statusText}`);
                }

                console.log("✅ Client mis à jour avec succès");
                
                // Invalider et recharger le cache des clients
                await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                await queryClient.refetchQueries({ queryKey: ["/api/clients"] });
                
                toast({
                  title: "Succès",
                  description: "Client mis à jour avec succès",
                  variant: "default"
                });

                // Retourner à la liste des clients
                setLocation("/clients");
                
              } catch (error) {
                console.error("❌ Erreur lors de la mise à jour:", error);
                
                toast({
                  title: "Erreur",
                  description: error instanceof Error ? error.message : "Erreur inconnue",
                  variant: "destructive"
                });
              }
            }}
            isEdit={true}
          />
          

        </>
      )}
    </div>
  );
}