import React from "react";
import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductionSafeSelect } from "@/lib/production-safe-select";

// Détecte si nous sommes en mode production
const isProduction = import.meta.env.MODE === 'production';

interface Option {
  value: string;
  label: string;
}

interface SaferSelectProps {
  field: any;
  label: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  extraAction?: (value: string) => void;
}

/**
 * Composant sécurisé qui utilise soit un select HTML natif en production
 * soit le composant Select de shadcn/ui en développement
 */
export function SaferSelect({
  field,
  label,
  options,
  placeholder,
  disabled = false,
  extraAction,
}: SaferSelectProps) {
  // Handler sécurisé pour les changements de valeurs
  const safeOnValueChange = (value: string) => {
    try {
      // En production, utiliser setTimeout pour éviter les problèmes de rendu
      if (isProduction) {
        setTimeout(() => {
          field.onChange(value);
          if (extraAction) {
            extraAction(value);
          }
        }, 0);
      } else {
        // En développement, appliquer directement
        field.onChange(value);
        if (extraAction) {
          extraAction(value);
        }
      }
    } catch (err) {
      console.error(`Erreur lors du changement de ${label}:`, err);
    }
  };

  // En production, utiliser un select HTML natif
  if (isProduction) {
    return (
      <FormControl>
        <ProductionSafeSelect
          value={field.value || ""}
          onValueChange={safeOnValueChange}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
        />
      </FormControl>
    );
  }

  // En développement, utiliser le composant Select de shadcn/ui
  return (
    <Select
      onValueChange={safeOnValueChange}
      value={field.value || ""}
      defaultValue={field.value || ""}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger className="bg-white border-gray-200 h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}