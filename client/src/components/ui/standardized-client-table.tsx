import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getStatusHexColors } from "@shared/constants";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";

interface ClientDisplay {
  id: number;
  name: string;
  prenom: string;
  nom: string;
  status: string;
  produit: string;
  telephone: string;
  email: string;
  dateSignature: string | null;
  dateRendezVous: string | null;
  dateInstallation: string | null;
  codeVendeur: string;
  identifiantContrat: string;
  codePostal: string;
  ville: string;
}

interface StandardizedClientTableProps {
  clients: ClientDisplay[];
  isAdmin: boolean;
  onEdit?: (client: ClientDisplay) => void;
  onDelete?: (clientId: number) => void;
  onViewDetails?: (client: ClientDisplay) => void;
  isDeleting?: boolean;
}

export function StandardizedClientTable({ clients, isAdmin, onEdit, onDelete, onViewDetails, isDeleting = false }: StandardizedClientTableProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = getStatusHexColors(status);
    const borderClass = (status === 'enregistre' || !status) ? 'border border-gray-200' : 'border-0';
    return `${borderClass} font-medium`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              CLIENT
            </th>
            <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              PRODUIT
            </th>
            <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              STATUT
            </th>
            <th className="px-2 md:px-6 py-2 md:py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wide w-[50px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-2 md:px-6 py-2 md:py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {client.prenom?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {client.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {client.telephone || "-"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-2 md:px-6 py-2 md:py-4">
                <div className="text-sm text-gray-900">
                  {client.produit || "-"}
                </div>
              </td>
              <td className="px-2 md:px-6 py-2 md:py-4">
                <Badge 
                  className={`${getStatusColor(client.status)} text-xs px-2 py-1 whitespace-nowrap`}
                  style={{
                    backgroundColor: getStatusHexColors(client.status || 'enregistre').bg,
                    color: getStatusHexColors(client.status || 'enregistre').text
                  }}
                >
                  {client.status === 'rendez-vous' || client.status === 'rendez_vous' ? 'RDV' : client.status}
                </Badge>
              </td>
              <td className="px-2 md:px-6 py-2 md:py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                    )}
                    {isAdmin && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {isAdmin && onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(client.id)}
                        className="text-red-600"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}