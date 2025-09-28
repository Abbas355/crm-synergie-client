import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2, Merge, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DuplicateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les doublons détectés
  const { data: duplicates, isLoading } = useQuery({
    queryKey: ["/api/duplicates/detect"],
    queryFn: async () => {
      const response = await fetch("/api/duplicates/detect");
      if (!response.ok) throw new Error("Erreur récupération doublons");
      return response.json();
    }
  });

  // Marquer comme doublon
  const markDuplicateMutation = useMutation({
    mutationFn: async ({ clientId, reason }: { clientId: number, reason: string }) => {
      const response = await fetch("/api/duplicates/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, reason })
      });
      if (!response.ok) throw new Error("Erreur marquage doublon");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Doublon marqué",
        description: "Client marqué comme doublon avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/duplicates/detect"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer le doublon",
        variant: "destructive"
      });
    }
  });

  // Fusionner clients
  const mergeMutation = useMutation({
    mutationFn: async ({ keepClientId, removeClientId }: { keepClientId: number, removeClientId: number }) => {
      const response = await fetch("/api/duplicates/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepClientId, removeClientId })
      });
      if (!response.ok) throw new Error("Erreur fusion clients");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clients fusionnés",
        description: "Fusion des clients réalisée avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/duplicates/detect"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de fusionner les clients",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Doublons</h1>
          <p className="text-gray-600">Détection et résolution des clients en double</p>
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/duplicates/detect"] })}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Doublons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyse des doublons en cours...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{duplicates?.length || 0}</div>
                <div className="text-sm text-gray-600">Groupes de doublons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {duplicates?.reduce((acc: number, dup: any) => acc + dup.count, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Clients concernés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {duplicates?.reduce((acc: number, dup: any) => acc + (dup.count - 1), 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Doublons à traiter</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des doublons */}
      <Card>
        <CardHeader>
          <CardTitle>Doublons Détectés</CardTitle>
          <CardDescription>
            Clients ayant le même nom, prénom et téléphone
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              Recherche des doublons...
            </div>
          ) : duplicates && duplicates.length > 0 ? (
            <div className="space-y-6">
              {duplicates.map((duplicate: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {duplicate.prenom} {duplicate.nom}
                      </h3>
                      <p className="text-gray-600">{duplicate.phone}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-700">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {duplicate.count} doublons
                    </Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Contrat</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicate.client_ids.map((clientId: number, clientIndex: number) => (
                        <TableRow key={clientId}>
                          <TableCell className="font-medium">{clientId}</TableCell>
                          <TableCell>{duplicate.products[clientIndex] || 'Non défini'}</TableCell>
                          <TableCell>{duplicate.contracts[clientIndex] || 'Non défini'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markDuplicateMutation.mutate({
                                  clientId,
                                  reason: `Doublon de ${duplicate.prenom} ${duplicate.nom}`
                                })}
                                disabled={markDuplicateMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Supprimer
                              </Button>
                              
                              {clientIndex > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => mergeMutation.mutate({
                                    keepClientId: duplicate.client_ids[0],
                                    removeClientId: clientId
                                  })}
                                  disabled={mergeMutation.isPending}
                                >
                                  <Merge className="w-3 h-3 mr-1" />
                                  Fusionner
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun doublon détecté</h3>
              <p className="text-gray-600">
                Tous les clients sont uniques dans la base de données
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}