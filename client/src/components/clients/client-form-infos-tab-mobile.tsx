import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { ProductionSafeSelect } from "@/lib/production-safe-select";
import { MobileSafeDatePicker } from "@/components/mobile-safe-date-picker";
import { BasicDatePicker } from "@/components/basic-date-picker";

interface ClientFormInfosTabProps {
  form: UseFormReturn<any>;
  isPending: boolean;
  sourceOptions: { value: string; label: string }[];
  clientStatusOptions: { value: string; label: string }[];
  handleTabChange?: (tab: string) => void;
  client?: any;
  editMode?: boolean;
  dateRendezVousOpen?: boolean;
  setDateRendezVousOpen?: (open: boolean) => void;
  dateInstallationOpen?: boolean;
  setDateInstallationOpen?: (open: boolean) => void;
}

/**
 * Composant pour l'onglet Infos du formulaire client optimisé pour mobile
 */
export function ClientFormInfosTab({
  form,
  isPending,
  sourceOptions,
  clientStatusOptions,
  handleTabChange,
  client,
  editMode = true,
  dateRendezVousOpen = false,
  setDateRendezVousOpen,
  dateInstallationOpen = false,
  setDateInstallationOpen,
}: ClientFormInfosTabProps) {
  // Surveiller le changement de statut pour la validation des dates
  const selectedStatus = form.watch('status');
  
  // Effet pour valider les dates lorsque le statut change
  useEffect(() => {
    // Si le statut est "rendez-vous", vérifier si la date de rendez-vous est définie
    if (selectedStatus === 'rendez-vous') {
      const dateRendezVous = form.getValues('dateRendezVous');
      if (!dateRendezVous) {
        form.setError('dateRendezVous', {
          type: 'manual',
          message: 'La date de rendez-vous est obligatoire pour ce statut'
        });
      } else {
        form.clearErrors('dateRendezVous');
      }
    }
    
    // Si le statut est "installation", vérifier si la date d'installation est définie
    if (selectedStatus === 'installation') {
      const dateInstallation = form.getValues('dateInstallation');
      if (!dateInstallation) {
        form.setError('dateInstallation', {
          type: 'manual',
          message: 'La date d\'installation est obligatoire pour ce statut'
        });
      } else {
        form.clearErrors('dateInstallation');
      }
    }
  }, [selectedStatus, form]);

  return (
    <div className="space-y-4">
      {/* Statut du client */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Statut du client <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              {/* Utilisation du sélecteur optimisé pour éviter les problèmes sur mobile */}
              <ProductionSafeSelect
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("Statut sélectionné:", value);
                  // Mettre à jour le statut
                  field.onChange(value);
                  
                  // Ouvrir automatiquement le calendrier si nécessaire après un court délai
                  if (value === 'rendez-vous' && setDateRendezVousOpen) {
                    setTimeout(() => setDateRendezVousOpen(true), 200);
                  } else if (value === 'installation' && setDateInstallationOpen) {
                    setTimeout(() => setDateInstallationOpen(true), 200);
                  }
                }}
                options={clientStatusOptions}
                placeholder="Sélectionner un statut"
                disabled={isPending || editMode === false}
                className="bg-white border-gray-200"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Le statut détermine l'étape dans le parcours client
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date de rendez-vous (conditionnelle si le statut est "rendez-vous") */}
      {(selectedStatus === 'rendez-vous' || form.getValues('dateRendezVous')) && (
        <FormField
          control={form.control}
          name="dateRendezVous"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-gray-700 font-medium">
                Date de rendez-vous
                {selectedStatus === 'rendez-vous' && <span className="text-red-500"> *</span>}
              </FormLabel>
              <FormControl>
                {/* Utilisation du composant simplifié pour une meilleure compatibilité mobile */}
                <BasicDatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date)}
                  label="Date de rendez-vous"
                  disabled={isPending || editMode === false}
                  placeholder="Sélectionner une date"
                  className="w-full"
                />
              </FormControl>
              <FormDescription className="text-xs">
                {selectedStatus === 'rendez-vous' 
                  ? "Date obligatoire pour le statut 'Rendez-vous'" 
                  : "Date du rendez-vous avec le client"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Date d'installation (conditionnelle si le statut est "installation") */}
      {(selectedStatus === 'installation' || form.getValues('dateInstallation')) && (
        <FormField
          control={form.control}
          name="dateInstallation"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-gray-700 font-medium">
                Date d'installation
                {selectedStatus === 'installation' && <span className="text-red-500"> *</span>}
              </FormLabel>
              <FormControl>
                {/* Utilisation du composant simplifié pour une meilleure compatibilité mobile */}
                <BasicDatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date)}
                  label="Date d'installation"
                  disabled={isPending || editMode === false}
                  placeholder="Sélectionner une date"
                  className="w-full"
                />
              </FormControl>
              <FormDescription className="text-xs">
                {selectedStatus === 'installation' 
                  ? "Date obligatoire pour le statut 'Installation'" 
                  : "Date d'installation prévue"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Source */}
      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Source <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              {/* Utilisation du sélecteur optimisé pour éviter les problèmes sur mobile */}
              <ProductionSafeSelect
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("Source sélectionnée:", value);
                  field.onChange(value);
                  
                  // Si on change la source et qu'on ne sélectionne pas "Recommandation",
                  // on réinitialise le type de recommandation
                  if (value !== "Recommandation") {
                    form.setValue("source", "");
                  }
                }}
                options={sourceOptions}
                placeholder="Sélectionner une source"
                disabled={isPending || editMode === false}
                className="bg-white border-gray-200"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Type de recommandation (si la source est "Recommandation") */}
      {form.watch('source') === 'Recommandation' && (
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Type de recommandation <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                {/* Utilisation du sélecteur optimisé pour éviter les problèmes sur mobile */}
                <ProductionSafeSelect
                  value={field.value || ""}
                  onValueChange={(value) => {
                    console.log("Type de recommandation sélectionné:", value);
                    field.onChange(value);
                  }}
                  options={sourceOptions}
                  placeholder="Sélectionner un type"
                  disabled={isPending || editMode === false}
                  className="bg-white border-gray-200"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Commentaire */}
      <FormField
        control={form.control}
        name="commentaire"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-medium">Commentaire</FormLabel>
            {client && !editMode ? (
              <div className="p-2 border rounded bg-gray-50 min-h-[80px]">
                {field.value || "Aucun commentaire"}
              </div>
            ) : (
              <FormControl>
                <Textarea 
                  placeholder="Ajoutez un commentaire..." 
                  className="bg-white border-gray-200 min-h-[80px]"
                  disabled={isPending || editMode === false}
                  {...field} 
                />
              </FormControl>
            )}
            <FormDescription className="text-xs">
              Informations complémentaires sur le client
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Boutons de navigation */}
      <div className="flex justify-between mt-8">
        <Button 
          type="button"
          variant="outline" 
          className="bg-white border-gray-200"
          onClick={() => handleTabChange && handleTabChange('contrat')}
          disabled={isPending}
        >
          Précédent
        </Button>
        <div className="flex gap-2">
          <Button 
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isPending || editMode === false}
          >
            {isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                En cours...
              </>
            ) : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}