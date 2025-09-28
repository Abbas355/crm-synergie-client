import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientMissingFields } from "@/components/clients/client-missing-fields";
import { ArrowLeft, User, AlertCircle } from "lucide-react";

interface Client {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  civilite: string;
  dateNaissance: string | null;
  adresse: string;
  codePostal: string | null;
  ville: string;
  produit: string;
  identifiantContrat: string | null;
  carteSim: string | null;
  portabilite: string;
  numeroPorter: string | null;
  source: string;
  commentaire: string | null;
  status: string;
  codeVendeur: string;
  userid: number;
}

export default function TestMissingFields() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data: client, isLoading, refetch } = useQuery<Client>({
    queryKey: ["/api/clients", selectedClientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${selectedClientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!selectedClientId,
    retry: false,
  });

  const testClients = [
    { id: 121, name: "Jean-Philippe Cretin", hasIssues: false, description: "Client avec données complètes" },
    { id: 127, name: "Marie Dupont", hasIssues: true, description: "Client avec champs manquants" },
  ];

  if (selectedClientId && client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedClientId(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Test - Champs manquants
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Informations client */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {client.prenom} {client.nom}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <p className="font-medium text-sm">{client.email}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Produit</label>
                  <p className="font-medium text-sm">{client.produit}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Portabilité</label>
                  <p className="font-medium text-sm">{client.portabilite}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                  <p className="font-medium text-sm">{client.source}</p>
                </div>
              </div>
              
              {/* Composant de champs manquants */}
              <ClientMissingFields 
                client={client} 
                onUpdate={() => {
                  refetch();
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Test - Interface des champs manquants
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Liste des clients de test */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Clients de test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testClients.map((testClient) => (
                <div 
                  key={testClient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{testClient.name}</p>
                      <p className="text-sm text-gray-600">{testClient.description}</p>
                    </div>
                    {testClient.hasIssues && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Champs manquants
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => setSelectedClientId(testClient.id)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {isLoading ? "Chargement..." : "Tester"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}