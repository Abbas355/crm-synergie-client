import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
interface ClientStatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Version simplifiée du sélecteur de statut
export function ClientStatusSelector({ value, onChange, disabled = false }: ClientStatusSelectorProps) {
  return (
    <Select
      onValueChange={onChange}
      defaultValue={value}
      value={value}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un statut" />
      </SelectTrigger>
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
  );
}