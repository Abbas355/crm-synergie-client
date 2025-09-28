import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

/**
 * Version améliorée de la page clients - Format mobile simple
 * Cette page utilise une approche ultra simplifiée pour l'affichage des clients
 */
export default function ClientsPageImproved() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  
  // Récupération du rôle de l'utilisateur
  const { isAdmin } = useRole();
  
  // Récupération du système de notifications
  const { toast } = useToast();

  // Fonction pour charger les clients
  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/clients?all=true&debug=1", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des clients: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Les données reçues ne sont pas un tableau");
      }
      
      console.log("Données clients chargées:", data.length);
      setClients(data);
      setFilteredClients(data);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Charger les clients au chargement de la page
  useEffect(() => {
    loadClients();
  }, []);

  return (
    <AppLayout>
      <div className="py-4 px-4 max-w-screen-sm mx-auto">
        {/* Mode Diagnostique */}
        <Card className="mb-4 bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Diagnostique mode</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="py-1">Nombre total de clients: {clients.length}</p>
            <p className="py-1">Nombre de clients filtrés: {filteredClients.length}</p>
            <p className="py-1">Affichage: tableau</p>
            <p className="py-1">Statut admin: {isAdmin() ? "Oui" : "Non"}</p>
            
            <Button 
              className="mt-3 bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                loadClients();
                toast({
                  title: "Rafraîchissement",
                  description: "Rechargement des données clients...",
                });
              }}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Recharger
            </Button>
          </CardContent>
        </Card>

        {/* Liste des clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Liste complète des clients</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucun client trouvé</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-200">
                {clients.map((client) => (
                  <Link key={client.id} href={`/clients/edit/${client.id}`} className="block py-3 px-2 hover:bg-gray-50 rounded">
                    <div className="text-sm font-medium">
                      ID: {client.id} - {client.prenom} {client.nom} - Status: {client.status || 'N/A'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}