import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Client } from "@shared/schema";
import { normalizeClientData, type ClientData } from "@shared/client-types";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoreHorizontal, Search, UserPlus, Trash2, Edit, Eye, ChevronDown, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { VendeurTable } from "./vendeur-table";

type ClientTableProps = {
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onAddClient: () => void;
};

export function ClientTable({ onViewClient, onEditClient, onAddClient }: ClientTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { isAdmin, isVendeur, getUserRole } = useRole();
  
  // Vérification du rôle actuel pour logs de debug
  console.log("Rôle utilisateur actuel:", getUserRole());

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
      // Statut 204 indique un succès sans contenu, pas besoin de parser le JSON ni de retourner la réponse
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès",
      });
      setClientToDelete(null);
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression du client",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete.id);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher des clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={onAddClient}>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un client
        </Button>
      </div>

      {isAdmin() ? (
        // Tableau pour les administrateurs
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>
                  Date Signature <ChevronDown className="inline h-3 w-3" aria-label="Tri par date de signature décroissante" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : clients && clients.length > 0 ? (
                clients
                  .filter(client => {
                    if (!searchQuery) return true;
                    const searchTerm = searchQuery.toLowerCase();
                    const name = `${client.prenom || ""} ${client.nom || ""}`.toLowerCase();
                    return (
                      name.includes(searchTerm) ||
                      (client.email || "").toLowerCase().includes(searchTerm) ||
                      (client.telephone || "").toLowerCase().includes(searchTerm) ||
                      (client.identifiantContrat || "").toLowerCase().includes(searchTerm) ||
                      (client.carteSim || "").toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name || `${client.prenom} ${client.nom}`}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.telephone || "-"}</TableCell>
                    <TableCell>{client.company || "-"}</TableCell>
                    <TableCell>{client.codeVendeur || "-"}</TableCell>
                    <TableCell>
                      {client.dateSignature ? (
                        <span className="font-medium">{formatDate(client.dateSignature)}</span>
                      ) : client.date ? (
                        formatDate(client.date)
                      ) : (
                        <span className="text-gray-500">{formatDate(client.createdAt)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Icône Crayon pour éditer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClient(client)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <span className="sr-only">Modifier</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {/* Icône Corbeille pour supprimer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <span className="sr-only">Supprimer</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Menu déroulant pour autres actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onViewClient(client)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    {searchQuery 
                      ? "Aucun client trouvé pour cette recherche."
                      : "Aucun client trouvé. Ajoutez votre premier client en cliquant sur 'Ajouter un client'."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Tableau pour les vendeurs (composant séparé)
        <VendeurTable 
          onViewClient={onViewClient} 
          onEditClient={onEditClient} 
          searchQuery={searchQuery} 
        />
      )}

      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}