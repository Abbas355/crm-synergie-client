import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Client, Task, Activity } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  ClipboardList, 
  History,
  Loader2,
  Edit
} from "lucide-react";
import { ClientTimeline } from "@/components/clients/client-timeline";
import { TaskAutomationPanel } from "@/components/tasks/task-automation-panel";

type ClientDetailProps = {
  clientId?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
};

interface ClientDetailData extends Client {
  tasks: Task[];
  activities: Activity[];
}

export function ClientDetail({ clientId, isOpen, onClose, onEdit }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState("info");
  
  const { data: clientDetail, isLoading } = useQuery<ClientDetailData>({
    queryKey: ["/api/clients", clientId],
    queryFn: async ({ queryKey }) => {
      const [_, id] = queryKey;
      if (typeof id === 'number') {
        return getQueryFn({ on401: "throw" })(`/api/clients/${id}`);
      }
      throw new Error("ID client invalide");
    },
    enabled: !!clientId && isOpen,
  });

  if (!clientId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clientDetail ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-start">
                <DialogTitle className="text-2xl">{clientDetail.name}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => onEdit(clientDetail)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
              <DialogDescription>
                Détails et informations du client
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="tasks">Tâches ({clientDetail.tasks?.length || 0})</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="automation">Automatisation</TabsTrigger>
                <TabsTrigger value="history">Historique ({clientDetail.activities?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-500">{clientDetail.email || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Téléphone</p>
                      <p className="text-sm text-gray-500">{clientDetail.phone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Entreprise</p>
                      <p className="text-sm text-gray-500">{clientDetail.company || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Date d'ajout</p>
                      <p className="text-sm text-gray-500">{formatDate(clientDetail.createdAt)}</p>
                    </div>
                  </div>
                  {clientDetail.carteSim && (
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Carte SIM</p>
                        <p className="text-sm text-gray-500">{clientDetail.carteSim}</p>
                      </div>
                    </div>
                  )}
                  {clientDetail.produit && (
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Produit</p>
                        <p className="text-sm text-gray-500">{clientDetail.produit}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                {clientDetail.tasks && clientDetail.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {clientDetail.tasks.map((task) => (
                      <Card key={task.id}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-md">{task.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {task.status === "en_cours" ? "En cours" : task.status === "termine" ? "Terminé" : "En attente"}
                            {task.dueDate && ` · Échéance: ${formatDate(task.dueDate)}`}
                            {task.assignedTo && ` · Assigné à: ${task.assignedTo}`}
                          </CardDescription>
                        </CardHeader>
                        {task.description && (
                          <CardContent className="py-2">
                            <p className="text-sm">{task.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune tâche pour ce client</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                <ClientTimeline clientId={clientId!} />
              </TabsContent>

              <TabsContent value="automation">
                <TaskAutomationPanel clientId={clientId} showGlobalControls={false} />
              </TabsContent>

              <TabsContent value="history">
                {clientDetail.activities && clientDetail.activities.length > 0 ? (
                  <div className="space-y-3">
                    {clientDetail.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-md">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <History className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <History className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune activité enregistrée</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Client non trouvé</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}