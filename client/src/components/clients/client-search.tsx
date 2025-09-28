import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface Client {
  id: number;
  name?: string;
  email?: string;
  telephone?: string;
  phone?: string;
  prenom?: string;
  nom?: string;
}

function getClientDisplayName(client: Client): string {
  if (client.prenom && client.nom) {
    return `${client.prenom} ${client.nom}`;
  }
  
  return client.name || `Client #${client.id}`;
}

interface ClientSearchProps {
  selectedClientId?: number | null;
  onClientSelect: (clientId: number | null) => void;
  disabled?: boolean;
}

export function ClientSearch({ 
  selectedClientId,
  onClientSelect,
  disabled = false
}: ClientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Récupérer les clients du vendeur
  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['/api/clients/own'],
    enabled: !disabled,
  });



  // Filtrer les clients en fonction de la recherche
  const filteredClients = clients?.filter(client => {
    const clientName = getClientDisplayName(client).toLowerCase();
    const clientEmail = (client.email || "").toLowerCase();
    const clientPhone = (client.telephone || client.phone || "").toLowerCase();
    const searchLower = debouncedSearchQuery.toLowerCase();
    
    return (
      clientName.includes(searchLower) ||
      clientEmail.includes(searchLower) ||
      clientPhone.includes(searchLower)
    );
  }) || [];

  // Mettre à jour le client sélectionné quand selectedClientId change
  useEffect(() => {
    if (selectedClientId && clients) {
      const client = clients.find(c => c.id === selectedClientId) || null;
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  // Handler pour sélectionner un client
  const handleSelectClient = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId) || null;
    setSelectedClient(client);
    onClientSelect(clientId);
  };

  // Handler pour effacer la sélection
  const handleClearSelection = () => {
    setSelectedClient(null);
    onClientSelect(null);
    setSearchQuery("");
  };

  return (
    <FormItem className="space-y-4">
      <FormLabel>Sélectionner un client</FormLabel>
      
      {!selectedClient ? (
        <div className="space-y-2">
          <div className="relative">
            <FormControl>
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={disabled}
                className="pl-9"
              />
            </FormControl>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {debouncedSearchQuery && filteredClients.length > 0 && (
            <ScrollArea className="h-48 border rounded-md bg-background">
              <div className="p-1">
                {filteredClients.map(client => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2"
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <div>
                      <div className="font-medium">{getClientDisplayName(client)}</div>
                      {client.email && (
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {debouncedSearchQuery && filteredClients.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground py-2">
              Aucun client trouvé.
            </div>
          )}
          
          {!debouncedSearchQuery && clients && clients.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground py-2">
              Aucun client disponible.
            </div>
          )}
          
          {!debouncedSearchQuery && clients && clients.length > 0 && (
            <div className="text-sm text-muted-foreground py-2">
              {clients.length} client(s) disponible(s). Tapez pour rechercher.
            </div>
          )}
          
          {isLoading && (
            <div className="text-sm text-muted-foreground py-2">
              Chargement...
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between border rounded-md p-3 bg-muted/50">
          <div>
            <div className="font-medium">{getClientDisplayName(selectedClient)}</div>
            {selectedClient.email && (
              <div className="text-xs text-muted-foreground">{selectedClient.email}</div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSelection}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <FormMessage />
    </FormItem>
  );
}