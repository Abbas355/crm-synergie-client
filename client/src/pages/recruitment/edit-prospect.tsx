import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Schema de validation pour l'édition
const editProspectSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().min(10, "Le téléphone doit contenir au moins 10 caractères"),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  statut: z.enum(["actif", "inactif"]),
});

type EditProspectFormData = z.infer<typeof editProspectSchema>;

export default function EditProspect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Variables pour la gestion des villes supprimées car pas nécessaires pour les recrues

  // Récupérer l'ID depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const prospectId = urlParams.get('id');

  // Query pour récupérer les données du prospect depuis l'endpoint recrues
  const { data: prospectData, isLoading } = useQuery({
    queryKey: [`/api/recruitment/recrues`],
    enabled: !!prospectId,
    select: (data: any) => {
      // Les données arrivent dans {recrues: [...]}
      const recrues = data?.recrues || [];
      const foundRecrue = recrues.find((recrue: any) => recrue.id.toString() === prospectId);
      return foundRecrue;
    },
  });

  const form = useForm<EditProspectFormData>({
    resolver: zodResolver(editProspectSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      adresse: "",
      codePostal: "",
      ville: "",
      statut: "inactif",
    },
    mode: "onChange",
  });

  // Pré-remplir le formulaire avec les données existantes
  useEffect(() => {
    if (prospectData) {
      const formData = {
        prenom: prospectData.prenom || "",
        nom: prospectData.nom || "",
        email: prospectData.email || "",
        telephone: prospectData.phone || "", // Seulement 'phone' disponible dans la table users
        adresse: "", // Pas disponible dans la table users
        codePostal: "", // Pas disponible dans la table users
        ville: "", // Pas disponible dans la table users
        statut: prospectData.active !== false ? "actif" : "inactif",
      };
      form.reset(formData);
    }
  }, [prospectData, form]);

  // Fonction de récupération des villes supprimée car pas nécessaire pour les recrues

  const updateProspectMutation = useMutation({
    mutationFn: async (data: EditProspectFormData) => {
      return await apiRequest("PUT", `/api/users/${prospectId}`, {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email || null,
        phone: data.telephone, // Seulement phone existe dans la table users
        active: data.statut === "actif",
        // Les champs adresse, codePostal, ville ne sont pas disponibles dans la table users
      });
    },
    onSuccess: async () => {
      toast({
        title: "Recrue modifiée",
        description: "Les informations de la recrue ont été mises à jour avec succès.",
      });
      // Invalider et forcer le rechargement des requêtes
      await queryClient.invalidateQueries({ queryKey: ["/api/recruitment/recrues"] });
      await queryClient.refetchQueries({ queryKey: ["/api/recruitment/recrues"] });
      
      // Petit délai pour s'assurer que le cache est bien rafraîchi
      setTimeout(() => {
        setLocation("/recruitment/prospects");
      }, 500);
    },
    onError: (error) => {
      console.error("Erreur modification recrue:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la recrue.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProspectFormData) => {
    updateProspectMutation.mutate(data);
  };

  if (!prospectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">ID du prospect manquant</p>
            <Button 
              onClick={() => setLocation("/recruitment/prospects")}
              className="mt-4"
            >
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-700">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/recruitment/prospects")}
            className="text-gray-700 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Modifier le prospect</h1>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-600" />
              Informations du prospect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    {...form.register("prenom")}
                    placeholder="Prénom"
                  />
                  {form.formState.errors.prenom && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.prenom.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    {...form.register("nom")}
                    placeholder="Nom"
                  />
                  {form.formState.errors.nom && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.nom.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="email@exemple.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    {...form.register("telephone")}
                    placeholder="06 12 34 56 78"
                  />
                  {form.formState.errors.telephone && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.telephone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Note explicative pour les champs disponibles */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Champs modifiables</h3>
                    <p className="text-sm text-blue-700">
                      Pour les recrues, vous pouvez modifier : prénom, nom, email, téléphone et statut (actif/inactif). 
                      Les informations d'adresse ne sont pas requises dans le processus de recrutement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={form.watch("statut")}
                  onValueChange={(value: "actif" | "inactif") => form.setValue("statut", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/recruitment/prospects")}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateProspectMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {updateProspectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}