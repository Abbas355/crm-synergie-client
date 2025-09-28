import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock, User, Tag, AlertTriangle, Plus, Edit2, ArrowLeft } from "lucide-react";

interface NewTaskFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewTaskForm({ onClose, onSuccess }: NewTaskFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    status: "pending",
    dueDate: "",
    estimatedDuration: "",
    clientId: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des clients du vendeur connecté
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des clients');
      return response.json();
    },
    enabled: true
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      return await apiRequest("POST", "/api/tasks", {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        category: taskData.category,
        dueDate: taskData.dueDate,
        client_id: taskData.clientId && taskData.clientId !== "none" ? parseInt(taskData.clientId) : null,
        estimated_duration: taskData.estimatedDuration ? parseInt(taskData.estimatedDuration) : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tâche créée",
        description: "La nouvelle tâche a été créée avec succès.",
      });
      handleClose();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est obligatoire.",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      priority: "",
      status: "pending",
      dueDate: "",
      estimatedDuration: "",
      clientId: ""
    });
    onClose();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const priorityOptions = [
    { value: "low", label: "Faible", color: "text-blue-600" },
    { value: "medium", label: "Moyenne", color: "text-yellow-600" },
    { value: "high", label: "Élevée", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" }
  ];

  const categoryOptions = [
    { value: "appel", label: "Appel", icon: "📞" },
    { value: "suivi", label: "Suivi", icon: "👥" },
    { value: "prospection", label: "Prospection", icon: "🎯" },
    { value: "installation", label: "Installation", icon: "🔧" },
    { value: "formation", label: "Formation", icon: "📚" },
    { value: "administratif", label: "Administratif", icon: "📋" }
  ];

  return (
    <div className="relative bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl overflow-hidden border border-blue-100/50 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Fond décoratif avec particules */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Header fixe */}
        <div className="relative z-10 p-8 pb-4 flex-shrink-0">
          {/* Header élégant */}
          <div className="flex items-center gap-6 mb-6">
            <button
              onClick={handleClose}
              className="group p-3 bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Nouvelle tâche
                </h2>
              </div>
              <p className="text-gray-500 text-sm">Créez et organisez votre travail efficacement</p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable avec scroll mobile optimisé */}
        <div className="relative z-10 flex-1 task-form-scroll px-8">
          <div className="mobile-form-spacing">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre de la tâche - Design premium */}
          <div className="group">
            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-sm">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
              <span>Titre de la tâche</span>
              <span className="text-red-500 text-xs">*</span>
            </Label>
            <div className="relative">
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Ex: Appeler client pour validation"
                className="h-14 text-base px-4 bg-white/90 border-2 border-gray-200/50 focus:border-blue-400 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400"
                required
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Description - Design élégant */}
          <div className="group">
            <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 shadow-sm">
                <Edit2 className="h-4 w-4 text-purple-600" />
              </div>
              <span>Description</span>
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Détaillez votre tâche, objectifs et notes importantes..."
                rows={4}
                className="text-base px-4 py-3 bg-white/90 border-2 border-gray-200/50 focus:border-purple-400 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 resize-none placeholder:text-gray-400"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Ligne 1: Catégorie et Priorité - Design moderne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <Label className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
                <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl group-hover:from-green-200 group-hover:to-emerald-300 transition-all duration-300 shadow-sm">
                  <Tag className="h-4 w-4 text-green-600" />
                </div>
                <span>Catégorie</span>
              </Label>
              <div className="relative">
                <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                  <SelectTrigger className="h-14 bg-white/90 border-2 border-gray-200/50 focus:border-green-400 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-lg">
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="rounded-xl hover:bg-green-50 transition-colors p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{option.icon}</span>
                          <span className="font-medium text-gray-700">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="group">
              <Label className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
                <div className="p-2 bg-gradient-to-r from-orange-100 to-red-200 rounded-xl group-hover:from-orange-200 group-hover:to-red-300 transition-all duration-300 shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <span>Priorité</span>
              </Label>
              <div className="relative">
                <Select value={formData.priority} onValueChange={(value) => updateFormData("priority", value)}>
                  <SelectTrigger className="h-14 bg-white/90 border-2 border-gray-200/50 focus:border-orange-400 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Sélectionner une priorité" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-lg">
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="rounded-xl hover:bg-orange-50 transition-colors p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full shadow-sm ${option.color === 'text-blue-600' ? 'bg-blue-500' : option.color === 'text-yellow-600' ? 'bg-yellow-500' : option.color === 'text-orange-600' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                          <span className={`font-medium ${option.color}`}>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Ligne 2: Date d'échéance et Durée estimée - Design moderne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <Label htmlFor="dueDate" className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
                <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-200 rounded-xl group-hover:from-emerald-200 group-hover:to-green-300 transition-all duration-300 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                </div>
                <span>Date d'échéance</span>
              </Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateFormData("dueDate", e.target.value)}
                  className="h-14 text-base px-4 bg-white/90 border-2 border-gray-200/50 focus:border-emerald-400 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="group">
              <Label htmlFor="estimatedDuration" className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-200 rounded-xl group-hover:from-blue-200 group-hover:to-cyan-300 transition-all duration-300 shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span>Durée estimée (min)</span>
              </Label>
              <div className="relative">
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => updateFormData("estimatedDuration", e.target.value)}
                  placeholder="Ex: 30"
                  min="1"
                  className="h-14 text-base px-4 bg-white/90 border-2 border-gray-200/50 focus:border-blue-400 focus:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>

          {/* Client associé - Design moderne */}
          <div className="group">
            <Label htmlFor="clientId" className="text-sm font-semibold flex items-center gap-3 mb-4 text-gray-700">
              <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-200 rounded-xl group-hover:from-indigo-200 group-hover:to-purple-300 transition-all duration-300 shadow-sm">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <span>Client associé</span>
              <span className="text-gray-400 text-xs">(optionnel)</span>
            </Label>
            <div className="relative">
              <Select value={formData.clientId} onValueChange={(value) => updateFormData("clientId", value)}>
                <SelectTrigger className="h-14 bg-white/90 border-2 border-gray-200/50 focus:border-indigo-400 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                  <SelectValue placeholder={clientsLoading ? "Chargement des clients..." : "Sélectionnez un client (optionnel)"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-lg">
                  <SelectItem value="none" className="rounded-xl hover:bg-indigo-50 transition-colors p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-gray-500">Aucun client</span>
                    </div>
                  </SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="rounded-xl hover:bg-indigo-50 transition-colors p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {client.prenom?.[0]?.toUpperCase()}{client.nom?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">{client.prenom} {client.nom}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Boutons d'action - Design premium */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gradient-to-r from-gray-200/50 via-gray-300/30 to-gray-200/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="group w-full sm:w-auto h-14 px-8 bg-white/90 border-2 border-gray-200/50 hover:border-gray-300 hover:bg-white rounded-2xl transition-all duration-300 font-medium text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
                <span>Annuler</span>
              </div>
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || !formData.title.trim()}
              className="group w-full sm:flex-1 h-14 px-8 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {createTaskMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>Créer la tâche</span>
                  </>
                )}
              </div>
            </Button>
          </div>
            </form>
          </div>
        </div>
    </div>
  );
}