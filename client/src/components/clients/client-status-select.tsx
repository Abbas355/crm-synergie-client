import { useState, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileSafeDatePicker } from "@/components/mobile-safe-date-picker";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UseFormReturn } from "react-hook-form";

import { CLIENT_STATUSES, CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, type ClientStatus } from "@shared/constants";

// Types de statuts disponibles
export type { ClientStatus };

// Informations sur les statuts (label, couleur, etc.)
export const statusOptions = [
  { value: CLIENT_STATUSES.ENREGISTRE, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.ENREGISTRE], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.ENREGISTRE] },
  { value: CLIENT_STATUSES.VALIDE, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.VALIDE], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.VALIDE] },
  { value: CLIENT_STATUSES.VALIDATION_7_JOURS, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.VALIDATION_7_JOURS], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.VALIDATION_7_JOURS] },
  { value: CLIENT_STATUSES.RENDEZ_VOUS, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.RENDEZ_VOUS], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.RENDEZ_VOUS], requiresDate: true, dateField: "dateRendezVous" },
  { value: CLIENT_STATUSES.POST_PRODUCTION, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.POST_PRODUCTION], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.POST_PRODUCTION] },
  { value: CLIENT_STATUSES.INSTALLATION, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.INSTALLATION], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.INSTALLATION], requiresDate: true, dateField: "dateInstallation" },
  { value: CLIENT_STATUSES.RESILIATION, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.RESILIATION], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.RESILIATION] },
  { value: CLIENT_STATUSES.ABANDONNE, label: CLIENT_STATUS_LABELS[CLIENT_STATUSES.ABANDONNE], color: CLIENT_STATUS_COLORS[CLIENT_STATUSES.ABANDONNE] }
];

// Fonction pour obtenir les informations d'un statut par sa valeur
export const getStatusInfo = (status: string) => {
  return statusOptions.find(option => option.value === status) || statusOptions[0];
};

// Fonction pour obtenir le label d'un statut
export const getStatusLabel = (status: string): string => {
  const statusInfo = getStatusInfo(status);
  return statusInfo ? statusInfo.label : "Inconnu";
};

// Propriétés du composant
interface ClientStatusSelectProps {
  form: UseFormReturn<any>;
  isViewMode?: boolean;
}

// Composant de sélection de statut client
export function ClientStatusSelect({ form, isViewMode = false }: ClientStatusSelectProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(form.getValues("status") || "nouveau");
  const [showDateAlert, setShowDateAlert] = useState<boolean>(false);
  const [requiredDateField, setRequiredDateField] = useState<string | null>(null);

  // Observer les changements de statut
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "status") {
        const newStatus = value.status as string;
        setCurrentStatus(newStatus);
        
        // Vérifier si le statut nécessite une date
        const statusInfo = getStatusInfo(newStatus);
        if (statusInfo?.requiresDate) {
          setRequiredDateField(statusInfo.dateField);
          
          // Vérifier si la date correspondante est renseignée
          const dateValue = form.getValues(statusInfo.dateField);
          setShowDateAlert(!dateValue);
        } else {
          setRequiredDateField(null);
          setShowDateAlert(false);
        }
      }
      
      // Si la date requise change, mettre à jour l'alerte
      if (requiredDateField && name === requiredDateField) {
        const dateValue = value[requiredDateField];
        setShowDateAlert(!dateValue);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, requiredDateField]);
  
  // Vérifier initialement si le statut courant nécessite une date
  useEffect(() => {
    const statusInfo = getStatusInfo(currentStatus);
    if (statusInfo?.requiresDate) {
      setRequiredDateField(statusInfo.dateField);
      const dateValue = form.getValues(statusInfo.dateField);
      setShowDateAlert(!dateValue);
    }
  }, [currentStatus, form]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Statut vente *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                // Gérer l'état ici directement aussi pour une réponse immédiate
                const statusInfo = getStatusInfo(value);
                if (statusInfo?.requiresDate) {
                  setRequiredDateField(statusInfo.dateField);
                  const dateValue = form.getValues(statusInfo.dateField);
                  setShowDateAlert(!dateValue);
                } else {
                  setRequiredDateField(null);
                  setShowDateAlert(false);
                }
              }}
              defaultValue={field.value}
              value={field.value}
              disabled={isViewMode}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={`${option.color} hover:${option.color}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Alerte pour date obligatoire */}
      {showDateAlert && requiredDateField && (
        <Alert variant="destructive" className="py-2 border-red-500">
          <InfoCircledIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            {requiredDateField === "dateRendezVous" 
              ? "Une date de rendez-vous est requise pour ce statut." 
              : "Une date d'installation est requise pour ce statut."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Champ de date conditionnelle */}
      {requiredDateField === "dateRendezVous" && (
        <FormField
          control={form.control}
          name="dateRendezVous"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de rendez-vous *</FormLabel>
              <MobileSafeDatePicker
                field={field}
                disabled={isViewMode}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {/* Champ de date d'installation conditionnelle */}
      {requiredDateField === "dateInstallation" && (
        <FormField
          control={form.control}
          name="dateInstallation"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date d'installation *</FormLabel>
              <MobileSafeDatePicker
                field={field}
                disabled={isViewMode}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}