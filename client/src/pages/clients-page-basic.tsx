import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { getStatusHexColors } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, FileText, ArrowLeft } from "lucide-react";

/**
 * Version simplifiée de la page clients pour résoudre le problème de chargement infini
 * Cette page utilise une approche plus directe pour afficher les clients
 */
export default function ClientsPageBasic() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
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
      <div className="py-4 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-4">Clients (Version Simplifiée)</h1>
            
            {/* Lien vers la version complète */}
            <Link href="/clients">
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-blue-100 border border-blue-300 text-blue-800 hover:bg-blue-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Version Complète
              </Button>
            </Link>
          </div>
          
          {/* Bouton de rafraîchissement */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              loadClients();
              toast({
                title: "Rafraîchissement",
                description: "Rechargement des données clients...",
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
        </div>

        {/* Statistiques */}
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">Informations</h3>
          <p>Nombre total de clients: {clients.length}</p>
          <p>Statut admin: {isAdmin() ? "Oui" : "Non"}</p>
        </div>

        {/* Client List */}
        {isLoading ? (
          <div className="text-center py-10">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <FileText className="h-8 w-8 mx-auto text-red-400" />
            <p className="mt-2 text-gray-500">Erreur: {error.message}</p>
            <Button onClick={loadClients} className="mt-4">Réessayer</Button>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contrat</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.id}</TableCell>
                      <TableCell>{`${client.prenom || ''} ${client.nom || ''}`}</TableCell>
                      <TableCell>
                        {client.dateSignature 
                          ? new Date(client.dateSignature).toLocaleDateString('fr-FR')
                          : "-"}
                      </TableCell>
                      <TableCell>{client.identifiantContrat || "-"}</TableCell>
                      <TableCell>{client.codeVendeur || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-center"
                          style={{
                            backgroundColor: getStatusColor(client.status),
                            color: getStatusTextColor(client.status),
                            border: '1px solid #ccc'
                          }}>
                          {client.status || 'Nouveau'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/clients/edit/${client.id}`}>
                            <FileText className="h-4 w-4 mr-1" />
                            Éditer
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Fonction utilitaire pour obtenir la couleur du statut
function getStatusColor(status: string | null | undefined): string {
  return getStatusHexColors(status || 'enregistre').bg;
}

// Fonction utilitaire pour obtenir la couleur du texte en fonction du statut
function getStatusTextColor(status: string | null | undefined): string {
  return getStatusHexColors(status || 'enregistre').text;
}