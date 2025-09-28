import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Données clients statiques pour démonstration 
// Cela évite d'utiliser la base de données qui est limitée en taux d'appels
const DEMO_CLIENTS = [
  {
    id: 1,
    codeVendeur: "FR12345",
    dateSignature: "12/05/2025",
    nom: "Sandra Silvano",
    identifiantContrat: "F056789012",
    dateRendezVous: "-",
    dateInstallation: "-",
    status: "valide",
  },
  {
    id: 2,
    codeVendeur: "FR67890",
    dateSignature: "08/05/2025",
    nom: "Gaelle Picard",
    identifiantContrat: "F078912345",
    dateRendezVous: "15/05/2025",
    dateInstallation: "21/05/2025",
    status: "rendez-vous",
  },
  {
    id: 3,
    codeVendeur: "FR52796",
    dateSignature: "07/05/2025",
    nom: "Denis Todisco",
    identifiantContrat: "F045678901",
    dateRendezVous: "-",
    dateInstallation: "19/05/2025",
    status: "installation",
  },
  {
    id: 4, 
    codeVendeur: "FR52796",
    dateSignature: "12/03/2025",
    nom: "Inès Leborgne - Dumoulin",
    identifiantContrat: "FO34967664",
    dateRendezVous: "-",
    dateInstallation: "-",
    status: "valide",
  },
  {
    id: 5,
    codeVendeur: "-",
    dateSignature: "-", 
    nom: "Virag Kaposvari",
    identifiantContrat: "F012345678",
    dateRendezVous: "-",
    dateInstallation: "-",
    status: "enregistre",
  },
  {
    id: 6,
    codeVendeur: "FR52796",
    dateSignature: "15/02/2025",
    nom: "Boroka Bardos",
    identifiantContrat: "F023456789",
    dateRendezVous: "-",
    dateInstallation: "-",
    status: "abandonne",
  },
  {
    id: 7,
    codeVendeur: "FR12345",
    dateSignature: "22/04/2025",
    nom: "Jean Dujardin",
    identifiantContrat: "F034567890",
    dateRendezVous: "-",
    dateInstallation: "-",
    status: "resiliation",
  }
];

export default function TableauSimple() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrer les clients par recherche
  const filteredClients = DEMO_CLIENTS.filter(client => {
    if (searchTerm === "") return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      client.nom.toLowerCase().includes(searchLower) ||
      client.identifiantContrat.toLowerCase().includes(searchLower) ||
      client.codeVendeur.toLowerCase().includes(searchLower)
    );
  });

  // Fonction pour déterminer la couleur de fond en fonction du statut
  const getStatusBackground = (status: string) => {
    switch (status.toLowerCase()) {
      case 'enregistre':
        return "white";
      case 'valide':
        return "#facc15"; // Jaune exact
      case 'valide_7j':
        return "#E5E7EB"; // Gris clair
      case 'rendez-vous':
        return "#A9BC49"; // Vert olive
      case 'installation':
        return "#CCFFCC"; // Vert très clair
      case 'post-production':
        return "#FFCCCC"; // Rouge clair
      case 'resiliation':
        return "#dc2626"; // Rouge exact selon capture
      case 'abandonne':
        return "#666666"; // Gris foncé
      default:
        return "white";
    }
  };
  
  // Fonction pour déterminer la couleur du texte
  const getStatusTextColor = (status: string) => {
    return ['resiliation', 'abandonne'].includes(status.toLowerCase()) 
      ? "white" 
      : "black";
  };

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tableau des Clients</h1>
          <div className="flex gap-2">
            <Link href="/clients">
              <Button variant="outline">
                Vue standard
              </Button>
            </Link>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        {/* Tableau des clients */}
        <div className="w-full overflow-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="p-3 text-center" style={{ width: "100px" }}>Code Vendeur</th>
                <th className="p-3 text-center" style={{ width: "100px" }}>Date Signature</th>
                <th className="p-3 text-center">Nom</th>
                <th className="p-3 text-center" style={{ width: "120px" }}>Identifiant Contrat</th>
                <th className="p-3 text-center" style={{ width: "80px" }}>Date Rdv</th>
                <th className="p-3 text-center" style={{ width: "80px" }}>Date Installa</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const bgColor = getStatusBackground(client.status);
                  const textColor = getStatusTextColor(client.status);
                  
                  return (
                    <tr 
                      key={client.id}
                      style={{ 
                        backgroundColor: bgColor,
                        color: textColor,
                        transition: 'background-color 0.2s ease-in-out'
                      }}
                      className="hover:opacity-90 cursor-pointer"
                    >
                      <td className="p-3 text-center">{client.codeVendeur}</td>
                      <td className="p-3 text-center">{client.dateSignature}</td>
                      <td className="p-3 text-center font-medium">{client.nom}</td>
                      <td className="p-3 text-center">{client.identifiantContrat}</td>
                      <td className="p-3 text-center">{client.dateRendezVous}</td>
                      <td className="p-3 text-center">{client.dateInstallation}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}