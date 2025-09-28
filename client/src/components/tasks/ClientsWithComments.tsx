import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Phone, 
  Calendar as CalendarIcon,
  Users, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  FileText
} from "lucide-react";

interface ClientWithComments {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  produit: string;
  statut: string;
  commentaires: string;
  codeVendeur: string;
  createdAt: string;
  updatedAt: string;
  analysis: {
    needsCall: boolean;
    hasDate: boolean;
    dates: string[];
    suggestedTaskType: string;
    detectedKeywords: string[];
  };
}

interface ClientsWithCommentsResponse {
  clients: ClientWithComments[];
  total: number;
  stats: {
    needingCalls: number;
    withDates: number;
    forFollowUp: number;
  };
}

const ClientsWithComments: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<ClientWithComments | null>(null);
  const [taskPriority, setTaskPriority] = useState<string>("medium");
  const [taskDate, setTaskDate] = useState<Date>();
  const queryClient = useQueryClient();

  const { data: clientsData, isLoading, error } = useQuery<ClientsWithCommentsResponse>({
    queryKey: ['/api/clients/with-comments'],
    retry: false,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      clientId: number;
      taskType: string;
      priority: string;
      dueDate?: string;
    }) => {
      const response = await fetch('/api/tasks/create-from-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la tâche');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedClient(null);
      setTaskDate(undefined);
      setTaskPriority("medium");
    },
  });

  const handleCreateTask = (client: ClientWithComments) => {
    if (!client) return;

    createTaskMutation.mutate({
      clientId: client.id,
      taskType: client.analysis.suggestedTaskType,
      priority: taskPriority,
      dueDate: taskDate?.toISOString(),
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'signature': return 'bg-yellow-100 text-yellow-800';
      case 'validation': return 'bg-blue-100 text-blue-800';
      case 'rendez-vous': return 'bg-green-100 text-green-800';
      case 'installation': return 'bg-purple-100 text-purple-800';
      case 'post-production': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chargement des clients...</h2>
            <p className="text-gray-500">Analyse des commentaires en cours</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des clients avec commentaires. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!clientsData || clientsData.total === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client avec commentaires</h3>
        <p className="text-gray-500">
          Les clients ayant des commentaires apparaîtront ici pour création automatique de tâches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clients avec commentaires</h2>
            <p className="text-gray-500">{clientsData.total} clients nécessitent un suivi</p>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">À appeler</div>
                <div className="text-xl font-bold">{clientsData.stats.needingCalls}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-500">Avec dates</div>
                <div className="text-xl font-bold">{clientsData.stats.withDates}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-gray-500">Suivi général</div>
                <div className="text-xl font-bold">{clientsData.stats.forFollowUp}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des clients */}
      <div className="space-y-4">
        {clientsData.clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {client.prenom} {client.nom}
                      </h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline">{client.produit}</Badge>
                    <Badge className={getStatusColor(client.statut)}>{client.statut}</Badge>
                    <Badge className={client.analysis.needsCall ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {client.analysis.suggestedTaskType}
                    </Badge>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-700 font-medium mb-1">Commentaire:</p>
                    <p className="text-sm text-gray-600">{client.commentaires}</p>
                  </div>

                  {client.analysis.detectedKeywords.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Mots-clés détectés:</p>
                      <div className="flex flex-wrap gap-1">
                        {client.analysis.detectedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {client.analysis.dates.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Dates trouvées:</p>
                      <div className="flex flex-wrap gap-1">
                        {client.analysis.dates.map((date, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => setSelectedClient(client)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Créer tâche
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création de tâche */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Créer une tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Client:</p>
                <p className="text-lg">{selectedClient.prenom} {selectedClient.nom}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Type de tâche suggéré:</p>
                <Badge className={selectedClient.analysis.needsCall ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {selectedClient.analysis.suggestedTaskType === 'appel' ? 'Appel téléphonique' : 'Suivi général'}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Priorité:</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date d'échéance (optionnel):</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskDate ? format(taskDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskDate}
                      onSelect={setTaskDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => handleCreateTask(selectedClient)}
                  disabled={createTaskMutation.isPending}
                  className="flex-1"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Créer la tâche
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedClient(null)}
                  disabled={createTaskMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClientsWithComments;