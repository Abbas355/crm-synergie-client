import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimCard, Client } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, ArrowLeft, Check, CreditCard, User } from "lucide-react";
import { useUnifiedNotes } from "@/hooks/useUnifiedNotes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SimCardFormProps = {
  isOpen: boolean;
  onClose: () => void;
  simCard?: SimCard;
};

// Schéma de validation modernisé
const simCardSchema = z.object({
  codeVendeur: z.string().optional().default(""),
  numero: z
    .string()
    .min(19, "Le numéro doit contenir 19 chiffres")
    .max(19, "Le numéro doit contenir 19 chiffres")
    .regex(/^893315022201\d{7}$/, "Le numéro doit commencer par 893315022201 suivi de 7 chiffres"),
  statut: z.enum(["disponible", "affecte"]).default("disponible"),
  clientId: z.number().optional().nullable(),
  dateInstallation: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof simCardSchema>;

export function SimCardFormModern({ isOpen, onClose, simCard }: SimCardFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(simCardSchema),
    defaultValues: {
      codeVendeur: simCard?.codeVendeur || "",
      numero: simCard?.numero || "893315022201",
      statut: simCard?.statut || "disponible",
      clientId: simCard?.clientId || null,
      dateInstallation: simCard?.dateInstallation ? 
        new Date(simCard.dateInstallation).toISOString().split('T')[0] : "",
      note: simCard?.note || "",
    },
  });

  // Observer les champs pour l'interface dynamique
  const statut = form.watch("statut");
  const clientId = form.watch("clientId");
  
  // Récupérer la note unifiée du client assigné
  const { content: clientNote, isLoading: isLoadingNote, updateNote } = useUnifiedNotes(clientId);

  // Récupérer la liste des clients pour le sélecteur
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: statut === "affecte",
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        dateInstallation: data.dateInstallation ? data.dateInstallation : null, // Garder en string pour l'API
      };

      if (simCard?.id) {
        // Modification
        await apiRequest("PUT", `/api/sim-cards/${simCard.id}`, submitData);
        toast({
          title: "Carte SIM modifiée",
          description: "La carte SIM a été modifiée avec succès.",
        });
      } else {
        // Création
        await apiRequest("POST", "/api/sim-cards", submitData);
        toast({
          title: "Carte SIM créée",
          description: "La carte SIM a été créée avec succès.",
        });
      }

      // Déclencher la synchronisation via le gestionnaire centralisé
      const { simCardSync } = await import('@/utils/simCardSync');
      await simCardSync.triggerUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la carte SIM",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réinitialiser le formulaire quand la carte SIM change
  useEffect(() => {
    if (simCard) {
      form.reset({
        codeVendeur: simCard.codeVendeur || "",
        numero: simCard.numero || "893315022201",
        statut: simCard.statut || "disponible",
        clientId: simCard.clientId || null,
        dateInstallation: simCard.dateInstallation ? 
          new Date(simCard.dateInstallation).toISOString().split('T')[0] : "",
        note: simCard.note || "",
      });
    } else {
      form.reset({
        codeVendeur: "",
        numero: "893315022201",
        statut: "disponible",
        clientId: null,
        dateInstallation: "",
        note: "",
      });
    }
  }, [simCard, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            {simCard ? "Modifier la carte SIM" : "Nouvelle carte SIM"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Numéro de carte */}
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Numéro de carte SIM
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="893315022201xxxxxxx"
                        className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code vendeur */}
              <FormField
                control={form.control}
                name="codeVendeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Code vendeur
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="FR12345678"
                        className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Statut */}
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Statut
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="affecte">Affectée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client (affiché seulement si affecté) */}
              {statut === "affecte" && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Client
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11">
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.prenom} {client.nom} - {client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date d'installation (affichée seulement si affecté avec client) */}
              {statut === "affecte" && clientId && (
                <FormField
                  control={form.control}
                  name="dateInstallation"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Date d'installation
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Note Client Unifiée */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>Note/Commentaire Client</span>
                      {clientId && clientNote && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Synchronisé avec client
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          !clientId 
                            ? "Assignez d'abord un client pour voir sa note"
                            : isLoadingNote 
                              ? "Récupération de la note client..."
                              : clientNote 
                                ? "Note du client récupérée automatiquement"
                                : "Aucune note pour ce client (vous pouvez en ajouter une)"
                        }
                        value={
                          clientId && clientNote && !field.value 
                            ? clientNote  // Affiche automatiquement la note du client
                            : field.value || ""
                        }
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Si un client est assigné et qu'on modifie la note, 
                          // on met à jour la note unifiée du client
                          if (clientId && e.target.value !== clientNote) {
                            // Optionnel: actualisation temps réel de la note client
                            // updateNote(e.target.value);
                          }
                        }}
                        disabled={isLoadingNote}
                        className="bg-white/60 dark:bg-slate-700/60 border-white/30 focus:border-blue-400 shadow-lg rounded-xl h-11"
                      />
                    </FormControl>
                    {clientId && clientNote && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md">
                        ✅ Note récupérée depuis la fiche client. Les modifications seront synchronisées.
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto bg-white/60 dark:bg-slate-700/60 border-white/30 hover:bg-white/80 dark:hover:bg-slate-700/80 shadow-lg rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {simCard ? "Sauvegarder" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}