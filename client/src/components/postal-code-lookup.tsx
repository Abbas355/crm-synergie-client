import React, { useState, useEffect } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface City {
  nom: string;
  code: string;
  codesPostaux: string[];
}

interface PostalCodeLookupProps {
  postalCodeValue: string;
  cityValue: string;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  postalCodeDisabled?: boolean;
  cityDisabled?: boolean;
  required?: boolean;
}

export function PostalCodeLookup({
  postalCodeValue,
  cityValue,
  onPostalCodeChange,
  onCityChange,
  postalCodeDisabled = false,
  cityDisabled = false,
  required = false,
}: PostalCodeLookupProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const debouncedPostalCode = useDebounce(postalCodeValue, 500);
  
  // Rechercher les villes pour un code postal
  useEffect(() => {
    if (debouncedPostalCode && debouncedPostalCode.length === 5) {
      setIsLoading(true);
      setError("");
      
      fetch(`https://geo.api.gouv.fr/communes?codePostal=${debouncedPostalCode}&fields=nom,code,codesPostaux`)
        .then(res => res.json())
        .then((data: City[]) => {
          setCities(data);
          
          // Si une seule ville est trouvée, la sélectionner automatiquement
          if (data.length === 1) {
            onCityChange(data[0].nom);
          } else if (data.length === 0) {
            setError("Aucune ville trouvée pour ce code postal");
          } else if (cityValue && !data.some(city => city.nom === cityValue)) {
            // Si la ville actuelle n'est pas dans la liste des villes trouvées
            onCityChange("");
          }
        })
        .catch(err => {
          setError("Erreur lors de la recherche des villes");
          console.error("Erreur lors de la recherche des villes:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (debouncedPostalCode && debouncedPostalCode.length !== 5) {
      // Réinitialiser les villes si le code postal n'a pas 5 caractères
      setCities([]);
      setError("");
    }
  }, [debouncedPostalCode, onCityChange]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem>
        <FormLabel>Code postal {required && "*"}</FormLabel>
        <FormControl>
          <Input
            placeholder="75000"
            value={postalCodeValue}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            maxLength={5}
            disabled={postalCodeDisabled}
          />
        </FormControl>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <FormMessage />
      </FormItem>
      
      <FormItem>
        <FormLabel>Ville {required && "*"}</FormLabel>
        {isLoading ? (
          <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : cities.length > 1 ? (
          <Select
            value={cityValue}
            onValueChange={onCityChange}
            disabled={cityDisabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.code} value={city.nom}>
                  {city.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <FormControl>
            <Input
              placeholder="Paris"
              value={cityValue}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={cityDisabled}
            />
          </FormControl>
        )}
        <FormMessage />
      </FormItem>
    </div>
  );
}