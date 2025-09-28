import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";

interface Commune {
  nom: string;
  code: string;
  codesPostaux: string[];
}

interface PostalCodeAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onCitySelect: (city: string) => void;
}

/**
 * Composant de champ de saisie pour le code postal avec autocomplétion des communes
 */
export function PostalCodeAutocomplete({ 
  value, 
  onChange,
  onCitySelect,
  ...props 
}: PostalCodeAutocompleteProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Synchroniser avec la valeur externe
  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  // Effet de recherche des communes avec délai pour éviter trop de requêtes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (internalValue.length >= 3) {
        fetchCommunes(internalValue);
      } else {
        setCommunes([]);
        setOpen(false);
      }
    }, 1000); // Délai de 1 seconde

    return () => clearTimeout(timeoutId);
  }, [internalValue]);

  const fetchCommunes = async (postalCode: string) => {
    if (postalCode.length < 2) return;

    try {
      setLoading(true);
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux`);
      
      if (response.ok) {
        const data = await response.json();
        setCommunes(data);
        setOpen(data.length > 0);
      } else {
        console.error("Erreur lors de la récupération des communes:", response.statusText);
        setCommunes([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des communes:", error);
      setCommunes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
    setInternalValue(newValue);
    onChange(newValue);
    
    // Ne pas ouvrir immédiatement pour éviter le mouvement du formulaire
    setOpen(false);
  };

  const handleSelectCommune = (commune: Commune) => {
    onCitySelect(commune.nom);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <Input
            type="text"
            placeholder="Code postal"
            value={internalValue}
            onChange={handleChange}
            onClick={() => internalValue.length >= 2 && setOpen(true)}
            {...props}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={5}>
        <Command>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Chargement des communes...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>Aucune commune trouvée</CommandEmpty>
                <CommandGroup heading="Communes">
                  {communes.map((commune) => (
                    <CommandItem
                      key={commune.code}
                      onSelect={() => handleSelectCommune(commune)}
                      className="cursor-pointer"
                    >
                      {commune.nom}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}