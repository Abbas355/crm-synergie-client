import { forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface DateNaissanceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Composant unifié pour la saisie de date de naissance
 * Utilisé dans TOUS les formulaires clients pour garantir la cohérence
 * Format: JJ/MM/AAAA avec validation automatique
 */
export const DateNaissanceInput = forwardRef<HTMLInputElement, DateNaissanceInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    
    /**
     * Formate automatiquement la date de naissance en JJ/MM/AAAA
     * Identique à la logique du formulaire nouveau client
     */
    const formatDateNaissance = (inputValue: string) => {
      // Supprimer tous les caractères non numériques
      const cleanValue = inputValue.replace(/\D/g, '');
      
      // Limiter à 8 caractères (jjmmaaaa)
      const limitedValue = cleanValue.slice(0, 8);
      
      // Ajouter les séparations automatiquement
      if (limitedValue.length >= 3 && limitedValue.length <= 4) {
        return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`;
      } else if (limitedValue.length >= 5) {
        return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4)}`;
      } else if (limitedValue.length >= 1) {
        return limitedValue;
      }
      
      return limitedValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatDateNaissance(e.target.value);
      onChange?.(formattedValue);
    };

    return (
      <Input
        ref={ref}
        type="text"
        placeholder="JJ/MM/AAAA"
        value={value}
        onChange={handleChange}
        maxLength={10}
        className={cn(className)}
        {...props}
      />
    );
  }
);

DateNaissanceInput.displayName = "DateNaissanceInput";