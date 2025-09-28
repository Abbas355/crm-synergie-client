import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, RotateCcw, Clock, AlertTriangle, Search, User, Phone, Mail, MapPin, Package, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletedClient {
  id: number;
  prenom: string | null;
  nom: string | null;
  name: string | null;
  email: string | null;
  telephone: string | null;
  produit: string | null;
  status: string | null;
  deletedAt: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
}

export default function TrashPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer les clients supprimés
  const { data: deletedClients = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients/deleted'],
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Mutation pour restaurer un client
  const restoreMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch(`/api/clients/${clientId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la restauration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client restauré",
        description: "Le client a été restauré avec succès",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filtrer les clients selon le terme de recherche
  const filteredClients = deletedClients.filter((client: DeletedClient) => {
    const clientName = getClientName(client);
    const searchLower = searchTerm.toLowerCase();
    return (
      clientName.toLowerCase().includes(searchLower) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.telephone && client.telephone.includes(searchTerm)) ||
      (client.produit && client.produit.toLowerCase().includes(searchLower))
    );
  });

  // Fonction pour calculer le temps restant avant suppression définitive
  const getTimeRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expirationDate = new Date(deletedDate.getTime() + 48 * 60 * 60 * 1000); // 48h
    const now = new Date();
    const timeRemaining = expirationDate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      return { expired: true, text: 'Expiré' };
    }
    
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      expired: false,
      text: `${hoursRemaining}h ${minutesRemaining}m restantes`
    };
  };

  // Fonction pour formater le nom du client
  const getClientName = (client: DeletedClient) => {
    if (client.name) return client.name;
    if (client.prenom && client.nom) return `${client.prenom} ${client.nom}`;
    if (client.prenom) return client.prenom;
    if (client.nom) return client.nom;
    return 'Client sans nom';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
        <div className="container mx-auto px-3 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Chargement de la corbeille...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
        <div className="container mx-auto px-3 py-6">
          <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl rounded-2xl">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4 text-sm">Impossible de charger la corbeille</p>
              <Button onClick={() => window.location.reload()} size="sm">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      <div className="container mx-auto px-3 py-4">
        {/* Header moderne compact pour mobile */}
        <div className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl rounded-2xl p-4 mb-4">
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Trash2 className="h-5 w-5 text-blue-600" />
              Clients supprimés
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {filteredClients.length} élément(s) dans la corbeille
            </p>
            <Badge variant="outline" className="mt-2 flex items-center gap-1 bg-blue-50 border-blue-200 text-blue-700 w-fit mx-auto">
              <Clock className="h-4 w-4" />
              {deletedClients.length} total
            </Badge>
          </div>
        </div>

        {/* Barre de recherche compacte */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-white/70 border-white/20 shadow-lg h-11 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Liste des clients optimisée mobile */}
        {filteredClients.length === 0 ? (
          <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl rounded-2xl">
            <CardContent className="p-8 text-center">
              <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                {deletedClients.length === 0 ? 'Corbeille vide' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600 text-sm">
                {deletedClients.length === 0 
                  ? 'Aucun client supprimé récemment' 
                  : 'Aucun client ne correspond à votre recherche'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client: DeletedClient) => {
              const timeRemaining = getTimeRemaining(client.deletedAt);
              const clientName = getClientName(client);
              
              return (
                <Card key={client.id} className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          {clientName}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.telephone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span>{client.telephone}</span>
                            </div>
                          )}
                          {client.produit && (
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span>{client.produit}</span>
                            </div>
                          )}
                          {client.adresse && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-xs leading-tight">
                                {client.adresse}
                                {client.code_postal && `, ${client.code_postal}`}
                                {client.ville && ` ${client.ville}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <Badge 
                          variant={timeRemaining.expired ? "destructive" : "secondary"}
                          className="text-xs mb-1"
                        >
                          {timeRemaining.text}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Supprimé le {format(new Date(client.deletedAt), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(client.id)}
                        disabled={timeRemaining.expired || restoreMutation.isPending}
                        className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 h-8 px-3 text-sm"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Informations importantes - version mobile compacte */}
        <Card className="mt-6 backdrop-blur-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Informations importantes
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Conservation 48h</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3 w-3" />
                <span>Restauration complète</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-3 w-3" />
                <span>Suppression auto</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>Accès admin</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}