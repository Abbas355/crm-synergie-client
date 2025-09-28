import React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { normalizeClientData, type ClientData } from "@shared/client-types";
import { Eye, Edit, MoreHorizontal, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Fonctions pour obtenir les couleurs en fonction du statut
function getStatusBackgroundColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower === "enregistré" || statusLower === "enregistre") return "#ffffff";
  if (statusLower === "validé" || statusLower === "valide") return "#22c55e"; // vert comme dans la capture
  if (statusLower.includes("valide 7") || statusLower.includes("validé 7") || statusLower === "valide_7j") return "#e5e7eb"; // bg-gray-200
  if (statusLower === "rendez-vous" || statusLower === "rdv") return "#a9bd49"; // Couleur exacte de la capture d'écran
  if (statusLower === "installation") return "#dcfce7"; // bg-green-100
  if (statusLower === "post-production") return "#fecaca"; // bg-red-200
  if (statusLower === "résiliation" || statusLower === "resiliation") return "#dc2626"; // bg-red-600
  if (statusLower === "abandonné" || statusLower === "abandonne") return "#6b7280"; // bg-gray-500
  
  return "#ffffff"; // blanc par défaut
}

function getStatusTextColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower === "résiliation" || statusLower === "resiliation" || 
      statusLower === "abandonné" || statusLower === "abandonne" ||
      statusLower === "validé" || statusLower === "valide") {
    return "#ffffff"; // texte blanc pour fonds foncés
  }
  
  return "#000000"; // texte noir pour fonds clairs
}

type VendeurTableProps = {
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  searchQuery: string;
};

export function VendeurTable({ onViewClient, onEditClient, searchQuery }: VendeurTableProps) {
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  return (
    <div className="rounded-md border">
      {/* TABLEAU VENDEURS - FORMAT SPÉCIFIQUE */}
      <Table className="min-w-full text-xs">
        <TableHeader>
          <TableRow className="bg-gray-50 text-gray-600 font-medium">
            <TableHead className="py-2 px-2">
              Date signature <ChevronDown className="inline h-3 w-3" aria-label="Tri par date de signature décroissante" />
            </TableHead>
            <TableHead className="py-2 px-2">Adresse</TableHead>
            <TableHead className="py-2 px-2">CP</TableHead>
            <TableHead className="py-2 px-2">Ville</TableHead>
            <TableHead className="py-2 px-2">IDENTIFIANT</TableHead>
            <TableHead className="py-2 px-2">Nom</TableHead>
            <TableHead className="py-2 px-2">Téléphone</TableHead>
            <TableHead className="py-2 px-2">Produit</TableHead>
            <TableHead className="py-2 px-2">Portabilité</TableHead>
            <TableHead className="py-2 px-2">Rendez-vous</TableHead>
            <TableHead className="py-2 px-2">Installation</TableHead>
            <TableHead className="py-2 px-2 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-16">
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
              .map((client) => {
              const normalized = normalizeClientData(client as ClientData);
              console.log(`Données normalisées pour client ${client.id}:`, {
                telephone: normalized.telephone,
                produit: normalized.produit,
                original_telephone: client.telephone
              });
              return (
                <TableRow 
                  key={client.id} 
                  onClick={() => onViewClient(client)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: getStatusBackgroundColor(client.status || ""),
                    color: getStatusTextColor(client.status || "")
                  }}
                >
                  {/* Date de signature */}
                  <TableCell className="text-xs p-1">
                    {client.dateSignature ? (
                      <span className="font-medium">{formatDate(client.dateSignature)}</span>
                    ) : client.date ? (
                      formatDate(client.date)
                    ) : (
                      <span className="text-gray-500">{formatDate(client.createdAt)}</span>
                    )}
                  </TableCell>
                  
                  {/* Adresse (affichage complet sur 2 lignes max) */}
                  <TableCell className="text-xs p-1">
                    <div className="line-clamp-2 break-words whitespace-normal" style={{ maxWidth: '140px' }}>
                      {normalized.adresse}
                    </div>
                  </TableCell>
                  
                  {/* Code postal */}
                  <TableCell className="text-xs p-1">{normalized.codePostal}</TableCell>
                  
                  {/* Ville */}
                  <TableCell className="text-xs p-1">{normalized.ville}</TableCell>
                  
                  {/* Identifiant contrat */}
                  <TableCell className="text-xs p-1 font-bold">{normalized.identifiantContrat}</TableCell>
                  
                  {/* Nom complet */}
                  <TableCell className="text-xs p-1 font-medium">{`${normalized.prenom} ${normalized.nom}`}</TableCell>
                  
                  {/* Téléphone */}
                  <TableCell className="text-xs p-1">{normalized.telephone}</TableCell>
                  
                  {/* Produit */}
                  <TableCell className="text-xs p-1">{normalized.produit}</TableCell>
                  
                  {/* Portabilité */}
                  <TableCell className="text-xs p-1">
                    {normalized.portabilite}
                  </TableCell>
                  
                  {/* Rendez-vous */}
                  <TableCell className="text-xs p-1">
                    {normalized.dateRendezVous !== "-" ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        {normalized.dateRendezVous}
                      </div>
                    ) : "-"}
                  </TableCell>
                  
                  {/* Installation (date d'installation) */}
                  <TableCell className="text-xs p-1">
                    {normalized.dateInstallation !== "-" ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        {normalized.dateInstallation}
                      </div>
                    ) : "-"}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewClient(client);
                      }}
                    >
                      <span className="sr-only">Voir</span>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-16">
                {searchQuery 
                  ? "Aucun client trouvé pour cette recherche."
                  : "Aucun client trouvé. Ajoutez votre premier client en cliquant sur 'Ajouter un client'."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}