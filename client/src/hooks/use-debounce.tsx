import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Définir un délai avant de mettre à jour la valeur
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Annuler le timer précédent si la valeur change à nouveau
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}