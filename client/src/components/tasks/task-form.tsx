import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarIcon, User, Clock, AlertCircle, FileText, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUnifiedNotes } from "@/hooks/useUnifiedNotes";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Définir le schéma de validation pour le formulaire de tâche
const taskFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  status: z.string().min(1, "Le statut est requis"),
  priority: z.string().min(1, "La priorité est requise"),
  dueDate: z.date().optional().nullable(),
  clientId: z.number().optional().nullable(),
  taskType: z.string().min(1, "Le type de tâche est requis")
});

// Définir le type pour les valeurs du formulaire
export type TaskFormValues = z.infer<typeof taskFormSchema>;

// Props pour le composant TaskForm
interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => void;
  onCancel: () => void;
  defaultValues?: Partial<TaskFormValues>;
  isEdit?: boolean;
  isMobile?: boolean;
}

// Composant principal du formulaire de tâche
export function TaskForm({ onSubmit, onCancel, defaultValues, isEdit = false, isMobile = false }: TaskFormProps) {
  // Initialiser le formulaire avec react-hook-form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "pending",
      priority: defaultValues?.priority || "medium",
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : null,
      clientId: defaultValues?.clientId || null,
      taskType: defaultValues?.taskType || "suivi"
    }
  });

  // État pour gérer le chargement
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Observer le client sélectionné pour récupérer sa note unifiée
  const selectedClientId = form.watch("clientId");
  
  // Récupérer la note unifiée du client sélectionné
  const { content: clientNote, isLoading: isLoadingNote } = useUnifiedNotes(selectedClientId);

  // Récupérer la liste des clients du vendeur actuel uniquement
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients", { vendeurOnly: true }],
    queryFn: async () => {
      // Nous utilisons vendeurOnly=true pour récupérer uniquement les clients du vendeur connecté
      const response = await apiRequest("GET", "/api/clients?vendeurOnly=true");
      return await response.json();
    }
  });

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (values: TaskFormValues) => {
    console.log("🎯 TaskForm handleSubmit appelé avec:", values);
    setIsSubmitting(true);
    try {
      // Convertir "aucun_client" en null pour le champ clientId
      if (values.clientId && values.clientId.toString() === "aucun_client") {
        values.clientId = null;
      }
      console.log("🎯 TaskForm va appeler onSubmit avec:", values);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Labels pour les priorités
  const priorityLabels = {
    low: "Faible",
    medium: "Normale", 
    high: "Haute",
    urgent: "Urgente"
  };

  // Labels pour les statuts
  const statusLabels = {
    "pending": "En attente",
    "in_progress": "En cours",
    "completed": "Terminée",
    "cancelled": "Annulée"
  };

  return (
    <div className="task-form-container flex-scroll-container bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="h-full flex flex-col min-h-0"
        >
          {/* Zone de contenu scrollable */}
          <div className="flex-1 overflow-y-auto flex-scroll-container" style={{ minHeight: 0 }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              
              {/* En-tête */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {isEdit ? "Modifier la tâche" : "Nouvelle tâche"}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? "Modifiez les informations de votre tâche" : "Créez une nouvelle tâche pour votre suivi"}
                </p>
              </div>

              {/* Section Type et Titre */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <span>Informations principales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type de tâche */}
                  <FormField
                    control={form.control}
                    name="taskType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Type de tâche</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="suivi">📞 Suivi client</SelectItem>
                            <SelectItem value="prospection">🎯 Prospection</SelectItem>
                            <SelectItem value="recrutement">👥 Recrutement</SelectItem>
                            <SelectItem value="administratif">📋 Administratif</SelectItem>
                            <SelectItem value="formation">🎓 Formation</SelectItem>
                            <SelectItem value="autre">📝 Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Titre */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Titre</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Entrez le titre de la tâche" 
                            className="h-10 bg-white border-gray-200 focus:border-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Note Client Unifiée */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span>Note/Commentaire</span>
                          {selectedClientId && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Synchronisé avec client
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={
                              selectedClientId 
                                ? isLoadingNote 
                                  ? "Récupération de la note client..."
                                  : clientNote 
                                    ? "Note du client récupérée automatiquement"
                                    : "Aucune note pour ce client (vous pouvez en ajouter une)"
                                : "Sélectionnez un client pour voir sa note ou ajoutez une description libre"
                            }
                            className="resize-none min-h-[80px] bg-white border-gray-200 focus:border-blue-500" 
                            {...field} 
                            value={
                              selectedClientId && clientNote && !field.value 
                                ? clientNote  // Affiche automatiquement la note du client
                                : field.value || ""
                            }
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            disabled={isLoadingNote}
                          />
                        </FormControl>
                        {selectedClientId && clientNote && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                            ✅ Note synchronisée depuis la fiche client. Les modifications ici mettront à jour la note client.
                          </div>
                        )}
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section Client associé */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-5 w-5 text-green-600" />
                    <span>Client associé</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Client associé (optionnel)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const numericValue = value === "aucun_client" ? null : parseInt(value);
                            field.onChange(numericValue);
                          }} 
                          defaultValue={field.value ? field.value.toString() : "aucun_client"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-blue-500">
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aucun_client">
                              <span className="text-gray-500">Aucun client spécifique</span>
                            </SelectItem>
                            {isLoadingClients ? (
                              <SelectItem value="loading" disabled>
                                <span className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Chargement...
                                </span>
                              </SelectItem>
                            ) : (
                              clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.prenom} {client.nom}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section Statut et Priorité */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span>Statut et priorité</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Statut */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Priorité */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Priorité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <span className={cn(
                                  "flex items-center",
                                  value === "urgent" && "text-red-600 font-medium",
                                  value === "high" && "text-orange-600 font-medium",
                                  value === "medium" && "text-blue-600",
                                  value === "low" && "text-gray-500"
                                )}>
                                  {label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section Date d'échéance */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Planification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Date d'échéance (optionnelle)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-10 justify-start text-left font-normal bg-white border-gray-200 focus:border-blue-500",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionner une date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              locale={fr}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Espacement pour les boutons */}
              <div className="h-20"></div>
            </div>
          </div>

          {/* Boutons d'action fixes en bas */}
          <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 p-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="order-2 sm:order-1 h-10 px-6 border-gray-200 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="order-1 sm:order-2 h-10 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Modification..." : "Création..."}
                  </>
                ) : (
                  <>
                    {isEdit ? "Modifier la tâche" : "Créer la tâche"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}