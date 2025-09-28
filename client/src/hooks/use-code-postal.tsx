import { useState, useEffect } from 'react';
import { getVillesByCodePostal } from '@/lib/postal-codes';
import { UseFormReturn } from 'react-hook-form';

/**
 * Hook pour gérer l'auto-complétion des villes à partir des codes postaux
 * Peut être utilisé dans n'importe quel formulaire avec une paire code postal/ville
 */
export function useCodePostal<T extends Record<string, any>>({
  form,
  codePostalField,
  villeField,
}: {
  form: UseFormReturn<T>;
  codePostalField: keyof T;
  villeField: keyof T;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // S'abonner aux changements du formulaire pour détecter les modifications du code postal
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Si le champ modifié est le code postal
      if (name === codePostalField) {
        const codePostal = value[codePostalField] as string;
        
        // Si le code postal a 5 caractères, rechercher les villes correspondantes
        if (codePostal && codePostal.length === 5) {
          const villes = getVillesByCodePostal(codePostal);
          
          if (villes.length === 1) {
            // Une seule ville : remplir automatiquement
            form.setValue(villeField as any, villes[0]);
            setShowSuggestions(false);
          } else if (villes.length > 1) {
            // Plusieurs villes : afficher les suggestions
            setSuggestions(villes);
            setShowSuggestions(true);
          } else {
            // Aucune ville trouvée
            setShowSuggestions(false);
          }
        } else {
          // Code postal incomplet, cacher les suggestions
          setShowSuggestions(false);
        }
      }
    });
    
    // Nettoyer l'abonnement à la suppression du composant
    return () => subscription.unsubscribe();
  }, [form, codePostalField, villeField]);

  // Fonction pour sélectionner une ville depuis les suggestions
  const selectVille = (ville: string) => {
    form.setValue(villeField as any, ville);
    setShowSuggestions(false);
  };

  return {
    suggestions,
    showSuggestions,
    selectVille,
  };
}