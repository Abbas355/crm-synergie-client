import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Client } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { formatVendorCode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, FileText, Search } from "lucide-react";
import { DataPagination } from "@/components/ui/data-pagination";
import { Link } from "wouter";
import { useRole } from "@/hooks/use-role";

export default function TableauClients() {
  // Hook pour vérifier les permissions
  const { isAdmin } = useRole();
  
  // État local pour la page et la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const itemsPerPage = 10;
  
  // Récupération des clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Filtrer les clients en fonction du terme de recherche
  const filteredClients = clients.filter((client) => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const clientName = `${client.prenom || ""} ${client.nom || ""}`.toLowerCase();
    const clientAddress = `${client.adresse || ""} ${client.codePostal || ""} ${client.ville || ""}`.toLowerCase();
    
    return (
      clientName.includes(searchTermLower) ||
      clientAddress.includes(searchTermLower) ||
      (client as any).identifiantContrat?.toLowerCase().includes(searchTermLower) ||
      (client as any).codeVendeur?.toLowerCase().includes(searchTermLower) ||
      (client as any).carteSim?.toLowerCase().includes(searchTermLower)
    );
  });

  // Pagination
  const paginatedClients = filteredClients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Liste clients triés par date de signature décroissante
  const sortedClients = [...filteredClients].sort((a, b) => {
    const dateA = a.dateSignature ? new Date(a.dateSignature).getTime() : 0;
    const dateB = b.dateSignature ? new Date(b.dateSignature).getTime() : 0;
    return dateB - dateA;
  });
  
  // Liste des 5 clients les plus récents
  const recentClients = sortedClients.slice(0, 5);
  
  console.log("Clients récents:", recentClients.map(c => `${c.prenom} ${c.nom}: ${c.dateSignature}`));

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tableau des Clients</h1>
          <div className="flex items-center gap-2">
            <Link href="/clients">
              <Button variant="outline">
                Retour à la vue standard
              </Button>
            </Link>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4 relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un client..."
            className="pl-9 pr-4"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              className="absolute right-3 top-2.5"
              onClick={() => setSearchTerm("")}
            >
              <span className="text-gray-400 text-sm">×</span>
            </button>
          )}
        </div>

        {/* Tableau des clients */}
        <div className="w-full overflow-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                {/* Code Vendeur - visible uniquement pour les admins */}
                {isAdmin() && (
                  <th className="p-3 text-center" style={{ width: "100px" }}>Code Vendeur</th>
                )}
                <th className="p-3 text-center" style={{ width: "100px" }}>Date Signature</th>
                <th className="p-3 text-center">Nom</th>
                <th className="p-3 text-center" style={{ width: "120px" }}>Identifiant Contrat</th>
                <th className="p-3 text-center" style={{ width: "80px" }}>Date Rdv</th>
                <th className="p-3 text-center" style={{ width: "80px" }}>Date Installa</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin() ? 6 : 5} className="text-center py-8">
                    Chargement des clients...
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 6 : 5} className="text-center py-8">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500">Aucun client à afficher</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  // Déterminer la couleur de fond en fonction du statut
                  let bgColor = "white"; // Par défaut
                  let textColor = "black"; // Par défaut
                  let statusLabel = client.status || "Nouveau";
                  
                  if (client.status) {
                    const status = client.status.toLowerCase();
                    if (status === "validé" || status === "valide") {
                      bgColor = "#22c55e"; // Vert comme dans la capture
                      textColor = "white";
                      statusLabel = "Validé";
                    }
                    else if (status.includes("7 jours") || status.includes("7jours") || status === "valide_7j") {
                      bgColor = "#E5E7EB"; // Gris clair
                      statusLabel = "Validé 7j";
                    }
                    else if (status === "rdv" || status.includes("rendez-vous")) {
                      bgColor = "#A9BC49"; // Vert olive
                      statusLabel = "Rendez-vous";
                    }
                    else if (status.includes("install")) {
                      bgColor = "#CCFFCC"; // Vert très clair
                      statusLabel = "Installation";
                    }
                    else if (status.includes("production")) {
                      bgColor = "#FFCCCC"; // Rouge clair
                      statusLabel = "Post-production";
                    }
                    else if (status.includes("résili") || status.includes("resili")) {
                      bgColor = "#CC0000"; // Rouge foncé
                      textColor = "white";
                      statusLabel = "Résilié";
                    }
                    else if (status.includes("abandonn")) {
                      bgColor = "#666666"; // Gris foncé
                      textColor = "white";
                      statusLabel = "Abandonné";
                    }
                  }
                  
                  // Formater la date pour ressembler à la capture d'écran
                  const dateStr = client.dateSignature 
                    ? new Date(client.dateSignature).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : "-";
                    
                  // Première partie de la date (jour + mois)
                  const dateParts = dateStr.split(' ');
                  const dayMonth = dateParts.length >= 2 ? `${dateParts[0]} ${dateParts[1]}` : "";
                  // Année
                  const year = dateParts.length >= 3 ? dateParts[2] : "";
                  
                  return (
                    <tr 
                      key={client.id} 
                      style={{ 
                        backgroundColor: bgColor,
                        color: textColor
                      }}
                      className="hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      {/* Code vendeur - visible uniquement pour les admins */}
                      {isAdmin() && (
                        <td className="p-3 text-center">
                          {(client as any).codeVendeur ? formatVendorCode((client as any).codeVendeur) : "-"}
                        </td>
                      )}
                      
                      {/* Date Signature */}
                      <td className="p-3 text-center">
                        {client.dateSignature ? dateStr : "-"}
                      </td>
                      
                      {/* Nom */}
                      <td className="p-3 text-center">
                        <div className="font-medium">
                          {client.prenom} {client.nom}
                        </div>
                      </td>
                      
                      {/* ID Contrat */}
                      <td className="p-3 text-center">
                        {(client as any).identifiantContrat || "-"}
                      </td>
                      
                      {/* Date Rendez-vous */}
                      <td className="p-3 text-center">
                        {(client as any).dateRendezVous ? 
                          new Date((client as any).dateRendezVous).toLocaleDateString('fr-FR') : 
                          "-"}
                      </td>
                      
                      {/* Date Installation */}
                      <td className="p-3 text-center">
                        {(client as any).dateInstallation ? 
                          new Date((client as any).dateInstallation).toLocaleDateString('fr-FR') : 
                          "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-4">
          <DataPagination
            currentPage={page}
            totalPages={Math.ceil(filteredClients.length / itemsPerPage)}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AppLayout>
  );
}