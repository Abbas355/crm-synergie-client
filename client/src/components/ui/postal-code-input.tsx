import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCodePostal } from "@/hooks/use-code-postal";

interface PostalCodeInputProps<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  codePostalField: keyof T;
  villeField: keyof T;
  codePostalLabel?: string;
  villeLabel?: string;
  codePostalRequired?: boolean;
  villeRequired?: boolean;
  codePostalDescription?: string;
  layout?: "vertical" | "horizontal";
}

/**
 * Composant réutilisable pour les paires de champs code postal/ville
 * avec auto-complétion des villes basée sur le code postal
 */
export function PostalCodeInput<T extends Record<string, any>>({
  form,
  codePostalField,
  villeField,
  codePostalLabel = "Code postal",
  villeLabel = "Ville",
  codePostalRequired = true,
  villeRequired = true,
  codePostalDescription,
  layout = "horizontal",
}: PostalCodeInputProps<T>) {
  // Utiliser notre hook personnalisé
  const { suggestions, showSuggestions, selectVille } = useCodePostal({
    form,
    codePostalField,
    villeField,
  });

  return (
    <div className={layout === "horizontal" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
      <FormField
        control={form.control}
        name={codePostalField as string}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">
              {codePostalLabel} {codePostalRequired && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="75001" 
                className="bg-white border-gray-200"
                {...field} 
              />
            </FormControl>
            {codePostalDescription && (
              <FormDescription className="text-xs text-gray-500">
                {codePostalDescription}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name={villeField as string}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel className="text-gray-700">
              {villeLabel} {villeRequired && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Paris" 
                className="bg-white border-gray-200"
                {...field} 
              />
            </FormControl>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((ville, index) => (
                  <div
                    key={`${ville.nom}-${index}`}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => selectVille(ville)}
                  >
                    {ville.nom}
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}