import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Client = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  produit: string | null;
  status: string;
};

type ClientSelectorProps = {
  onSelect: (client: Client) => void;
  selectedClientId?: number;
};

export function ClientSelector({ onSelect, selectedClientId }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce pour la recherche (300ms de délai optimisé)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients/my-clients", debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/clients/my-clients?search=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des clients');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Toujours actif
  });

  // Fonctions memoïsées pour éviter les recalculs
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'enregistre': return 'bg-gray-500';
      case 'valide': return 'bg-yellow-500';
      case 'validation_7_jours': return 'bg-orange-500';
      case 'rendez_vous': return 'bg-blue-500';
      case 'post_production': return 'bg-purple-500';
      case 'installation': return 'bg-green-500';
      case 'resiliation': return 'bg-red-500';
      case 'abandonne': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'enregistre': return 'Enregistré';
      case 'valide': return 'Validé';
      case 'validation_7_jours': return 'Validation + 7j';
      case 'rendez_vous': return 'RDV';
      case 'post_production': return 'Post-prod';
      case 'installation': return 'Installation';
      case 'resiliation': return 'Résilié';
      case 'abandonne': return 'Abandonné';
      default: return status;
    }
  }, []);

  // Memoïser la liste des clients pour éviter les re-rendus
  const clientsList = useMemo(() => {
    if (!clients || clients.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          {searchTerm ? "Aucun client trouvé" : "Aucun client disponible"}
        </div>
      );
    }

    return clients.map((client: Client) => (
      <Card 
        key={client.id} 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
          selectedClientId === client.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white/90'
        }`}
        onClick={() => onSelect(client)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {client.prenom} {client.nom}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  {client.email && (
                    <div className="truncate">{client.email}</div>
                  )}
                  {client.telephone && (
                    <div>{client.telephone}</div>
                  )}
                  {client.ville && (
                    <div>{client.ville}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge 
                className={`${getStatusColor(client.status)} text-white text-xs px-2 py-1`}
              >
                {getStatusLabel(client.status)}
              </Badge>
              {client.produit && (
                <div className="text-xs text-gray-600 font-medium">
                  {client.produit}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }, [clients, selectedClientId, onSelect, getStatusColor, getStatusLabel]);

  if (isLoading && debouncedSearchTerm !== searchTerm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/70 backdrop-blur-sm border-blue-200 focus:border-blue-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          />
        </div>
        <div className="text-center py-6 text-gray-500">
          Chargement des clients...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/70 backdrop-blur-sm border-blue-200 focus:border-blue-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        />
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-2">
        {clientsList}
      </div>
    </div>
  );
}