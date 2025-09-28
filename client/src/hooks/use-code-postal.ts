import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

interface UseCodePostalProps<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  codePostalField: keyof T;
  villeField: keyof T;
}

interface VilleSuggestion {
  nom: string;
  codePostal: string;
}

export function useCodePostal<T extends Record<string, any>>({
  form,
  codePostalField,
  villeField,
}: UseCodePostalProps<T>) {
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const codePostal = form.watch(codePostalField as string);

  useEffect(() => {
    const fetchVilles = async () => {
      if (!codePostal || codePostal.length !== 5) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Vérifier que c'est un code postal valide (5 chiffres)
      if (!/^\d{5}$/.test(codePostal)) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`https://api.zippopotam.us/fr/${codePostal}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.places && data.places.length > 0) {
            const villes = data.places.map((place: any) => ({
              nom: place['place name'],
              codePostal: data['post code'],
            }));
            
            setSuggestions(villes);
            
            // Si une seule ville, l'auto-compléter automatiquement
            if (villes.length === 1) {
              form.setValue(villeField as string, villes[0].nom);
              setShowSuggestions(false);
            } else {
              // Plusieurs villes trouvées, afficher les suggestions
              setShowSuggestions(true);
            }
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des villes:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVilles();
  }, [codePostal, form, villeField]);

  const selectVille = (ville: VilleSuggestion) => {
    form.setValue(villeField as string, ville.nom);
    setShowSuggestions(false);
  };

  return {
    suggestions,
    showSuggestions,
    isLoading,
    selectVille,
  };
}