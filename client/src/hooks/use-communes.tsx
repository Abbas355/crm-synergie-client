import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { getCommunesByCodePostal } from '@/lib/api-communes';

/**
 * Hook pour gérer l'auto-complétion des villes à partir des codes postaux
 * en utilisant l'API nationale des communes
 */
export function useCommunes<T extends Record<string, any>>({
  form,
  codePostalField,
  villeField,
}: {
  form: UseFormReturn<T>;
  codePostalField: keyof T;
  villeField: keyof T;
}) {
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // S'abonner aux changements du code postal
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === codePostalField) {
        const codePostal = value[codePostalField] as string;
        
        // Vérifier que le code postal a 5 chiffres
        if (codePostal && /^\d{5}$/.test(codePostal)) {
          setLoading(true);
          
          // Rechercher les communes correspondantes
          getCommunesByCodePostal(codePostal)
            .then(results => {
              setCommunes(results);
              
              if (results.length === 1) {
                // Une seule commune : remplir automatiquement
                form.setValue(villeField as any, results[0]);
                setShowSuggestions(false);
              } else if (results.length > 1) {
                // Plusieurs communes : afficher les suggestions
                setShowSuggestions(true);
              } else {
                // Aucune commune trouvée
                setShowSuggestions(false);
              }
            })
            .catch(error => {
              console.error("Erreur lors de la récupération des communes:", error);
              setCommunes([]);
              setShowSuggestions(false);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // Code postal incomplet, réinitialiser
          setCommunes([]);
          setShowSuggestions(false);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, codePostalField, villeField]);

  // Fonction pour sélectionner une commune
  const selectCommune = (commune: string) => {
    form.setValue(villeField as any, commune);
    setShowSuggestions(false);
  };

  return {
    communes,
    loading,
    showSuggestions,
    selectCommune
  };
}