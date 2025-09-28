import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, TrendingUp, Clock, AlertTriangle, CheckCircle, PlayCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schéma pour déclencher l'automatisation
const automationTriggerSchema = z.object({
  event: z.enum(['signature_contrat', 'status_change', 'date_echeance', 'client_created']),
  clientId: z.number(),
  eventData: z.object({}).optional()
});

type AutomationTriggerData = z.infer<typeof automationTriggerSchema>;

// Schéma pour créer une tâche client
const clientTaskSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  category: z.enum(['appel', 'suivi', 'prospection', 'installation', 'general']),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  dueDate: z.string().optional(),
  estimatedDuration: z.coerce.number().positive().optional(),
  location: z.string().optional()
});

type ClientTaskData = z.infer<typeof clientTaskSchema>;

interface TaskAutomationPanelProps {
  clientId?: number;
  showGlobalControls?: boolean;
}

export function TaskAutomationPanel({ clientId, showGlobalControls = false }: TaskAutomationPanelProps) {
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Statistiques par défaut pour l'affichage
  const defaultStats = {
    overview: {
      total: 5,
      pending: 3,
      overdue: 1,
      completedToday: 2
    }
  };

  const automationStats = defaultStats;
  const statsLoading = false;

  // Formulaire pour déclencher l'automatisation
  const automationForm = useForm<AutomationTriggerData>({
    resolver: zodResolver(automationTriggerSchema),
    defaultValues: {
      clientId: clientId || 0,
      event: 'signature_contrat'
    }
  });

  // Formulaire pour créer une tâche client
  const taskForm = useForm<ClientTaskData>({
    resolver: zodResolver(clientTaskSchema),
    defaultValues: {
      category: 'general',
      priority: 'medium'
    }
  });

  // Mutation pour déclencher l'automatisation
  const triggerAutomationMutation = useMutation({
    mutationFn: async (data: AutomationTriggerData) => {
      const response = await fetch('/api/tasks/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors du déclenchement');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Automatisation déclenchée",
        description: `${data.tasksCreated} tâche(s) créée(s) automatiquement`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/tasks'] });
      setIsAutomationDialogOpen(false);
      automationForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de déclencher l'automatisation",
        variant: "destructive"
      });
    }
  });

  // Mutation pour exécuter le processus d'automatisation global
  const runAutomationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tasks/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors de l\'exécution');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processus d'automatisation exécuté",
        description: `${data.results.reminders.length} rappels, ${data.results.escalations.length} escalades traités`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/automation/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter le processus d'automatisation",
        variant: "destructive"
      });
    }
  });

  // Mutation pour créer une tâche client
  const createTaskMutation = useMutation({
    mutationFn: async (data: ClientTaskData) => {
      const response = await fetch(`/api/clients/${clientId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tâche créée",
        description: "La tâche a été créée avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/timeline`] });
      setIsTaskDialogOpen(false);
      taskForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive"
      });
    }
  });

  const onTriggerAutomation = (data: AutomationTriggerData) => {
    triggerAutomationMutation.mutate(data);
  };

  const onCreateTask = (data: ClientTaskData) => {
    createTaskMutation.mutate(data);
  };

  const eventLabels = {
    signature_contrat: "Signature de contrat",
    status_change: "Changement de statut",
    date_echeance: "Date d'échéance",
    client_created: "Création de client"
  };

  const categoryLabels = {
    appel: "Appel",
    suivi: "Suivi",
    prospection: "Prospection",
    installation: "Installation",
    general: "Général"
  };

  const priorityLabels = {
    urgent: "Urgent",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible"
  };

  return (
    <div className="space-y-4">
      {/* Statistiques d'automatisation */}
      {showGlobalControls && automationStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{automationStats.overview.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">En attente</p>
                  <p className="text-2xl font-bold">{automationStats.overview.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">En retard</p>
                  <p className="text-2xl font-bold">{automationStats.overview.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Terminées aujourd'hui</p>
                  <p className="text-2xl font-bold">{automationStats.overview.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contrôles d'automatisation - Design amélioré */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-bold text-blue-800">Automatisation des Tâches</CardTitle>
            </div>
            <p className="text-sm text-blue-600/80 hidden sm:block">Gestion automatisée de vos tâches et processus</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {/* Bouton pour déclencher l'automatisation */}
            {clientId && (
              <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Déclencher automatisation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Déclencher automatisation</DialogTitle>
                  </DialogHeader>
                  <Form {...automationForm}>
                    <form onSubmit={automationForm.handleSubmit(onTriggerAutomation)} className="space-y-4">
                      <FormField
                        control={automationForm.control}
                        name="event"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Événement déclencheur</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(eventLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={triggerAutomationMutation.isPending}>
                          {triggerAutomationMutation.isPending ? "Déclenchement..." : "Déclencher"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {/* Bouton pour créer une tâche manuelle */}
            {clientId && (
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Créer tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                  </DialogHeader>
                  <Form {...taskForm}>
                    <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                      <FormField
                        control={taskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titre</FormLabel>
                            <FormControl>
                              <Input placeholder="Titre de la tâche..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={taskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Description de la tâche..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Catégorie</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(categoryLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={taskForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priorité</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(priorityLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date d'échéance</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={taskForm.control}
                          name="estimatedDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Durée estimée (min)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="30" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={taskForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu (optionnel)</FormLabel>
                            <FormControl>
                              <Input placeholder="Lieu de la tâche..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createTaskMutation.isPending}>
                          {createTaskMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {/* Boutons d'action optimisés */}
            {showGlobalControls && (
              <>
                <Button 
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 font-semibold shadow-md transition-all duration-200 hover:scale-105"
                  onClick={() => runAutomationMutation.mutate()}
                  disabled={runAutomationMutation.isPending}
                >
                  {runAutomationMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>Exécution...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      <span>Exécuter</span>
                    </>
                  )}
                </Button>
                <Button 
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 flex items-center justify-center gap-2 font-semibold shadow-md transition-all duration-200 hover:scale-105"
                  variant="outline"
                >
                  <Zap className="h-4 w-4" />
                  <span>Configurer</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}